import { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError';

// The client reads `error.response.data.message`, so every failure has to keep
// that key regardless of where it came from.
const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }

  if (
    error instanceof mongoose.mongo.MongoServerError &&
    error.code === 11000
  ) {
    res.status(409).json({ message: 'This value already exists.' });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Something went wrong' });
};

export default errorHandler;
