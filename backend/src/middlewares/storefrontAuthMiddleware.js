const crypto = require('crypto');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

// Only the trusted ecommerce backend may create payment orders and record
// conversions. This key must never be placed in browser/Vite environment vars.
const requireStorefrontApiKey = (req, res, next) => {
  const supplied = req.get('x-storefront-api-key') || '';
  const expected = config.storefrontApiKey;
  const suppliedBuffer = Buffer.from(supplied, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (!expected || suppliedBuffer.length !== expectedBuffer.length
    || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return next(ApiError.unauthorized('Invalid storefront credentials'));
  }
  return next();
};

module.exports = { requireStorefrontApiKey };
