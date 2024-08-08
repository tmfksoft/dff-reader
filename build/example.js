"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const _1 = __importDefault(require("."));
// Both an example file on how to use this reader
// and testing ground for me to fix bugs and test solutions
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const tempDir = path_1.default.join(__dirname, "..", "temp");
        // Bug with loading animated models ahead :(
        // xenonsign2_SFSe
        // BS_building_SFS - Burger shot?
        const modelName = "cxrf_frway1sig";
        const bansheeFile = path_1.default.join(tempDir, modelName + ".dff");
        const bansheeData = fs_1.default.readFileSync(bansheeFile);
        const dff = new _1.default(bansheeData);
        fs_1.default.writeFileSync(path_1.default.join(tempDir, modelName + ".json"), JSON.stringify(dff.stripData(dff.parsed), null, '\t'));
        //fs.writeFileSync(path.join(tempDir, modelName + ".json"), JSON.stringify(dff.parsed, null, '\t'));
        fs_1.default.writeFileSync(path_1.default.join(tempDir, modelName + "_test.json"), JSON.stringify(dff.getNode(), null, '\t'));
        // Test write OBJ and MTL
    });
}
start();
//# sourceMappingURL=example.js.map