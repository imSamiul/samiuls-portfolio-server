import app from './app';
import connectDB, { disconnectDB } from './config/db';
import { env } from './config/env';

async function start() {
  // Connect before listening so a healthy port never means a dead database.
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`Server listening on ${env.PORT} (${env.NODE_ENV})`);
  });

  // Hosts send SIGTERM on redeploy; finish in-flight requests first.
  const shutdown = () => {
    server.close(() => {
      void disconnectDB().finally(() => process.exit(0));
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((error) => {
  console.error('Failed to start the server', error);
  process.exit(1);
});
