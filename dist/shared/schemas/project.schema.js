"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
const techListSchema = zod_1.z.array(zod_1.z.string().trim().min(1)).min(1);
// Create arrives as multipart, so every field is text and the tech lists come
// in as JSON strings.
const techListFromText = zod_1.z
    .string()
    .transform((value, ctx) => {
    try {
        return JSON.parse(value);
    }
    catch (_a) {
        ctx.addIssue({ code: 'custom', message: 'must be a valid JSON array' });
        return zod_1.z.NEVER;
    }
})
    .pipe(techListSchema);
const booleanFromText = zod_1.z
    .union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])])
    .transform((value) => value === true || value === 'true');
const requiredText = zod_1.z.string().trim().min(1);
exports.createProjectSchema = zod_1.z.object({
    title: requiredText,
    summary: requiredText,
    frontEndTech: techListFromText,
    backEndTech: techListFromText,
    liveLink: requiredText,
    frontEndRepo: requiredText,
    backEndRepo: requiredText,
    projectDetails: requiredText,
    showOnHomepage: booleanFromText.default(false),
});
// Update is sent as JSON, so the tech lists are real arrays here. No defaults:
// a missing key must stay untouched rather than being reset.
exports.updateProjectSchema = zod_1.z.object({
    title: requiredText.optional(),
    summary: requiredText.optional(),
    frontEndTech: techListSchema.optional(),
    backEndTech: techListSchema.optional(),
    liveLink: requiredText.optional(),
    frontEndRepo: requiredText.optional(),
    backEndRepo: requiredText.optional(),
    projectDetails: requiredText.optional(),
    showOnHomepage: zod_1.z.boolean().optional(),
});
