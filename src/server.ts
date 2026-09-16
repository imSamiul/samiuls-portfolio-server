import app from './app.js';
import { disconnectDatabase, ensureDatabase } from './config/db.js';
import { env } from './config/env.js';

/**
 * The container entry. On Vercel nothing runs this file: the platform imports
 * the app from `app.ts` and owns the listener itself.
 */
async function bootstrap() {
  await ensureDatabase();

  const server = app.listen(env.PORT);

  const shutdown = () => {
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Nothing catches this on purpose: a failed boot is fatal, and letting it
// reject is what prints the reason and exits non-zero.
await bootstrap();
