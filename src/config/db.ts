import mongoose from 'mongoose';
import { env } from './env';

let connection: Promise<typeof mongoose> | null = null;

// Memoised so the standalone server and the Vercel entry can both ask for a
// connection without opening a second pool.
export default function connectDB() {
  if (!connection) {
    connection = mongoose.connect(env.DB_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  return connection;
}

export function disconnectDB() {
  connection = null;
  return mongoose.disconnect();
}
