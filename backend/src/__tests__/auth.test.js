jest.mock('../repositories/userRepository', () => ({
  findByEmail: jest.fn(),
  getRoleByName: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
  findById: jest.fn(),
  findSessionUserById: jest.fn(),
  savePasswordReset: jest.fn(),
  findByPasswordResetToken: jest.fn(),
  updatePassword: jest.fn(),
  clearPasswordReset: jest.fn(),
}));

jest.mock('../repositories/profileRepository', () => ({
  create: jest.fn(),
}));

jest.mock('../repositories/affiliateRepository', () => ({
  createLink: jest.fn(),
}));

jest.mock('../repositories/walletrepository', () => ({
  findOrCreateByUserId: jest.fn(),
}));

jest.mock('../repositories/logRepository', () => ({
  createActivityLog: jest.fn(),
}));

jest.mock('../utils/jwtUtils', () => ({
  generateAccessToken: jest.fn(() => 'access-token'),
  generateRefreshToken: jest.fn(() => 'refresh-token'),
  verifyRefreshToken: jest.fn(() => ({ id: 1 })),
}));

jest.mock('../utils/passwordUtils', () => ({
  hashPassword: jest.fn(async () => 'hashed-password'),
  comparePassword: jest.fn(async () => true),
}));

jest.mock('../helpers/codeGenerator', () => ({
  generateReferralCode: jest.fn(() => 'AFF123'),
}));

jest.mock('../services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../logs/logger', () => ({
  error: jest.fn(),
}));

const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const profileRepository = require('../repositories/profileRepository');
const affiliateRepository = require('../repositories/affiliateRepository');
const walletRepository = require('../repositories/walletrepository');
const logRepository = require('../repositories/logRepository');
const passwordUtils = require('../utils/passwordUtils');

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers an affiliate and returns a token bundle', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(null);
    userRepository.getRoleByName.mockResolvedValueOnce({ id: 2, name: 'affiliate' });
    userRepository.create.mockResolvedValueOnce({ id: 7, email: 'new@example.com', status: 'active' });
    profileRepository.create.mockResolvedValueOnce({ first_name: 'Ada', last_name: 'Lovelace' });
    affiliateRepository.createLink.mockResolvedValueOnce({ id: 11, referral_code: 'AFF123' });
    walletRepository.findOrCreateByUserId.mockResolvedValueOnce({ id: 17, user_id: 7 });

    const result = await authService.register({
      email: 'new@example.com',
      password: 's3curePass1',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.user.email).toBe('new@example.com');
    expect(passwordUtils.hashPassword).toHaveBeenCalled();
    expect(walletRepository.findOrCreateByUserId).toHaveBeenCalledWith(7);
    expect(logRepository.createActivityLog).toHaveBeenCalled();
  });

  it('rejects invalid login credentials', async () => {
    userRepository.findByEmail.mockResolvedValueOnce({ id: 9, email: 'old@example.com', password_hash: 'hash', role_name: 'affiliate', status: 'active' });
    passwordUtils.comparePassword.mockResolvedValueOnce(false);

    await expect(authService.login({ email: 'old@example.com', password: 'wrong' })).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects a refresh token that was revoked or rotated', async () => {
    userRepository.findSessionUserById.mockResolvedValueOnce({ id: 1, email: 'member@example.com', role_name: 'affiliate', status: 'active', refresh_token: 'other-token' });

    await expect(authService.refreshTokens('refresh-token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('revokes the refresh token on logout', async () => {
    await authService.logout(7);

    expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(7, null);
  });
});
