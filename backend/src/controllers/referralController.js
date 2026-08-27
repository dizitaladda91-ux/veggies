const referralService = require('../services/referralService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class ReferralController {
  trackClick = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const result = await referralService.trackClick({
      referralCode: code,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      referrerUrl: req.get('referrer'),
    });
    return sendSuccess(res, 'Click tracked', result);
  });

  recordConversion = asyncHandler(async (req, res) => {
    const { referralCode, orderId, customerEmail, amount, grossAmount, discountAmount, eligibleAmount, currency, clickId } = req.body;
    const result = await referralService.processConversion({
      referralCode,
      orderId,
      customerEmail,
      amount: parseFloat(amount),
      grossAmount: grossAmount === undefined ? parseFloat(amount) : parseFloat(grossAmount),
      discountAmount: discountAmount === undefined ? 0 : parseFloat(discountAmount),
      eligibleAmount: eligibleAmount === undefined ? parseFloat(amount) : parseFloat(eligibleAmount),
      currency,
      clickId,
    });
    return sendSuccess(res, 'Conversion & commission processed', result, HTTP_STATUS.CREATED);
  });

  getDiscount = asyncHandler(async (req, res) => {
    const discount = await referralService.getAffiliateDiscount(req.params.code);
    return sendSuccess(res, 'Affiliate discount verified', discount);
  });

  getCouponEligibility = asyncHandler(async (req, res) => {
    const result = await referralService.getCouponEligibility(req.params.code, req.query.customerEmail);
    return sendSuccess(res, 'Coupon eligibility checked', result);
  });

  getTeam = asyncHandler(async (req, res) => {
    const team = await referralService.getTeamMembers(req.user.id, req.user.role_name, req.query);
    return sendSuccess(res, 'Sub-affiliate team members retrieved', team);
  });
}

module.exports = new ReferralController();
