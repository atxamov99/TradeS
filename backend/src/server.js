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

// Test User accounts are hard-deleted a grace period AFTER they expire (not
// immediately at expiry) so an expiring user isn't surprised by data loss the
// instant their trial ends. No queue/cron lib exists in this repo — a simple
// interval on the persistent process matches the existing telegram-polling
// pattern below, and is skipped entirely in the Vercel serverless path (since
// it's only scheduled inside startServer(), which itself is skipped there).
const TEST_USER_CLEANUP_GRACE_DAYS = 7;
const TEST_USER_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

const cleanupExpiredTestUsers = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TEST_USER_CLEANUP_GRACE_DAYS);
  try {
    const expired = await prisma.user.findMany({
      where: { isTestUser: true, testExpiresAt: { lt: cutoff } },
      select: { id: true },
    });
    if (expired.length === 0) return;
    const ids = expired.map((u) => u.id);

    // Sale.userId, SyncQueue.userId, Order.userId, and InventoryBatch.userId
    // are all required FKs with no onDelete: Cascade to User (same for
    // Product.ownerId/createdById, though those are optional), so these
    // throwaway rows must be deleted explicitly before the User row itself —
    // otherwise a required FK on any one of them would reject the whole
    // batched User delete. Order already cascades to OrderItem/
    // ShippingAddress via their own onDelete: Cascade, so deleting Order
    // rows alone covers those. All deletes run in one transaction so we
    // never end up with orphaned rows and a still-present User, or vice
    // versa.
    //
    // NOTE: if a test user's Product is ever referenced by another user's
    // OrderItem/CartItem (both required FKs, default Restrict), this whole
    // transaction will fail-and-retry every cycle for that batch until the
    // referencing row is gone — a known, non-destructive limitation.
    const results = await prisma.$transaction([
      prisma.sale.deleteMany({ where: { userId: { in: ids } } }),
      prisma.syncQueue.deleteMany({ where: { userId: { in: ids } } }),
      prisma.order.deleteMany({ where: { userId: { in: ids } } }),
      prisma.inventoryBatch.deleteMany({ where: { userId: { in: ids } } }),
      prisma.product.deleteMany({ where: { OR: [{ ownerId: { in: ids } }, { createdById: { in: ids } }] } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }), // last element — the actual count we report
    ]);
    const { count } = results[results.length - 1];
    if (count > 0) logger.info(`Test User cleanup: removed ${count} expired account(s)`);
  } catch (err) {
    logger.error(`Test User cleanup failed: ${err.message}`);
  }
};

const SUPPORT_MESSAGE_TTL_HOURS = 24;
const SUPPORT_MESSAGE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // hourly

const cleanupOldSupportMessages = async () => {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - SUPPORT_MESSAGE_TTL_HOURS);
  try {
    const { count } = await prisma.supportMessage.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) logger.info(`Support message cleanup: removed ${count} message(s) older than 24h`);
  } catch (err) {
    logger.error(`Support message cleanup failed: ${err.message}`);
  }
};

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

    setInterval(cleanupExpiredTestUsers, TEST_USER_CLEANUP_INTERVAL_MS);
    cleanupExpiredTestUsers(); // also run once at boot

    setInterval(cleanupOldSupportMessages, SUPPORT_MESSAGE_CLEANUP_INTERVAL_MS);
    cleanupOldSupportMessages(); // also run once at boot
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
