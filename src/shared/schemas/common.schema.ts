import { z } from 'zod';

export const objectIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid id'),
});

export type ObjectIdParams = z.infer<typeof objectIdParamsSchema>;
