declare enum ChunkTypes {
    Struct = 1,// https://gtamods.com/wiki/Struct_(RW_Section)
    String = 2,// Stores 4 byte aligned ASCII String - https://gtamods.com/wiki/String_(RW_Section)
    Extension = 3,// https://gtamods.com/wiki/Extension_(RW_Section)
    Texture = 6,// https://gtamods.com/wiki/Texture_(RW_Section)
    Material = 7,// https://gtamods.com/wiki/Material_(RW_Section)
    Material_List = 8,// https://gtamods.com/wiki/Material_List_(RW_Section)
    Frame_List = 14,// https://gtamods.com/wiki/Frame_List_(RW_Section)
    Geometry = 15,// https://gtamods.com/wiki/RpGeometry
    Clump = 16,// https://gtamods.com/wiki/RpClump
    Light = 18,// https://gtamods.com/wiki/Light_(RW_Section)
    Atomic = 20,// https://gtamods.com/wiki/Atomic_(RW_Section)
    Anim_Animation = 27,// https://gtamods.com/wiki/Anim_Animation_(RW_Section) - generic RW keyframed animation section
    Geometry_List = 26,// https://gtamods.com/wiki/Geometry_List_(RW_Section)
    Right_To_Render = 31,// https://gtamods.com/wiki/Right_To_Render_(RW_Section)
    UV_Animation_Dictionary = 43,// Container of up to 8 named Anim_Animation entries, sits alongside the Clump
    Skin_PLG = 278,// https://gtamods.com/wiki/Skin_PLG_(RW_Section) - per-vertex bone indices/weights + bone inverse matrices, nested in a Geometry's Extension
    HAnim_PLG = 286,// https://gtamods.com/wiki/HAnim_PLG_(RW_Section)
    Material_Effects_PLG = 288,// https://gtamods.com/wiki/Material_Effects_PLG_(RW_Section)
    UV_Animation_PLG = 309,// Nested in a Material's Extension - references Anim_Animation entries by name
    Bin_Mesh_PLG = 1294,// https://gtamods.com/wiki/Bin_Mesh_PLG_(RW_Section)
    Native_Data_PLG = 1296,// https://gtamods.com/wiki/Native_Data_PLG_(RW_Section)
    Pipeline_Set = 39056115,// https://gtamods.com/wiki/Pipeline_Set_(RW_Section)
    Specular_Material = 39056118,// https://gtamods.com/wiki/Specular_Material_(RW_Section)
    Effect_2D = 39056120,// https://gtamods.com/wiki/2d_Effect_(RW_Section)
    Extra_Vert_Colour = 39056121,// https://gtamods.com/wiki/Extra_Vert_Colour_(RW_Section)
    Collision_Model = 39056122,// https://gtamods.com/wiki/Collision_Model_(RW_Section)
    Reflection_Material = 39056124,// https://gtamods.com/wiki/Reflection_Material_(RW_Section)
    Breakable = 39056125,// https://gtamods.com/wiki/Breakable_(RW_Section)
    Frame = 39056126
}
export default ChunkTypes;
