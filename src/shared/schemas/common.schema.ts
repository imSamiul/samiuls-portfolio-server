import { z } from 'zod';

import { PROJECTS_PAGE_SIZE } from '../constants.js';

/**
 * `?page=&limit=` on public lists. Query values arrive as strings, hence the
 * coercion; the ceiling stops a caller from asking for the whole collection in
 * one response.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(PROJECTS_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

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
