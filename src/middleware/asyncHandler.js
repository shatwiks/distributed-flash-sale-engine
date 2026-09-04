/**
 * Wraps an async route handler or middleware to ensure rejected promises
 * and thrown errors are caught and forwarded to Express's next() error handler.
 *
 * @param {Function} fn - Async express route handler (req, res, next)
 * @returns {Function} Express route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
