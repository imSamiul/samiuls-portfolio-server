/** Every upload is normalised to these dimensions, and the web app relies on it. */
export const PROJECT_IMAGE_WIDTH = 1920;
export const PROJECT_IMAGE_HEIGHT = 1080;

export const MAX_PROJECT_IMAGE_BYTES = 2 * 1024 * 1024;

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

/**
 * Stable Cloudinary public id, so replacing the resume overwrites one asset
 * instead of accumulating them. Cache busting comes from the stored version.
 */
export const RESUME_PUBLIC_ID = 'resume.pdf';

/** What the browser saves the download as, via `fl_attachment`. */
export const RESUME_DOWNLOAD_NAME = 'Samiul_Karim_Prodhan_Resume';
