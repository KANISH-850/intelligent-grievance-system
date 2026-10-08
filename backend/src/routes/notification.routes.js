const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth.middleware");

// Require authentication for all notification routes
router.use(authenticate);

// GET /api/v1/notifications - Get user notifications
router.get("/", notificationController.getNotifications);

// PATCH /api/v1/notifications/read-all - Mark all as read
router.patch("/read-all", notificationController.markAllAsRead);

// PATCH /api/v1/notifications/:id/read - Mark single notification as read
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
