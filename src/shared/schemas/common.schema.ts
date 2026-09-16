import { z } from 'zod';

export const objectIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid id'),
});

export type ObjectIdParams = z.infer<typeof objectIdParamsSchema>;

/** Lowercase words joined by single dashes — no leading, trailing or doubled. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugParamsSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, 'Invalid slug'),
});

export type SlugParams = z.infer<typeof slugParamsSchema>;
