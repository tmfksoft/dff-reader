export default class Util {
    static libraryIDPack(version: number, build: number): number;
    static libraryIDUnpackVersion(libid: number): number;
    static libraryIDUnpackBuild(libid: number): number;
    static GetChunkName(type: number): string;
}
