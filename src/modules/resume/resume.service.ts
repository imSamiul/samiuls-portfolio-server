import {
  assertCloudinaryConfigured,
  cloudinary,
} from '../../config/cloudinary.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * The PDF is a raw Cloudinary asset, so nothing is read from the container's
 * filesystem. `pnpm upload:resume` prints the public id to configure.
 */
export function getResumeDownloadUrl() {
  if (!env.RESUME_PUBLIC_ID) {
    throw new ApiError(
      503,
      'The resume is not available right now',
      'RESUME_NOT_CONFIGURED',
    );
  }

  assertCloudinaryConfigured();

  return cloudinary.url(env.RESUME_PUBLIC_ID, {
    resource_type: 'raw',
    secure: true,
    flags: 'attachment',
  });
}
