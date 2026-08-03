import Texture from "./Texture";
import { UVAnimationPLGChunk } from "./chunks/UVAnimationChunk";
interface BasicMaterial {
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    isTextured: boolean;
    ambient: number;
    specular: number;
    diffuse: number;
    uvAnimation?: UVAnimationPLGChunk;
}
interface UnTexturedMaterial extends BasicMaterial {
    isTextured: false;
}
interface TexturedMaterial extends BasicMaterial {
    isTextured: true;
    texture: Texture;
}
type Material = UnTexturedMaterial | TexturedMaterial;
export default Material;
