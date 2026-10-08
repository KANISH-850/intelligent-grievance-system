const express = require("express");
const router = express.Router();
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const grievanceRoutes = require("./grievance.routes");
const officerRoutes = require("./officer.routes");
const adminRoutes = require("./admin.routes");
const chatbotRoutes = require("./chatbot.routes");
const notificationRoutes = require("./notification.routes");

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/grievances", grievanceRoutes);
router.use("/officer", officerRoutes);
router.use("/admin", adminRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
