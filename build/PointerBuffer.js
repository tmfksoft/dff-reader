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
    // How many bytes are left from the current position.
    get remaining() {
        return Math.max(0, this.data.length - this.pointer);
    }
    // Whether at least `length` more bytes remain - use this instead of
    // `hasMore` before reading another whole chunk header at the top level,
    // where a handful of stray trailing/padding bytes after the last real
    // chunk shouldn't be treated as the start of one more chunk to parse.
    hasBytes(length) {
        return this.pointer + length <= this.data.length;
    }
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
    readSectionBeyond(length, limit) {
        const startInLimit = (this.data.byteOffset - limit.byteOffset) + this.pointer;
        const available = Math.max(0, limit.length - startInLimit);
        const take = Math.min(length, available);
        const section = limit.subarray(startInLimit, startInLimit + take);
        this.forward(Math.min(length, this.remaining));
        return section;
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