import type { RequestHandler } from 'express';

/**
 * One line per request, printed on `finish` because the status code is only
 * known once the response is sent. `originalUrl` keeps the mount prefix that
 * Express strips from `req.url` inside a router.
 */
export const requestLog: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    // eslint-disable-next-line no-console
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`,
    );
  });

  next();
};
