require('dotenv').config();

// Node's fetch (undici) sometimes tries a flaky IPv6 route first on Windows
// dual-stack networks and hangs until timeout before falling back — force
// IPv4 first so outbound calls (e.g. Telegram long-polling) resolve fast.
require('dns').setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const routes = require('./routes/index');
const errorMiddleware = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const ApiError = require('./utils/ApiError');
const logger = require('./utils/logger');
const prisma = require('./config/prisma');
const telegramService = require('./services/telegram.service');

// ── App Setup ──────────────────────────────────────────────────────────────

const app = express();

// Behind a single reverse proxy (Render/Vercel) — trust the first proxy hop so
// req.ip reflects the real client (X-Forwarded-For) for rate limiting and logging.
app.set('trust proxy', 1);

// ── Security Middlewares ───────────────────────────────────────────────────

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8081')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(apiLimiter);          // Global rate limiting

// ── Body Parsing ───────────────────────────────────────────────────────────

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// ── Logging ────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
}

// ── Health Check ───────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/v1', routes);

// ── 404 Handler ────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// ── Global Error Handler ───────────────────────────────────────────────────

app.use(errorMiddleware);

// ── Start Server ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Prisma connected to PostgreSQL');

    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`API base: http://localhost:${PORT}/api/v1`);
      logger.info(`Health:   http://localhost:${PORT}/health`);
    });

    // Local dev: pull Telegram updates via long-polling instead of a webhook,
    // since there's no stable public URL to register here. Production points
    // a webhook at the deployed Render URL instead (see render.yaml).
    if (process.env.NODE_ENV !== 'production') {
      telegramService.startPolling();
    }
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
