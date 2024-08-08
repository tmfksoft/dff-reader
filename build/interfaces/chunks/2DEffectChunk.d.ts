export interface Base2DEffectEntry {
    position: {
        x: number;
        y: number;
        z: number;
    };
    entryType: EntryType;
}
export declare enum EntryType {
    Light = 0,
    ParticleEffect = 1,
    PedAttractor = 3,
    SunGlare = 4,
    EnterExit = 6,
    StreetSign = 7,
    TriggerPoint = 8,
    CoverPoint = 9,
    Escalator = 10
}
/**
 * 2D Light Entry
 */
export declare enum LightFlags1 {
    CORONA_CHECK_OBSTACLES = 1,
    FOG_TYPE_2 = 2,
    FOG_TYPE_4 = 4,
    WITHOUT_CORONA = 8,
    CORONA_ONLY_AT_LONG_DISTANCE = 16,
    AT_DAY = 32,
    AT_NIGHT = 64,
    BLINKING1 = 128
}
export declare enum LightFlags2 {
    CORONA_ONLY_FROM_BELOW = 1,
    BLINKING2 = 2,
    UPDATE_HEIGHT_ABOVE_GROUND = 4,
    CHECK_DIRECTION = 8,
    BLINKING3 = 16
}
export declare enum LightCoronaShowMode {
    DEFAULT = 0,
    RANDOM_FLASHING = 1,
    RANDOM_FLASHING_ALWAYS_AT_WET_WEATHER = 2,
    LIGHTS_ANIM_SPEED_4X = 3,
    LIGHTS_ANIM_SPEED_2X = 4,
    LIGHTS_ANIM_SPEED_1x = 5,
    WARNLIGHT = 6,
    TRAFFICLIGHT = 7,
    TRAINCROSSLIGHT = 8,
    UNKNOWN = 9,
    AT_RAIN_ONLY = 10,
    TIME_5_5 = 11,
    TIME_6_4_12 = 12,
    TIME_6_4_13 = 13
}
export interface Light2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.Light;
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    coronaFarClip: number;
    pointLightRange: number;
    coronaSize: number;
    shadowSize: number;
    coronaShowMode: LightCoronaShowMode;
    coronaEnableReflection: number;
    coronaFlareType: number;
    shadowColorMultiplier: number;
    flags1: LightFlags1;
    coronaTexName: string;
    shadowTexName: string;
    shadowZDistance: number;
    flags2: LightFlags2;
}
export interface ExtendedLight2DEffectEntry extends Base2DEffectEntry {
    lookDirection: {
        x: number;
        y: number;
        z: number;
    };
}
export interface Particle2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.ParticleEffect;
    particleName: string;
}
export declare enum PedAttractorType {
    PED_ATM_ATTRACTOR = 0,
    PED_SEAT_ATTRACTOR = 1,
    PED_STOP_ATTRACTOR = 2,
    PED_PIZZA_ATTRACTOR = 3,
    PED_SHELTER_ATTRACTOR = 4,
    PED_TRIGGER_SCRIPT_ATTRACTOR = 5,
    PED_LOOK_AT_ATTRACTOR = 6,
    PED_SCRIPTED_ATTRACTOR = 7,
    PED_PARK_ATTRACTOR = 8,
    PED_STEP_ATTRACTOR = 9
}
export interface PedAttractor2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.PedAttractor;
    attractorType: PedAttractorType;
    queueDir: {
        x: number;
        y: number;
        z: number;
    };
    useDir: {
        x: number;
        y: number;
        z: number;
    };
    forwardDir: {
        x: number;
        y: number;
        z: number;
    };
    externalScriptName: string;
    pedExistingProbability: number;
    unknown1: number;
    unused1: number;
    unknown2: number;
    unused2: number;
}
export interface SunGlare2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.SunGlare;
}
export interface EnterExit2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.EnterExit;
    enterRotationAngle: number;
    radiusX: number;
    radiusY: number;
    exitPosition: {
        x: number;
        y: number;
        z: number;
    };
    exitRotationAngle: number;
    interiorId: number;
    flags: number;
    interiorName: string;
    timeOn: number;
    timeOff: number;
    skyColor: number;
    unknown: number;
}
export interface StreetSign2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.StreetSign;
    size: {
        width: number;
        height: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    flags: number;
    text: string[];
    flagsDecoded: {
        lines: number;
        maxSymbols: number;
        textColor: number;
    };
}
export interface TriggerPoint2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.TriggerPoint;
    pointId: number;
}
export interface CoverPoint2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.CoverPoint;
    xDirection: number;
    yDirection: number;
    coverType: number;
}
export interface Escalator2DEffectEntry extends Base2DEffectEntry {
    entryType: EntryType.Escalator;
    bottomPosition: {
        x: number;
        y: number;
        z: number;
    };
    topPosition: {
        x: number;
        y: number;
        z: number;
    };
    endPosition: {
        x: number;
        y: number;
        z: number;
    };
    direction: number;
}
type EffectEntry = Light2DEffectEntry | ExtendedLight2DEffectEntry | Particle2DEffectEntry | PedAttractor2DEffectEntry | SunGlare2DEffectEntry | EnterExit2DEffectEntry | StreetSign2DEffectEntry | TriggerPoint2DEffectEntry | CoverPoint2DEffectEntry | Escalator2DEffectEntry | Base2DEffectEntry;
export { EffectEntry };
export default interface Base2DEffectChunk {
    entryCount: number;
    entries: EffectEntry[];
}
