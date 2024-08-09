import Base2DEffectChunk from "./chunks/2DEffectChunk";
import Material from "./Material";
import RGBA from "./RGBA";
import Triangle from "./Triangle";
export default interface Geometry {
    name: string;
    format: number;
    formatName: string;
    numTriangles: number;
    numVertices: number;
    numMorphTargets: number;
    triangles: Triangle[];
    vertices: {
        x: number;
        y: number;
        z: number;
    }[];
    normals: {
        x: number;
        y: number;
        z: number;
    }[];
    vertexColours: RGBA[];
    nightVertexColours?: RGBA[];
    uvs: {
        u: number;
        v: number;
    }[][];
    materials: Material[];
    effect?: Base2DEffectChunk;
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
    animData: any;
}
