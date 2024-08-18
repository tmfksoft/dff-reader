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
class DFFReader {
    constructor(data) {
        this.data = data;
        this.rawData = new PointerBuffer_1.default(data);
        this.parsed = this.parseFile();
    }
    parseFile() {
        return this.parseChunk(this.rawData);
    }
    parseChunk(buf) {
        const sectionHeader = buf.readSection(12);
        const sectionType = sectionHeader.readUint32LE(0);
        const sectionSize = sectionHeader.readUint32LE(4);
        const sectionLibrary = sectionHeader.readUint32LE(8);
        const sectionContent = buf.readSection(sectionSize);
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
        const containerTypes = [
            ChunkTypes_1.default.Extension,
            ChunkTypes_1.default.Material,
            ChunkTypes_1.default.Material_List,
            ChunkTypes_1.default.Clump,
            ChunkTypes_1.default.Frame_List,
            ChunkTypes_1.default.Geometry_List,
            ChunkTypes_1.default.Geometry,
            ChunkTypes_1.default.Atomic,
            ChunkTypes_1.default.Texture, // Texture
        ];
        if (containerTypes.includes(chunk.type)) {
            let maxLoop = 1000;
            const content = new PointerBuffer_1.default(sectionContent);
            while (content.hasMore && maxLoop > -1) {
                const cType = content.readUint32();
                const cSize = content.readUint32();
                const cLibrary = content.readUint32();
                // Rewind the buffer and read the whole section out of it.
                content.backward(12);
                const wholeChunk = content.readSection(12 + cSize);
                childrenChunks.push(this.parseChunk(new PointerBuffer_1.default(wholeChunk)));
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
                    const numAtomics = content.readDWORD();
                    const numLights = content.readDWORD();
                    const numCameras = content.readDWORD();
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
                    const frameCount = content.readDWORD();
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
                        const parentIndex = content.readDWORD();
                        const matrixFlags = content.readDWORD();
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
                    const geometryCount = content.readDWORD();
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
                if (firstChild.type === ChunkTypes_1.default.Struct) {
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
        else if (chunk.type === ChunkTypes_1.default.Breakable) {
            // Breakable
            const magicNumber = sectionContent.readUint32LE();
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
                    const materialCount = content.readDWORD();
                    const materialIndices = [];
                    for (let i = 0; i < materialCount; i++) {
                        materialIndices.push(content.readDWORD());
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
                    const format = content.readDWORD();
                    content.rewind();
                    const rawFormat = content.readSection(4);
                    const numTriangles = content.readDWORD();
                    const numVertices = content.readDWORD();
                    const numMorphTargets = content.readDWORD();
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
                            const hasPosition = content.readDWORD();
                            const hasNormals = content.readDWORD();
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
                    for (let i = 0; i < numMorphTargets; i++) {
                        // Some more stuff
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
            // Lazy way to do it.
            chunk.parsed = {
                name: sectionContent.toString(),
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
                    vAddressing = (addressing >> 4) && 0b00001111;
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
            let str = "";
            const bytes = chunk.data;
            for (let i = 0; bytes.length; i++) {
                const char = bytes[i];
                if (char === 0x00) {
                    break;
                }
                else {
                    str += String.fromCharCode(char);
                }
            }
            chunk.parsed = {
                value: str,
            };
        }
        else if (chunk.type === ChunkTypes_1.default.Material) {
            if (childrenChunks.length > 1) {
                const firstChild = childrenChunks[0];
                if (firstChild.type === ChunkTypes_1.default.Struct) {
                    const content = new PointerBuffer_1.default(firstChild.data);
                    const flags = content.readDWORD();
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
                    const unused = content.readDWORD();
                    const isTextured = content.readUint32();
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
        else if (chunk.type === ChunkTypes_1.default.Effect_2D) {
            const content = new PointerBuffer_1.default(chunk.data);
            const entryCount = content.readDWORD();
            const entries = [];
            for (let i = 0; i < entryCount; i++) {
                const posX = content.readFloat();
                const posY = content.readFloat();
                const posZ = content.readFloat();
                const entryType = content.readUint32(); // Type?
                const dataSize = content.readDWORD(); // Data size
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
                    const attractorType = sectionData.readDWORD();
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
                    const pedExistingProbability = sectionData.readDWORD();
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
                    console.log(flags.toString(2));
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
                        0xFFFFFF,
                        0x000000,
                        0x808080,
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
                    const pointId = sectionData.readDWORD();
                    triggerPointEntry.pointId = pointId;
                }
                else if (entryType === _2DEffectChunk_1.EntryType.CoverPoint) {
                    const coverPointEntry = entry;
                    const xDirection = sectionData.readFloat();
                    const yDirection = sectionData.readFloat();
                    const coverType = sectionData.readDWORD();
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
                    const direction = sectionData.readDWORD();
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
            const magicNumber = content.readDWORD();
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
    getGeometry() {
        var _a;
        const geometryList = [];
        const frames = this.searchChunk(this.parsed, ChunkTypes_1.default.Frame);
        const geometry = this.searchChunk(this.parsed, ChunkTypes_1.default.Geometry);
        const frameList = this.searchChunk(this.parsed, ChunkTypes_1.default.Frame_List);
        const frameExtensions = this.searchChunk(frameList[0], ChunkTypes_1.default.Extension);
        const atomics = this.searchChunk(this.parsed, ChunkTypes_1.default.Atomic);
        if (frameList.length !== 1) {
            throw new Error("Expected 1 FrameList but found " + frameList.length);
        }
        if (!frameList[0].parsed) {
            throw new Error("FrameList missing parsed data section!");
        }
        for (let atomic of atomics) {
            if (!atomic.parsed) {
                continue;
            }
            const targetGeometry = geometry[atomic.parsed.geometryIndex];
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
            const targetExtension = frameExtensions[atomic.parsed.frameIndex];
            const extensionFrames = this.searchChunk(targetExtension, ChunkTypes_1.default.Frame);
            if (extensionFrames) {
                if (extensionFrames.length > 0) {
                    if (extensionFrames[0].parsed) {
                        geoName = extensionFrames[0].parsed.name;
                    }
                }
            }
            const hAnim = this.searchChunk(targetExtension, ChunkTypes_1.default.HAnim_PLG);
            const defaultPosition = { x: 0, y: 0, z: 0 };
            const defaultRotationMatrix = {
                right: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 0, z: 0 },
                at: { x: 0, y: 0, z: 0 },
            };
            const defaultParentIndex = -1;
            const defaultMatrixFlags = 0;
            if (targetGeometry.parsed) {
                const position = frameListData && frameListData.position || defaultPosition;
                const rotationMatrix = frameListData && frameListData.rotationMatrix || defaultRotationMatrix;
                const parentIndex = frameListData && frameListData.parentIndex || defaultParentIndex;
                const matrixFlags = frameListData && frameListData.matrixFlags || defaultMatrixFlags;
                const twoFX = this.searchChunk(targetGeometry, ChunkTypes_1.default.Effect_2D);
                const vertColours = this.searchChunk(targetGeometry, ChunkTypes_1.default.Extra_Vert_Colour);
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
                        if (textures.length > 0) {
                            return Object.assign(Object.assign({}, m.parsed), { texture: textures.map(m => m.parsed)[0] });
                        }
                        return Object.assign({}, m.parsed);
                    }), nightVertexColours: extraVertColours, effect,
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
        return {
            obj: Buffer.from(objLines.join('\r\n')),
            mtl: Buffer.from(mtlLines.join('\r\n')),
        };
    }
    getNode() {
        const frameNodes = this.searchChunk(this.parsed, ChunkTypes_1.default.Frame);
        const atomicNodes = this.searchChunk(this.parsed, ChunkTypes_1.default.Atomic);
        const frameLists = this.searchChunk(this.parsed, ChunkTypes_1.default.Frame_List);
        const parsedGeometry = this.getGeometry();
        const mainNodes = [];
        if (frameLists.length > 1) {
            throw new Error("More than a single frame list, unexpected");
        }
        const frameList = frameLists[0];
        if (frameList.parsed) {
            for (let myIndex = 0; myIndex < frameList.parsed.frameCount; myIndex++) {
                const frame = frameList.parsed.frames[myIndex];
                if (frame.parentIndex >= 0) {
                    continue;
                }
                const getChildren = (parentIndex, depth = 0) => {
                    if (!frameList.parsed) {
                        return [];
                    }
                    if (depth > 1000) {
                        return [];
                    }
                    const children = [];
                    // Find child nodes
                    for (let mi = 0; mi < frameList.parsed.frameCount; mi++) {
                        const fr = frameList.parsed.frames[mi];
                        if (fr.parentIndex !== parentIndex) {
                            continue;
                        }
                        // This should probably use the Extension chunks instead.
                        const mFrame = frameNodes[mi];
                        let frameName = "Unknown Frame";
                        if (mFrame && mFrame.parsed) {
                            frameName = mFrame.parsed.name;
                        }
                        const mNode = {
                            name: frameName,
                            children: getChildren(mi, depth + 1),
                            position: fr.position,
                            rotationMatrix: fr.rotationMatrix,
                            matrixFlags: fr.matrixFlags,
                        };
                        children.push(mNode);
                    }
                    for (let atomic of atomicNodes) {
                        if (!atomic.parsed) {
                            continue;
                        }
                        if (atomic.parsed.frameIndex !== parentIndex) {
                            continue;
                        }
                        const geometry = parsedGeometry[atomic.parsed.geometryIndex];
                        children.push(geometry);
                    }
                    return children;
                };
                const myFrame = frameNodes[myIndex];
                const myNode = {
                    name: myFrame.parsed && myFrame.parsed.name || "",
                    children: getChildren(myIndex),
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