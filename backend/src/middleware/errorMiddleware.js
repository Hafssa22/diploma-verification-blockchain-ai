/**
 * Global error handling middleware.
 * Catches all errors thrown in controllers and returns structured JSON.
 */
function errorMiddleware(err, req, res, next) {
  console.error(`[Error] ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Ethers.js / blockchain errors
  if (err.message && err.message.includes('Blockchain error')) {
    return res.status(503).json({
      success: false,
      message: 'Blockchain service unavailable',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Blockchain error',
    });
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorMiddleware;
