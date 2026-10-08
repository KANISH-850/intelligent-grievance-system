const express = require("express");
const router = express.Router();
const { checkDatabaseConnection } = require("../config/database");

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint for Backend service & Database connection
 * @access  Public
 */
router.get("/health", async (req, res) => {
  const isDbConnected = await checkDatabaseConnection();

  if (!isDbConnected) {
    return res.status(503).json({
      status: "unhealthy",
      service: "backend",
      database: "disconnected",
    });
  }

  res.status(200).json({
    status: "ok",
    service: "backend",
    database: "connected",
  });
});

module.exports = router;
