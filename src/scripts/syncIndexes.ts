/* eslint-disable no-console */
import mongoose from 'mongoose';

import { disconnectDatabase, ensureDatabase } from '../config/db.js';
// Imported for the side effect: a model has to be registered to be synced.
import '../models/index.js';

/**
 * Production runs with `autoIndex` off, and a serverless instance boots on
 * every cold start — far too often to check indexes there. Run this once per
 * deploy that changes an index.
 */
async function syncIndexes() {
  await ensureDatabase();

  for (const model of Object.values(mongoose.models)) {
    const changes = await model.syncIndexes();

    console.log(
      changes.length
        ? `${model.modelName}: dropped ${changes.join(', ')}`
        : `${model.modelName}: up to date`,
    );
  }
}

syncIndexes()
  .then(() => {
    console.log('Index sync finished');
  })
  .catch((error) => {
    console.error('Index sync failed', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
