const affiliateService = require('../services/affiliateService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class AffiliateController {
  getLinks = asyncHandler(async (req, res) => {
    const links = await affiliateService.getUserLinks(req.user.id);
    return sendSuccess(res, 'Affiliate links retrieved', links);
  });

  createLink = asyncHandler(async (req, res) => {
    const { targetUrl, title, referralCode } = req.body;
    const link = await affiliateService.createCustomLink(req.user.id, { targetUrl, title, referralCode });
    return sendSuccess(res, 'Custom affiliate link created', link, HTTP_STATUS.CREATED);
  });

  getEarnings = asyncHandler(async (req, res) => {
    const earnings = await affiliateService.getAffiliateEarnings(req.user.id);
    return sendSuccess(res, 'Affiliate earnings data retrieved', earnings);
  });
}

module.exports = new AffiliateController();
