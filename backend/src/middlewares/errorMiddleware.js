const logger = require('../logs/logger');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const ApiError = require('../utils/apiError');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.errors || [], err.stack);
  }

  logger.error(`API Error Encountered: ${error.message} [${req.method} ${req.originalUrl}]`, {
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    errors: error.errors,
    stack: error.stack,
  });

  if (error.stack) {
    console.error(`[EXPLICIT ERROR TRACE] ${req.method} ${req.originalUrl}:`, error.stack);
  }

  const responseBody = {
    success: false,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(config.env === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  };

  res.status(error.statusCode).json(responseBody);
};

module.exports = errorHandler;
