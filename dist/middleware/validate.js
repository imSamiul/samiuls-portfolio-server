"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("../utils/ApiError"));
function formatIssues(error) {
    return error.issues
        .map((issue) => issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message)
        .join('; ');
}
// Validating here keeps controllers free of ad-hoc checks. Unknown body keys
// are stripped by zod, which doubles as the mass-assignment whitelist.
const validate = (schemas) => (req, _res, next) => {
    if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
            next(new ApiError_1.default(400, formatIssues(result.error)));
            return;
        }
    }
    if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
            next(new ApiError_1.default(400, formatIssues(result.error)));
            return;
        }
        req.body = result.data;
    }
    next();
};
exports.default = validate;
