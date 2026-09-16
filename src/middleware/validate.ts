import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import ApiError from '../utils/ApiError';

type RequestSchemas = {
  body?: ZodType;
  params?: ZodType;
};

function formatIssues(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues
    .map((issue) =>
      issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
    )
    .join('; ');
}

// Validating here keeps controllers free of ad-hoc checks. Unknown body keys
// are stripped by zod, which doubles as the mass-assignment whitelist.
const validate =
  (schemas: RequestSchemas) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        next(new ApiError(400, formatIssues(result.error)));
        return;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        next(new ApiError(400, formatIssues(result.error)));
        return;
      }
      req.body = result.data;
    }

    next();
  };

export default validate;
