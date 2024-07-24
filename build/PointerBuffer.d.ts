/// <reference types="node" />
export default class PointerBuffer {
    protected data: Buffer;
    pointer: number;
    pointerHistory: number[];
    size: number;
    get rawData(): Buffer;
    get hasMore(): boolean;
    constructor(data: Buffer);
    pointerCheck(dataSize: number): void;
    readDWORD(): number;
    readUint32(): number;
    readUint16(): number;
    readInt16(): number;
    readFloat(): number;
    readUint8(): number;
    readSection(length: number): Buffer;
    readString(length: number): string;
    readChunks(length: number): Buffer[];
    forward(length: number): void;
    backward(length: number): void;
    rewind(): void;
}
