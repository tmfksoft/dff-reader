export interface SkinPLGHeader {
    numBones: number;
    numUsedBones: number;
    maxWeightsPerVertex: number;
    usedBoneIds: number[];
}
export default interface SkinChunk extends SkinPLGHeader {
    vertexBoneIndices: [number, number, number, number][];
    vertexBoneWeights: [number, number, number, number][];
    boneInverseMatrices: {
        right: {
            x: number;
            y: number;
            z: number;
        };
        up: {
            x: number;
            y: number;
            z: number;
        };
        at: {
            x: number;
            y: number;
            z: number;
        };
        position: {
            x: number;
            y: number;
            z: number;
        };
    }[];
}
