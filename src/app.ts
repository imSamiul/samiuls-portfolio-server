import cors from 'cors';
import express from 'express';
import errorHandler from './middleware/errorHandler';
import routes from './routes';
import ApiError from './utils/ApiError';

const app = express();

app.use(
  cors({
    origin: [
      'http://192.168.0.174:3002',
      'https://samiul3041.vercel.app', // Production frontend
      'http://localhost:3002',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);
app.use(express.json());

// Kept outside the API prefix so the host's health check does not depend on it.
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', routes);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'Route not found'));
});
app.use(errorHandler);

export default app;
