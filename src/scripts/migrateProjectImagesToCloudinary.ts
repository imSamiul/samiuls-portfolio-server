/* eslint-disable no-console */
import mongoose from 'mongoose';

import { disconnectDatabase, ensureDatabase } from '../config/db.js';
import { uploadImage } from '../modules/projects/project.service.js';

interface LegacyImage {
  data: mongoose.mongo.Binary | Buffer;
  contentType?: string;
}

/**
 * One-off: project images used to live on the document as a Buffer. This moves
 * them to Cloudinary and rewrites the field. Re-running is safe — migrated
 * documents no longer have `image.data`.
 */
async function migrateProjectImages() {
  await ensureDatabase();

  const projects = mongoose.connection.collection('projects');
  const legacyProjects = await projects
    .find({ 'image.data': { $exists: true } })
    .toArray();

  console.log(`Found ${legacyProjects.length} project(s) to migrate`);

  for (const project of legacyProjects) {
    const image = project.image as LegacyImage;
    const buffer = Buffer.isBuffer(image.data)
      ? image.data
      : Buffer.from(image.data.buffer);

    const uploaded = await uploadImage(buffer);

    await projects.updateOne(
      { _id: project._id },
      { $set: { image: uploaded } },
    );

    console.log(`Migrated ${String(project._id)} -> ${uploaded.url}`);
  }
}

migrateProjectImages()
  .then(() => {
    console.log('Migration finished');
  })
  .catch((error) => {
    console.error('Migration failed', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
