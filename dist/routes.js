"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_routes_1 = __importDefault(require("./modules/projects/project.routes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const router = (0, express_1.Router)();
router.use('/resume', resumeRoutes_1.default);
router.use('/auth', authRoutes_1.default);
router.use('/project', project_routes_1.default);
exports.default = router;
