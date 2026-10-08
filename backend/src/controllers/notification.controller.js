const notificationService = require("../services/notification.service");

/**
 * GET /api/v1/notifications
 * Retrieves notifications for the authenticated user.
 */
const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user.id);
    return res.status(200).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a single notification as read for the authenticated user.
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await notificationService.markNotificationAsRead(id, req.user.id);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 * Marks all unread notifications as read for the authenticated user.
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllNotificationsAsRead(req.user.id);
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
