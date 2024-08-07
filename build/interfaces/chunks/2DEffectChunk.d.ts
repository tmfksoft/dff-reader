interface Base2DEffectChunk {
    position: {
        x: number;
        y: number;
        z: number;
    };
    entryType: number;
}
interface Light2DEffectChunk extends Base2DEffectChunk {
    entryType: 0;
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
    coronaShowMode: number;
    coronaEnableReflection: number;
    coronaFlareType: number;
    shadowColorMultiplier: number;
    flags1: number;
    coronaTexName: string;
    shadowTexName: string;
    shadowZDistance: number;
    flags2: number;
}
interface ExtendedLight2DEffectChunk extends Light2DEffectChunk {
    lookDirectionX: number;
    lookDirectionY: number;
    lookDirectionZ: number;
}
interface Particle2DEffectChunk extends Base2DEffectChunk {
    entryType: 1;
    particleName: string;
}
interface PedAttractor2DEffectChunk extends Base2DEffectChunk {
    entryType: 3;
    type: number;
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
}
interface SunGlare2DEffectChunk extends Base2DEffectChunk {
    entryType: 4;
}
interface EnterExit2DEffectChunk extends Base2DEffectChunk {
    entryType: 6;
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
    interiorName: number;
    timeOn: string;
    timeOff: string;
    skyColor: string;
}
interface StreetSign2DEffectChunk extends Base2DEffectChunk {
    entryType: 7;
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
}
interface TriggerPoint2DEffectChunk extends Base2DEffectChunk {
    entryType: 8;
    pointId: number;
}
interface CoverPoint2DEffectChunk extends Base2DEffectChunk {
    entryType: 9;
    xDirection: number;
    yDirection: number;
    coverType: number;
}
interface Escalator2DEffectChunk extends Base2DEffectChunk {
    entryType: 10;
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
