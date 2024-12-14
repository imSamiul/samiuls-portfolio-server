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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            throw new Error('Token not provided');
        }
        if (!process.env.JWT_TOKEN) {
            throw new Error('JWT secret is not defined');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_TOKEN); // Specify the structure if known
        if (!decoded) {
            throw new Error('Invalid token');
        }
        req.body.tokenData = decoded.id;
        next();
    }
    catch (error) {
        let errorMessage = 'Authentication failed';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(500).json({ message: errorMessage });
        console.log(error);
    }
});
exports.default = auth;
