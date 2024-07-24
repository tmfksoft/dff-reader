import ChunkTypes from "./enums/ChunkTypes";

export default class Util {

	static libraryIDPack(version: number, build: number): number {
		if (version <= 0x31000) {
			return version >> 8;
		}
		return ((version - 0x30000) & 0x3FF00) << 14 | (version & 0x3F) << 16 | (build & 0xFFFF);
	}
	
	static libraryIDUnpackVersion(libid: number): number {
		if (libid & 0xFFFF0000) {
			return ((libid >> 14) & 0x3FF00) + 0x30000 | ((libid >> 16) & 0x3F);
		}
		return libid << 8;
	}
	
	static libraryIDUnpackBuild(libid: number): number {
		if (libid & 0xFFFF0000) {
			return libid & 0xFFFF;
		}
		return 0;
	}

	static GetChunkName(type: number): string {
		if (typeof ChunkTypes[type] !== "undefined") {
			return ChunkTypes[type];
		}
		console.warn("Unknown Chunk Type: %s", type.toString(16));
		return "Unknown Section"
	}
}