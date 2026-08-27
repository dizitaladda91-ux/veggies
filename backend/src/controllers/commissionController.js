const commissionService = require('../services/commissionService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class CommissionController {
  getRules = asyncHandler(async (req, res) => {
    const rules = await commissionService.getRules();
    return sendSuccess(res, 'Commission rules fetched', rules);
  });

  createRule = asyncHandler(async (req, res) => {
    const { name, type, value, eventType, minimumAmount, maximumAmount } = req.body;
    const rule = await commissionService.createRule({
      name,
      type,
      value: parseFloat(value),
      eventType,
      minimumAmount: minimumAmount === undefined ? 0 : parseFloat(minimumAmount),
      maximumAmount: maximumAmount === undefined || maximumAmount === '' ? null : parseFloat(maximumAmount),
      createdBy: req.user.id,
    });
    return sendSuccess(res, 'Commission rule created', rule, HTTP_STATUS.CREATED);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { commissionId } = req.params;
    const { status } = req.body;
    const updated = await commissionService.updateCommissionStatus(commissionId, status);
    return sendSuccess(res, `Commission status updated to ${status}`, updated);
  });

  autoSettle = asyncHandler(async (req, res) => {
    const holdDays = parseInt(req.body.holdDays || '7', 10);
    const result = await commissionService.autoSettleMaturedCommissions(holdDays);
    return sendSuccess(res, 'Automated commission settlement completed', result);
  });
}

module.exports = new CommissionController();
