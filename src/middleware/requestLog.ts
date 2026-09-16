import { randomUUID } from 'node:crypto';

import { pinoHttp } from 'pino-http';

import { logger } from '../config/logger.js';

/**
 * Access log, plus a request id stamped on every line logged during that
 * request — so a single error report leads straight back to the request that
 * caused it. The id also goes out as a response header, which is what an admin
 * can quote when something looks wrong.
 *
 * Silenced in tests through the logger's level, not a flag here.
 */
export const requestLog = pinoHttp({
  logger,
  genReqId: (req, res) => {
    // Koyeb may already have tagged the request; keep its id so the two sets of
    // logs line up.
    const forwarded = req.headers['x-request-id'];
    const id = typeof forwarded === 'string' ? forwarded : randomUUID();

    res.setHeader('x-request-id', id);

    return id;
  },
  // 500s are logged again by errorHandler with the error attached, so this line
  // only needs to say the request finished badly.
  customLogLevel: (_req, res, error) =>
    res.statusCode >= 500 || error ? 'warn' : 'info',
});
