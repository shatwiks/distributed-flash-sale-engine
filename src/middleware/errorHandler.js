/**
 * Centralized error handling middleware.
 * Catches all thrown/forwarded errors, maps to standard HTTP status codes,
 * and returns { error: message } to prevent process crashes.
 *
 * @param {Error} err - Caught error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Handle JSON parse syntax errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }

  // Handle PostgreSQL CHECK constraint violation (e.g., available_tickets >= 0)
  if (err.code === '23514') {
    return res.status(409).json({ error: 'Inventory constraint violation: tickets cannot be negative.' });
  }

  // Handle PostgreSQL Foreign Key violation
  if (err.code === '23503') {
    return res.status(404).json({ error: 'Referenced entity not found.' });
  }

  // Handle PostgreSQL Unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry detected (idempotency key or unique constraint).' });
  }

  // Handle PostgreSQL invalid text representation / malformed UUID
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid input syntax (e.g. malformed UUID or string representation).' });
  }

  // Handle PostgreSQL numeric value out of range
  if (err.code === '22003') {
    return res.status(400).json({ error: 'Numeric value out of allowable range.' });
  }

  // Handle PostgreSQL statement / query timeout
  if (err.code === '57014') {
    return res.status(504).json({ error: 'Database query execution timeout.' });
  }

  // Handle PostgreSQL too many connections
  if (err.code === '53300') {
    return res.status(503).json({ error: 'Database connection pool exhausted. Please retry shortly.' });
  }

  // Handle Redlock resource contention
  if (err.name === 'ResourceLockedError') {
    return res.status(409).json({ error: 'Resource is currently locked by another concurrent process. Please retry.' });
  }

  // Handle Redis connection / max retries errors
  if (err.name === 'MaxRetriesPerRequestError' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Cache service temporarily unavailable.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
