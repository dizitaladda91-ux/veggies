# Email Notifications Service

## Overview

The Email Notifications Service is a production-ready email system integrated into the Affiliate Management SaaS platform. It supports multiple email providers and provides automated email notifications for key events.

## Features

✅ **Multiple Email Providers**
- SMTP (Gmail, SendGrid, custom SMTP servers)
- SendGrid (API integration)
- Gmail (app-specific password)
- Ethereal (test/development)

✅ **Automated Email Triggers**
- Welcome email for new affiliates
- Withdrawal request confirmation
- Withdrawal approval notification
- Withdrawal rejection notification
- Commission earned notification
- Password reset email
- Admin notification for new affiliate registrations

✅ **Non-blocking Implementation**
- All emails sent asynchronously
- Never blocks API responses
- Graceful error handling with logging

✅ **Production-Ready**
- Error logging and monitoring
- Configurable via environment variables
- Support for HTML and text email formats
- Professional email templates with branding

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install nodemailer
```

### 2. Environment Variables

Create or update your `.env` file:

```env
# Enable/disable email service
EMAIL_ENABLED=true

# Email provider: 'smtp', 'sendgrid', 'gmail', or 'test'
EMAIL_PROVIDER=test

# From address
EMAIL_FROM=noreply@affiliatemanagement.com

# ===== SMTP Configuration =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# ===== SendGrid Configuration =====
SENDGRID_API_KEY=your-sendgrid-api-key

# ===== Gmail Configuration =====
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-specific-password

# ===== Test Configuration =====
EMAIL_TEST_USER=test@ethereal.email
EMAIL_TEST_PASSWORD=test-password
```

## Email Provider Configuration

### Gmail Setup

1. Enable 2-Factor Authentication on your Google account
2. Generate an App-Specific Password: https://myaccount.google.com/apppasswords
3. Use the generated 16-character password in `SMTP_PASSWORD`

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=16-char-app-password
```

### SendGrid Setup

1. Create a SendGrid account: https://sendgrid.com
2. Generate an API key from Settings > API Keys
3. Use the API key in your environment

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key-here
```

### Custom SMTP Server

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASSWORD=password
```

### Development Testing (Ethereal)

For testing without a real email provider:

```env
EMAIL_PROVIDER=test
EMAIL_TEST_USER=test@ethereal.email
EMAIL_TEST_PASSWORD=test-password
```

Ethereal provides test credentials automatically.

## Email Service API

### Methods

#### `sendEmail(to, subject, htmlContent, textContent, attachments)`
General-purpose email sending method.

**Parameters:**
- `to` (string): Recipient email address
- `subject` (string): Email subject line
- `htmlContent` (string): HTML email body
- `textContent` (string, optional): Plain text fallback
- `attachments` (array, optional): Array of attachment objects

**Returns:** `{ success: boolean, messageId?: string, error?: string }`

```javascript
const result = await emailService.sendEmail(
  'user@example.com',
  'Hello',
  '<p>Test email</p>',
  'Test email',
  []
);
```

#### `sendWelcomeEmail(affiliate)`
Sends welcome email to new affiliate.

**Parameters:**
- `affiliate`: Object with `{ email, firstName, lastName }`

```javascript
await emailService.sendWelcomeEmail({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});
```

#### `sendWithdrawalRequestEmail(user, withdrawal)`
Sends withdrawal request confirmation.

**Parameters:**
- `user`: User object with `{ email, firstName }`
- `withdrawal`: Withdrawal data with `{ amount, status, requested_at, bank_account_number }`

#### `sendWithdrawalApprovedEmail(user, withdrawal)`
Notifies user of withdrawal approval.

#### `sendWithdrawalRejectedEmail(user, withdrawal, reason)`
Notifies user of withdrawal rejection.

#### `sendCommissionEmail(affiliate, commission)`
Notifies affiliate of earned commission.

#### `sendPasswordResetEmail(user, resetToken)`
Sends password reset link.

#### `sendNewAffiliateNotificationToAdmin(affiliate, adminEmail)`
Notifies admin of new affiliate registration.

## Integration Examples

### 1. Withdrawal Request (Already Integrated)

When a withdrawal is requested in [withdrawalRequest.service.js](./withdrawalRequest.service.js#L40):

```javascript
const result = await withdrawalRepository.create(...);

// Email sent automatically
emailService.sendWithdrawalRequestEmail(user, {
  amount: value,
  status: 'pending',
  requested_at: new Date(),
  bank_account_number: bankAccount.account_number,
});
```

### 2. Affiliate Registration (Already Integrated)

When a new affiliate registers in [authService.js](./authService.js#L63):

```javascript
const user = await userRepository.create(...);

// Welcome email sent automatically
emailService.sendWelcomeEmail({
  email: user.email,
  firstName: profile.first_name,
  lastName: profile.last_name,
});
```

### 3. Withdrawal Approval (Already Integrated)

When admin approves withdrawal in [adminWithdrawal.controller.js](../controllers/adminWithdrawal.controller.js#L18):

```javascript
const approved = await withdrawalRepository.approve(...);

// Approval email sent automatically
emailService.sendWithdrawalApprovedEmail(user, {
  amount: withdrawal.amount,
  approved_at: new Date(),
});
```

## Testing Email Service

### Method 1: Manual Test Script

```bash
node src/services/emailService.test.js
```

This runs all email templates through the configured provider.

### Method 2: In Application Code

```javascript
const emailService = require('./services/emailService');

// Test any template
await emailService.sendWelcomeEmail({
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
});
```

### Method 3: Using Ethereal Test Provider

Set `EMAIL_PROVIDER=test` in your `.env`, then run the application. Emails will be sent to the Ethereal test service, which provides preview links.

## Error Handling

All email operations are non-blocking and include error handling:

```javascript
try {
  const result = await emailService.sendWelcomeEmail(user);
  if (!result.success) {
    logger.warn('Email failed but continuing:', result.error);
  }
} catch (error) {
  logger.error('Email service error:', error);
  // Application continues - email is non-critical
}
```

## Monitoring & Logging

All email activities are logged:

```
✓ Email sent successfully: Welcome Email to user@example.com
✗ Failed to send email: Withdrawal Approval to admin@example.com
⚠ Email service disabled - using console logger
```

Check logs in:
- Development: Console output
- Production: Winston logs in `backend/logs/`

## Performance Considerations

- **Async Execution**: Emails don't block API responses
- **Queue Support**: Can integrate with Bull or RabbitMQ for high volume
- **Retry Logic**: Can be added for failed deliveries
- **Rate Limiting**: Email provider rate limits apply

## Security Considerations

⚠️ **Environment Variables**
- Never commit `.env` files to repository
- Use `.env.example` for configuration templates
- Keep API keys and passwords secure

⚠️ **Email Content**
- Links use `config.frontendUrl` for consistent branding
- User data is properly escaped in HTML
- No sensitive data in email subject lines

⚠️ **SMTP Credentials**
- Use app-specific passwords for Gmail
- Store passwords only in environment variables
- Rotate credentials regularly in production

## Troubleshooting

### Emails not sending?

1. Check `EMAIL_ENABLED=true` in `.env`
2. Verify `EMAIL_PROVIDER` is set correctly
3. Check email provider credentials
4. Review logs: `tail -f src/logs/error.log`

### Using Ethereal for testing?

- Preview link is logged after email sends
- Check console for "Preview URL"
- Ethereal emails expire after 24 hours

### Gmail authentication failing?

- Ensure 2FA is enabled
- Generate new app-specific password
- Use 16-character password exactly

### SendGrid integration?

- Verify API key format (starts with `SG.`)
- Check SendGrid account has email sending enabled
- Review SendGrid logs for delivery status

## Future Enhancements

- 📧 **Email Queue System**: Integrate Bull/BullMQ for high-volume
- 📊 **Email Analytics**: Track open/click rates via SendGrid
- 🔄 **Retry Logic**: Automatic retry with exponential backoff
- 📋 **Email Templates**: Database-driven template management
- 🌐 **Localization**: Multi-language email templates
- 📱 **SMS Fallback**: Backup notifications via SMS

## Support

For issues or questions:
1. Check logs: `src/logs/`
2. Review email provider documentation
3. Verify environment configuration
4. Test with `emailService.test.js`
