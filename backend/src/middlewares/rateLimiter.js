const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const HTTP_STATUS = require('../constants/httpStatusCodes');

const globalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString(),
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
    timestamp: new Date().toISOString(),
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many payment requests. Please try again later.' },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

const storefrontRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many storefront requests. Please try again later.' },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
  storefrontRateLimiter,
};
