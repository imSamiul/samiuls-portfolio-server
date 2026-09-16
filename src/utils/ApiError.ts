/**
 * Application-level error carrying an HTTP status and a stable machine code the
 * frontend can branch on.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code = 'ERROR',
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, ApiError);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(
    message = 'Authentication required',
    code = 'UNAUTHORIZED',
  ) {
    return new ApiError(401, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static tooManyRequests(message: string, code = 'TOO_MANY_REQUESTS') {
    return new ApiError(429, message, code);
  }
}
