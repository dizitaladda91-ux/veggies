const HTTP_STATUS = require('../constants/httpStatusCodes');

class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(msg, errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, msg, true, errors);
  }

  static unauthorized(msg = 'Unauthorized access') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, msg);
  }

  static forbidden(msg = 'Forbidden: Insufficient permissions') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, msg);
  }

  static conflict(msg = 'Resource conflict') {
    return new ApiError(HTTP_STATUS.CONFLICT, msg);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, msg, false);
  }
}

module.exports = ApiError;
