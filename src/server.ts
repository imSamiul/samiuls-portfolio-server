import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function bootstrap() {
  await connectDatabase();

  const server = createApp().listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, prefix: env.API_PREFIX },
      `API listening on http://localhost:${env.PORT}${env.API_PREFIX}`,
    );
  });

  const shutdown = () => {
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start API');
  process.exit(1);
});
