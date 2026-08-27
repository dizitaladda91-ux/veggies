const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../helpers/responseHelper');
const HTTP_STATUS = require('../constants/httpStatusCodes');
class PaymentController {
  createOrder = asyncHandler(async (req, res) => sendSuccess(res, 'Razorpay order created', await paymentService.createOrder(req.body), HTTP_STATUS.CREATED));
  verifyPayment = asyncHandler(async (req, res) => sendSuccess(res, 'Payment verified', await paymentService.verifyPayment({ orderId: req.body.razorpay_order_id, paymentId: req.body.razorpay_payment_id, signature: req.body.razorpay_signature })));
  webhook = asyncHandler(async (req, res) => sendSuccess(res, 'Webhook received', await paymentService.webhook(req.body, req.get('x-razorpay-signature'))));
}
module.exports = new PaymentController();
