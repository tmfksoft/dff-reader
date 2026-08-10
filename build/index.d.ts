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
    private resolveSkin;
    /**
     * Raw bytes of this model's embedded vehicle collision, if it has one -
     * a Collision_Model (0x0253F2FA) RW section, one of Rockstar's own
     * custom chunk types (https://gtamods.com/wiki/Collision_Model_(RW_Section)),
     * found (per that page) hanging off the Clump's own Extension in GTA:SA
     * vehicle DFFs. This is how vehicle collision actually ships in SA - the
     * standalone models/coll/vehicles.col most tools expect is a near-empty
     * leftover from III/VC's pipeline, not where SA vehicles' real collision
     * lives.
     *
     * The wiki page describes this section's payload as "complete with
     * header, but only one model per section" - i.e. structurally identical
     * to a single model entry inside a standalone .col archive (fourcc +
     * size + name + id + body), just found in a different container. That's
     * deliberately left for the caller to parse (e.g. with
     * @majesticfudgie/col-reader's COLReader, unmodified) rather than
     * reimplemented here - this module only extracts the chunk, it doesn't
     * know the .col body format.
     */
    getCollisionData(): Uint8Array | undefined;
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
