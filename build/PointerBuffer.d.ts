export default class PointerBuffer {
    protected data: Uint8Array;
    private static readonly textDecoder;
    pointer: number;
    private lastReadLength;
    size: number;
    private view;
    get rawData(): Uint8Array<ArrayBufferLike>;
    get hasMore(): boolean;
    get remaining(): number;
    hasBytes(length: number): boolean;
    /**
     * Reads `length` bytes from the current position, allowing the result to
     * run past the end of this buffer's own view and into whatever follows it
     * in the underlying data.
     *
     * Only for recovering from a container whose declared size is smaller
     * than its actual contents (see DFFReader.parseChunk) - the bytes really
     * are present in the file, this view just doesn't cover them. `limit`
     * bounds how far it may reach, and the pointer still only advances within
     * this view so the caller's own position stays sane.
     */
    readSectionBeyond(length: number, limit: Uint8Array): Uint8Array<ArrayBufferLike>;
    constructor(data: Uint8Array);
    pointerCheck(dataSize: number): void;
    readDWORD(): number;
    readUint32(): number;
    readUint16(): number;
    readInt16(): number;
    readFloat(): number;
    readUint8(): number;
    readSection(length: number): Uint8Array<ArrayBufferLike>;
    readString(length: number): string;
    readChunks(length: number): Uint8Array<ArrayBufferLike>[];
    forward(length: number): void;
    backward(length: number): void;
    rewind(): void;
}
