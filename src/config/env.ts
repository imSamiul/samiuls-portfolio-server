import dotenv from 'dotenv';
import { z } from 'zod';

// Local runs read a dotenv file; on a hosted runtime the platform injects the
// values and this call is a no-op.
const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
dotenv.config({
  path: nodeEnv === 'production' ? '.env.production' : '.env.development',
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_URL: z.string().min(1),
  JWT_TOKEN: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse({ ...process.env, NODE_ENV: nodeEnv });

if (!parsed.success) {
  // Fail at boot naming the offending variables, instead of crashing somewhere
  // inside a request later on.
  const details = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Invalid environment configuration:\n${details}`);
  process.exit(1);
}

export const env = parsed.data;
