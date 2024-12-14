"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const mongoose_1 = __importDefault(require("./db/mongoose"));
const cors_1 = __importDefault(require("cors"));
// Load environment variables based on the current environment
const env = ((_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.trim()) || 'development';
console.log(`Environment: ${env}`);
const envFile = env === 'production' ? '.env.production' : '.env.development';
dotenv_1.default.config({ path: envFile });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Allow CORS
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3001',
        'https://8295-103-180-245-251.ngrok-free.app',
        'http://192.168.0.174:3001',
        'http://localhost:4173',
    ], // Specify the allowed origin (React app)
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies, authorization headers, etc.
}));
app.get('/', (req, res) => {
    res.send(`Hello, World! Environment: ${process.env.NODE_ENV}`);
});
app.use(express_1.default.json());
(0, mongoose_1.default)();
app.use('/api/resume', resumeRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/project', projectRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
