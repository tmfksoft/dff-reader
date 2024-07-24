import Triangle from "../Triangle";

export default interface GeometryChunk {

	// This is data copied verbaitm from our internal structure
	format: number,
	formatName: string, // strip | list - Refers to triangle storage
	//triListFlag: number, // Use GeometryFormat.rpGEOMETRYTRISTRIP to check

	numTriangles: number,
	numVertices: number,
	numMorphTargets: number,

	triangles: Triangle[],
	vertices: { x: number, y: number, z: number }[],
	normals: { x: number, y: number, z:number }[],

	// Vertex RGBA 0-255 range
	vertexColours: { r: number, g: number, b: number, a: number }[],

	uvs: { u: number, v: number }[][],

}