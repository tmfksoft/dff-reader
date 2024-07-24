export default interface FrameListChunk {
    frameCount: number;
    frames: {
        rotationMatrix: {
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
        };
        position: {
            x: number;
            y: number;
            z: number;
        };
        parentIndex: number;
        matrixFlags: number;
    }[];
}
