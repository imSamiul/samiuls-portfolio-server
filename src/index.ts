import express from 'express';
import dotenv from 'dotenv';
import resumeRoutes from './routes/resumeRoutes';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import connectDB from './db/mongoose';
import cors from 'cors';

// Load environment variables based on the current environment

const env = process.env.NODE_ENV?.trim() || 'development';
console.log(`Environment: ${env}`);

const envFile = env === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS
app.use(
  cors({
    origin: [
      'http://192.168.0.174:3002',
      'https://samiul3041.vercel.app', // Production frontend
      'http://localhost:3002',
    ], // Specify the allowed origin (React app)
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies, authorization headers, etc.
  }),
);
app.options('*', cors());

app.get('/', (req, res) => {
  res.send(`Hello, World! Environment: ${process.env.NODE_ENV}`);
});
app.use(express.json());
connectDB();
app.use('/api/resume', resumeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/project', projectRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
