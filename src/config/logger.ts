import { pino } from 'pino';

import { isProduction, isTest } from './env.js';

/**
 * One JSON object per line on stdout, which is exactly what Koyeb collects and
 * makes searchable. No pretty transport: it would pull in a dev-only dependency
 * that the production container still has to resolve, and `tsx` runs the same
 * source in both places.
 */
export const logger = pino({
  // Silent in tests so the suite output stays readable.
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});
