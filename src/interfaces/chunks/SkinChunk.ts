// https://gtamods.com/wiki/Skin_PLG_(RW_Section)
// Only the pieces a software (WebGL) skinning pipeline actually needs are
// parsed here - per-vertex bone indices/weights and each bone's inverse bind
// matrix. Real files also carry a trailing platform-specific "skin split"
// section (PS2/Xbox hardware skinning batches) after the bone matrices;
// it's ignored, so parsing intentionally never reads to the end of the chunk.

// The chunk's own immediate parse result (chunk.parsed) - just the header.
// The vertex/bone arrays below need this Geometry's numVertices to know
// where they end, which isn't available yet at the point this chunk itself
// gets parsed (see the comment in index.ts's Skin_PLG branch) - DFFReader
// resolves the rest afterwards, once both are ready, in getGeometry().
export interface SkinPLGHeader {
	numBones: number,
	numUsedBones: number,
	maxWeightsPerVertex: number,

	// The subset of bone indices (0..numBones-1) actually referenced by at
	// least one vertex weight - informational only. Verified against a real
	// ped model (army.dff): vertexBoneIndices below hold these same values
	// directly (e.g. 31 shows up as a vertex index despite numUsedBones
	// being only 27), not positions within this array - so this is NOT an
	// indirection table to remap indices through.
	usedBoneIds: number[],
}

// Fully resolved shape, exposed via Geometry.skin.
export default interface SkinChunk extends SkinPLGHeader {
	// One entry per vertex, always 4 indices/weights wide (RW's fixed max),
	// unused slots hold weight 0. Indices reference the bone list directly
	// (0..numBones-1) - see the usedBoneIds comment above.
	vertexBoneIndices: [number, number, number, number][],
	vertexBoneWeights: [number, number, number, number][],

	// One 4x4 matrix per bone (16 floats, row-major), transforming a vertex
	// from model space into that bone's local space at bind pose - exactly
	// what THREE.Skeleton.boneInverses expects.
	boneInverseMatrices: number[][],
}
