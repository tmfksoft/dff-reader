"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = __importDefault(require("./Util"));
const PointerBuffer_1 = __importDefault(require("./PointerBuffer"));
const ChunkTypes_1 = __importDefault(require("./enums/ChunkTypes"));
const GeometryFormat_1 = __importDefault(require("./enums/GeometryFormat"));
const AtomicFlags_1 = __importDefault(require("./enums/AtomicFlags"));
const _2DEffectChunk_1 = require("./interfaces/chunks/2DEffectChunk");
// Chunk types whose content is itself a sequence of child chunks, rather than
// a flat data payload. Hoisted out of parseChunk() - it's recursed into for
// every chunk in the file, so rebuilding this on every call added up.
const containerTypes = new Set([
    ChunkTypes_1.default.Extension, // Extension
    ChunkTypes_1.default.Material, // Material
    ChunkTypes_1.default.Material_List, // Material List
    ChunkTypes_1.default.Clump, // Clump
    ChunkTypes_1.default.Frame_List, // Frame List
    ChunkTypes_1.default.Geometry_List, // Geometry List
    ChunkTypes_1.default.Geometry, // Geometry
    ChunkTypes_1.default.Atomic, // Atomic
    ChunkTypes_1.default.Texture, // Texture
    ChunkTypes_1.default.Light, // Light
    ChunkTypes_1.default.UV_Animation_Dictionary, // UV Animation Dictionary
    ChunkTypes_1.default.UV_Animation_PLG, // UV Animation PLG
]);
// Shared across all string decodes in this module instead of constructing a
// new TextDecoder per chunk (Frame names, texture names, alpha names, ...).
const textDecoder = new TextDecoder();
class DFFReader {
    constructor(data) {
        this.data = data;
        this.rawData = new PointerBuffer_1.default(data);
        this.parsed = this.parseFile();
    }
    parseFile() {
        // A .dff stream isn't always a single top-level chunk - some files
        // (e.g. ones with UV animated textures) are preceded by a top-level
        // UV Animation Dictionary (0x2B) chunk before the actual RwClump.
        // Walk every top-level chunk and return the Clump; anything else
        // found at the top level isn't currently exposed.
        let maxLoop = 1000;
        let clump;
        // A stray handful of bytes after the last real chunk (padding,
        // alignment, a trailing null) isn't enough to hold another chunk
        // header (12 bytes) - treat that as end of file, not a chunk to parse.
        // A file has exactly one Clump (the rest of this class assumes that
        // too), and the UV Animation Dictionary (when present) is only ever
        // seen ahead of it, so stop as soon as the Clump is found instead of
        // parsing - and immediately discarding - whatever else follows it.
        while (!clump && this.rawData.hasBytes(12) && maxLoop > -1) {
            const chunk = this.parseChunk(this.rawData);
            if (chunk.type === ChunkTypes_1.default.Clump) {
                clump = chunk;
            }
            else if (chunk.type === ChunkTypes_1.default.UV_Animation_Dictionary) {
                this.uvAnimationDictionary = chunk;
            }
            maxLoop--;
        }
        if (maxLoop <= 0) {
            console.warn("HIT MAX LOOP!");
        }
        if (!clump) {
            throw new Error("No Clump chunk found in file");
        }
        return clump;
    }
    parseChunk(buf) {
        // buf's own DataView already covers this data - read the header
        // straight off it instead of slicing out a section and wrapping a
        // second DataView around it just to read 12 bytes.
        const sectionType = buf.readUint32();
        const sectionSize = buf.readUint32();
        const sectionLibrary = buf.readUint32();
        // A parent's declared size can't always be trusted. Some GTA III
        // clumps are written 12 bytes short - just enough to cover their last
        // atomic's body but not its header - so that atomic reads past the
        // end of the section its parent handed us. Refusing to read it threw
        // away the whole model; 32 of gta3.img's 3138 models failed this way.
        //
        // Take whatever is actually there instead. The truncated tail is
        // still long enough for the chunk's own Struct, which is the part
        // anything downstream needs, and San Andreas files never hit this
        // because their sizes are correct.
        const sectionContent = (sectionSize > buf.remaining)
            ? buf.readSectionBeyond(sectionSize, this.data)
            : buf.readSection(sectionSize);
        const chunk = {
            type: sectionType,
            typeName: Util_1.default.GetChunkName(sectionType),
            size: sectionSize,
            libraryId: sectionLibrary,
            version: {
                library: Util_1.default.libraryIDUnpackVersion(sectionLibrary),
                build: Util_1.default.libraryIDUnpackBuild(sectionLibrary),
            },
            data: sectionContent,
        };
        const childrenChunks = [];
        if (containerTypes.has(chunk.type)) {
            let maxLoop = 1000;
            const content = new PointerBuffer_1.default(sectionContent);
            while (content.hasMore && maxLoop > -1) {
                // parseChunk reads exactly one chunk's header + body (bounded by
                // its own sectionSize) straight off `content` and advances its
                // pointer past it, so there's no need to pre-slice/re-wrap each
                // child into its own buffer here first.
                childrenChunks.push(this.parseChunk(content));
                maxLoop--;
            }
            if (maxLoop <= 0) {
                console.warn("HIT MAX LOOP!");
            }
        }
        if (childrenChunks.length > 0) {
            chunk.children = childrenChunks;
        }
        // Handle parsing
        if (chunk.type === ChunkTypes_1.default.Clump) {
            // Clump
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === ChunkTypes_1.default.Struct) {
                    const content = new PointerBuffer_1.default(firstChild.data);
                    // RenderWare 3.4 (Vice City) grew the light/camera counts -
                    // GTA III era clumps carry only numAtomics, so this struct
                    // is 4 bytes there and 12 from 3.4 onwards. Reading blind
                    // overran the struct and failed every III model outright.
                    const numAtomics = content.readUint32();
                    const numLights = content.hasBytes(4) ? content.readUint32() : 0;
                    const numCameras = content.hasBytes(4) ? content.readUint32() : 0;
                    chunk.parsed = {
                        numAtomics,
                        numLights,
                        numCameras,
                    };
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Frame_List) {
            // Frame List
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === ChunkTypes_1.default.Struct) {
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const frameCount = content.readUint32();
                    let frames = [];
                    for (let i = 0; i < frameCount; i++) {
                        const rotationMatrix = {
                            right: {
                                x: 0, y: 0, z: 0,
                            },
                            up: {
                                x: 0, y: 0, z: 0,
                            },
                            at: {
                                x: 0, y: 0, z: 0,
                            },
                        };
                        rotationMatrix.right.x = content.readFloat();
                        rotationMatrix.right.y = content.readFloat();
                        rotationMatrix.right.z = content.readFloat();
                        rotationMatrix.up.x = content.readFloat();
                        rotationMatrix.up.y = content.readFloat();
                        rotationMatrix.up.z = content.readFloat();
                        rotationMatrix.at.x = content.readFloat();
                        rotationMatrix.at.y = content.readFloat();
                        rotationMatrix.at.z = content.readFloat();
                        const position = {
                            x: 0, y: 0, z: 0,
                        };
                        position.x = content.readFloat();
                        position.y = content.readFloat();
                        position.z = content.readFloat();
                        // Signed: the root frame is conventionally stored as -1 (0xFFFFFFFF).
                        const parentIndex = content.readDWORD();
                        const matrixFlags = content.readUint32();
                        frames.push({
                            rotationMatrix,
                            position,
                            parentIndex,
                            matrixFlags,
                        });
                    }
                    chunk.parsed = {
                        frameCount,
                        frames,
                    };
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Geometry_List) {
            // Geometry List
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === 0x00000001) {
                    // Struct
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const geometryCount = content.readUint32();
                    chunk.parsed = {
                        geometryCount
                    };
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Atomic) {
            // Atomic
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                // A clump written with a short size (see parseChunk) can leave
                // its last atomic's struct truncated - the header survives but
                // the body doesn't. An atomic without a frame and geometry
                // index is unusable, so leave it unparsed for getGeometry() to
                // skip rather than reading off the end of the buffer.
                if (firstChild.type === ChunkTypes_1.default.Struct && firstChild.data.length >= 12) {
                    // Struct
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const frameIndex = content.readUint32();
                    const geometryIndex = content.readUint32();
                    const flags = content.readUint32();
                    chunk.parsed = {
                        frameIndex,
                        geometryIndex,
                        flags,
                        flagsInfo: (flags === AtomicFlags_1.default.rpATOMICCOLLISIONTEST ? "rpATOMICCOLLISIONTEST" : "rpATOMICRENDER")
                    };
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Light) {
            // Light
            // https://gtamods.com/wiki/Light_(RW_Section)
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === ChunkTypes_1.default.Struct) {
                    // Struct
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const frameIndex = content.readUint32();
                    const radius = content.readFloat();
                    const red = content.readFloat();
                    const green = content.readFloat();
                    const blue = content.readFloat();
                    const directionAngle = content.readFloat();
                    // Some files carry a shorter Light struct without the
                    // trailing flags/type fields - don't hard-fail on those.
                    const flags = content.hasMore ? content.readUint16() : 0;
                    const type = content.hasMore ? content.readUint16() : 0;
                    const lightChunk = {
                        frameIndex,
                        radius,
                        red,
                        green,
                        blue,
                        directionAngle,
                        flags,
                        type,
                    };
                    chunk.parsed = lightChunk;
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Anim_Animation) {
            // Anim Animation - generic RW keyframed animation section.
            // Sourced from Criterion's rpuvanim.h/rtanim.h (via gta-reversed) and
            // cross-checked against https://gtamods.com/wiki/Anim_Animation_(RW_Section)
            const content = new PointerBuffer_1.default(chunk.data);
            const version = content.readUint32();
            const typeID = content.readUint32();
            const numFrames = content.readUint32();
            const flags = content.readUint32();
            const duration = content.readFloat();
            // UV custom-data sub-header (_rpUVAnimCustomData, 68 bytes).
            // "unknown" isn't pinned down yet - safe to skip.
            const unknown = content.readUint32();
            const name = content.readString(32);
            const nodeToUVChannelMap = [];
            for (let i = 0; i < 8; i++) {
                nodeToUVChannelMap.push(content.readUint32());
            }
            const keyFrames = [];
            for (let i = 0; i < numFrames; i++) {
                const time = content.readFloat();
                const data = [
                    content.readFloat(), content.readFloat(), content.readFloat(),
                    content.readFloat(), content.readFloat(), content.readFloat(),
                ];
                const prevFrameIndex = content.readDWORD();
                keyFrames.push({
                    time,
                    data,
                    prevFrameIndex,
                    // Both interpretations of the same 6 floats - typeID is
                    // supposed to say which one applies, but that mapping isn't
                    // confirmed yet, so both are provided rather than guessing.
                    linear: {
                        right: { x: data[0], y: data[1] },
                        up: { x: data[2], y: data[3] },
                        pos: { x: data[4], y: data[5] },
                    },
                    param: {
                        theta: data[0],
                        s0: data[1],
                        s1: data[2],
                        skew: data[3],
                        x: data[4],
                        y: data[5],
                    },
                });
            }
            const animChunk = {
                version,
                typeID,
                numFrames,
                flags,
                duration,
                name,
                nodeToUVChannelMap,
                keyFrames,
            };
            chunk.parsed = animChunk;
        }
        else if (chunk.type === ChunkTypes_1.default.UV_Animation_Dictionary) {
            // UV Animation Dictionary - same shape as every other RW list
            // container in this file (e.g. Geometry_List): a leading Struct
            // chunk holding just the count, followed by that many full
            // Anim_Animation (0x1B) chunks as siblings. containerTypes already
            // parsed all of that into childrenChunks - just read the count.
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === ChunkTypes_1.default.Struct) {
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const count = content.readUint32();
                    const dictChunk = { count };
                    chunk.parsed = dictChunk;
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.UV_Animation_PLG) {
            // UV Animation PLG - nested inside a Material's Extension chunk.
            // References dictionary entries by name, one per active channel slot.
            // Like the other list-shaped sections here, its data is a single
            // leading Struct chunk (not a bare payload).
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === ChunkTypes_1.default.Struct) {
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const channelMask = content.readUint32();
                    const channels = [];
                    for (let slot = 0; slot < 8; slot++) {
                        if ((channelMask & (1 << slot)) === 0) {
                            continue;
                        }
                        channels.push({ slot, name: content.readString(32) });
                    }
                    const plgChunk = { channelMask, channels };
                    chunk.parsed = plgChunk;
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Breakable) {
            // Breakable
            const magicNumber = new DataView(sectionContent.buffer, sectionContent.byteOffset, sectionContent.byteLength).getUint32(0, true);
            chunk.parsed = {
                magicNumber
            };
        }
        else if (chunk.type === ChunkTypes_1.default.Bin_Mesh_PLG) {
            // Bin Mesh PLG
            const content = new PointerBuffer_1.default(sectionContent);
            const flags = content.readUint32();
            const numMeshes = content.readUint32();
            let meshInfo = [];
            for (let i = 0; i < numMeshes; i++) {
                const numIndices = content.readUint32();
                const matIndex = content.readUint32();
                meshInfo.push({
                    numIndices, matIndex
                });
            }
            chunk.parsed = {
                flags,
                flagsInfo: (flags === 0 ? "list" : "strip"),
                numMeshes,
                meshInfo,
            };
        }
        else if (chunk.type === ChunkTypes_1.default.Material_List) {
            // Material list
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === 0x00000001) {
                    // Struct
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const materialCount = content.readUint32();
                    const materialIndices = [];
                    for (let i = 0; i < materialCount; i++) {
                        materialIndices.push(content.readUint32());
                    }
                    chunk.parsed = {
                        materialCount,
                        materialIndices,
                    };
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Geometry) {
            // Geometry
            if (childrenChunks.length > 0) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === ChunkTypes_1.default.Struct) {
                    // Struct
                    // https://gtamods.com/wiki/RpGeometry#Format
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const format = content.readUint32();
                    content.rewind();
                    const rawFormat = content.readSection(4);
                    const numTriangles = content.readUint32();
                    const numVertices = content.readUint32();
                    const numMorphTargets = content.readUint32();
                    // We'll read them but not use them.
                    if (chunk.version.library < 0x34000) {
                        const ambient = content.readFloat();
                        const specular = content.readFloat();
                        const diffuse = content.readFloat();
                    }
                    const triangles = [];
                    const vertices = [];
                    const morphTargets = [];
                    const uvs = [];
                    const normals = [];
                    const vertexColours = [];
                    // Builds our material list.
                    const materialList = [];
                    for (let child of childrenChunks) {
                        if (child.type === ChunkTypes_1.default.Material_List) {
                            if (child.children) {
                                for (let cchild of child.children) {
                                    if (cchild.type === ChunkTypes_1.default.Material) {
                                        const materialChild = cchild;
                                        if (materialChild.children) {
                                            for (let mChild of materialChild.children) {
                                                if (mChild.type !== ChunkTypes_1.default.Texture) {
                                                    continue;
                                                }
                                                const mat = mChild;
                                                materialList.push({
                                                    textureName: mat.parsed.textureName
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // Contains triangles
                    if ((format & GeometryFormat_1.default.rpGEOMETRYNATIVE) === 0) {
                        // Colour information - Pre Lit Data
                        if ((format & GeometryFormat_1.default.rpGEOMETRYPRELIT)) {
                            // Read colour data
                            for (let i = 0; i < numVertices; i++) {
                                const [r, g, b, a] = content.readSection(4);
                                vertexColours.push({
                                    r, g, b, a
                                });
                            }
                        }
                        // Sanity was saved by
                        // https://github.com/Parik27/DragonFF/blob/master/gtaLib/dff.py#L1473
                        if (format & (GeometryFormat_1.default.rpGEOMETRYTEXTURED | GeometryFormat_1.default.rpGEOMETRYTEXTURED2)) {
                            let texCount = (format & 0x00FF0000) >> 16;
                            if (texCount === 0) {
                                if (format & GeometryFormat_1.default.rpGEOMETRYTEXTURED2) {
                                    texCount = 2;
                                }
                                else if (format & GeometryFormat_1.default.rpGEOMETRYTEXTURED) {
                                    texCount = 1;
                                }
                                else {
                                    texCount = 0;
                                }
                            }
                            for (let i = 0; i < texCount; i++) {
                                const uvSet = [];
                                for (let i = 0; i < numVertices; i++) {
                                    const u = content.readFloat();
                                    const v = content.readFloat();
                                    uvSet.push({ u, v });
                                }
                                uvs.push(uvSet);
                            }
                        }
                        // Face Information (Triangles)
                        for (let i = 0; i < numTriangles; i++) {
                            const vertex2 = content.readUint16();
                            const vertex1 = content.readUint16();
                            const materialId = content.readUint16();
                            const vertex3 = content.readUint16();
                            triangles.push({
                                vertex2,
                                vertex1,
                                materialId,
                                vertex3
                            });
                        }
                        // Unknown (Morph Targets)
                        for (let i = 0; i < numMorphTargets; i++) {
                            const boundingSphereX = content.readFloat();
                            const boundingSphereY = content.readFloat();
                            const boundingSphereZ = content.readFloat();
                            const boundingSphereRadius = content.readFloat();
                            const hasPosition = content.readUint32();
                            const hasNormals = content.readUint32();
                            morphTargets.push({
                                boundingSphereX,
                                boundingSphereY,
                                boundingSphereZ,
                                boundingSphereRadius,
                                hasPosition,
                                hasNormals,
                            });
                        }
                        // Vertex Information
                        for (let i = 0; i < numVertices; i++) {
                            const x = content.readFloat();
                            const y = content.readFloat();
                            const z = content.readFloat();
                            vertices.push({
                                x, y, z
                            });
                        }
                        // Normal Information
                        if (format & GeometryFormat_1.default.rpGEOMETRYNORMALS) {
                            for (let i = 0; i < numVertices; i++) {
                                const x = content.readFloat();
                                const y = content.readFloat();
                                const z = content.readFloat();
                                normals.push({
                                    x, y, z
                                });
                            }
                        }
                    }
                    // 100% unsure how correct this is
                    let formatName = "list";
                    if (format & GeometryFormat_1.default.rpGEOMETRYTRISTRIP) {
                        formatName = "strip";
                    }
                    chunk.parsed = {
                        format,
                        formatName,
                        numTriangles,
                        numVertices,
                        numMorphTargets,
                        triangles,
                        vertices,
                        normals,
                        vertexColours,
                        uvs,
                    };
                }
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Frame) {
            // Frame
            const nullIndex = sectionContent.indexOf(0);
            chunk.parsed = {
                name: textDecoder.decode(nullIndex >= 0 ? sectionContent.subarray(0, nullIndex) : sectionContent),
            };
        }
        else if (chunk.type === ChunkTypes_1.default.Texture) {
            // Texture
            if (childrenChunks.length >= 3) {
                const struct = childrenChunks[0];
                let filteringMode = 0x00;
                let uAddressing = 0;
                let vAddressing = 0;
                let mipLevels = 0;
                if (struct.type === ChunkTypes_1.default.Struct) {
                    const content = new PointerBuffer_1.default(struct.data);
                    filteringMode = content.readUint8();
                    const addressing = content.readUint8();
                    uAddressing = addressing & 0b00001111;
                    vAddressing = (addressing >> 4) & 0b00001111;
                    const mipLevelsByte = content.readUint8();
                    // idk how to do this right this second.
                    mipLevels = mipLevelsByte;
                }
                const textureNameChunk = childrenChunks[1];
                const textureAlphaChunk = childrenChunks[2];
                let textureName = "";
                let textureAlphaName = "";
                if (textureNameChunk.type === ChunkTypes_1.default.String) {
                    textureName = textureNameChunk.parsed.value;
                }
                if (textureAlphaChunk.type === ChunkTypes_1.default.String) {
                    textureAlphaName = textureAlphaChunk.parsed.value;
                }
                chunk.parsed = {
                    filteringMode,
                    uAddressing,
                    vAddressing,
                    mipLevels,
                    textureName,
                    textureAlphaName,
                };
            }
        }
        else if (chunk.type === ChunkTypes_1.default.String) {
            // String
            const bytes = chunk.data;
            const nullIndex = bytes.indexOf(0);
            chunk.parsed = {
                value: textDecoder.decode(nullIndex >= 0 ? bytes.subarray(0, nullIndex) : bytes),
            };
        }
        else if (chunk.type === ChunkTypes_1.default.Material) {
            if (childrenChunks.length > 1) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === ChunkTypes_1.default.Struct) {
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const flags = content.readUint32();
                    const color = {
                        r: 0,
                        g: 0,
                        b: 0,
                        a: 0,
                    };
                    color.r = content.readUint8();
                    color.g = content.readUint8();
                    color.b = content.readUint8();
                    color.a = content.readUint8();
                    const unused = content.readUint32();
                    const isTextured = content.readUint32() !== 0;
                    let ambient = 0;
                    let specular = 0;
                    let diffuse = 0;
                    if (chunk.version.library > 0x30400) {
                        ambient = content.readFloat();
                        specular = content.readFloat();
                        diffuse = content.readFloat();
                    }
                    chunk.parsed = {
                        color,
                        isTextured,
                        ambient,
                        specular,
                        diffuse,
                    };
                }
            }
        }
        else if (chunk.type == ChunkTypes_1.default.HAnim_PLG) {
            const content = new PointerBuffer_1.default(chunk.data);
            const hAnimVersion = content.readUint32(); // Expecting '256', aka 0x100 (v1.0)
            const nodeId = content.readUint32();
            const numNodes = content.readUint32();
            chunk.parsed = {
                hAnimVersion,
                nodeId,
                numNodes,
            };
            // I'm not honestly sure if this is correct, the Wiki is a little vague.
            if (numNodes > 0) {
                const flags = content.readUint32();
                const keyFrameSize = content.readUint32();
                const keyFrames = [];
                // 12 bytes to a frame
                const frameCount = numNodes;
                // I haven't a clue what to do here.
                for (let i = 0; i < frameCount; i++) {
                    keyFrames.push({
                        nodeId: content.readUint32(),
                        nodeIndex: content.readUint32(),
                        flags: content.readUint32(),
                    });
                }
                chunk.parsed = Object.assign(Object.assign({}, chunk.parsed), { flags,
                    keyFrameSize, nodes: keyFrames });
            }
        }
        else if (chunk.type === ChunkTypes_1.default.Skin_PLG) {
            // Only the header is parsed here - the per-vertex bone
            // indices/weights that follow need this Geometry's numVertices
            // to know where they end (there's no count stored in this chunk
            // itself, since it also has to fit variable-length, intentionally
            // unparsed platform-specific "skin split" data after the bone
            // matrices). Chunks are parsed depth-first bottom-up, so the
            // sibling Geometry struct's numVertices isn't known yet at this
            // point - see DFFReader.resolveSkin(), called from getGeometry()
            // once both this header and the Geometry's own parse are ready.
            const content = new PointerBuffer_1.default(chunk.data);
            const numBones = content.readUint8();
            const numUsedBones = content.readUint8();
            const maxWeightsPerVertex = content.readUint8();
            content.readUint8(); // unused padding byte
            const usedBoneIds = [];
            for (let i = 0; i < numUsedBones; i++) {
                usedBoneIds.push(content.readUint8());
            }
            const header = {
                numBones,
                numUsedBones,
                maxWeightsPerVertex,
                usedBoneIds,
            };
            chunk.parsed = header;
        }
        else if (chunk.type === ChunkTypes_1.default.Effect_2D) {
            const content = new PointerBuffer_1.default(chunk.data);
            const entryCount = content.readUint32();
            const entries = [];
            for (let i = 0; i < entryCount; i++) {
                const posX = content.readFloat();
                const posY = content.readFloat();
                const posZ = content.readFloat();
                const entryType = content.readUint32(); // Type?
                const dataSize = content.readUint32(); // Data size
                const sectionData = new PointerBuffer_1.default(content.readSection(dataSize));
                const entry = {
                    position: {
                        x: posX,
                        y: posY,
                        z: posZ,
                    },
                    entryType
                };
                if (entryType === _2DEffectChunk_1.EntryType.Light) {
                    const lightEntry = entry;
                    const colorR = sectionData.readUint8();
                    const colorG = sectionData.readUint8();
                    const colorB = sectionData.readUint8();
                    const colorA = sectionData.readUint8();
                    const coronaFarClip = sectionData.readFloat();
                    const pointLightRange = sectionData.readFloat();
                    const coronaSize = sectionData.readFloat();
                    const shadowSize = sectionData.readFloat();
                    const coronaShowMode = sectionData.readUint8();
                    const coronaEnableReflection = sectionData.readUint8();
                    const coronaFlareType = sectionData.readUint8();
                    const shadowColorMultiplier = sectionData.readSection(1)[0];
                    const flags1 = sectionData.readUint8();
                    const coronaTexName = sectionData.readString(24);
                    const shadowTexName = sectionData.readString(24);
                    const shadowZDistance = sectionData.readUint8();
                    const flags2 = sectionData.readUint8();
                    // Populate the entry
                    lightEntry.color = {
                        r: colorR,
                        g: colorG,
                        b: colorB,
                        a: colorA,
                    };
                    lightEntry.coronaFarClip = coronaFarClip;
                    lightEntry.pointLightRange = pointLightRange;
                    lightEntry.coronaSize = coronaSize;
                    lightEntry.shadowSize = shadowSize;
                    lightEntry.coronaShowMode = coronaShowMode;
                    lightEntry.coronaEnableReflection = coronaEnableReflection;
                    lightEntry.coronaFlareType = coronaFlareType;
                    lightEntry.shadowColorMultiplier = shadowColorMultiplier;
                    lightEntry.flags1 = flags1;
                    lightEntry.coronaTexName = coronaTexName.trim();
                    lightEntry.shadowTexName = shadowTexName.trim();
                    lightEntry.shadowZDistance = shadowZDistance;
                    lightEntry.flags2 = flags2;
                    if (dataSize === 80) {
                        const extendedLightEntry = entry;
                        const lookDirectionX = sectionData.readUint8();
                        const lookDirectionY = sectionData.readUint8();
                        const lookDirectionZ = sectionData.readUint8();
                        extendedLightEntry.lookDirection = {
                            x: lookDirectionX,
                            y: lookDirectionY,
                            z: lookDirectionZ,
                        };
                    }
                }
                else if (entryType === _2DEffectChunk_1.EntryType.ParticleEffect) {
                    const particleEffectEntry = entry;
                    const particleName = sectionData.readString(24);
                    // Not sure where this is used right now.
                    // It likely needs trimming properly.
                    particleEffectEntry.particleName = particleName.trim();
                }
                else if (entryType === _2DEffectChunk_1.EntryType.PedAttractor) {
                    const pedEntry = entry;
                    const attractorType = sectionData.readUint32();
                    const queueDirX = sectionData.readFloat();
                    const queueDirY = sectionData.readFloat();
                    const queueDirZ = sectionData.readFloat();
                    const useDirX = sectionData.readFloat();
                    const useDirY = sectionData.readFloat();
                    const useDirZ = sectionData.readFloat();
                    const forwardDirX = sectionData.readFloat();
                    const forwardDirY = sectionData.readFloat();
                    const forwardDirZ = sectionData.readFloat();
                    const externalScriptName = sectionData.readString(8);
                    const pedExistingProbability = sectionData.readUint32();
                    const unknown1 = sectionData.readUint8();
                    const unused1 = sectionData.readUint8();
                    const unknown2 = sectionData.readUint8();
                    const unused2 = sectionData.readUint8();
                    pedEntry.attractorType = attractorType;
                    pedEntry.queueDir = {
                        x: queueDirX,
                        y: queueDirY,
                        z: queueDirZ,
                    };
                    pedEntry.useDir = {
                        x: useDirX,
                        y: useDirY,
                        z: useDirZ,
                    };
                    pedEntry.forwardDir = {
                        x: forwardDirX,
                        y: forwardDirY,
                        z: forwardDirZ,
                    };
                    pedEntry.externalScriptName = externalScriptName;
                    pedEntry.pedExistingProbability = pedExistingProbability;
                    // Wonder if these are used by a script somehow
                    pedEntry.unknown1 = unknown1;
                    pedEntry.unused1 = unused1;
                    pedEntry.unknown2 = unknown2;
                    pedEntry.unused2 = unused2;
                }
                else if (entryType === _2DEffectChunk_1.EntryType.SunGlare) {
                    // No specific code
                }
                else if (entryType === _2DEffectChunk_1.EntryType.EnterExit) {
                    const enterExitEntry = entry;
                    const enterRotationAngle = sectionData.readFloat();
                    const radiusX = sectionData.readFloat();
                    const radiusY = sectionData.readFloat();
                    const exitPositionX = sectionData.readFloat();
                    const exitPositionY = sectionData.readFloat();
                    const exitPositionZ = sectionData.readFloat();
                    const exitRotationAngle = sectionData.readFloat();
                    const interiorId = sectionData.readInt16();
                    const flags = sectionData.readInt16();
                    // Assuming GXT String?
                    const interiorName = sectionData.readString(8);
                    const timeOn = sectionData.readUint8();
                    const timeOff = sectionData.readUint8();
                    const skyColor = sectionData.readUint8();
                    const unknown = sectionData.readUint8();
                    // Populate the entry
                    enterExitEntry.enterRotationAngle = enterRotationAngle;
                    enterExitEntry.radiusX = radiusX;
                    enterExitEntry.radiusY = radiusY;
                    enterExitEntry.exitPosition = {
                        x: exitPositionX,
                        y: exitPositionY,
                        z: exitPositionZ,
                    };
                    enterExitEntry.exitRotationAngle = exitRotationAngle;
                    enterExitEntry.interiorId = interiorId;
                    enterExitEntry.flags = flags;
                    enterExitEntry.interiorName = interiorName;
                    enterExitEntry.timeOn = timeOn;
                    enterExitEntry.timeOff = timeOff;
                    enterExitEntry.skyColor = skyColor;
                    enterExitEntry.unknown = unknown;
                }
                else if (entryType === _2DEffectChunk_1.EntryType.StreetSign) {
                    // Suddenly documentation change!
                    // This section of the wiki isn't as obvious.
                    // I'm also not 100% sure where this is used.
                    // I haven't found it on a few street signs yet
                    const streetSignEntry = entry;
                    // Hopefully there's no massive bugs here..
                    // OH GOD THEYRE MASSIVE BUGS.
                    console.warn("Found 2D Effect Street Sign, The data may not be reliably parsed.");
                    const sizeWidth = sectionData.readFloat();
                    const sizeHeight = sectionData.readFloat();
                    const rotationX = sectionData.readFloat();
                    const rotationY = sectionData.readFloat();
                    const rotationZ = sectionData.readFloat();
                    const flags = sectionData.readUint16();
                    const lineMask = 0b00000011;
                    const lineCountFlag = (flags & lineMask) >> 0;
                    const symbolMask = 0b00001100;
                    const symbolCountFlag = (flags & symbolMask) >> 2;
                    const textColorMask = 0b00110000;
                    const textColorFlag = (flags & textColorMask) >> 4;
                    const lineCounts = [
                        4, 1, 2, 3
                    ];
                    const symbolCounts = [
                        16, 2, 4, 8,
                    ];
                    const textColors = [
                        0xFFFFFF, // White
                        0x000000, // Black
                        0x808080, // Grey
                        0xFF0000, // Red
                    ];
                    const line1 = sectionData.readString(16);
                    const line2 = sectionData.readString(16);
                    const line3 = sectionData.readString(16);
                    const line4 = sectionData.readString(16);
                    // Populate the entry
                    streetSignEntry.size = {
                        width: sizeWidth,
                        height: sizeHeight,
                    };
                    streetSignEntry.rotation = {
                        x: rotationX,
                        y: rotationY,
                        z: rotationZ,
                    };
                    streetSignEntry.flags = flags;
                    streetSignEntry.text = [
                        line1, line2, line3, line4,
                    ];
                    // I'll just define some defaults.
                    streetSignEntry.flagsDecoded = {
                        lines: lineCounts[lineCountFlag],
                        maxSymbols: symbolCounts[symbolCountFlag],
                        textColor: textColors[textColorFlag],
                    };
                }
                else if (entryType === _2DEffectChunk_1.EntryType.TriggerPoint) {
                    const triggerPointEntry = entry;
                    const pointId = sectionData.readUint32();
                    triggerPointEntry.pointId = pointId;
                }
                else if (entryType === _2DEffectChunk_1.EntryType.CoverPoint) {
                    const coverPointEntry = entry;
                    const xDirection = sectionData.readFloat();
                    const yDirection = sectionData.readFloat();
                    const coverType = sectionData.readUint32();
                    coverPointEntry.xDirection = xDirection;
                    coverPointEntry.yDirection = yDirection;
                    coverPointEntry.coverType = coverType;
                }
                else if (entryType === _2DEffectChunk_1.EntryType.Escalator) {
                    const escalatorPointEntry = entry;
                    const bottomX = sectionData.readFloat();
                    const bottomY = sectionData.readFloat();
                    const bottomZ = sectionData.readFloat();
                    const topX = sectionData.readFloat();
                    const topY = sectionData.readFloat();
                    const topZ = sectionData.readFloat();
                    const endX = sectionData.readFloat();
                    const endY = sectionData.readFloat();
                    const endZ = sectionData.readFloat();
                    const direction = sectionData.readUint32();
                    // Populate the entry
                    escalatorPointEntry.bottomPosition = {
                        x: bottomX,
                        y: bottomY,
                        z: bottomZ,
                    };
                    escalatorPointEntry.topPosition = {
                        x: topX,
                        y: topY,
                        z: topZ,
                    };
                    escalatorPointEntry.endPosition = {
                        x: endX,
                        y: endY,
                        z: endZ,
                    };
                    escalatorPointEntry.direction = direction;
                }
                else {
                    console.warn("Unrecognised 2D Effect Entry %i", entryType);
                }
                entries.push(entry);
            }
            const effect = {
                entryCount,
                entries
            };
            chunk.parsed = effect;
        }
        else if (chunk.type === ChunkTypes_1.default.Extra_Vert_Colour) {
            const content = new PointerBuffer_1.default(chunk.data);
            const magicNumber = content.readUint32();
            const vertexColours = [];
            const colourCount = (chunk.size - 4) / 4;
            if (magicNumber !== 0) {
                for (let i = 0; i < colourCount; i++) {
                    const red = content.readUint8();
                    const green = content.readUint8();
                    const blue = content.readUint8();
                    const alpha = content.readUint8();
                    vertexColours.push({
                        r: red,
                        g: green,
                        b: blue,
                        a: alpha
                    });
                }
                chunk.parsed = vertexColours;
            }
        }
        return chunk;
    }
    stripData(chunk) {
        const d = chunk;
        if (typeof d.data !== "undefined") {
            delete d.data;
        }
        if (typeof d.children !== "undefined") {
            d.children = d.children.map(c => this.stripData(c));
        }
        return chunk;
    }
    /**
     * Searches a RawChunk for all child chunks matching the supplied type.
     * It searches all children recursively.
     *
     * Items are returned in the order they're found, this should be alright for most cases.
     * @param chunk Chunk to search
     * @param type Type of chunk to find
     * @returns Array of matching chunks
     */
    searchChunk(chunk, type) {
        const matching = [];
        if (chunk.type === type) {
            matching.push(chunk);
        }
        if (chunk.children) {
            for (let child of chunk.children) {
                if (child.type === type) {
                    matching.push(child);
                }
                if (child.children) {
                    for (let nestedChild of child.children) {
                        const matches = this.searchChunk(nestedChild, type);
                        for (let match of matches) {
                            matching.push(match);
                        }
                    }
                }
            }
        }
        return matching;
    }
    /**
     * Looks up a UV animation by name from this file's UV Animation Dictionary
     * (the name a material's `uvAnimation.channels[n].name` references).
     * Returns undefined if the file has no dictionary, or no entry with that name.
     */
    getUVAnimation(name) {
        var _a, _b;
        if (!((_a = this.uvAnimationDictionary) === null || _a === void 0 ? void 0 : _a.children)) {
            return undefined;
        }
        for (const child of this.uvAnimationDictionary.children) {
            if (child.type === ChunkTypes_1.default.Anim_Animation && ((_b = child.parsed) === null || _b === void 0 ? void 0 : _b.name) === name) {
                return child.parsed;
            }
        }
        return undefined;
    }
    // Finishes parsing a Skin_PLG chunk now that the sibling Geometry's
    // numVertices is known (see the comment on Skin_PLG parsing above for why
    // this can't happen at initial parse time). Re-reads from the chunk's
    // raw data rather than resuming a saved pointer position - simpler than
    // threading a PointerBuffer's read position back out of parseChunk(),
    // and this only ever runs once per skinned geometry.
    resolveSkin(chunk, numVertices) {
        if (!chunk.parsed) {
            return undefined;
        }
        const { numBones, numUsedBones, maxWeightsPerVertex, usedBoneIds } = chunk.parsed;
        const content = new PointerBuffer_1.default(chunk.data);
        // Skip back past the header (3 header bytes + 1 padding + usedBoneIds)
        // exactly as it was originally read.
        content.readSection(4 + numUsedBones);
        const vertexBoneIndices = [];
        for (let i = 0; i < numVertices; i++) {
            vertexBoneIndices.push([
                content.readUint8(), content.readUint8(), content.readUint8(), content.readUint8(),
            ]);
        }
        const vertexBoneWeights = [];
        for (let i = 0; i < numVertices; i++) {
            vertexBoneWeights.push([
                content.readFloat(), content.readFloat(), content.readFloat(), content.readFloat(),
            ]);
        }
        // Each bone matrix is 4 vectors of 4 floats - right/up/at/position,
        // each with a trailing padding float (always 0, not a real 4th
        // component) rather than a plain row/column-major 4x4 matrix. See
        // the field's own doc comment in SkinChunk.ts for how this was
        // confirmed.
        const boneInverseMatrices = [];
        for (let i = 0; i < numBones; i++) {
            const right = { x: content.readFloat(), y: content.readFloat(), z: content.readFloat() };
            content.readFloat(); // padding
            const up = { x: content.readFloat(), y: content.readFloat(), z: content.readFloat() };
            content.readFloat(); // padding
            const at = { x: content.readFloat(), y: content.readFloat(), z: content.readFloat() };
            content.readFloat(); // padding
            const position = { x: content.readFloat(), y: content.readFloat(), z: content.readFloat() };
            content.readFloat(); // padding
            boneInverseMatrices.push({ right, up, at, position });
        }
        return {
            numBones,
            numUsedBones,
            maxWeightsPerVertex,
            usedBoneIds,
            vertexBoneIndices,
            vertexBoneWeights,
            boneInverseMatrices,
        };
    }
    getGeometry() {
        var _a, _b, _c, _d, _e;
        const geometryList = [];
        const frames = this.searchChunk(this.parsed, ChunkTypes_1.default.Frame);
        const geometry = this.searchChunk(this.parsed, ChunkTypes_1.default.Geometry);
        const frameList = this.searchChunk(this.parsed, ChunkTypes_1.default.Frame_List);
        const atomics = this.searchChunk(this.parsed, ChunkTypes_1.default.Atomic);
        if (frameList.length !== 1) {
            throw new Error("Expected 1 FrameList but found " + frameList.length);
        }
        if (!frameList[0].parsed) {
            throw new Error("FrameList missing parsed data section!");
        }
        const frameExtensions = this.searchChunk(frameList[0], ChunkTypes_1.default.Extension);
        for (let atomic of atomics) {
            if (!atomic.parsed) {
                continue;
            }
            const targetGeometry = geometry[atomic.parsed.geometryIndex];
            if (!targetGeometry) {
                // Atomic references a geometry index that doesn't exist in this file.
                continue;
            }
            const targetFrame = frames[atomic.parsed.frameIndex];
            const frameListData = (_a = frameList[0].parsed) === null || _a === void 0 ? void 0 : _a.frames[atomic.parsed.frameIndex];
            const materials = this.searchChunk(targetGeometry, ChunkTypes_1.default.Material);
            // A DFF isn't guaranteed to have as many frames as its frame count.
            // Though I feel I should be looking at Extension chunks instead of frames
            // They seem to a better 'container' for frame and animation data.
            let geoName = "Unknown Frame";
            if (targetFrame && targetFrame.parsed) {
                geoName = targetFrame.parsed.name;
            }
            // This is possibly the proper way to get the name?
            // Not every frame is guaranteed to have a matching Extension chunk
            // (e.g. files with UV animation dictionaries or other extra top-level
            // children), so this may legitimately be undefined.
            const targetExtension = frameExtensions[atomic.parsed.frameIndex];
            const extensionFrames = targetExtension ? this.searchChunk(targetExtension, ChunkTypes_1.default.Frame) : [];
            if (extensionFrames) {
                if (extensionFrames.length > 0) {
                    if (extensionFrames[0].parsed) {
                        geoName = extensionFrames[0].parsed.name;
                    }
                }
            }
            const hAnim = targetExtension ? this.searchChunk(targetExtension, ChunkTypes_1.default.HAnim_PLG) : [];
            const defaultPosition = { x: 0, y: 0, z: 0 };
            const defaultRotationMatrix = {
                right: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 0, z: 0 },
                at: { x: 0, y: 0, z: 0 },
            };
            const defaultParentIndex = -1;
            const defaultMatrixFlags = 0;
            if (targetGeometry.parsed) {
                const position = (_b = frameListData === null || frameListData === void 0 ? void 0 : frameListData.position) !== null && _b !== void 0 ? _b : defaultPosition;
                const rotationMatrix = (_c = frameListData === null || frameListData === void 0 ? void 0 : frameListData.rotationMatrix) !== null && _c !== void 0 ? _c : defaultRotationMatrix;
                const parentIndex = (_d = frameListData === null || frameListData === void 0 ? void 0 : frameListData.parentIndex) !== null && _d !== void 0 ? _d : defaultParentIndex;
                const matrixFlags = (_e = frameListData === null || frameListData === void 0 ? void 0 : frameListData.matrixFlags) !== null && _e !== void 0 ? _e : defaultMatrixFlags;
                const twoFX = this.searchChunk(targetGeometry, ChunkTypes_1.default.Effect_2D);
                const vertColours = this.searchChunk(targetGeometry, ChunkTypes_1.default.Extra_Vert_Colour);
                const skinChunks = this.searchChunk(targetGeometry, ChunkTypes_1.default.Skin_PLG);
                let skin;
                if (skinChunks.length > 0) {
                    skin = this.resolveSkin(skinChunks[0], targetGeometry.parsed.numVertices);
                }
                let extraVertColours;
                if (vertColours.length > 0) {
                    if (vertColours[0].parsed) {
                        extraVertColours = vertColours[0].parsed;
                    }
                }
                let effect;
                if (twoFX.length > 0) {
                    if (twoFX[0].parsed) {
                        effect = twoFX[0].parsed;
                    }
                }
                geometryList.push(Object.assign(Object.assign({ name: geoName }, targetGeometry.parsed), { materials: materials.filter(m => (m.parsed)).map(m => {
                        const textures = this.searchChunk(m, ChunkTypes_1.default.Texture);
                        const uvAnimations = this.searchChunk(m, ChunkTypes_1.default.UV_Animation_PLG);
                        const uvAnimation = uvAnimations.length > 0 ? uvAnimations[0].parsed : undefined;
                        if (textures.length > 0) {
                            return Object.assign(Object.assign({}, m.parsed), { texture: textures.map(m => m.parsed)[0], uvAnimation });
                        }
                        return Object.assign(Object.assign({}, m.parsed), { uvAnimation });
                    }), nightVertexColours: extraVertColours, effect,
                    skin,
                    position,
                    rotationMatrix,
                    parentIndex,
                    matrixFlags, animData: hAnim.length > 0 && hAnim[0].parsed || undefined }));
            }
        }
        return geometryList;
    }
    /**
     * @deprecated - This doesn't produce a faithful model anymore!
     * Converts the supplied Geometry to a OBJ and its accompanying Material.
     * @param geometry
     */
    toOBJ(geometry) {
        var _a;
        let objLines = [];
        let mtlLines = [];
        // Quick shit out an OBJ file
        objLines.push(`mtllib ${geometry.name}.mtl`);
        // Write vertexes
        for (const vertex of geometry.vertices) {
            objLines.push(`v ${vertex.x.toFixed(5)} ${vertex.y.toFixed(5)} ${vertex.z.toFixed(5)} 1.0`);
        }
        // Write UVs
        if (geometry.uvs.length > 0) {
            for (const uv of geometry.uvs[0]) {
                objLines.push(`vt ${uv.u} ${1 - uv.v} 0`);
            }
        }
        // Write normals
        for (const normal of geometry.normals) {
            objLines.push(`vn ${normal.x.toFixed(5)} ${normal.y.toFixed(5)} ${normal.z.toFixed(5)}`);
        }
        // Write faces/triangles
        let currentMaterial = null;
        let currentMaterialIndex = -1;
        for (const triangle of geometry.triangles) {
            let v1 = 0;
            let v2 = 0;
            let v3 = 0;
            if (geometry.format & GeometryFormat_1.default.rpGEOMETRYTRISTRIP) {
                // Triangle Strip
                v1 = triangle.vertex1 + 1;
                v2 = triangle.vertex2 + 1;
                v3 = triangle.vertex3 + 1;
                if (v1 > geometry.vertices.length) {
                    //console.log("Triangle %s has invalid v1 of %s / %s", geometry.triangles.indexOf(triangle), v1, geometry.vertices.length);
                    continue;
                }
                if (v2 > geometry.vertices.length) {
                    //console.log("Triangle %s has invalid v2 of %s / %s", geometry.triangles.indexOf(triangle), v2, geometry.vertices.length);
                    continue;
                }
                if (v3 > geometry.vertices.length) {
                    //console.log("Triangle %s has invalid v3 of %s / %s", geometry.triangles.indexOf(triangle), v3, geometry.vertices.length);
                    continue;
                }
            }
            else {
                // Triangle List
            }
            if (currentMaterialIndex !== triangle.materialId) {
                if (typeof geometry.materials[triangle.materialId] !== "undefined") {
                    currentMaterialIndex = triangle.materialId;
                    currentMaterial = geometry.materials[currentMaterialIndex];
                    objLines.push(`usemtl ${geometry.name}_${currentMaterialIndex}`);
                }
                else {
                    //console.warn("Failed to find material %s", triangle.materialId)
                }
            }
            if (geometry.uvs.length <= 0) {
                objLines.push(`f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}`);
            }
            else if (geometry.normals.length >= 0) {
                objLines.push(`f ${v1}/${v1}/${v1} ${v2}/${v2}/${v2} ${v3}/${v3}/${v3}`);
            }
            else {
                objLines.push(`f ${v1} ${v2} ${v3}`);
            }
        }
        // Kick some material info in for now
        for (let i = 0; i < geometry.materials.length; i++) {
            objLines.push(`# ${i} ${geometry.name}_${i}`);
        }
        // Generate our material file
        for (let i = 0; i < geometry.materials.length; i++) {
            const material = geometry.materials[i];
            mtlLines.push(`newmtl ${geometry.name}_${i}`);
            if (material.isTextured) {
                mtlLines.push(`\tmap_Kd ${(_a = material.texture) === null || _a === void 0 ? void 0 : _a.textureName}.png`);
            }
            const ambientR = material.color.r / 255;
            const ambientG = material.color.g / 255;
            const ambientB = material.color.b / 255;
            mtlLines.push(`\tKa ${ambientR} ${ambientG} ${ambientB}`);
        }
        const encoder = new TextEncoder();
        return {
            obj: encoder.encode(objLines.join('\r\n')),
            mtl: encoder.encode(mtlLines.join('\r\n')),
        };
    }
    getNode() {
        const frameNodes = this.searchChunk(this.parsed, ChunkTypes_1.default.Frame);
        const atomicNodes = this.searchChunk(this.parsed, ChunkTypes_1.default.Atomic);
        const frameLists = this.searchChunk(this.parsed, ChunkTypes_1.default.Frame_List);
        const parsedGeometry = this.getGeometry();
        // getGeometry() builds its array by walking `atomicNodes` in this same order,
        // skipping any atomic whose geometryIndex doesn't resolve to a real Geometry
        // chunk. Mirror that exact walk/skip here so each atomic maps back to the
        // right entry in `parsedGeometry` - atomic.parsed.geometryIndex is NOT a
        // valid index into `parsedGeometry` (it indexes the Geometry List, not the
        // per-atomic output array).
        const geometryChunks = this.searchChunk(this.parsed, ChunkTypes_1.default.Geometry);
        const geometryByAtomic = new Map();
        let parsedGeometryIndex = 0;
        for (const atomic of atomicNodes) {
            if (!atomic.parsed) {
                continue;
            }
            if (!geometryChunks[atomic.parsed.geometryIndex]) {
                continue;
            }
            geometryByAtomic.set(atomic, parsedGeometry[parsedGeometryIndex]);
            parsedGeometryIndex++;
        }
        const mainNodes = [];
        if (frameLists.length !== 1) {
            throw new Error("Expected 1 FrameList but found " + frameLists.length);
        }
        const frameList = frameLists[0];
        // Parallel array to frameListParsed.frames (see getGeometry()'s use
        // of the same indexing) - needed to find each frame's own HAnim_PLG,
        // not just the ones with an attached Atomic/Geometry.
        const frameExtensions = this.searchChunk(frameList, ChunkTypes_1.default.Extension);
        const getFrameHAnim = (frameIndex) => {
            const targetExtension = frameExtensions[frameIndex];
            if (!targetExtension) {
                return undefined;
            }
            const hAnim = this.searchChunk(targetExtension, ChunkTypes_1.default.HAnim_PLG);
            return hAnim.length > 0 ? hAnim[0].parsed : undefined;
        };
        // The `frameNodes` global flat search below is a *different* list
        // than frameListParsed.frames (Frame (0x2FE) chunks can turn up
        // elsewhere in the file too, e.g. inside a UV Animation Dictionary),
        // so indexing into it by frame position silently pulls the wrong
        // name on any file where the two lists don't happen to line up 1:1 -
        // confirmed on a real skinned ped model (army.dff), where every name
        // this produced was off by one frame. Look the name up from within
        // this specific frame's own Extension instead (same technique
        // getGeometry() already uses), falling back to the old global-array
        // behaviour only if a frame genuinely has no Extension->Frame name.
        const getFrameName = (frameIndex) => {
            const targetExtension = frameExtensions[frameIndex];
            const extensionFrames = targetExtension ? this.searchChunk(targetExtension, ChunkTypes_1.default.Frame) : [];
            if (extensionFrames.length > 0 && extensionFrames[0].parsed) {
                return extensionFrames[0].parsed.name;
            }
            const fallback = frameNodes[frameIndex];
            if (fallback && fallback.parsed) {
                return fallback.parsed.name;
            }
            return "Unknown Frame";
        };
        if (frameList.parsed) {
            const frameListParsed = frameList.parsed;
            // getChildren() used to re-scan every frame/atomic in the file for
            // each node it built, making tree construction O(frameCount^2).
            // Index children by parentIndex/frameIndex once up front instead.
            const childFrameIndicesByParent = new Map();
            for (let mi = 0; mi < frameListParsed.frameCount; mi++) {
                const parentIndex = frameListParsed.frames[mi].parentIndex;
                let siblings = childFrameIndicesByParent.get(parentIndex);
                if (!siblings) {
                    siblings = [];
                    childFrameIndicesByParent.set(parentIndex, siblings);
                }
                siblings.push(mi);
            }
            const atomicsByFrameIndex = new Map();
            for (const atomic of atomicNodes) {
                if (!atomic.parsed) {
                    continue;
                }
                let siblings = atomicsByFrameIndex.get(atomic.parsed.frameIndex);
                if (!siblings) {
                    siblings = [];
                    atomicsByFrameIndex.set(atomic.parsed.frameIndex, siblings);
                }
                siblings.push(atomic);
            }
            for (let myIndex = 0; myIndex < frameListParsed.frameCount; myIndex++) {
                const frame = frameListParsed.frames[myIndex];
                if (frame.parentIndex >= 0) {
                    continue;
                }
                const getChildren = (parentIndex, depth = 0) => {
                    if (depth > 1000) {
                        return [];
                    }
                    const children = [];
                    // Find child nodes
                    const childFrameIndices = childFrameIndicesByParent.get(parentIndex) || [];
                    for (const mi of childFrameIndices) {
                        const fr = frameListParsed.frames[mi];
                        const mNode = {
                            name: getFrameName(mi),
                            children: getChildren(mi, depth + 1),
                            animData: getFrameHAnim(mi),
                            position: fr.position,
                            rotationMatrix: fr.rotationMatrix,
                            matrixFlags: fr.matrixFlags,
                        };
                        children.push(mNode);
                    }
                    const childAtomics = atomicsByFrameIndex.get(parentIndex) || [];
                    for (const atomic of childAtomics) {
                        const geometry = geometryByAtomic.get(atomic);
                        if (geometry) {
                            children.push(geometry);
                        }
                    }
                    return children;
                };
                const myNode = {
                    name: getFrameName(myIndex),
                    children: getChildren(myIndex),
                    animData: getFrameHAnim(myIndex),
                    position: frame.position,
                    rotationMatrix: frame.rotationMatrix,
                    matrixFlags: frame.matrixFlags,
                };
                mainNodes.push(myNode);
            }
        }
        return mainNodes[0];
    }
}
exports.default = DFFReader;
//# sourceMappingURL=index.js.map