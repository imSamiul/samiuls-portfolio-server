import {
  assertCloudinaryConfigured,
  cloudinary,
  RESUME_FOLDER,
  uploadBuffer,
} from '../../config/cloudinary.js';
import type { SiteAssetRecord } from '../../models/index.js';
import { SiteAsset } from '../../models/index.js';
import { RESUME_DOWNLOAD_NAME, RESUME_PUBLIC_ID } from '../../shared/index.js';
import { ApiError } from '../../utils/ApiError.js';

const RESUME_KEY = 'resume';

/**
 * Replaces the stored PDF. The pointer lives in MongoDB rather than an env var
 * so the owner can swap the resume from the dashboard without a redeploy.
 */
export async function replaceResume(buffer: Buffer) {
  const result = await uploadBuffer(buffer, {
    folder: RESUME_FOLDER,
    public_id: RESUME_PUBLIC_ID,
    // PDFs are raw: Cloudinary blocks PDF delivery for `image` assets by
    // default, so this must not become 'image'.
    resource_type: 'raw',
    overwrite: true,
    // The public id is stable, so without this the CDN would keep handing out
    // the previous PDF from the same URL.
    invalidate: true,
  });

  const asset = await SiteAsset.findOneAndUpdate(
    { key: RESUME_KEY },
    { publicId: result.public_id, version: result.version },
    { returnDocument: 'after', upsert: true },
  ).lean<SiteAssetRecord>();

  return asset;
}

/**
 * Lets the website know whether a resume exists before it renders a download
 * link, so a visitor never lands on the 503 envelope in a new tab.
 */
export async function getResumeMeta() {
  const asset = await SiteAsset.findOne({ key: RESUME_KEY })
    .select('updatedAt')
    .lean<Pick<SiteAssetRecord, 'updatedAt'>>();

  if (!asset) {
    throw ApiError.notFound(
      'No resume has been uploaded yet',
      'RESUME_NOT_CONFIGURED',
    );
  }

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
