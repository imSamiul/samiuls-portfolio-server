"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const requireAuth = (req, _res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        next(new ApiError_1.default(401, 'Token not provided'));
        return;
    }
    try {
        jsonwebtoken_1.default.verify(token, env_1.env.JWT_TOKEN);
        next();
    }
    catch (_b) {
        next(new ApiError_1.default(401, 'Invalid or expired token'));
    }
};
exports.default = requireAuth;
