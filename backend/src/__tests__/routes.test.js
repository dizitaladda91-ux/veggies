const request = require('supertest');

jest.mock('../middlewares/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role_name: req.headers['x-role'] || 'admin' };
    next();
  },
}));

jest.mock('../middlewares/rbacMiddleware', () => ({
  authorizeRoles: (...allowedRoles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'unauthorized' });
    if (!allowedRoles.includes(req.user.role_name)) return res.status(403).json({ message: 'forbidden' });
    next();
  },
}));

jest.mock('../controllers/adminController', () => ({
  getUsers: (req, res) => res.status(200).json({ success: true }),
  updateUserStatus: (req, res) => res.status(200).json({ success: true }),
  deleteUser: (req, res) => res.status(200).json({ success: true }),
  getAuditLogs: (req, res) => res.status(200).json({ success: true }),
}));

const app = require('../app');

describe('route authorization', () => {
  it('allows authorized admin routes', async () => {
    const response = await request(app).get('/admin/users');
    expect(response.status).toBe(200);
  });

  it('rejects unauthorized role access', async () => {
    const response = await request(app).get('/admin/users').set('x-role', 'affiliate');
    expect(response.status).toBe(403);
  });
});
