import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { corsOrigins, env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { requestLog } from './middleware/requestLog.js';
import { routes } from './routes.js';

export function createApp() {
  const app = express();

  // Koyeb sits in front of the API, so client IPs arrive via headers.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLog);

  // Outside the API prefix so the platform health check never counts against
  // the rate limit.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use(env.API_PREFIX, apiLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
