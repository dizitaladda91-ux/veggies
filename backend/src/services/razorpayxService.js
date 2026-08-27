const https = require('https');
const config = require('../config/env');
const logger = require('../utils/logger');

class RazorpayXService {
  isConfigured() {
    return Boolean(
      process.env.RAZORPAYX_ENABLED === 'true' &&
      process.env.RAZORPAYX_ACCOUNT_NUMBER &&
      config.razorpay.keyId &&
      config.razorpay.keySecret
    );
  }

  async createPayout({ accountNumber, ifscCode, beneficiaryName, amount, referenceId, narration = 'Affiliate Payout' }) {
    if (!this.isConfigured()) {
      logger.info('RazorpayX is disabled or not fully configured. Falling back to manual payout processing.');
      return { status: 'PENDING', isManual: true };
    }

    const payload = JSON.stringify({
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      amount: Math.round(Number(amount) * 100), // Amount in paise
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      fund_account: {
        account_type: 'bank_account',
        bank_account: {
          name: beneficiaryName,
          ifsc: ifscCode,
          account_number: accountNumber,
        },
      },
      queue_if_low_balance: true,
      reference_id: String(referenceId),
      narration: narration.slice(0, 30),
    });

    const auth = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.razorpay.com',
        path: '/v1/payouts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(responseBody);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              logger.info(`RazorpayX Payout initiated successfully: ID ${data.id}, Status: ${data.status}`);
              resolve({
                success: true,
                payoutId: data.id,
                status: data.status,
                utr: data.utr || null,
                raw: data,
              });
            } else {
              logger.error('RazorpayX API Error:', data);
              resolve({ success: false, error: data.error?.description || 'RazorpayX payout failed', raw: data });
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', (err) => {
        logger.error('RazorpayX Request Error:', err);
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = new RazorpayXService();
