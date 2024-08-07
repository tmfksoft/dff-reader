// Created using https://gtamods.com/wiki/2d_Effect_(RW_Section)

interface Base2DEffectChunk {
	position: { x: number, y: number, z: number },
	entryType: number,
}

interface Light2DEffectChunk extends Base2DEffectChunk {
	entryType: 0,
	color: { r: number, g: number, b: number, a: number },
	coronaFarClip: number,
	pointLightRange: number,
	coronaSize: number,
	shadowSize: number,
	coronaShowMode: number,
	coronaEnableReflection: number,
	coronaFlareType: number, // Needs an enum
	shadowColorMultiplier: number,
	flags1: number, // Needs an enum
	coronaTexName: string,
	shadowTexName: string,
	shadowZDistance: number,
	flags2: number, // Needs an enum

}
interface ExtendedLight2DEffectChunk extends Light2DEffectChunk {
	lookDirectionX: number,
	lookDirectionY: number,
	lookDirectionZ: number,
}

interface Particle2DEffectChunk extends Base2DEffectChunk {
	entryType: 1,
	particleName: string,
}

interface PedAttractor2DEffectChunk extends Base2DEffectChunk {
	entryType: 3,

	type: number, // Needs an enum for "Ped attractor types"

	// Assumed to be Eulers
	queueDir: { x: number, y: number, z: number },
	useDir: { x: number, y: number, z: number },
	forwardDir: { x: number, y: number, z: number },

	externalScriptName: string,
	pedExistingProbability: number, // Eh?

}

interface SunGlare2DEffectChunk extends Base2DEffectChunk {
	entryType: 4,
}

// Doesn't appear to be a type 5

interface EnterExit2DEffectChunk extends Base2DEffectChunk {
	entryType: 6,

	enterRotationAngle: number,
	radiusX: number,
	radiusY: number,

	exitPosition: { x: number, y: number, z: number },
	exitRotationAngle: number,

	interiorId: number,
	flags: number, // ?
	interiorName: number,

	timeOn: string,
	timeOff: string,
	skyColor: string,

}

// The documentation for this section isn't as clear
// So I'm making some educated guesses.
interface StreetSign2DEffectChunk extends Base2DEffectChunk {
	entryType: 7,

	size: { width: number, height: number },
	rotation: { x: number, y: number, z: number },
	flags: number, // Needs enum
	text: string[],
}

// Not sure how to use this just yet.
// Looks like it calls a method
interface TriggerPoint2DEffectChunk extends Base2DEffectChunk {
	entryType: 8,

	pointId: number,
}

interface CoverPoint2DEffectChunk extends Base2DEffectChunk {
	entryType: 9,

	xDirection: number,
	yDirection: number,
	coverType: number, // No documentation.. :(
}

interface Escalator2DEffectChunk extends Base2DEffectChunk {
	entryType: 10,
	bottomPosition: { x: number, y: number, z: number },
	topPosition: { x: number, y: number, z: number },
	endPosition: { x: number, y:number, z: number },
	direction: number,
}