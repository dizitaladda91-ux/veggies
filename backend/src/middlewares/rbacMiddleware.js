const ApiError = require('../utils/apiError');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role_name)) {
      return next(ApiError.forbidden(`Role '${req.user.role_name}' is not authorized to perform this action`));
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
