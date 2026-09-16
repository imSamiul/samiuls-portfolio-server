import type { RequestHandler } from 'express';

import { ApiError } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/response.js';
import { revalidateResume } from '../../utils/revalidateWeb.js';
import {
  getResumeDownloadUrl,
  getResumeMeta,
  replaceResume,
} from './resume.service.js';

export const meta: RequestHandler = async (_req, res) => {
  const asset = await getResumeMeta();

  sendSuccess(res, 'Resume available', { updatedAt: asset.updatedAt });
};

/** Redirects to Cloudinary rather than streaming the bytes through the API. */
export const download: RequestHandler = async (_req, res) => {
  res.redirect(302, await getResumeDownloadUrl());
};

export const replace: RequestHandler = async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('A PDF file is required', 'RESUME_REQUIRED');
  }

  const asset = await replaceResume(req.file.buffer);

  sendSuccess(res, 'Resume updated', { updatedAt: asset.updatedAt });
  revalidateResume();
};
