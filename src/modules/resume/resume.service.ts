import { RESUME_DOWNLOAD_NAME, RESUME_PUBLIC_ID } from '#shared';
import type { UploadApiResponse } from 'cloudinary';

import {
  assertCloudinaryConfigured,
  cloudinary,
  RESUME_FOLDER,
} from '../../config/cloudinary.js';
import type { SiteAssetRecord } from '../../models/index.js';
import { SiteAsset } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';

const RESUME_KEY = 'resume';

/**
 * Replaces the stored PDF. The pointer lives in MongoDB rather than an env var
 * so the owner can swap the resume from the dashboard without a redeploy.
 */
export async function replaceResume(buffer: Buffer) {
  assertCloudinaryConfigured();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: RESUME_FOLDER,
        public_id: RESUME_PUBLIC_ID,
        // PDFs are raw: Cloudinary blocks PDF delivery for `image` assets by
        // default, so this must not become 'image'.
        resource_type: 'raw',
        overwrite: true,
        // The public id is stable, so without this the CDN would keep handing
        // out the previous PDF from the same URL.
        invalidate: true,
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error('Cloudinary returned no upload result'));
          return;
        }

        resolve(uploaded);
      },
    );

    upload.end(buffer);
  });

  const asset = await SiteAsset.findOneAndUpdate(
    { key: RESUME_KEY },
    { publicId: result.public_id, version: result.version },
    { returnDocument: 'after', upsert: true },
  ).lean<SiteAssetRecord>();

  return asset;
}

export async function getResumeDownloadUrl() {
  const asset = await SiteAsset.findOne({
    key: RESUME_KEY,
  }).lean<SiteAssetRecord>();

  if (!asset) {
    throw new ApiError(
      503,
      'The resume is not available right now',
      'RESUME_NOT_CONFIGURED',
    );
  }

  assertCloudinaryConfigured();

  return cloudinary.url(asset.publicId, {
    resource_type: 'raw',
    secure: true,
    version: asset.version,
    flags: `attachment:${RESUME_DOWNLOAD_NAME}`,
  });
}
