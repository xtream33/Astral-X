/**
 * ASTRA-X CSRF Protection
 * Simple double-submit cookie pattern — no extra dependencies needed.
 *
 * On GET requests: generates a token, stores it in the session.
 * On POST requests: compares the form token against the session token.
 *
 * Usage in routes:
 *   GET:  const token = csrf.generate(req);  // pass to template
 *   POST: csrf.verify(req, res, next);        // use as middleware
 */

const crypto = require('crypto');

function generate(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  return req.session.csrfToken;
}

function verify(req, res, next) {
  // Skip for GET / HEAD / OPTIONS
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();

  const sessionToken = req.session?.csrfToken;
  const bodyToken    = req.body?._csrf || req.headers?.['x-csrf-token'];

  if (!sessionToken || !bodyToken || sessionToken !== bodyToken) {
    return res.status(403).json({ success: false, message: '403 Forbidden — CSRF token mismatch. Please reload the page and try again.' });
  }
  next();
}

/** Hidden input field HTML to embed in every form. */
function field(token) {
  return `<input type="hidden" name="_csrf" value="${token}">`;
}

module.exports = { generate, verify, field };
