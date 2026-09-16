import { z } from 'zod';

import { SLUG_PATTERN } from './common.schema.js';

const techListSchema = z.array(z.string().trim().min(1));

/** A project always has a frontend; it may not have a backend. */
const requiredTechListSchema = techListSchema.min(1);

/**
 * Create arrives as multipart, so every field is text and the tech lists come in
 * as JSON strings.
 */
const jsonArrayFromText = z.string().transform((value, ctx) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    ctx.addIssue({ code: 'custom', message: 'must be a valid JSON array' });
    return z.NEVER;
  }
});

const booleanFromText = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');

const requiredText = z.string().trim().min(1);

/**
 * Links are optional: blank is allowed and means "there is none". The serializer
 * drops blanks from responses, so the client tests for presence, not for ''.
 */
const optionalText = z.string().trim().optional();

/**
 * Blank means "derive it from the title". Anything else has to be URL safe
 * already, since it becomes a public, indexed URL.
 */
const optionalSlug = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value.toLowerCase()))
  .refine(
    (value) => value === undefined || SLUG_PATTERN.test(value),
    'Use lowercase letters, numbers and single dashes',
  )
  .optional();

export const projectStatusSchema = z.enum(['draft', 'published']);

/** Multipart sends numbers as text, and blank coerces to 0, which is the default. */
const orderFromText = z.coerce.number().int();

export const createProjectSchema = z.object({
  title: requiredText,
  slug: optionalSlug,
  // Drafts by default: publishing has to be a deliberate act.
  status: projectStatusSchema.default('draft'),
  order: orderFromText.default(0),
  summary: requiredText,
  frontEndTech: jsonArrayFromText.pipe(requiredTechListSchema),
  backEndTech: jsonArrayFromText.pipe(techListSchema).default([]),
  liveLink: optionalText,
  frontEndRepo: optionalText,
  backEndRepo: optionalText,
  projectDetails: requiredText,
  showOnHomepage: booleanFromText.default(false),
});

/**
 * Update is sent as JSON, so the tech lists are real arrays here. No defaults: a
 * missing key must stay untouched rather than being reset.
 */
export const updateProjectSchema = z.object({
  title: requiredText.optional(),
  // Editable, but renaming the title alone never moves an existing URL.
  slug: optionalSlug,
  status: projectStatusSchema.optional(),
  order: z.number().int().optional(),
  summary: requiredText.optional(),
  frontEndTech: requiredTechListSchema.optional(),
  backEndTech: techListSchema.optional(),
  liveLink: optionalText,
  frontEndRepo: optionalText,
  backEndRepo: optionalText,
  projectDetails: requiredText.optional(),
  showOnHomepage: z.boolean().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
