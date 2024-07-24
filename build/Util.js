"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChunkTypes_1 = __importDefault(require("./enums/ChunkTypes"));
class Util {
    static libraryIDPack(version, build) {
        if (version <= 0x31000) {
            return version >> 8;
        }
        return ((version - 0x30000) & 0x3FF00) << 14 | (version & 0x3F) << 16 | (build & 0xFFFF);
    }
    static libraryIDUnpackVersion(libid) {
        if (libid & 0xFFFF0000) {
            return ((libid >> 14) & 0x3FF00) + 0x30000 | ((libid >> 16) & 0x3F);
        }
        return libid << 8;
    }
    static libraryIDUnpackBuild(libid) {
        if (libid & 0xFFFF0000) {
            return libid & 0xFFFF;
        }
        return 0;
    }
    static GetChunkName(type) {
        if (typeof ChunkTypes_1.default[type] !== "undefined") {
            return ChunkTypes_1.default[type];
        }
        console.warn("Unknown Chunk Type: %s", type.toString(16));
        return "Unknown Section";
    }
}
exports.default = Util;
//# sourceMappingURL=Util.js.map