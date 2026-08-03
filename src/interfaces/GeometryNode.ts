import Geometry from "./Geometry";
import HAnimChunk from "./chunks/HAnimChunk";

export default interface GeometryNode {
	name: string,
	children: ( GeometryNode | Geometry )[],

	// HAnim_PLG data for THIS frame, if it has any - present on skeleton
	// bone frames even when they carry no geometry of their own (which is
	// the usual case: a skinned mesh's Geometry.animData only covers the one
	// frame it's attached to, e.g. "Pelvis" on a ped, but the other ~30
	// bones needed to actually build a THREE.Skeleton are plain frames with
	// no Geometry at all - this is the only place their HAnim data shows up).
	// The frame carrying the full bone table (all nodeId/nodeIndex/flags
	// entries, not just its own) is conventionally named "Root" and sits at
	// the skeleton's actual root, above where any geometry is attached.
	animData?: HAnimChunk,

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