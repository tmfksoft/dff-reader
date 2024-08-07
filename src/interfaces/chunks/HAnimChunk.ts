// https://gtamods.com/wiki/HAnim_PLG_(RW_Section)
export default interface HAnimChunk {
	hAnimVersion: number, // 0x100 = 256
	nodeId: number,
	numNodes: number,
	
	flags?: number,
	keyFrameSize: number, // Normally 36
	nodes: {
		nodeId: number,
		nodeIndex: number,
		flags: number,
	}[],
}