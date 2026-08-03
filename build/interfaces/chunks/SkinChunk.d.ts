export interface SkinPLGHeader {
    numBones: number;
    numUsedBones: number;
    maxWeightsPerVertex: number;
    usedBoneIds: number[];
}
export default interface SkinChunk extends SkinPLGHeader {
    vertexBoneIndices: [number, number, number, number][];
    vertexBoneWeights: [number, number, number, number][];
    boneInverseMatrices: number[][];
}
