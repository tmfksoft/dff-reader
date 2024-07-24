"use strict";
// A basic Buffer wrapper to provide more complex pointer operations.
Object.defineProperty(exports, "__esModule", { value: true });
class PointerBuffer {
    get rawData() {
        return this.data;
    }
    get hasMore() {
        if (this.pointer === this.data.length) {
            return false;
        }
        return true;
    }
    constructor(data) {
        this.data = data;
        // Uses the history to get the pointer location
        // It's slow but cool.
        this.pointer = 0;
        this.pointerHistory = [];
        this.size = 0;
        this.size = data.length;
    }
    pointerCheck(dataSize) {
        if (this.pointer + dataSize > this.data.length) {
            throw new Error(`Attempting to read past end of buffer! ${(this.pointer + dataSize)} > ${this.data.length}`);
        }
    }
    readDWORD() {
        this.pointerCheck(4);
        const num = this.data.readInt32LE(this.pointer);
        this.forward(4);
        return num;
    }
    readUint32() {
        this.pointerCheck(4);
        const num = this.data.readUint32LE(this.pointer);
        this.forward(4);
        return num;
    }
    readUint16() {
        this.pointerCheck(2);
        const num = this.data.readUint16LE(this.pointer);
        this.forward(2);
        return num;
    }
    readInt16() {
        this.pointerCheck(2);
        const num = this.data.readInt16LE(this.pointer);
        this.forward(2);
        return num;
    }
    readFloat() {
        this.pointerCheck(4);
        const num = this.data.readFloatLE(this.pointer);
        this.forward(4);
        return num;
    }
    readUint8() {
        this.pointerCheck(1);
        const num = this.data.readUint8(this.pointer);
        this.forward(1);
        return num;
    }
    readSection(length) {
        this.pointerCheck(length);
        const section = this.data.subarray(this.pointer, this.pointer + length);
        this.forward(length);
        return section;
    }
    readString(length) {
        // Trims null bytes
        const rawBytes = this.readSection(length);
        if (rawBytes.indexOf(0) > 0) {
            return rawBytes.toString('utf-8', 0, rawBytes.indexOf(0));
        }
        return rawBytes.toString();
    }
    readChunks(length) {
        let chunks = [];
        const chunkCount = Math.floor((this.data.length - this.pointer) / length);
        for (let i = 0; i < chunkCount; i++) {
            const chunk = this.readSection(length);
            chunks.push(chunk);
        }
        return chunks;
    }
    // Forwards the pointer without read operations.
    forward(length) {
        this.pointer += length;
        this.pointerHistory.push(length);
    }
    backward(length) {
        this.pointer = Math.abs(this.pointer - length);
        this.pointerHistory.push(length);
    }
    // Undoes the last read
    rewind() {
        const lastRead = this.pointerHistory[this.pointerHistory.length - 1];
        this.pointer -= lastRead;
        this.pointerHistory.push(-lastRead);
    }
}
exports.default = PointerBuffer;
//# sourceMappingURL=PointerBuffer.js.map