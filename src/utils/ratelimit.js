/**
 * ASTRA-X Rate Limiter
 * Lightweight in-memory rate limiter — no extra npm packages needed.
 *
 * Usage:
 *   const limiter = require('./ratelimit');
 *   app.post('/api/pair', limiter({ max: 5, window: 60 }), handler);
 */

// Map: IP → { count, resetAt }
const buckets = new Map();

/**
 * Returns Express middleware that rate-limits by IP.
 * @param {object} opts
 * @param {number} opts.max    — max requests in the window
 * @param {number} opts.window — window in seconds
 * @param {string} [opts.message] — custom error message
 */
function rateLimiter({ max = 10, window = 60, message } = {}) {
  return (req, res, next) => {
    const ip  = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    let   b   = buckets.get(ip);

    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + window * 1000 };
    }

    b.count++;
    buckets.set(ip, b);

    // Clean old entries periodically (every 500 requests)
    if (buckets.size > 500) {
      for (const [k, v] of buckets) {
        if (now > v.resetAt) buckets.delete(k);
      }
    }

    if (b.count > max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        message: message || `⏳ Too many requests. Please wait ${retryAfter} seconds and try again.`,
      });
    }

    next();
  };
}

module.exports = rateLimiter;
