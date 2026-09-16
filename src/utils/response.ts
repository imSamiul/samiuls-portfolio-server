import type { Response } from 'express';

/**
 * Every successful response goes through here, so the client can read one shape
 * and surface `message` without the endpoint inventing its own envelope.
 */
export function sendSuccess<TData>(
  res: Response,
  message: string,
  data: TData,
  statusCode = 200,
) {
  return res.status(statusCode).json({ success: true, message, data });
}
