export interface UVAnimKeyFrame {
    time: number;
    data: [number, number, number, number, number, number];
    prevFrameIndex: number;
    linear: {
        right: {
            x: number;
            y: number;
        };
        up: {
            x: number;
            y: number;
        };
        pos: {
            x: number;
            y: number;
        };
    };
    param: {
        theta: number;
        s0: number;
        s1: number;
        skew: number;
        x: number;
        y: number;
    };
}
export default interface AnimAnimationChunk {
    version: number;
    typeID: number;
    numFrames: number;
    flags: number;
    duration: number;
    name: string;
    nodeToUVChannelMap: number[];
    keyFrames: UVAnimKeyFrame[];
}
export interface UVAnimationDictionaryChunk {
    count: number;
}
export interface UVAnimationChannel {
    slot: number;
    name: string;
}
export interface UVAnimationPLGChunk {
    channelMask: number;
    channels: UVAnimationChannel[];
}
