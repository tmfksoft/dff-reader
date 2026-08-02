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
    // Whether at least `length` more bytes remain - use this instead of
    // `hasMore` before reading another whole chunk header at the top level,
    // where a handful of stray trailing/padding bytes after the last real
    // chunk shouldn't be treated as the start of one more chunk to parse.
    hasBytes(length) {
        return this.pointer + length <= this.data.length;
    }
    constructor(data) {
        this.data = data;
        this.pointer = 0;
        // rewind() can only ever undo the single most recent forward/backward call,
        // so we only need to remember that one length - not a full growing history.
        this.lastReadLength = 0;
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
        return PointerBuffer.textDecoder.decode(bytes);
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
        this.lastReadLength = length;
    }
    backward(length) {
        if (length > this.pointer) {
            throw new Error(`Attempting to move pointer before start of buffer! ${this.pointer} - ${length} < 0`);
        }
        this.pointer -= length;
        this.lastReadLength = -length;
    }
    // Undoes the last read
    rewind() {
        this.pointer -= this.lastReadLength;
        this.lastReadLength = -this.lastReadLength;
    }
}
PointerBuffer.textDecoder = new TextDecoder();
exports.default = PointerBuffer;
//# sourceMappingURL=PointerBuffer.js.map