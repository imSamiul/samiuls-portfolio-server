/* eslint-disable no-console */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { RESUME_FILE_NAME } from '#shared';

import {
  assertCloudinaryConfigured,
  cloudinary,
  RESUME_FOLDER,
} from '../config/cloudinary.js';

/**
 * One-off (re-run whenever the PDF changes): pushes the committed resume to
 * Cloudinary so the API never serves it off the filesystem.
 */
async function uploadResume() {
  assertCloudinaryConfigured();

  const source = path.join(process.cwd(), 'public', 'assets', RESUME_FILE_NAME);
  const pdf = await readFile(source);

  const result = await cloudinary.uploader.upload(
    `data:application/pdf;base64,${pdf.toString('base64')}`,
    {
      folder: RESUME_FOLDER,
      resource_type: 'raw',
      public_id: RESUME_FILE_NAME,
      overwrite: true,
    },
  );

  console.log('Uploaded. Set this in .env.development and on Koyeb:');
  console.log(`RESUME_PUBLIC_ID=${result.public_id}`);
}

uploadResume().catch((error) => {
  console.error('Resume upload failed', error);
  process.exitCode = 1;
});
