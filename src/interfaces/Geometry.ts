import Base2DEffectChunk from "./chunks/2DEffectChunk";
import Material from "./Material";
import Triangle from "./Triangle";

export default interface Geometry {

	// For now we'll assume each piece of geometry has a name
	name: string,

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

	materials: Material[],
	effect?: Base2DEffectChunk,

	rotationMatrix: {
		right: { x: number, y: number, z: number },
		up: { x: number, y: number, z: number },
		at: { x: number, y: number, z: number },
	},
	position: {
		x: number,
		y: number,
		z: number,
	},
	parentIndex: number,
	matrixFlags: number,

	// Currently I don't have any understanding how this works
	// so I'll bodge the data in and worry about it later
	animData: any,
}