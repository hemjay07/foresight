import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { testConnection } from './utils/db';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeCronJobs } from './services/cronJobs';
import logger from './utils/logger';

// Import routes
import authRoutes from './api/auth';
import userRoutes from './api/users';
import adminRoutes from './api/admin';
import leagueRoutes from './api/league';
import privateLeaguesRoutes from './api/privateLeagues';
import achievementsRoutes from './api/achievements';
import errorsRoutes from './api/errors';
import referralsRoutes from './api/referrals';
import prizedContestsV2Routes from './api/prizedContestsV2';
import foresightScoreRoutes from './api/foresightScore';
import questsRoutes from './api/quests';
import activityRoutes from './api/activity';
import ctFeedRoutes from './api/ctFeed';
import watchlistRoutes from './api/watchlist';
import intelRoutes from './api/intel';
import twitterRoutes from './api/twitter';

// Create Express app and HTTP server
const app: Application = express();
const httpServer = createServer(app);

// Environment variables
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Allow configured frontend URL or localhost on any port in development
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean);

    // In development, also allow any localhost port
    if (NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow ngrok URLs for sharing
    if (origin.includes('.ngrok-free.app')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined')); // Logging

// Rate limiting (apply to all routes)
app.use(apiLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CT Fantasy League API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      league: '/api/league',
      privateLeagues: '/api/private-leagues',
      admin: '/api/admin',
      errors: '/api/errors',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/league', leagueRoutes);
app.use('/api/private-leagues', privateLeaguesRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/v2', prizedContestsV2Routes);
app.use('/api/v2/fs', foresightScoreRoutes);
app.use('/api/v2/quests', questsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/ct-feed', ctFeedRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/intel', intelRoutes);
app.use('/api/twitter', twitterRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

/**
 * Start server
 */
export async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize Cron Jobs for automated scoring
    initializeCronJobs();

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info('========================================');
      logger.info('CT league Backend');
      logger.info('========================================');
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info('========================================');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
