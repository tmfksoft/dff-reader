/// <reference types="node" />
export default interface RawChunk<T = any> {
    type: number;
    typeName: string;
    size: number;
    libraryId: number;
    version: {
        library: number;
        build: number;
    };
    children?: RawChunk[];
    parsed?: T;
    data: Buffer;
}
