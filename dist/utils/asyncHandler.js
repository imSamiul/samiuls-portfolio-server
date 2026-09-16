"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Express 4 does not forward a rejected promise to the error handler, so every
// async route has to be wrapped for `errorHandler` to see the failure.
const asyncHandler = (handler) => (req, res, next) => {
    handler(req, res, next).catch(next);
};
exports.default = asyncHandler;
