import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Local: `.env.development` (gitignored). Hosted runtimes inject process.env —
 * dotenv does not override existing keys, and a missing file is fine.
 */
dotenv.config({ path: '.env.development' });

/**
 * Cloudinary and Resend are optional in development and test so the API can
 * boot from a bare clone, but mandatory in production where images live in
 * Cloudinary and the contact form has to deliver.
 */
const productionRequired = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY',
  'CONTACT_FROM_EMAIL',
  'WEB_REVALIDATE_URL',
  'REVALIDATE_SECRET',
] as const;

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    API_PREFIX: z.string().default('/api/v1'),

    DB_URL: z.string().min(1),

    JWT_TOKEN: z.string().min(1),
    JWT_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

    CORS_ORIGIN: z.string().default('http://localhost:3002'),

    // The dashboard has exactly one account; the gate used to be hardcoded in
    // the auth controller.
    ADMIN_EMAIL: z.string().min(1),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // Contact form delivery. Without a verified Resend domain, the only usable
    // sender is `onboarding@resend.dev` — fine, since it only mails ADMIN_EMAIL.
    RESEND_API_KEY: z.string().optional(),
    CONTACT_FROM_EMAIL: z.string().optional(),

    // The website's revalidation webhook. Without both, writes skip the call —
    // and since the site caches project data indefinitely, nothing would ever
    // update. Hence required in production.
    WEB_REVALIDATE_URL: z.string().optional(),
    REVALIDATE_SECRET: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') return;

    for (const key of productionRequired) {
      if (!value[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required when NODE_ENV=production`,
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) =>
  origin.trim(),
);
