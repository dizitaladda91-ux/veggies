const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../database');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const paymentRepository = require('../repositories/paymentRepository');
const couponRedemptionRepository = require('../repositories/couponRedemptionRepository');

class PaymentService {
  constructor() { this.client = null; }
  gateway() {
    if (!config.paymentsEnabled) throw ApiError.notFound('Payments are not enabled');
    if (!config.razorpay.keyId || !config.razorpay.keySecret) throw ApiError.internal('Razorpay is not configured');
    return new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
  }
  async createOrder({ amount, currency = 'INR', customer, referralCode, clickId }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const context = await paymentRepository.findReferralContext(client, referralCode, clickId);
      if (!context) throw ApiError.badRequest('Referral code, click ID, or affiliate is invalid');
      const originalAmount = Number(amount);
      const discountAmount = Number((originalAmount * config.affiliateDiscountPercent / 100).toFixed(2));
      const finalAmount = Number((originalAmount - discountAmount).toFixed(2));
      const order = await this.gateway().orders.create({ amount: Math.round(finalAmount * 100), currency, receipt: `aff_${Date.now()}_${clickId.slice(0, 8)}`, notes: { referralCode, clickId, affiliateId: context.affiliate_id } });
      await paymentRepository.createPayment(client, { gatewayOrderId: order.id, affiliateId: context.affiliate_id, clickId, referralCode, customer, amount: finalAmount, originalAmount, discountAmount, currency, gatewayResponse: order });
      await client.query('COMMIT');
      return { keyId: config.razorpay.keyId, orderId: order.id, amount: order.amount, currency: order.currency, customer: customer || {} };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  verifySignature(orderId, paymentId, signature) {
    const expected = crypto.createHmac('sha256', config.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const supplied = Buffer.from(signature, 'utf8');
    return supplied.length === Buffer.byteLength(expected) && crypto.timingSafeEqual(Buffer.from(expected), supplied);
  }
  async verifyPayment({ orderId, paymentId, signature }) {
    if (!this.verifySignature(orderId, paymentId, signature)) throw ApiError.badRequest('Invalid payment signature');
    const gatewayPayment = await this.gateway().payments.fetch(paymentId);
    if (gatewayPayment.order_id !== orderId) throw ApiError.badRequest('Payment does not belong to this order');
    return this.processGatewayPayment(orderId, paymentId, gatewayPayment.status === 'captured' ? 'SUCCESS' : 'PENDING', gatewayPayment);
  }
  async processGatewayPayment(orderId, paymentId, status, gatewayResponse) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const payment = await paymentRepository.findByGatewayOrderId(client, orderId);
      if (!payment) throw ApiError.notFound('Payment order not found');
      if (payment.status === 'SUCCESS' && status === 'SUCCESS') {
        await client.query('COMMIT');
        return { payment, conversion: null, commission: null, pending: false, alreadyProcessed: true };
      }
      const updated = await paymentRepository.updatePayment(client, payment.id, { paymentId, status, gatewayResponse });
      let result = null;
      if (status === 'SUCCESS') {
        const context = await paymentRepository.findReferralContext(client, updated.referral_code, updated.click_id);
        if (!context) throw ApiError.badRequest('The referral context is no longer valid');
        const customerEmail = updated.customer?.email;
        if (!customerEmail) throw ApiError.badRequest('Customer email is required for one-time coupon validation');
        const redemption = await couponRedemptionRepository.claim({
          referralCode: updated.referral_code,
          customerEmail,
          orderId: updated.gateway_order_id,
        }, client);
        if (!redemption) throw ApiError.conflict('This referral coupon has already been used by this customer.');
        result = await paymentRepository.createConversionAndCommission(client, {
          ...updated,
          affiliate_role: context.affiliate_role,
          parent_affiliate_id: context.parent_affiliate_id,
        });
        if (result?.conversion) await couponRedemptionRepository.attachConversion(redemption.id, result.conversion.id, client);
      }
      await client.query('COMMIT');
      return { payment: updated, conversion: result?.conversion || null, commission: result?.commission || null, pending: status !== 'SUCCESS' };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async webhook(rawBody, signature) {
    if (!config.razorpay.webhookSecret) throw ApiError.internal('Razorpay webhook secret is not configured');

    let bodyBuffer;
    let payload;

    if (Buffer.isBuffer(rawBody)) {
      bodyBuffer = rawBody;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch (error) {
        throw ApiError.badRequest('Invalid webhook JSON payload');
      }
    } else if (typeof rawBody === 'string') {
      bodyBuffer = Buffer.from(rawBody, 'utf8');
      try {
        payload = JSON.parse(rawBody);
      } catch (error) {
        throw ApiError.badRequest('Invalid webhook JSON payload');
      }
    } else if (typeof rawBody === 'object' && rawBody !== null) {
      payload = rawBody;
      bodyBuffer = Buffer.from(JSON.stringify(rawBody), 'utf8');
    } else {
      throw ApiError.badRequest('Empty or invalid webhook body');
    }

    const expected = crypto.createHmac('sha256', config.razorpay.webhookSecret).update(bodyBuffer).digest('hex');
    const supplied = Buffer.from(signature || '', 'utf8');
    if (supplied.length !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(expected), supplied)) {
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    if (!payload || typeof payload !== 'object' || !payload.event_id || !payload.event) {
      throw ApiError.badRequest('Malformed webhook payload');
    }

    const supportedEvents = ['payment.captured', 'order.paid', 'payment.failed', 'refund.created', 'refund.processed', 'payment.authorized'];
    if (!supportedEvents.includes(payload.event)) {
      return { ignored: true, event: payload.event };
    }

    const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity || payload.payload?.refund?.entity;
    if (!entity || (!entity.order_id && !entity.id && !entity.payment_id)) {
      throw ApiError.badRequest('Webhook payload is missing payment/order entity');
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const received = await paymentRepository.recordWebhook(client, payload.event_id, payload.event, payload);
      if (!received) {
        await client.query('COMMIT');
        return { duplicate: true, event: payload.event };
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      await this.processGatewayPayment(entity.order_id || entity.id, entity.id || payload.payload?.payment?.entity?.id, 'SUCCESS', entity);
    } else if (payload.event === 'payment.failed') {
      await this.processGatewayPayment(entity.order_id, entity.id, 'FAILED', entity);
    } else if (payload.event === 'refund.processed') {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        await paymentRepository.reverseForFullRefund(client, {
          gatewayPaymentId: entity.payment_id,
          gatewayOrderId: entity.order_id,
          gatewayRefundId: entity.id,
          amount: entity.amount,
          payload,
        });
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }

    await paymentRepository.completeWebhook(db, payload.event_id);
    return { ignored: false, event: payload.event };
  }
}
module.exports = new PaymentService();
