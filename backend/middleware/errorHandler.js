const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);
  
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred on the server';
  
  res.status(status).json({
    success: false,
    message,
    // Provide stack trace only in non-production environments
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};

module.exports = errorHandler;
