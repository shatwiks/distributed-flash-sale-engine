require('dotenv').config();
const express = require('express');
const eventsRouter = require('./routes/events');
const { healthHandler } = require('./routes/events');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: CORS & JSON body parsing
const ALLOWED_ORIGINS = ['http://localhost:3001', 'http://localhost:3000'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, idempotency-key, Idempotency-Key'
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

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
