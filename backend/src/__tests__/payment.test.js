jest.mock('../database', () => ({
  getClient: jest.fn(),
}));

jest.mock('../repositories/paymentRepository', () => ({
  findReferralContext: jest.fn(),
  createPayment: jest.fn(),
  findByGatewayOrderId: jest.fn(),
  updatePayment: jest.fn(),
  createConversionAndCommission: jest.fn(),
  recordWebhook: jest.fn(),
  completeWebhook: jest.fn(),
}));

jest.mock('../config/env', () => ({
  paymentsEnabled: true,
  razorpay: { keyId: 'test-key', keySecret: 'test-secret', webhookSecret: 'webhook-secret' },
  affiliateDiscountPercent: 10,
}));

jest.mock('razorpay', () => jest.fn().mockImplementation(() => ({
  orders: { create: jest.fn() },
  payments: { fetch: jest.fn() },
})));

const crypto = require('crypto');
const paymentService = require('../services/paymentService');
const paymentRepository = require('../repositories/paymentRepository');
const db = require('../database');

describe('payment service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.getClient.mockResolvedValue({
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    });
  });

  it('creates a Razorpay signature that verifies successfully', () => {
    const orderId = 'order-1';
    const paymentId = 'pay-1';
    const signature = crypto.createHmac('sha256', 'test-secret').update(`${orderId}|${paymentId}`).digest('hex');

    expect(paymentService.verifySignature(orderId, paymentId, signature)).toBe(true);
  });

  it('rejects invalid webhook signatures', async () => {
    await expect(paymentService.webhook(Buffer.from(JSON.stringify({ event: 'payment.captured' })), 'bad-signature')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects malformed webhook payloads with a bad request error', async () => {
    const body = Buffer.from('{not-json');
    await expect(paymentService.webhook(body, crypto.createHmac('sha256', 'webhook-secret').update(body).digest('hex'))).rejects.toMatchObject({ statusCode: 400 });
  });

  it('deduplicates duplicate webhook events', async () => {
    const body = Buffer.from(JSON.stringify({ event: 'payment.captured', event_id: 'evt-1', payload: { payment: { entity: { id: 'pay-1', order_id: 'order-1' } } } }));
    paymentRepository.recordWebhook.mockResolvedValue(null);

    const result = await paymentService.webhook(body, crypto.createHmac('sha256', 'webhook-secret').update(body).digest('hex'));

    expect(result.duplicate).toBe(true);
  });
});
