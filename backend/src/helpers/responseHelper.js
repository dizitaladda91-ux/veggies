const HTTP_STATUS = require('../constants/httpStatusCodes');

const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
  const responseBody = {
    success,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(responseBody);
};

const sendSuccess = (res, message = 'Success', data = null, statusCode = HTTP_STATUS.OK, meta = null) => {
  return sendResponse(res, statusCode, true, message, data, meta);
};

const sendError = (res, message = 'Error', statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) => {
  const responseBody = {
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(responseBody);
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendError,
};
