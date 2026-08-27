const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const env = process.env.NODE_ENV || 'development';
const requireProductionSecret = (name, minimumLength = 1) => {
  const value = process.env[name];
  if (env === 'production' && (!value || value.length < minimumLength)) {
    throw new Error(`${name} must be configured securely when NODE_ENV=production`);
  }
  return value;
};

const accessSecret = requireProductionSecret('JWT_ACCESS_SECRET', 32) || 'default_access_secret_for_dev_only';
const refreshSecret = requireProductionSecret('JWT_REFRESH_SECRET', 32) || 'default_refresh_secret_for_dev_only';
const mfaEncryptionKey = requireProductionSecret('MFA_ENCRYPTION_KEY', 32) || 'development-only-mfa-encryption-key-change-me';
const storefrontApiKey = requireProductionSecret('STOREFRONT_API_KEY', 32) || '';
const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';
const payoutMakerCheckerMinimum = Number(process.env.PAYOUT_MAKER_CHECKER_MIN_AMOUNT || '0');
const sanitizeKey = (key) => (key || '').replace(/^['"]|['"]$/g, '').trim();
const razorpayKeyId = sanitizeKey(process.env.RAZORPAY_KEY_ID);
const razorpayKeySecret = sanitizeKey(process.env.RAZORPAY_KEY_SECRET);
const razorpayWebhookSecret = sanitizeKey(process.env.RAZORPAY_WEBHOOK_SECRET);
if (env === 'production' && paymentsEnabled) {
  if (!razorpayKeyId || !razorpayKeySecret || !razorpayWebhookSecret) {
    throw new Error('Razorpay credentials must be configured when PAYMENTS_ENABLED=true');
  }
}
const emailEnabled = process.env.EMAIL_ENABLED === 'true';
const emailProvider = process.env.EMAIL_PROVIDER || 'test';
if (env === 'production' && emailEnabled) {
  if (!['smtp', 'sendgrid', 'gmail'].includes(emailProvider)) {
    throw new Error('EMAIL_PROVIDER must be smtp, sendgrid, or gmail when EMAIL_ENABLED=true');
  }
  const providerCredentials = {
    smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    sendgrid: Boolean(process.env.SENDGRID_API_KEY),
    gmail: Boolean(process.env.GMAIL_USER && process.env.GMAIL_PASSWORD),
  };
  if (!providerCredentials[emailProvider]) {
    throw new Error(`Email credentials for provider '${emailProvider}' must be configured when EMAIL_ENABLED=true`);
  }
}

module.exports = {
  env,
  port: process.env.PORT || 5000,
  requireAdminMfa: process.env.REQUIRE_ADMIN_MFA === 'true',
  apiPrefix: process.env.API_PREFIX || '',
  frontendUrl: process.env.FRONTEND_URL || 'https://affiliation.veggieradiance.com',
  storefrontUrl: process.env.STOREFRONT_URL || 'https://veggieradiance.com/',
  affiliateDiscountPercent: parseFloat(process.env.AFFILIATE_DISCOUNT_PERCENT || '10'),
  razorpay: {
    keyId: razorpayKeyId,
    keySecret: razorpayKeySecret,
    webhookSecret: razorpayWebhookSecret,
  },
  paymentsEnabled,
  payoutMakerCheckerMinimum: Number.isFinite(payoutMakerCheckerMinimum) ? payoutMakerCheckerMinimum : 0,
  dbUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/affiliate_db',
  dbMax: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  dbIdleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  dbSslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED
    ? process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    : env === 'production',
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  mfaEncryptionKey,
  storefrontApiKey,
  corsOrigins: [
    ...(process.env.CORS_ORIGIN
      || process.env.FRONTEND_URL
      || (process.env.NODE_ENV === 'production'
        ? 'https://affiliation.veggieradiance.com'
        : 'http://localhost:3000'))
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    ...(process.env.NODE_ENV === 'production'
      ? ['https://affiliation.veggieradiance.com']
      : []),
  ],
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  trustProxy: process.env.TRUST_PROXY
    ? parseInt(process.env.TRUST_PROXY, 10)
    : (process.env.NODE_ENV === 'production' ? 1 : false),
  email: {
    enabled: process.env.EMAIL_ENABLED
      ? emailEnabled
      : env !== 'production',
    provider: emailProvider,
    fromEmail: process.env.EMAIL_FROM || 'noreply@affiliatemanagement.com',
    smtpHost: process.env.SMTP_HOST || 'smtp.example.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    gmailUser: process.env.GMAIL_USER || '',
    gmailPassword: process.env.GMAIL_PASSWORD || '',
    testUser: process.env.EMAIL_TEST_USER || 'test@ethereal.email',
    testPassword: process.env.EMAIL_TEST_PASSWORD || 'test-password',
  },
};
