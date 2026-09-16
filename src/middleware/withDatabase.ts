import type { RequestHandler } from 'express';

import { ensureDatabase } from '../config/db.js';

/**
 * Serverless has no boot step: the first request arrives before anything has
 * connected. Every later request reuses the resolved promise, so this costs one
 * microtask once the instance is warm.
 */
export const withDatabase: RequestHandler = (_req, _res, next) => {
  ensureDatabase().then(() => next(), next);
};
