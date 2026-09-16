import { v2 as cloudinary } from 'cloudinary';

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

export { cloudinary };
