/// <reference types="node" />
import PointerBuffer from "./PointerBuffer";
import ChunkTypes from "./enums/ChunkTypes";
import RawChunk from "./interfaces/RawChunk";
import Geometry from "./interfaces/Geometry";
declare class DFFReader {
    protected data: Buffer;
    rawData: PointerBuffer;
    parsed: RawChunk;
    constructor(data: Buffer);
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
    getGeometry(): Geometry[];
    /**
     * Converts the supplied Geometry to a OBJ and its accompanying Material.
     * @param geometry
     */
    toOBJ(geometry: Geometry): {
        obj: Buffer;
        mtl: Buffer;
    };
}
export default DFFReader;
