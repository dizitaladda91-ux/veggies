const { authorizeRoles } = require('../rbacMiddleware');

describe('authorizeRoles', () => {
  it('allows a user with an allowed role', () => {
    const next = jest.fn();
    authorizeRoles('admin')({ user: { role_name: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an unauthenticated request', () => {
    const next = jest.fn();
    authorizeRoles('admin')({}, {}, next);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('rejects a role outside the allowlist', () => {
    const next = jest.fn();
    authorizeRoles('admin')({ user: { role_name: 'affiliate' } }, {}, next);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });
});
