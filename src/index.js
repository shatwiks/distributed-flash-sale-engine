require('dotenv').config();
const express = require('express');
const eventsRouter = require('./routes/events');
const { healthHandler } = require('./routes/events');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
if (IS_PROD) {
  app.set('trust proxy', 1);
}

// Explicit CORS allowlist (never reflect arbitrary unknown origins with credentials)
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  const clean = origin.replace(/\/+$/, '');
  if (configuredOrigins.includes(clean)) return true;
  if (!IS_PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean)) {
    return true;
  }
  return false;
};

// Defense-in-depth HTTP Security Headers & Strict CORS
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, idempotency-key, Idempotency-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(origin && !isAllowedOrigin(origin) ? 403 : 204);
  }
  next();
});

// Sliding-window per-IP rate limiter for mutating routes in production
const rateLimitEnabled =
  process.env.NODE_ENV !== 'test' &&
  (process.env.RATE_LIMIT_ENABLED === 'true' || (IS_PROD && process.env.RATE_LIMIT_ENABLED !== 'false'));

if (rateLimitEnabled) {
  const buckets = new Map();
  const WINDOW_MS = 60 * 1000;
  const MAX_BUCKETS = 10000;

  app.use('/events', (req, res, next) => {
    if (req.method !== 'POST') return next();
    const isCheckout = req.path.endsWith('/checkout');
    const limit = isCheckout ? 60 : 15;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${ip}:${isCheckout ? 'checkout' : 'admin'}`;
    const now = Date.now();

    if (buckets.size > MAX_BUCKETS) {
      for (const [k, v] of buckets.entries()) {
        if (now - v.start >= WINDOW_MS) buckets.delete(k);
      }
    }

    const entry = buckets.get(key);
    if (!entry || now - entry.start >= WINDOW_MS) {
      buckets.set(key, { count: 1, start: now });
      return next();
    }
    entry.count += 1;
    if (entry.count > limit) {
      res.setHeader('Retry-After', String(Math.ceil((WINDOW_MS - (now - entry.start)) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please slow down and retry shortly.' });
    }
    return next();
  });
}

app.use(express.json({ limit: '64kb' }));

// Routes
// Health check route: tests DB connectivity via SELECT 1
app.get('/health', healthHandler);

// Mount events resource router
app.use('/events', eventsRouter);

// Centralized error handling middleware (must be wired last)
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Ticket Booking API] Server listening on port ${PORT}`);
    console.log(`[Ticket Booking API] Mode: Phase 3 In-Memory Atomic Concurrency (Redis + Redlock)`);
  });
}

module.exports = app;
