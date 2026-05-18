"use strict";
// A basic Uint8Array wrapper to provide more complex pointer operations.
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
        this.size = data.byteLength;
        this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }
    pointerCheck(dataSize) {
        if (this.pointer + dataSize > this.data.length) {
            throw new Error(`Attempting to read past end of buffer! ${(this.pointer + dataSize)} > ${this.data.length}`);
        }
    }
    readDWORD() {
        this.pointerCheck(4);
        const num = this.view.getInt32(this.pointer, true);
        this.forward(4);
        return num;
    }
    readUint32() {
        this.pointerCheck(4);
        const num = this.view.getUint32(this.pointer, true);
        this.forward(4);
        return num;
    }
    readUint16() {
        this.pointerCheck(2);
        const num = this.view.getUint16(this.pointer, true);
        this.forward(2);
        return num;
    }
    readInt16() {
        this.pointerCheck(2);
        const num = this.view.getInt16(this.pointer, true);
        this.forward(2);
        return num;
    }
    readFloat() {
        this.pointerCheck(4);
        const num = this.view.getFloat32(this.pointer, true);
        this.forward(4);
        return num;
    }
    readUint8() {
        this.pointerCheck(1);
        const num = this.data[this.pointer];
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
        const rawBytes = this.readSection(length);
        const nullIndex = rawBytes.indexOf(0);
        const bytes = nullIndex >= 0 ? rawBytes.subarray(0, nullIndex) : rawBytes;
        return new TextDecoder().decode(bytes);
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