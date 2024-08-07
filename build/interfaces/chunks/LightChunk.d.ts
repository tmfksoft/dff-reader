import LightFlags from "../../enums/LightFlags";
/**
 * The wiki suggests not to use actual lights and instead GTA:SA fakes it all
 * by projecting coronas and light cone textures etc.
 *
 * See https://gtamods.com/wiki/2d_Effect_(RW_Section)
 */
export default interface LightChunk {
    frameIndex: number;
    radius: number;
    red: number;
    green: number;
    blue: number;
    directionAngle: number;
    flags: LightFlags;
    type: LightTypes;
}
