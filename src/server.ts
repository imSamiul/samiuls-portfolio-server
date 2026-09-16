/* eslint-disable no-console */
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectDatabase();

  const server = createApp().listen(env.PORT, () => {
    console.log(
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

bootstrap().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
