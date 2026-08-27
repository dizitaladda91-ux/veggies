const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/withdrawalRequest.service');
const notificationRepository = require('../repositories/notification.repository');
const logger = require('../utils/logger');

exports.create = asyncHandler(async (req, res) => {
  const result = await service.request(req.user.id, req.body);
  
  try {
    const amount = req.body.amount || result?.amount || '';
    notificationRepository.create({
      userId: req.user.id,
      title: 'Withdrawal Requested 💳',
      message: `Your withdrawal request of ₹${amount} was submitted and is pending review.`,
      type: 'withdrawal',
    }).catch(err => logger.error('User withdrawal request notification error:', err));

    notificationRepository.createForAdmins({
      title: 'New Withdrawal Request 💳',
      message: `An affiliate submitted a new withdrawal request of ₹${amount}.`,
      type: 'withdrawal',
    }).catch(err => logger.error('Admin withdrawal request notification error:', err));
  } catch (err) {
    logger.error('Failed to create withdrawal request notifications:', err);
  }

  res.status(201).json({ success: true, data: result });
});
exports.listMine = asyncHandler(async (req, res) => res.json({ success: true, data: await service.list(req.user.id, req.query.page, req.query.limit) }));
exports.cancel = asyncHandler(async (req, res) => res.json({ success: true, data: await service.cancel(req.user.id, req.params.id, req.body.notes) }));
