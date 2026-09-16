/* eslint-disable no-console */
import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../config/db.js';

/**
 * One-off: projects predate `slug`, and the field is required and unique. Run
 * this **before** the unique index exists — in production that means running it
 * against the new code once, ahead of the first boot that calls `syncIndexes()`.
 *
 * Re-running is safe: documents that already have a slug are skipped.
 *
 * The driver collection is used rather than the model, because the model would
 * reject these documents for missing the very field being added.
 */
async function backfillProjectSlugs() {
  await connectDatabase();

  const projects = mongoose.connection.collection('projects');
  const pending = await projects
    .find({ slug: { $exists: false } })
    .project<{ _id: mongoose.Types.ObjectId; title: string }>({ title: 1 })
    .toArray();

  console.log(`Found ${pending.length} project(s) without a slug`);

  const taken = new Set(
    (await projects.distinct('slug')).filter(
      (slug): slug is string => typeof slug === 'string',
    ),
  );

  for (const project of pending) {
    const base =
      project.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'project';

    let slug = base;
    let suffix = 2;
    while (taken.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    taken.add(slug);

    await projects.updateOne({ _id: project._id }, { $set: { slug } });

    console.log(`${String(project._id)} -> ${slug}`);
  }
}

backfillProjectSlugs()
  .then(() => {
    console.log('Backfill finished');
  })
  .catch((error) => {
    console.error('Backfill failed', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
