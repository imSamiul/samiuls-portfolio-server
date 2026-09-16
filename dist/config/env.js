"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Local runs read a dotenv file; on a hosted runtime the platform injects the
// values and this call is a no-op.
const nodeEnv = ((_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.trim()) || 'development';
dotenv_1.default.config({
    path: nodeEnv === 'production' ? '.env.production' : '.env.development',
});
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production']),
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    DB_URL: zod_1.z.string().min(1),
    JWT_TOKEN: zod_1.z.string().min(1),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1),
});
const parsed = envSchema.safeParse(Object.assign(Object.assign({}, process.env), { NODE_ENV: nodeEnv }));
if (!parsed.success) {
    // Fail at boot naming the offending variables, instead of crashing somewhere
    // inside a request later on.
    const details = parsed.error.issues
        .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
    console.error(`Invalid environment configuration:\n${details}`);
    process.exit(1);
}
exports.env = parsed.data;
