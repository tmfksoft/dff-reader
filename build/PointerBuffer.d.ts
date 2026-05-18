export default class PointerBuffer {
    protected data: Uint8Array;
    pointer: number;
    pointerHistory: number[];
    size: number;
    private view;
    get rawData(): Uint8Array<ArrayBufferLike>;
    get hasMore(): boolean;
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
