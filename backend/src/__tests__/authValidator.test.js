const { validationResult } = require('express-validator');
const { refreshTokenValidator } = require('../validators/authValidator');

const validateRefreshBody = async (body) => {
  const req = { body };
  await Promise.all(refreshTokenValidator.map((validator) => validator.run(req)));
  return validationResult(req);
};

describe('refresh token validation', () => {
  it('allows a cookie-only request and a null legacy body token', async () => {
    expect((await validateRefreshBody({})).isEmpty()).toBe(true);
    expect((await validateRefreshBody({ refreshToken: null })).isEmpty()).toBe(true);
  });

  it('rejects a non-string body token', async () => {
    expect((await validateRefreshBody({ refreshToken: {} })).isEmpty()).toBe(false);
  });
});
