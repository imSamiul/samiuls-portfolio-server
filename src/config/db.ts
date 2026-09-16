import mongoose from 'mongoose';

import { env, isProduction } from './env.js';

mongoose.set('strictQuery', true);

let connection: Promise<unknown> | undefined;

/**
 * One connection per process, shared by every caller. A serverless instance
 * handles many requests, so connecting per request would open a new pool each
 * time and exhaust Atlas' connection limit.
 *
 * `autoIndex` is off in production — `pnpm sync:indexes` builds them instead,
 * so a cold start never waits on index checks.
 */
export function ensureDatabase(uri: string = env.DB_URL) {
  connection ??= mongoose
    .connect(uri, { autoIndex: !isProduction, maxPoolSize: 5 })
    .catch((error: unknown) => {
      // A rejected promise would be cached for the life of the instance, so
      // clear it and let the next request try again.
      connection = undefined;
      throw error;
    });

  return connection;
}

export async function disconnectDatabase() {
  connection = undefined;
  await mongoose.disconnect();
}
