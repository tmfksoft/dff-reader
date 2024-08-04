import fs from 'fs';
import path from 'path';
import DFFReader from '.';
import ChunkTypes from './enums/ChunkTypes';
import Geometry from './interfaces/Geometry';
import GeometryChunk from './interfaces/chunks/GeometryChunk';
import AtomicChunk from './interfaces/chunks/AtomicChunk';
import FrameListChunk from './interfaces/chunks/FrameListChunk';
import GeometryNode from './interfaces/GeometryNode';

// Both an example file on how to use this reader
// and testing ground for me to fix bugs and test solutions


async function start() {
	const tempDir = path.join(__dirname, "..", "temp");
	

	const bansheeFile = path.join(tempDir, "aw_streettree2.dff");
	const bansheeData = fs.readFileSync(bansheeFile);

	const dff = new DFFReader(bansheeData);

	fs.writeFileSync(path.join(tempDir, "aw_streettree2.json"), JSON.stringify(dff.stripData(dff.parsed), null, '\t'));

	fs.writeFileSync(path.join(tempDir, "aw_streettree2_test.json"), JSON.stringify(dff.getNode(), null, '\t'));
}
start();