const authService = require('../services/authService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class AuthController {
  setRefreshCookie(res, token) {
    res.cookie('refreshToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/auth', maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
  sanitizeTokens(result, res) {
    this.setRefreshCookie(res, result.tokens.refreshToken);
    return { ...result, tokens: { accessToken: result.tokens.accessToken } };
  }
  register = asyncHandler(async (req, res) => {
    const result = await authService.register({
      ...req.body,
      ipAddress: req.ip,
    });
    return sendSuccess(res, 'User registration successful', this.sanitizeTokens(result, res), HTTP_STATUS.CREATED);
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      ipAddress: req.ip,
    });
    if (result.mfaRequired) return sendSuccess(res, 'Authenticator verification required', result);
    return sendSuccess(res, 'Login successful', this.sanitizeTokens(result, res));
  });
  beginMfaSetup = asyncHandler(async (req, res) => sendSuccess(res, 'Authenticator setup ready', await authService.beginMfaSetup(req.body.mfaToken)));
  enableMfa = asyncHandler(async (req, res) => sendSuccess(res, 'Authenticator enabled', this.sanitizeTokens(await authService.enableMfa(req.body.mfaToken, req.body.secret, req.body.code, req.ip), res)));
  verifyMfaLogin = asyncHandler(async (req, res) => sendSuccess(res, 'Login successful', this.sanitizeTokens(await authService.verifyMfaLogin(req.body.mfaToken, req.body.code, req.ip), res)));

  refreshToken = asyncHandler(async (req, res) => {
    const result = await authService.refreshTokens(req.cookies.refreshToken || req.body?.refreshToken);
    return sendSuccess(res, 'Token refreshed successfully', this.sanitizeTokens({ tokens: result }, res));
  });
  forgotPassword = asyncHandler(async (req, res) => { await authService.requestPasswordReset(req.body.email); return sendSuccess(res, 'If that email exists, reset instructions have been sent'); });
  resetPassword = asyncHandler(async (req, res) => { await authService.resetPassword(req.body.token, req.body.password); return sendSuccess(res, 'Password reset successful'); });
  sendEmailVerification = asyncHandler(async (req, res) => { await authService.sendEmailVerification(req.user.id); return sendSuccess(res, 'Verification instructions have been sent'); });
  verifyEmail = asyncHandler(async (req, res) => { await authService.verifyEmailToken(req.body.token); return sendSuccess(res, 'Email verified successfully'); });

  logout = asyncHandler(async (req, res) => {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/auth' });
    return sendSuccess(res, 'Logout successful');
  });

  getCurrentUser = asyncHandler(async (req, res) => {
    return sendSuccess(res, 'Current user profile', { user: req.user });
  });
}

module.exports = new AuthController();
