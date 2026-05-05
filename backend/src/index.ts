import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { seedCategories } from './utils/db.js';
import { errorHandler } from './middleware/error.js';
import { authenticateToken } from './middleware/auth.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import logRoutes from './routes/logRoutes.js';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
if (NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production. Set it in the environment.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production. Set it in the environment.');
  }
  if (!process.env.RECAPTCHA_SECRET) {
    throw new Error('RECAPTCHA_SECRET is required in production. Set it in the environment.');
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || [];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In production, we strictly check against allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('CORS origin denied'));
    }
  },
  credentials: true,
};

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Auth Routes (public)
app.use('/api/auth', authRoutes);

// Public Routes (before auth middleware)
app.get('/api/categories', async (req, res, next) => {
  try {
    const { getCategories } = await import('./controllers/fileController.js');
    await getCategories(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Protected Routes
app.use('/api/files', authenticateToken, fileRoutes);
app.use('/api/logs', authenticateToken, logRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'City Health API is running' });
});

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await seedCategories();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
