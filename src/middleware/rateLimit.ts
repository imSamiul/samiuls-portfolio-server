import { rateLimit } from 'express-rate-limit';

import { isTest } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Counters live in memory: this API runs as a single instance, so there is no
 * second process to keep in sync. Tests skip enforcement entirely.
 */
function createLimiter(limit: number) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTest,
    handler: (_req, _res, next) => {
      next(
        ApiError.tooManyRequests(
          'Too many requests. Try again in a few minutes.',
        ),
      );
    },
  });
}

export const apiLimiter = createLimiter(600);

/** Credential endpoints get a much tighter budget per IP. */
export const authLimiter = createLimiter(20);

/** Tighter still: every accepted contact message costs an email. */
export const contactLimiter = createLimiter(5);
