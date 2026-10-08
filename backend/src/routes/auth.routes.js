const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

// Public auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Private auth route
router.get("/me", authenticate, authController.getMe);

module.exports = router;
