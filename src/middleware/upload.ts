import { MAX_PROJECT_IMAGE_BYTES, MAX_RESUME_BYTES } from '#shared';
import multer from 'multer';

import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

/**
 * Kept in memory because the buffer goes straight to Cloudinary — nothing is
 * written to the container's filesystem. MulterError is formatted centrally by
 * errorHandler.
 */
export const uploadProjectImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROJECT_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(
      ApiError.badRequest(
        'Only JPEG, JPG and PNG images are allowed',
        'UNSUPPORTED_IMAGE_TYPE',
      ),
    );
  },
}).single('image');

/** The resume is a PDF, so it needs its own filter and a larger budget. */
export const uploadResumePdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }

    cb(
      ApiError.badRequest(
        'The resume must be a PDF',
        'UNSUPPORTED_RESUME_TYPE',
      ),
    );
  },
}).single('resume');
