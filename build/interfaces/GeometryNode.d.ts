import Geometry from "./Geometry";
import HAnimChunk from "./chunks/HAnimChunk";
export default interface GeometryNode {
    name: string;
    children: (GeometryNode | Geometry)[];
    animData?: HAnimChunk;
    matrixFlags: number;
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
}
