const userRepository = require('../repositories/userRepository');
const profileRepository = require('../repositories/profileRepository');
const affiliateRepository = require('../repositories/affiliateRepository');
const referralRepository = require('../repositories/referralRepository');
const logRepository = require('../repositories/logRepository');
const jwtUtils = require('../utils/jwtUtils');
const passwordUtils = require('../utils/passwordUtils');
const codeGenerator = require('../helpers/codeGenerator');
const ApiError = require('../utils/apiError');
const config = require('../config/env');
const emailService = require('./emailService');
const logger = require('../utils/logger');
const notificationRepository = require('../repositories/notification.repository');
const walletRepository = require('../repositories/walletrepository');
const { ROLES } = require('../constants/roles');
const crypto = require('crypto');
const mfaService = require('./mfaService');
const db = require('../database');

class AuthService {
  async sendRegistrationOtp(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      throw ApiError.badRequest('Please enter a valid official email address');
    }

    const existingUser = await userRepository.findByEmail(cleanEmail);
    const existingOfficial = await userRepository.findByOfficialEmail(cleanEmail);
    if (existingUser || existingOfficial) {
      throw ApiError.conflict('This email address is already registered.');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await passwordUtils.hashPassword(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(`DELETE FROM email_verification_otps WHERE LOWER(email) = $1`, [cleanEmail]);
    await db.query(
      `INSERT INTO email_verification_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)`,
      [cleanEmail, otpHash, expiresAt]
    );

    logger.info(`=======================================================`);
    logger.info(`[REGISTRATION OTP GENERATED] Target Email: ${cleanEmail}`);
    logger.info(`[REGISTRATION OTP CODE] ${otpCode}`);
    logger.info(`=======================================================`);

    const result = await emailService.sendRegistrationOtp(cleanEmail, otpCode);
    if (!result.success) {
      logger.error(`[EMAIL DELIVERY FAILURE] Failed to send OTP to ${cleanEmail}: ${result.error || result.reason}`);
      throw ApiError.badRequest(`Failed to send email to ${cleanEmail}. Error: ${result.error || result.reason || 'SMTP Connection Error'}`);
    }

    return {
      message: '6-digit verification code sent to your official email.'
    };
  }

  async verifyRegistrationOtp(email, otpCode) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(otpCode || '').trim();

    if (!cleanEmail || cleanCode.length !== 6) {
      throw ApiError.badRequest('Please provide email and 6-digit verification code.');
    }

    const res = await db.query(
      `SELECT * FROM email_verification_otps 
       WHERE LOWER(email) = $1 AND expires_at > CURRENT_TIMESTAMP AND is_verified = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );

    const record = res.rows[0];
    if (!record) {
      throw ApiError.badRequest('Invalid or expired 6-digit verification code. Please click Resend Code.');
    }

    const isMatch = await passwordUtils.comparePassword(cleanCode, record.otp_hash);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect 6-digit verification code. Please check your inbox or click Resend.');
    }

    const verifiedToken = crypto.randomBytes(24).toString('hex');
    await db.query(
      `UPDATE email_verification_otps SET is_verified = TRUE, verified_token = $1 WHERE id = $2`,
      [verifiedToken, record.id]
    );

    return { message: 'Official email verified successfully! ✅', verifiedToken };
  }

  async register({ email, password, firstName, lastName, company = null, role = 'affiliate', recruitmentCode = null, ipAddress = null, officialEmail = null }) {
    if (![ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE].includes(role)) {
      throw ApiError.forbidden('Administrative accounts cannot be created through public registration');
    }
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw ApiError.conflict('Email address is already registered');
    }

    const targetOfficialEmail = (officialEmail || email).trim().toLowerCase();

    const roleObj = await userRepository.getRoleByName(role);
    if (!roleObj) {
      throw ApiError.badRequest(`Role '${role}' does not exist`);
    }

    let parentAffiliateId = null;
    let recruitmentLink = null;
    if (recruitmentCode) {
      recruitmentLink = await affiliateRepository.findLinkByCode(recruitmentCode);
      if (!recruitmentLink || recruitmentLink.link_type !== 'RECRUITMENT' || recruitmentLink.affiliate_role !== ROLES.SUPER_AFFILIATE || recruitmentLink.user_status !== 'active' || !recruitmentLink.is_active) throw ApiError.badRequest('Recruitment referral code is invalid or inactive');
      parentAffiliateId = recruitmentLink.user_id;
    }
    const passwordHash = await passwordUtils.hashPassword(password);
    const initialStatus = role === 'affiliate' ? 'active' : 'active';

    const user = await userRepository.create({
      email,
      passwordHash,
      roleId: roleObj.id,
      status: initialStatus,
      parentAffiliateId,
    });

    const profile = await profileRepository.create({
      userId: user.id,
      firstName,
      lastName,
      company,
      officialEmail: targetOfficialEmail,
    });

    await walletRepository.findOrCreateByUserId(user.id);

    let primaryLink = null;
    if (role === 'affiliate' || role === 'super_affiliate') {
      const affiliateName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      const referralCode = codeGenerator.generateReferralCode(role === 'super_affiliate' ? 'SUP' : 'AFF', affiliateName);
      primaryLink = await affiliateRepository.createLink({
        userId: user.id,
        referralCode,
        targetUrl: config.storefrontUrl,
        title: 'Default Shopping Link', linkType: 'SHOPPING', isSystemLink: true,
      });
      if (role === ROLES.SUPER_AFFILIATE) {
        const recruitmentReferralCode = codeGenerator.generateReferralCode('SUPTEAM', affiliateName);
        await affiliateRepository.createLink({ userId: user.id, referralCode: recruitmentReferralCode, targetUrl: `${config.frontendUrl.replace(/\/$/, '')}/register?ref=${encodeURIComponent(recruitmentReferralCode)}`, title: 'Default Recruitment Link', linkType: 'RECRUITMENT', isSystemLink: true });
      }
    }

    if (recruitmentLink) await referralRepository.createReferral({ referrerId: recruitmentLink.user_id, referredUserId: user.id, referralCode: recruitmentLink.referral_code, status: 'converted' });

    // Log Activity
    await logRepository.createActivityLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      ipAddress,
    });

    const accessToken = jwtUtils.generateAccessToken({ id: user.id, email: user.email, role: roleObj.name });
    const refreshToken = jwtUtils.generateRefreshToken({ id: user.id });
    await userRepository.updateRefreshToken(user.id, refreshToken);

    // Non-blocking background side-effects (Emails, Notifications)
    setImmediate(async () => {
      try {
        emailService.sendWelcomeEmail({
          email: targetOfficialEmail || user.email,
          official_email: targetOfficialEmail,
          firstName: profile.first_name,
          lastName: profile.last_name,
        }).catch(() => {});

        this.sendEmailVerification(user.id).catch(() => {});

        notificationRepository.createForAdmins({
          title: 'New Affiliate Joined',
          message: `New ${role.replace('_', ' ')} ${profile.first_name} ${profile.last_name || ''} (${user.email} | Official: ${targetOfficialEmail}) registered on the platform.`,
          type: 'new_affiliate',
        }).catch(() => {});

        notificationRepository.create({
          userId: user.id,
          title: 'Welcome to VEGGIE Radiance!',
          message: 'Your affiliate account is active. Share your referral link to start earning commissions.',
          type: 'welcome',
        }).catch(() => {});
      } catch (err) {}
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        role_name: roleObj.name,
        profile,
        primaryLink,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login({ email, password, ipAddress = null }) {
    const cleanEmail = email.trim().toLowerCase();
    let user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      user = await userRepository.findByOfficialEmail(cleanEmail);
    }
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden('Your account is not active. Please contact support.');
    }

    const isMatch = await passwordUtils.comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (config.requireAdminMfa && [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role_name)) {
      const purpose = user.mfa_enabled ? 'mfa-login' : 'mfa-setup';
      return { mfaRequired: true, mfaSetupRequired: !user.mfa_enabled, mfaToken: jwtUtils.generateMfaToken({ id: user.id }, purpose) };
    }
    return this.issueLoginTokens(user, ipAddress);
  }

  async refreshTokens(refreshToken) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    let decoded;
    try {
      decoded = jwtUtils.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await userRepository.findSessionUserById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }
    const storedToken = user.refresh_token;
    const tokensMatch = storedToken
      && Buffer.byteLength(storedToken) === Buffer.byteLength(refreshToken)
      && crypto.timingSafeEqual(Buffer.from(storedToken), Buffer.from(refreshToken));
    if (!tokensMatch) {
      throw ApiError.unauthorized('Refresh token has been revoked or rotated');
    }
    if (user.status !== 'active') {
      throw ApiError.forbidden('This account is not active');
    }

    const newAccessToken = jwtUtils.generateAccessToken({ id: user.id, email: user.email, role: user.role_name });
    const newRefreshToken = jwtUtils.generateRefreshToken({ id: user.id });

    await userRepository.updateRefreshToken(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async issueLoginTokens(user, ipAddress = null) {
    const accessToken = jwtUtils.generateAccessToken({ id: user.id, email: user.email, role: user.role_name });
    const refreshToken = jwtUtils.generateRefreshToken({ id: user.id });

    const [_, fullUser] = await Promise.all([
      userRepository.updateRefreshToken(user.id, refreshToken),
      userRepository.findById(user.id),
    ]);

    setImmediate(() => {
      logRepository.createActivityLog({ userId: user.id, action: 'USER_LOGIN', entityType: 'USER', entityId: user.id, ipAddress }).catch(() => {});
    });

    return { user: fullUser, tokens: { accessToken, refreshToken } };
  }

  async beginMfaSetup(mfaToken) {
    const decoded = jwtUtils.verifyMfaToken(mfaToken, 'mfa-setup');
    const user = await userRepository.findById(decoded.id);
    if (!user || ![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role_name)) throw ApiError.unauthorized('Invalid MFA setup request');
    return { secret: mfaService.generateSecret(), accountName: user.email, issuer: 'Affiliate Management' };
  }

  async enableMfa(mfaToken, secret, code, ipAddress = null) {
    const decoded = jwtUtils.verifyMfaToken(mfaToken, 'mfa-setup');
    const sessionUser = await userRepository.findSessionUserById(decoded.id);
    if (!sessionUser || ![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(sessionUser.role_name) || !mfaService.verifyCode(secret, code)) throw ApiError.unauthorized('Invalid authenticator code');
    await userRepository.enableMfa(sessionUser.id, mfaService.encrypt(secret));
    return this.issueLoginTokens(sessionUser, ipAddress);
  }

  async verifyMfa(mfaToken, code, ipAddress = null) {
    const decoded = jwtUtils.verifyMfaToken(mfaToken, 'mfa-login');
    const sessionUser = await userRepository.findSessionUserById(decoded.id);
    if (!sessionUser || ![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(sessionUser.role_name) || !sessionUser.mfa_secret) throw ApiError.unauthorized('MFA is not configured for this account');
    const decryptedSecret = mfaService.decrypt(sessionUser.mfa_secret);
    if (!mfaService.verifyCode(decryptedSecret, code)) throw ApiError.unauthorized('Invalid authenticator code');
    return this.issueLoginTokens(sessionUser, ipAddress);
  }

  async sendEmailVerification(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (user.is_email_verified) return { message: 'Email address is already verified' };

    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await userRepository.saveEmailVerificationToken(userId, hashed, expiresAt);
    emailService.sendVerificationEmail(user, token).catch(err => logger.error('Failed to send verification email', { error: err.message }));
    return { message: 'Verification email sent successfully' };
  }

  async verifyEmailToken(token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const record = await userRepository.findEmailVerificationToken(hashed);
    if (!record || new Date(record.expires_at) < new Date()) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }
    await userRepository.markEmailVerified(record.user_id);
    await userRepository.deleteEmailVerificationToken(record.user_id);
    return { message: 'Email address verified successfully' };
  }

  async requestPasswordReset(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    let user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      user = await userRepository.findByOfficialEmail(cleanEmail);
    }
    if (!user) {
      throw ApiError.notFound('No registered account found with this email address.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await userRepository.savePasswordResetToken(user.id, hashed, expiresAt);
    
    const sendResult = await emailService.sendPasswordResetEmail(user, token);
    const resetUrl = `${config.frontendUrl}/reset-password/${token}`;
    
    logger.info(`=======================================================`);
    logger.info(`[PASSWORD RESET LINK GENERATED] Target Email: ${cleanEmail}`);
    logger.info(`[PASSWORD RESET URL] ${resetUrl}`);
    logger.info(`=======================================================`);

    if (!sendResult.success) {
      logger.error(`[PASSWORD RESET EMAIL FAILURE] Could not deliver reset email to ${cleanEmail}: ${sendResult.error || sendResult.reason}`);
      
      const isTimeout = (sendResult.error || '').includes('ETIMEDOUT') || (sendResult.error || '').includes('timeout');
      if (isTimeout) {
        throw ApiError.badRequest(`Render Cloud Host is blocking outbound SMTP port 587 (Connection timeout). Please add RESEND_API_KEY or BREVO_API_KEY in Render Environment Variables for HTTPS email delivery.`);
      }
      throw ApiError.badRequest(`Failed to deliver password reset email: ${sendResult.error || sendResult.reason || 'SMTP delivery error.'}`);
    }

    return { message: 'Password reset link sent successfully! Please check your email inbox or spam folder.' };
  }

  async resetPassword(token, newPassword) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const record = await userRepository.findPasswordResetToken(hashed);
    if (!record || new Date(record.expires_at) < new Date()) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }
    const passwordHash = await passwordUtils.hashPassword(newPassword);
    await userRepository.updatePassword(record.user_id, passwordHash);
    await userRepository.deletePasswordResetToken(record.user_id);
    return { message: 'Password has been reset successfully' };
  }

  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
    return { message: 'Logout successful' };
  }
}

module.exports = new AuthService();
