import LightFlags from "../../enums/LightFlags";

// https://gtamods.com/wiki/Light_(RW_Section)
/**
 * The wiki suggests not to use actual lights and instead GTA:SA fakes it all
 * by projecting coronas and light cone textures etc.
 * 
 * See https://gtamods.com/wiki/2d_Effect_(RW_Section)
 */

export default interface LightChunk {
	frameIndex: number,
	radius: number,
	red: number,
	green: number,
	blue: number,
	directionAngle: number, // 1-cose(alpha) -- Whatever that actually means
	flags: LightFlags,
	type: LightTypes,
}