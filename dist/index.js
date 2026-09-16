"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Vercel's build entry points at dist/index.js and expects the express app to
// be the default export. Delete this file together with vercel.json once the
// API runs on Koyeb, where src/server.ts is the entry point.
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
void (0, db_1.default)();
exports.default = app_1.default;
