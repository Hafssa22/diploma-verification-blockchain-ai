/**
 * Optional API key middleware.
 * Protects the POST /add endpoint so only universities can add diplomas.
 *
 * To enable: set UNIVERSITY_API_KEY in .env
 * To use: send header "x-api-key: YOUR_KEY"
 */
function requireApiKey(req, res, next) {
  const requiredKey = process.env.UNIVERSITY_API_KEY;

  // If no key is configured, skip (development mode)
  if (!requiredKey) {
    console.warn('[Auth] UNIVERSITY_API_KEY not set — endpoint unprotected');
    return next();
  }

  const providedKey = req.headers['x-api-key'];

  if (!providedKey || providedKey !== requiredKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: valid API key required',
    });
  }

  next();
}

module.exports = requireApiKey;
