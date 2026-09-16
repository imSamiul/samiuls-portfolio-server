import { z } from 'zod';

const techListSchema = z.array(z.string().trim().min(1)).min(1);

// Create arrives as multipart, so every field is text and the tech lists come
// in as JSON strings.
const techListFromText = z
  .string()
  .transform((value, ctx) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      ctx.addIssue({ code: 'custom', message: 'must be a valid JSON array' });
      return z.NEVER;
    }
  })
  .pipe(techListSchema);

const booleanFromText = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');

const requiredText = z.string().trim().min(1);

export const createProjectSchema = z.object({
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
export const updateProjectSchema = z.object({
  title: requiredText.optional(),
  summary: requiredText.optional(),
  frontEndTech: techListSchema.optional(),
  backEndTech: techListSchema.optional(),
  liveLink: requiredText.optional(),
  frontEndRepo: requiredText.optional(),
  backEndRepo: requiredText.optional(),
  projectDetails: requiredText.optional(),
  showOnHomepage: z.boolean().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
