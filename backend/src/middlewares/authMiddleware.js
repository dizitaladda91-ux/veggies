const jwtUtils = require('../utils/jwtUtils');
const ApiError = require('../utils/apiError');
const userRepository = require('../repositories/userRepository');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required: Missing token');
  }

  try {
    const decoded = jwtUtils.verifyAccessToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('User associated with token no longer exists');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden('Your account is not active. Please contact administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    // Preserve deliberate authorization failures (for example, a suspended
    // account) rather than incorrectly reporting them as malformed tokens.
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired');
    }
    throw ApiError.unauthorized('Invalid or corrupted token');
  }
});

module.exports = {
  authenticate,
};
