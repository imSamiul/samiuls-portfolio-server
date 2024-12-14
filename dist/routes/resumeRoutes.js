"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resumeController_1 = require("../controllers/resumeController");
const router = express_1.default.Router();
// GET:
router.get('/download', resumeController_1.downloadResume);
// POST:
// PATCH:
// DELETE:
exports.default = router;
