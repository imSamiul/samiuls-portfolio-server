import { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 does not forward a rejected promise to the error handler, so every
// async route has to be wrapped for `errorHandler` to see the failure.
const asyncHandler =
  (
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch(next);
  };

export default asyncHandler;
