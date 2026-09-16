"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importStar(require("../config/db"));
const project_service_1 = require("../modules/projects/project.service");
// One-off: project images used to live on the document as a Buffer. This moves
// them to Cloudinary and rewrites the field. Re-running is safe — migrated
// documents no longer have `image.data`.
function migrateProjectImages() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.default)();
        const projects = mongoose_1.default.connection.collection('projects');
        const legacyProjects = yield projects
            .find({ 'image.data': { $exists: true } })
            .toArray();
        console.log(`Found ${legacyProjects.length} project(s) to migrate`);
        for (const project of legacyProjects) {
            const image = project.image;
            const buffer = Buffer.isBuffer(image.data)
                ? image.data
                : Buffer.from(image.data.buffer);
            const uploaded = yield (0, project_service_1.uploadProjectImage)(buffer);
            yield projects.updateOne({ _id: project._id }, { $set: { image: uploaded } });
            console.log(`Migrated ${String(project._id)} -> ${uploaded.url}`);
        }
    });
}
migrateProjectImages()
    .then(() => {
    console.log('Migration finished');
})
    .catch((error) => {
    console.error('Migration failed', error);
    process.exitCode = 1;
})
    .finally(() => (0, db_1.disconnectDB)());
