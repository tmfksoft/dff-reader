import fs from 'fs';
import path from 'path';
import DFFReader from '.';

// Both an example file on how to use this reader
// and testing ground for me to fix bugs and test solutions


async function start() {
	const tempDir = path.join(__dirname, "..", "temp");
	
	// Bug with loading animated models ahead :(
	// xenonsign2_SFSe
	// BS_building_SFS - Burger shot?

	const modelName = "cxrf_frway1sig";

	const bansheeFile = path.join(tempDir, modelName + ".dff");
	const bansheeData = fs.readFileSync(bansheeFile);

	const dff = new DFFReader(bansheeData);

	fs.writeFileSync(path.join(tempDir, modelName + ".json"), JSON.stringify(dff.stripData(dff.parsed), null, '\t'));
	//fs.writeFileSync(path.join(tempDir, modelName + ".json"), JSON.stringify(dff.parsed, null, '\t'));
	fs.writeFileSync(path.join(tempDir, modelName + "_test.json"), JSON.stringify(dff.getNode(), null, '\t'));

	// Test write OBJ and MTL
}
start();