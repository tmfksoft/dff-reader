"use strict";
// https://gtamods.com/wiki/Skin_PLG_(RW_Section)
// Only the pieces a software (WebGL) skinning pipeline actually needs are
// parsed here - per-vertex bone indices/weights and each bone's inverse bind
// matrix. Real files also carry a trailing platform-specific "skin split"
// section (PS2/Xbox hardware skinning batches) after the bone matrices;
// it's ignored, so parsing intentionally never reads to the end of the chunk.
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=SkinChunk.js.map