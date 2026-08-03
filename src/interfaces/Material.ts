import Texture from "./Texture";
import { UVAnimationPLGChunk } from "./chunks/UVAnimationChunk";

interface BasicMaterial {
	color: { r: number, g: number, b: number, a: number },
	isTextured: boolean,

	// Version dependant.
	// Defaults to 0 for unsupported versions.
	ambient: number,
	specular: number,
	diffuse: number,

	// Present if this material has an animated UV (scrolling/flashing texture).
	// Channel names reference entries in DFFReader.uvAnimationDictionary.
	uvAnimation?: UVAnimationPLGChunk,
}
interface UnTexturedMaterial extends BasicMaterial {
	isTextured: false,
}
interface TexturedMaterial extends BasicMaterial {
	isTextured: true,
	texture: Texture
}

type Material = UnTexturedMaterial | TexturedMaterial;
export default Material;