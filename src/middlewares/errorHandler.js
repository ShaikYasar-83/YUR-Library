// errorHandler.js - Global error handling middleware

const errorHandler = (err, req, res, next) => {
  // Log the error for internal debugging
  console.error(`[ERROR] ${err.message}`);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only show stack trace in development mode
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
