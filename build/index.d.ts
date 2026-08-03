import PointerBuffer from "./PointerBuffer";
import ChunkTypes from "./enums/ChunkTypes";
import RawChunk from "./interfaces/RawChunk";
import Geometry from "./interfaces/Geometry";
import GeometryNode from "./interfaces/GeometryNode";
import AnimAnimationChunk, { UVAnimationDictionaryChunk } from "./interfaces/chunks/UVAnimationChunk";
declare class DFFReader {
    protected data: Uint8Array;
    rawData: PointerBuffer;
    parsed: RawChunk;
    uvAnimationDictionary?: RawChunk<UVAnimationDictionaryChunk>;
    constructor(data: Uint8Array);
    parseFile(): RawChunk;
    parseChunk(buf: PointerBuffer): RawChunk;
    stripData(chunk: RawChunk): any;
    /**
     * Searches a RawChunk for all child chunks matching the supplied type.
     * It searches all children recursively.
     *
     * Items are returned in the order they're found, this should be alright for most cases.
     * @param chunk Chunk to search
     * @param type Type of chunk to find
     * @returns Array of matching chunks
     */
    searchChunk<T = any>(chunk: RawChunk, type: ChunkTypes): RawChunk<T>[];
    /**
     * Looks up a UV animation by name from this file's UV Animation Dictionary
     * (the name a material's `uvAnimation.channels[n].name` references).
     * Returns undefined if the file has no dictionary, or no entry with that name.
     */
    getUVAnimation(name: string): AnimAnimationChunk | undefined;
    getGeometry(): Geometry[];
    /**
     * @deprecated - This doesn't produce a faithful model anymore!
     * Converts the supplied Geometry to a OBJ and its accompanying Material.
     * @param geometry
     */
    toOBJ(geometry: Geometry): {
        obj: Uint8Array;
        mtl: Uint8Array;
    };
    getNode(): GeometryNode;
}
export default DFFReader;
