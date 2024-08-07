export default interface HAnimChunk {
    hAnimVersion: number;
    nodeId: number;
    numNodes: number;
    flags?: number;
    keyFrameSize: number;
    nodes: {
        nodeId: number;
        nodeIndex: number;
        flags: number;
    }[];
}
