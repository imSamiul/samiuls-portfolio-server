"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const routes_1 = __importDefault(require("./routes"));
const ApiError_1 = __importDefault(require("./utils/ApiError"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        'http://192.168.0.174:3002',
        'https://samiul3041.vercel.app', // Production frontend
        'http://localhost:3002',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express_1.default.json());
// Kept outside the API prefix so the host's health check does not depend on it.
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use('/api', routes_1.default);
app.use((_req, _res, next) => {
    next(new ApiError_1.default(404, 'Route not found'));
});
app.use(errorHandler_1.default);
exports.default = app;
