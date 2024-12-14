"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const auth_1 = __importDefault(require("../auth/auth"));
const router = express_1.default.Router();
// GET:
router.get('/getAllProjects', projectController_1.getProjects);
router.get('/getProjectById/:id', projectController_1.getProjectById);
router.get('/getProjectsForHomepage', projectController_1.getProjectsForHomepage);
// POST:
router.post('/create', auth_1.default, projectController_1.uploadMiddleware, projectController_1.createProject);
// PATCH:
router.patch('/updateShowOnHomePage/:id', auth_1.default, projectController_1.updateShowOnHomePage);
router.patch('/updateProject/:id', auth_1.default, projectController_1.updateProject);
// DELETE:
router.delete('/deleteProject/:id', auth_1.default, projectController_1.deleteProject);
exports.default = router;
