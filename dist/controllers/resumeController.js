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
exports.downloadResume = void 0;
const path_1 = __importDefault(require("path"));
const downloadResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = path_1.default.join(__dirname, '../../public/assets/Samiul_Resume.pdf');
    try {
        res.download(filePath, 'Samiul_Resume.pdf');
    }
    catch (error) {
        let errorMessage = 'Failed to do something exceptional';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(500).send({ message: errorMessage });
    }
});
exports.downloadResume = downloadResume;
