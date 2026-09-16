"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
// The client reads `error.response.data.message`, so every failure has to keep
// that key regardless of where it came from.
const errorHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }
    if (error instanceof ApiError_1.default) {
        res.status(error.status).json({ message: error.message });
        return;
    }
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof mongoose_1.default.Error.CastError) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    if (error instanceof mongoose_1.default.mongo.MongoServerError &&
        error.code === 11000) {
        res.status(409).json({ message: 'This value already exists.' });
        return;
    }
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
};
exports.default = errorHandler;
