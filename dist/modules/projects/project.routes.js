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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requireAuth_1 = __importDefault(require("../../middleware/requireAuth"));
const upload_1 = require("../../middleware/upload");
const validate_1 = __importDefault(require("../../middleware/validate"));
const common_schema_1 = require("../../shared/schemas/common.schema");
const project_schema_1 = require("../../shared/schemas/project.schema");
const projectController = __importStar(require("./project.controller"));
const router = express_1.default.Router();
// Paths are kept verbatim from the pre-migration API so the client keeps
// working until both repos move to /api/v1 together.
router.get('/getAllProjects', projectController.getProjects);
router.get('/getProjectsForHomepage', projectController.getHomepageProjects);
router.get('/getProjectById/:id', (0, validate_1.default)({ params: common_schema_1.objectIdParamsSchema }), projectController.getProjectById);
router.post('/create', requireAuth_1.default, upload_1.uploadProjectImage, (0, validate_1.default)({ body: project_schema_1.createProjectSchema }), projectController.createProject);
router.patch('/updateShowOnHomePage/:id', requireAuth_1.default, (0, validate_1.default)({ params: common_schema_1.objectIdParamsSchema }), projectController.toggleShowOnHomepage);
router.patch('/updateProject/:id', requireAuth_1.default, (0, validate_1.default)({ params: common_schema_1.objectIdParamsSchema, body: project_schema_1.updateProjectSchema }), projectController.updateProject);
router.delete('/deleteProject/:id', requireAuth_1.default, (0, validate_1.default)({ params: common_schema_1.objectIdParamsSchema }), projectController.deleteProject);
exports.default = router;
