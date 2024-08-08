"use strict";
// Created using https://gtamods.com/wiki/2d_Effect_(RW_Section)
// This is probably one of the more complicated chunks
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedAttractorType = exports.LightCoronaShowMode = exports.LightFlags2 = exports.LightFlags1 = exports.EntryType = void 0;
var EntryType;
(function (EntryType) {
    EntryType[EntryType["Light"] = 0] = "Light";
    EntryType[EntryType["ParticleEffect"] = 1] = "ParticleEffect";
    // 2?
    EntryType[EntryType["PedAttractor"] = 3] = "PedAttractor";
    EntryType[EntryType["SunGlare"] = 4] = "SunGlare";
    // 5?
    EntryType[EntryType["EnterExit"] = 6] = "EnterExit";
    EntryType[EntryType["StreetSign"] = 7] = "StreetSign";
    EntryType[EntryType["TriggerPoint"] = 8] = "TriggerPoint";
    EntryType[EntryType["CoverPoint"] = 9] = "CoverPoint";
    EntryType[EntryType["Escalator"] = 10] = "Escalator";
})(EntryType = exports.EntryType || (exports.EntryType = {}));
/**
 * 2D Light Entry
 */
var LightFlags1;
(function (LightFlags1) {
    LightFlags1[LightFlags1["CORONA_CHECK_OBSTACLES"] = 1] = "CORONA_CHECK_OBSTACLES";
    LightFlags1[LightFlags1["FOG_TYPE_2"] = 2] = "FOG_TYPE_2";
    LightFlags1[LightFlags1["FOG_TYPE_4"] = 4] = "FOG_TYPE_4";
    LightFlags1[LightFlags1["WITHOUT_CORONA"] = 8] = "WITHOUT_CORONA";
    LightFlags1[LightFlags1["CORONA_ONLY_AT_LONG_DISTANCE"] = 16] = "CORONA_ONLY_AT_LONG_DISTANCE";
    LightFlags1[LightFlags1["AT_DAY"] = 32] = "AT_DAY";
    LightFlags1[LightFlags1["AT_NIGHT"] = 64] = "AT_NIGHT";
    LightFlags1[LightFlags1["BLINKING1"] = 128] = "BLINKING1";
})(LightFlags1 = exports.LightFlags1 || (exports.LightFlags1 = {}));
var LightFlags2;
(function (LightFlags2) {
    LightFlags2[LightFlags2["CORONA_ONLY_FROM_BELOW"] = 1] = "CORONA_ONLY_FROM_BELOW";
    LightFlags2[LightFlags2["BLINKING2"] = 2] = "BLINKING2";
    LightFlags2[LightFlags2["UPDATE_HEIGHT_ABOVE_GROUND"] = 4] = "UPDATE_HEIGHT_ABOVE_GROUND";
    LightFlags2[LightFlags2["CHECK_DIRECTION"] = 8] = "CHECK_DIRECTION";
    LightFlags2[LightFlags2["BLINKING3"] = 16] = "BLINKING3";
})(LightFlags2 = exports.LightFlags2 || (exports.LightFlags2 = {}));
var LightCoronaShowMode;
(function (LightCoronaShowMode) {
    LightCoronaShowMode[LightCoronaShowMode["DEFAULT"] = 0] = "DEFAULT";
    LightCoronaShowMode[LightCoronaShowMode["RANDOM_FLASHING"] = 1] = "RANDOM_FLASHING";
    LightCoronaShowMode[LightCoronaShowMode["RANDOM_FLASHING_ALWAYS_AT_WET_WEATHER"] = 2] = "RANDOM_FLASHING_ALWAYS_AT_WET_WEATHER";
    LightCoronaShowMode[LightCoronaShowMode["LIGHTS_ANIM_SPEED_4X"] = 3] = "LIGHTS_ANIM_SPEED_4X";
    LightCoronaShowMode[LightCoronaShowMode["LIGHTS_ANIM_SPEED_2X"] = 4] = "LIGHTS_ANIM_SPEED_2X";
    LightCoronaShowMode[LightCoronaShowMode["LIGHTS_ANIM_SPEED_1x"] = 5] = "LIGHTS_ANIM_SPEED_1x";
    LightCoronaShowMode[LightCoronaShowMode["WARNLIGHT"] = 6] = "WARNLIGHT";
    LightCoronaShowMode[LightCoronaShowMode["TRAFFICLIGHT"] = 7] = "TRAFFICLIGHT";
    LightCoronaShowMode[LightCoronaShowMode["TRAINCROSSLIGHT"] = 8] = "TRAINCROSSLIGHT";
    LightCoronaShowMode[LightCoronaShowMode["UNKNOWN"] = 9] = "UNKNOWN";
    LightCoronaShowMode[LightCoronaShowMode["AT_RAIN_ONLY"] = 10] = "AT_RAIN_ONLY";
    LightCoronaShowMode[LightCoronaShowMode["TIME_5_5"] = 11] = "TIME_5_5";
    LightCoronaShowMode[LightCoronaShowMode["TIME_6_4_12"] = 12] = "TIME_6_4_12";
    LightCoronaShowMode[LightCoronaShowMode["TIME_6_4_13"] = 13] = "TIME_6_4_13";
})(LightCoronaShowMode = exports.LightCoronaShowMode || (exports.LightCoronaShowMode = {}));
var PedAttractorType;
(function (PedAttractorType) {
    PedAttractorType[PedAttractorType["PED_ATM_ATTRACTOR"] = 0] = "PED_ATM_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_SEAT_ATTRACTOR"] = 1] = "PED_SEAT_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_STOP_ATTRACTOR"] = 2] = "PED_STOP_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_PIZZA_ATTRACTOR"] = 3] = "PED_PIZZA_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_SHELTER_ATTRACTOR"] = 4] = "PED_SHELTER_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_TRIGGER_SCRIPT_ATTRACTOR"] = 5] = "PED_TRIGGER_SCRIPT_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_LOOK_AT_ATTRACTOR"] = 6] = "PED_LOOK_AT_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_SCRIPTED_ATTRACTOR"] = 7] = "PED_SCRIPTED_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_PARK_ATTRACTOR"] = 8] = "PED_PARK_ATTRACTOR";
    PedAttractorType[PedAttractorType["PED_STEP_ATTRACTOR"] = 9] = "PED_STEP_ATTRACTOR";
})(PedAttractorType = exports.PedAttractorType || (exports.PedAttractorType = {}));
//# sourceMappingURL=2DEffectChunk.js.map