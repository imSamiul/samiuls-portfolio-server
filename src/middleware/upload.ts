import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import ApiError from '../utils/ApiError';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Kept in memory because the buffer goes straight to Cloudinary — nothing is
// written to the container's filesystem.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(
      new ApiError(
        400,
        'Invalid file type. Only JPEG, JPG, and PNG are allowed.',
      ),
    );
  },
}).single('image');

export function uploadProjectImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      next(
        new ApiError(
          400,
          error.code === 'LIMIT_FILE_SIZE'
            ? 'File size is too large. Max size is 2MB.'
            : `Upload error: ${error.message}`,
        ),
      );
      return;
    }
    next(error);
  });
}
