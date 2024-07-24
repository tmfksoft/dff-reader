
// This is mainly for names
// A bunch are missing from the list at https://gtamods.com/wiki/List_of_RW_section_IDs
// I'll add what I need/encounter in future.

enum ChunkTypes {
    Struct = 0x00000001,               // https://gtamods.com/wiki/Struct_(RW_Section)
    String = 0x00000002,               // Stores 4 byte aligned ASCII String - https://gtamods.com/wiki/String_(RW_Section)
    Extension = 0x00000003,            // https://gtamods.com/wiki/Extension_(RW_Section)
    // 4 is Camera but unused.
    Texture = 0x00000006,              // https://gtamods.com/wiki/Texture_(RW_Section)
    Material = 0x00000007,             // https://gtamods.com/wiki/Material_(RW_Section)
    Material_List = 0x00000008,        // https://gtamods.com/wiki/Material_List_(RW_Section)
    Frame_List = 0x0000000E,           // https://gtamods.com/wiki/Frame_List_(RW_Section)
    Geometry = 0x0000000F,             // https://gtamods.com/wiki/RpGeometry
    Clump = 0x00000010,                // https://gtamods.com/wiki/RpClump
    Atomic = 0x00000014,               // https://gtamods.com/wiki/Atomic_(RW_Section)
    Geometry_List = 0x0000001A,        // https://gtamods.com/wiki/Geometry_List_(RW_Section)
    Right_To_Render = 0x0000001F,      // https://gtamods.com/wiki/Right_To_Render_(RW_Section)
    HAnim_PLG = 0x0000011E,            // https://gtamods.com/wiki/HAnim_PLG_(RW_Section)
    Material_Effects_PLG = 0x00000120, // https://gtamods.com/wiki/Material_Effects_PLG_(RW_Section)
    Bin_Mesh_PLG = 0x0000050E,         // https://gtamods.com/wiki/Bin_Mesh_PLG_(RW_Section)
    Native_Data_PLG = 0x00000510,      // https://gtamods.com/wiki/Native_Data_PLG_(RW_Section)
    // Rockstar Custom Sections
    Pipeline_Set = 0x0253F2F3,         // https://gtamods.com/wiki/Pipeline_Set_(RW_Section)
    Specular_Material = 0x0253F2F6,    // https://gtamods.com/wiki/Specular_Material_(RW_Section)
    Effect_2D = 0x0253F2F8,            // https://gtamods.com/wiki/2d_Effect_(RW_Section)
    Extra_Vert_Colour = 0x0253F2F9,    // https://gtamods.com/wiki/Extra_Vert_Colour_(RW_Section)
    Collision_Model = 0x0253F2FA,      // https://gtamods.com/wiki/Collision_Model_(RW_Section)
    Reflection_Material = 0x0253F2FC,  // https://gtamods.com/wiki/Reflection_Material_(RW_Section)
    Breakable = 0x0253F2FD,            // https://gtamods.com/wiki/Breakable_(RW_Section)
    Frame = 0x0253F2FE                 // https://gtamods.com/wiki/Frame_(RW_Section)
}

export default ChunkTypes;