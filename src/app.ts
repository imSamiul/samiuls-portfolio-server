import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { corsOrigins, env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { requestLog } from './middleware/requestLog.js';
import { routes } from './routes.js';
import { sendSuccess } from './utils/response.js';

export function createApp() {
  const app = express();

  // Koyeb sits in front of the API, so client IPs arrive via headers.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Outside the API prefix so the platform health check never counts against
  // the rate limit.
  app.get('/health', (_req, res) => {
    sendSuccess(res, 'ok', { uptime: process.uptime() });
  });

  // After /health so the platform's health probe does not flood the log.
  app.use(env.API_PREFIX, requestLog, apiLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
