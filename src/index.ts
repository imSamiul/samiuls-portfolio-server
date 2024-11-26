import express from 'express';
import dotenv from 'dotenv';
import resumeRoutes from './routes/resumeRoutes';
import authRoutes from './routes/authRoutes';
import connectDB from './db/mongoose';

// Load environment variables based on the current environment
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`Hello, World! Environment: ${process.env.NODE_ENV}`);
});
app.use(express.json());
connectDB();
app.use('/resume', resumeRoutes);
app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
