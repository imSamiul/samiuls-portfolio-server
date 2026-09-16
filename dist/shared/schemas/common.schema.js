"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectIdParamsSchema = void 0;
const zod_1 = require("zod");
exports.objectIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid id'),
});
