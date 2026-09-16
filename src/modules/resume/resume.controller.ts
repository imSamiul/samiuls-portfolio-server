import type { RequestHandler } from 'express';

import { getResumeDownloadUrl } from './resume.service.js';

/** Redirects to Cloudinary rather than streaming the bytes through the API. */
export const download: RequestHandler = (_req, res) => {
  res.redirect(302, getResumeDownloadUrl());
};
