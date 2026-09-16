import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
