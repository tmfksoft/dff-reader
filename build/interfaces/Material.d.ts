import Texture from "./Texture";
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
