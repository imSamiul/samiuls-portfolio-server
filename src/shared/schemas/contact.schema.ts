import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(z.email('Enter a valid email address')),
  message: z
    .string()
    .trim()
    .min(20, 'Please write at least 20 characters')
    .max(2000, 'Please keep it under 2000 characters'),
  /**
   * Honeypot. The form renders this field hidden, so a real visitor always
   * leaves it blank and anything in it is a bot. Validation stays permissive on
   * purpose: the controller answers 200 and drops the message, which tells the
   * bot nothing.
   */
  website: z.string().optional(),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
