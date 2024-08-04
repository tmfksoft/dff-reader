import Geometry from "./Geometry";

export default interface GeometryNode {
	name: string,
	children: ( GeometryNode | Geometry )[],

	// Unsure how important this actually is..
	matrixFlags: number,
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
}