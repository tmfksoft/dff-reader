import Triangle from "../Triangle";
export default interface GeometryChunk {
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
    vertexColours: {
        r: number;
        g: number;
        b: number;
        a: number;
    }[];
    uvs: {
        u: number;
        v: number;
    }[][];
}
