import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiOptions, UploadApiResponse } from 'cloudinary';

import { ApiError } from '../utils/ApiError.js';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const PROJECT_IMAGE_FOLDER = 'portfolio/projects';
export const RESUME_FOLDER = 'portfolio/resume';

/**
 * The keys are optional outside production, so anything that actually talks to
 * Cloudinary says so with a 503 instead of failing deep inside the SDK.
 */
export function assertCloudinaryConfigured() {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new ApiError(
      503,
      'Image storage is not configured',
      'CLOUDINARY_NOT_CONFIGURED',
    );
  }
}

/**
 * Every upload goes through here, because the SDK reports failures as a plain
 * object rather than an `Error` — so rejecting with it as-is left the client
 * and the log with "Something went wrong" and no stack, while Cloudinary's
 * actual reason ("Invalid cloud_name", "Invalid Signature") was dropped.
 *
 * 502: the request was fine, the service behind it refused.
 */
export function uploadBuffer(
  buffer: Buffer,
  options: UploadApiOptions,
): Promise<UploadApiResponse> {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      options,
      (error, uploaded) => {
        if (uploaded) {
          resolve(uploaded);
          return;
        }

        reject(
          new ApiError(
            502,
            error?.message ?? 'Cloudinary returned no upload result',
            'CLOUDINARY_UPLOAD_FAILED',
          ),
        );
      },
    );

    upload.end(buffer);
  });
}

export { cloudinary };
