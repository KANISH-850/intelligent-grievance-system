/**
 * Centralized Error Handling Middleware
 */

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  if (err.name === "MulterError") {
    statusCode = 400;
  }
  const safeMessage = statusCode >= 500
    ? "The request could not be completed right now. Please try again."
    : (err.message || "Request failed.");
  if (statusCode >= 500) {
    console.error("[ServerError]", err);
  }
  res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
