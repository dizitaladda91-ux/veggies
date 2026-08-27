const asyncHandler = require('../utils/asyncHandler');
const notificationRepository = require('../repositories/notification.repository');
const ApiError = require('../utils/apiError');

exports.list = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

  const [items, unreadCount] = await Promise.all([
    notificationRepository.findByUser(userId, limit),
    notificationRepository.countUnread(userId),
  ]);

  res.json({
    success: true,
    data: {
      items,
      unreadCount,
    },
  });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const item = await notificationRepository.markAsRead(id, userId);
  if (!item) {
    throw ApiError.notFound('Notification not found.');
  }

  const unreadCount = await notificationRepository.countUnread(userId);

  res.json({
    success: true,
    data: {
      item,
      unreadCount,
    },
  });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await notificationRepository.markAllAsRead(userId);

  res.json({
    success: true,
    data: {
      message: 'All notifications marked as read.',
      unreadCount: 0,
    },
  });
});
