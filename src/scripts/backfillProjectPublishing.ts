/* eslint-disable no-console */
import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../config/db.js';

/**
 * One-off: `status` defaults to `draft`, but mongoose defaults only apply to
 * documents it creates. Projects that predate the field read back as
 * `status: undefined`, which the public lists filter out — so without this the
 * website would go empty the moment the new code ships.
 *
 * Re-running is safe: documents that already have the fields are skipped.
 */
async function backfillProjectPublishing() {
  await connectDatabase();

  const projects = mongoose.connection.collection('projects');

  const published = await projects.updateMany(
    { status: { $exists: false } },
    // Already live before this field existed, so they stay live.
    { $set: { status: 'published' } },
  );
  const ordered = await projects.updateMany(
    { order: { $exists: false } },
    // 0 everywhere keeps the previous newest-first ordering intact.
    { $set: { order: 0 } },
  );

  console.log(`Published ${published.modifiedCount} project(s)`);
  console.log(`Ordered ${ordered.modifiedCount} project(s)`);
}

backfillProjectPublishing()
  .then(() => {
    console.log('Backfill finished');
  })
  .catch((error) => {
    console.error('Backfill failed', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
