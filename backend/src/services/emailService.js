const nodemailer = require('nodemailer');
const dns = require('dns');
const config = require('../config/env');
const logger = require('../utils/logger');

// Force Node.js DNS to resolve IPv4 addresses first
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Strict IPv4-only resolver using dns.resolve4 (bypasses IPv6 AAAA lookup completely)
const ipv4Lookup = (hostname, options, callback) => {
  const cb = typeof options === 'function' ? options : callback;
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      return cb(null, addresses[0], 4);
    }
    dns.lookup(hostname, { family: 4 }, (lookupErr, address) => {
      cb(lookupErr, address, 4);
    });
  });
};

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment
   * Supports: SMTP, SendGrid, Gmail, development test
   */
  initializeTransporter() {
    const { email } = config;

    if (!email.enabled) {
      logger.info('Email service disabled. Using console logger.');
      return;
    }

    try {
      if (email.provider === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: email.smtpHost,
          port: email.smtpPort,
          secure: email.smtpSecure,
          auth: {
            user: email.smtpUser,
            pass: email.smtpPassword,
          },
          family: 4,
          lookup: ipv4Lookup,
        });
      } else if (email.provider === 'sendgrid') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: email.sendgridApiKey,
          },
          family: 4,
          lookup: ipv4Lookup,
        });
      } else if (email.provider === 'gmail') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: email.gmailUser,
            pass: email.gmailPassword,
          },
          family: 4,
          lookup: ipv4Lookup,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: email.testUser,
            pass: email.testPassword,
          },
          family: 4,
          lookup: ipv4Lookup,
        });
      }

      logger.info(`Email transporter initialized with provider: ${email.provider} (Strict IPv4 DNS enforced via resolve4)`);
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send email with error handling and logging
   */
  async sendEmail(to, subject, htmlContent, textContent = null, attachments = []) {
    // 1. Try Resend HTTPS API if key configured (Port 443 - 100% bypasses Render firewall)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Veggie Affiliate <onboarding@resend.dev>',
            to: [to],
            subject,
            html: htmlContent
          })
        });
        const data = await response.json();
        if (response.ok) {
          logger.info(`Email delivered via Resend API: ${subject} to ${to}`, { id: data.id });
          return { success: true, messageId: data.id };
        }
        logger.error(`Resend API Error: ${JSON.stringify(data)}`);
      } catch (err) {
        logger.error(`Resend API Exception: ${err.message}`);
      }
    }

    // 2. Try Brevo HTTPS API if key configured (Port 443 - 100% bypasses Render firewall)
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Veggie Affiliate', email: process.env.GMAIL_USER || 'noreply@veggieradiance.com' },
            to: [{ email: to }],
            subject,
            htmlContent
          })
        });
        const data = await response.json();
        if (response.ok) {
          logger.info(`Email delivered via Brevo API: ${subject} to ${to}`, { messageId: data.messageId });
          return { success: true, messageId: data.messageId };
        }
        logger.error(`Brevo API Error: ${JSON.stringify(data)}`);
      } catch (err) {
        logger.error(`Brevo API Exception: ${err.message}`);
      }
    }

    // 3. Fallback to Nodemailer Transporter (SMTP / Gmail)
    if (!this.transporter) {
      logger.warn(`Email not sent (service disabled): ${subject} to ${to}`);
      return { success: false, reason: 'Email service disabled' };
    }

    try {
      const mailOptions = {
        from: config.email.fromEmail,
        to,
        subject,
        html: htmlContent,
        ...(textContent && { text: textContent }),
        ...(attachments.length > 0 && { attachments }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully via Nodemailer: ${subject} to ${to}`, { messageId: info.messageId });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email via Nodemailer: ${subject} to ${to}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send 6-digit registration OTP verification code
   */
  async sendRegistrationOtp(email, otpCode) {
    const subject = `Your Verification Code: ${otpCode} - Veggie Affiliate`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #04120e; color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.3);">
        <h2 style="color: #10b981; text-align: center; margin-bottom: 8px;">VEGGIE AFFILIATE NETWORK</h2>
        <p style="text-align: center; color: #a7f3d0; font-size: 14px; margin-bottom: 24px;">Official Email Verification Code</p>
        
        <p style="color: #e2e8f0; font-size: 15px;">Hello,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Your 6-digit email verification code to complete your affiliate registration is:
        </p>

        <div style="background-color: rgba(16, 185, 129, 0.1); border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #34d399; font-family: monospace;">${otpCode}</span>
        </div>

        <p style="color: #94a3b8; font-size: 13px; text-align: center;">
          This code is valid for <strong>10 minutes</strong>. Please enter this code on the registration page to verify your official email.
        </p>

        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          If you did not request this code, please ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, htmlContent);
  }

  /**
   * Send welcome email for new affiliates
   */
  async sendWelcomeEmail(affiliate) {
    const affiliateEmail = affiliate.official_email || affiliate.officialEmail || affiliate.email;
    const firstName = affiliate.firstName || affiliate.first_name || 'Affiliate';
    const subject = 'Welcome to Our Affiliate Program!';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${firstName}!</h2>
        <p>Thank you for joining our affiliate program. We're excited to have you on board!</p>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Complete your profile with bank account details</li>
          <li>Generate your unique referral links</li>
          <li>Start promoting and earning commissions!</li>
        </ol>
        
        <p>
          <a href="${config.frontendUrl}/dashboard" 
             style="background-color: #007bff; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Go to Dashboard
          </a>
        </p>
        
        <p>If you have any questions, contact our support team.</p>
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(affiliateEmail, subject, htmlContent);
  }

  /**
   * Send commission earned notification
   */
  async sendCommissionEmail(affiliate, commission) {
    const affiliateEmail = affiliate.official_email || affiliate.officialEmail || affiliate.email;
    const firstName = affiliate.firstName || affiliate.first_name || 'Affiliate';
    const { amount, referral_code, created_at } = commission;

    const subject = `Commission Earned: ₹${Number(amount || 0).toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Commission Earned! 🎉</h2>
        <p>Hi ${firstName},</p>
        
        <p>Great news! You've earned a commission:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Commission Amount:</strong> ₹${Number(amount || 0).toFixed(2)}</p>
          <p><strong>Referral Code:</strong> ${referral_code}</p>
          <p><strong>Date:</strong> ${new Date(created_at).toLocaleDateString()}</p>
        </div>
        
        <p>This amount will be added to your wallet and available for withdrawal.</p>
        
        <p>
          <a href="${config.frontendUrl}/earnings" 
             style="background-color: #28a745; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            View Earnings
          </a>
        </p>
        
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(affiliateEmail, subject, htmlContent);
  }

  /**
   * Send withdrawal request confirmation
   */
  async sendWithdrawalRequestEmail(user, withdrawal) {
    const userEmail = user.official_email || user.officialEmail || user.email;
    const firstName = user.firstName || user.first_name || 'Affiliate';
    const { amount, status, requested_at, bank_account_number } = withdrawal;

    const subject = `Withdrawal Request Confirmation - ₹${Number(amount || 0).toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Withdrawal Request Received</h2>
        <p>Hi ${firstName},</p>
        
        <p>Your withdrawal request has been received and is being processed:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₹${Number(amount || 0).toFixed(2)}</p>
          <p><strong>Status:</strong> <span style="color: #ffc107;">${status.toUpperCase()}</span></p>
          <p><strong>Bank Account (last 4):</strong> ****${(bank_account_number || '').slice(-4)}</p>
          <p><strong>Requested on:</strong> ${new Date(requested_at).toLocaleDateString()}</p>
        </div>
        
        <p>You'll receive an email once your withdrawal is processed and transferred to your bank account.</p>
        
        <p>
          <a href="${config.frontendUrl}/withdrawals" 
             style="background-color: #007bff; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Track Withdrawal
          </a>
        </p>
        
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Send withdrawal approval notification
   */
  async sendWithdrawalApprovedEmail(user, withdrawal) {
    const userEmail = user.official_email || user.officialEmail || user.email;
    const firstName = user.firstName || user.first_name || 'Affiliate';
    const { amount, approved_at } = withdrawal;

    const subject = `Withdrawal Approved - ₹${Number(amount || 0).toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Withdrawal Approved! ✅</h2>
        <p>Hi ${firstName},</p>
        
        <p>Great news! Your withdrawal of <strong>₹${Number(amount || 0).toFixed(2)}</strong> has been approved.</p>
        
        <p>The funds should appear in your bank account within 2-5 business days.</p>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p><strong>Approved on:</strong> ${new Date(approved_at || Date.now()).toLocaleDateString()}</p>
        </div>
        
        <p>Thank you for being part of our affiliate program!</p>
        
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Send withdrawal rejection notification
   */
  async sendWithdrawalRejectedEmail(user, withdrawal, reason) {
    const userEmail = user.official_email || user.officialEmail || user.email;
    const firstName = user.firstName || user.first_name || 'Affiliate';
    const { amount } = withdrawal;

    const subject = `Withdrawal Request Declined - ₹${Number(amount || 0).toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Withdrawal Request Declined</h2>
        <p>Hi ${firstName},</p>
        
        <p>Unfortunately, your withdrawal request for <strong>₹${Number(amount || 0).toFixed(2)}</strong> has been declined.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p><strong>Reason:</strong> ${reason || 'Please contact support for details.'}</p>
        </div>
        
        <p>If you believe this is an error or have questions, please contact our support team.</p>
        
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken, targetEmail = null) {
    const userEmail = targetEmail || user.official_email || user.officialEmail || user.email;
    const firstName = user.firstName || user.first_name || 'Affiliate';
    const resetLink = `${config.frontendUrl}/reset-password/${resetToken}`;
    const subject = 'Reset Your Password - Veggie Affiliate';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        
        <p style="margin: 25px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </p>
        
        <p>This link is valid for 1 hour. If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(user, verificationToken) {
    const userEmail = user.official_email || user.officialEmail || user.email;
    const verifyLink = `${config.frontendUrl}/verify-email/${verificationToken}`;
    const subject = 'Verify Your Email Address';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Hi ${user.first_name || 'there'},</p>
        <p>Please click the button below to verify your email address:</p>
        <p><a href="${verifyLink}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Verify email</a></p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Send admin alert on new affiliate registration
   */
  async sendAdminNewAffiliateAlert(adminEmail, affiliate) {
    const { firstName, lastName, email: affiliateEmail, company } = affiliate;
    const subject = `New Affiliate Registration: ${firstName} ${lastName}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Affiliate Registration</h2>
        <p>A new affiliate has registered and requires your attention:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${affiliateEmail}</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
        </div>
        
        <p>
          <a href="${config.frontendUrl}/admin/affiliates" 
             style="background-color: #007bff; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Review Affiliate
          </a>
        </p>
      </div>
    `;

    return this.sendEmail(adminEmail, subject, htmlContent);
  }
}

module.exports = new EmailService();
