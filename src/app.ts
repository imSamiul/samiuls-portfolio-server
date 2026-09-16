import compression from 'compression';
import cors from 'cors';
import express from 'express';
import type { RequestHandler } from 'express';
import helmetDefault from 'helmet';

import { corsOrigins, env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { requestLog } from './middleware/requestLog.js';
import { withDatabase } from './middleware/withDatabase.js';
import { routes } from './routes.js';
import { sendSuccess } from './utils/response.js';

// Vercel's build type-checks this file with a resolver that picks helmet's CJS
// declarations, where the default import is typed as the module namespace
// instead of the middleware factory. Local `tsc` picks the ESM declarations, so
// the cast is what keeps both toolchains happy.
const helmet = helmetDefault as unknown as () => RequestHandler;

export function createApp() {
  const app = express();

  // The platform terminates TLS in front of the API, so client IPs arrive via
  // headers.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Outside the API prefix so the platform health check never counts against
  // the rate limit, and answers without touching the database.
  app.get('/health', (_req, res) => {
    sendSuccess(res, 'ok', { uptime: process.uptime() });
  });

  // After /health so the platform's health probe does not flood the log.
  app.use(env.API_PREFIX, requestLog, withDatabase, apiLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Vercel builds the deployment around the Express app it finds default-exported
 * from `src/app.ts` — the one place in this repo where a default export is
 * required rather than avoided. `server.ts` listens on this same instance.
 */
export default createApp();
