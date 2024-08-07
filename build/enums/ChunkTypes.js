"use strict";
// This is mainly for names
// A bunch are missing from the list at https://gtamods.com/wiki/List_of_RW_section_IDs
// I'll add what I need/encounter in future.
Object.defineProperty(exports, "__esModule", { value: true });
var ChunkTypes;
(function (ChunkTypes) {
    ChunkTypes[ChunkTypes["Struct"] = 1] = "Struct";
    ChunkTypes[ChunkTypes["String"] = 2] = "String";
    ChunkTypes[ChunkTypes["Extension"] = 3] = "Extension";
    // 4 is Camera but unused.
    ChunkTypes[ChunkTypes["Texture"] = 6] = "Texture";
    ChunkTypes[ChunkTypes["Material"] = 7] = "Material";
    ChunkTypes[ChunkTypes["Material_List"] = 8] = "Material_List";
    ChunkTypes[ChunkTypes["Frame_List"] = 14] = "Frame_List";
    ChunkTypes[ChunkTypes["Geometry"] = 15] = "Geometry";
    ChunkTypes[ChunkTypes["Clump"] = 16] = "Clump";
    ChunkTypes[ChunkTypes["Light"] = 18] = "Light";
    ChunkTypes[ChunkTypes["Atomic"] = 20] = "Atomic";
    ChunkTypes[ChunkTypes["Geometry_List"] = 26] = "Geometry_List";
    ChunkTypes[ChunkTypes["Right_To_Render"] = 31] = "Right_To_Render";
    ChunkTypes[ChunkTypes["HAnim_PLG"] = 286] = "HAnim_PLG";
    ChunkTypes[ChunkTypes["Material_Effects_PLG"] = 288] = "Material_Effects_PLG";
    ChunkTypes[ChunkTypes["Bin_Mesh_PLG"] = 1294] = "Bin_Mesh_PLG";
    ChunkTypes[ChunkTypes["Native_Data_PLG"] = 1296] = "Native_Data_PLG";
    // Rockstar Custom Sections
    ChunkTypes[ChunkTypes["Pipeline_Set"] = 39056115] = "Pipeline_Set";
    ChunkTypes[ChunkTypes["Specular_Material"] = 39056118] = "Specular_Material";
    ChunkTypes[ChunkTypes["Effect_2D"] = 39056120] = "Effect_2D";
    ChunkTypes[ChunkTypes["Extra_Vert_Colour"] = 39056121] = "Extra_Vert_Colour";
    ChunkTypes[ChunkTypes["Collision_Model"] = 39056122] = "Collision_Model";
    ChunkTypes[ChunkTypes["Reflection_Material"] = 39056124] = "Reflection_Material";
    ChunkTypes[ChunkTypes["Breakable"] = 39056125] = "Breakable";
    ChunkTypes[ChunkTypes["Frame"] = 39056126] = "Frame"; // https://gtamods.com/wiki/Frame_(RW_Section)
})(ChunkTypes || (ChunkTypes = {}));
exports.default = ChunkTypes;
//# sourceMappingURL=ChunkTypes.js.map