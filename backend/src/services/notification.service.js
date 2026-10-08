const { prisma } = require("../config/database");

/**
 * Creates a notification in the database.
 * Supports transactional creation by accepting optional tx client.
 */
const createNotification = async (
  { userId, grievanceId = null, type, title, message },
  dbClient = null
) => {
  const client = dbClient || prisma;

  return await client.notification.create({
    data: {
      user_id: userId,
      grievance_id: grievanceId,
      type,
      title,
      message,
      is_read: false,
    },
  });
};

/**
 * Retrieves notifications for an authenticated user.
 */
const getUserNotifications = async (userId) => {
  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    include: {
      grievance: {
        select: {
          id: true,
          grievance_number: true,
          status: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });

  return {
    notifications,
    unreadCount,
  };
};

/**
 * Marks a single notification as read, enforcing user ownership.
 */
const markNotificationAsRead = async (notificationId, userId) => {
  const existing = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!existing || existing.user_id !== userId) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { is_read: true },
  });

  return updated;
};

/**
 * Marks all notifications for a user as read.
 */
const markAllNotificationsAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: { is_read: true },
  });

  return { success: true };
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
