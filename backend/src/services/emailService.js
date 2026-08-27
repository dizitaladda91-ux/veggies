const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

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
        });
      } else if (email.provider === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: email.gmailUser,
            pass: email.gmailPassword,
          },
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
        });
      }

      logger.info(`Email transporter initialized with provider: ${email.provider}`);
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send email with error handling and logging
   */
  async sendEmail(to, subject, htmlContent, textContent = null, attachments = []) {
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
      logger.info(`Email sent successfully: ${subject} to ${to}`, { messageId: info.messageId });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email: ${subject} to ${to}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email for new affiliates
   */
  async sendWelcomeEmail(affiliate) {
    const { email: affiliateEmail, firstName } = affiliate;
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
    const { email: affiliateEmail, firstName } = affiliate;
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
    const { email: userEmail, firstName } = user;
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
    const { email: userEmail, firstName } = user;
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
    const { email: userEmail, firstName } = user;
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
  async sendPasswordResetEmail(user, resetToken) {
    const { email: userEmail, firstName } = user;
    const resetLink = `${config.frontendUrl}/reset-password/${resetToken}`;
    const subject = 'Reset Your Password';

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

    return this.sendEmail(user.email, subject, htmlContent);
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
