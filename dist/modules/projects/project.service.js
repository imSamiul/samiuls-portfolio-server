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
exports.uploadProjectImage = uploadProjectImage;
exports.findProjects = findProjects;
exports.findHomepageProjects = findHomepageProjects;
exports.findProjectById = findProjectById;
exports.createProject = createProject;
exports.updateProject = updateProject;
exports.toggleShowOnHomepage = toggleShowOnHomepage;
exports.deleteProject = deleteProject;
const sharp_1 = __importDefault(require("sharp"));
const cloudinary_1 = __importStar(require("../../config/cloudinary"));
const project_model_1 = __importDefault(require("../../models/project.model"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 1080;
const WEBP_QUALITY = 80;
// Re-encoding matters: uploading the raw buffer keeps the original format, so a
// 2MB PNG would stay a 2MB PNG. Also exported for the one-off data migration.
function uploadProjectImage(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const optimised = yield (0, sharp_1.default)(buffer)
            .resize(IMAGE_WIDTH, IMAGE_HEIGHT)
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();
        const result = yield cloudinary_1.default.uploader.upload(`data:image/webp;base64,${optimised.toString('base64')}`, { folder: cloudinary_1.PROJECT_IMAGE_FOLDER, resource_type: 'image' });
        return { url: result.secure_url, publicId: result.public_id };
    });
}
function findProjects() {
    return project_model_1.default.find().sort({ createdAt: -1 }).lean();
}
function findHomepageProjects() {
    return project_model_1.default.find({ showOnHomepage: true })
        .sort({ createdAt: -1 })
        .lean();
}
function findProjectById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const project = yield project_model_1.default.findById(id).lean();
        if (!project) {
            throw new ApiError_1.default(404, 'Project not found');
        }
        return project;
    });
}
function createProject(input, imageBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const image = yield uploadProjectImage(imageBuffer);
        try {
            const project = yield project_model_1.default.create(Object.assign(Object.assign({}, input), { image }));
            return project.toObject();
        }
        catch (error) {
            // Don't leave an orphaned asset behind when the insert fails.
            yield cloudinary_1.default.uploader.destroy(image.publicId);
            throw error;
        }
    });
}
function updateProject(id, input) {
    return __awaiter(this, void 0, void 0, function* () {
        const project = yield project_model_1.default.findByIdAndUpdate(id, input, {
            new: true,
            runValidators: true,
        }).lean();
        if (!project) {
            throw new ApiError_1.default(404, 'Project not found');
        }
        return project;
    });
}
function toggleShowOnHomepage(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const project = yield project_model_1.default.findById(id);
        if (!project) {
            throw new ApiError_1.default(404, 'Project not found');
        }
        project.showOnHomepage = !project.showOnHomepage;
        yield project.save();
        return project.toObject();
    });
}
function deleteProject(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const project = yield project_model_1.default.findByIdAndDelete(id).lean();
        if (!project) {
            throw new ApiError_1.default(404, 'Project not found');
        }
        if ((_a = project.image) === null || _a === void 0 ? void 0 : _a.publicId) {
            yield cloudinary_1.default.uploader.destroy(project.image.publicId);
        }
        return project;
    });
}
