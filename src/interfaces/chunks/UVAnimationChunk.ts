// UV Animation (texture coordinate animation) chunks - 0x1B / 0x2B / 0x135.
// Layout sourced from Criterion's rpuvanim.h / rtanim.h (as hosted by the
// gta-reversed decompilation project) and cross-checked against
// https://gtamods.com/wiki/Anim_Animation_(RW_Section)

export interface UVAnimKeyFrame {
	time: number,
	// Raw 6 floats - meaning depends on the parent animation's typeID.
	data: [number, number, number, number, number, number],
	// On-disk index into this animation's own keyframe list. RW resolves this
	// into a runtime pointer after load; keyframes for the same node form a
	// backward-linked list through time (a node always has one at t=0 and t=duration).
	prevFrameIndex: number,

	// data[6] reinterpreted as RpUVAnimLinearKeyFrameData.
	linear: {
		right: { x: number, y: number },
		up: { x: number, y: number },
		pos: { x: number, y: number },
	},
	// data[6] reinterpreted as RpUVAnimParamKeyFrameData (rotation/scale/skew/translation).
	param: {
		theta: number, // radians
		s0: number,
		s1: number,
		skew: number,
		x: number,
		y: number,
	},
}

export default interface AnimAnimationChunk {
	version: number,
	// Interpolation scheme ID - 0x1C1 for UV animation. Whether this alone
	// distinguishes linear vs param keyframes (RpUVAnimKeyFrameType) isn't
	// confirmed - both keyframe layouts are the same 24 bytes, so consumers
	// currently get both interpretations on each keyframe (see `linear`/`param`).
	typeID: number,
	numFrames: number,
	flags: number,
	duration: number, // seconds

	// From the UV custom-data sub-header (_rpUVAnimCustomData).
	name: string, // the name UV_Animation_PLG channels reference
	nodeToUVChannelMap: number[], // length 8 (RP_UVANIM_MAXSLOTS)

	keyFrames: UVAnimKeyFrame[],
}

export interface UVAnimationDictionaryChunk {
	count: number,
}

export interface UVAnimationChannel {
	slot: number,
	name: string,
}

export interface UVAnimationPLGChunk {
	channelMask: number,
	channels: UVAnimationChannel[],
}
