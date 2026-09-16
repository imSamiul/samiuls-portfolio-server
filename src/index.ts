// Vercel's build entry points at dist/index.js and expects the express app to
// be the default export. Delete this file together with vercel.json once the
// API runs on Koyeb, where src/server.ts is the entry point.
import app from './app';
import connectDB from './config/db';

void connectDB();

export default app;
