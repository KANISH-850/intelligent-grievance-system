const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbot.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// POST /api/v1/chatbot/message - Authenticated CITIZEN only
router.post(
  "/message",
  authenticate,
  requireRole("CITIZEN"),
  chatbotController.postMessage
);

module.exports = router;
