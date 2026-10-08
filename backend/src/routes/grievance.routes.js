const express = require("express");
const router = express.Router();
const grievanceController = require("../controllers/grievance.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const { validateGrievanceSubmission } = require("../middleware/grievanceValidation");

// Submit a new citizen grievance
router.post(
  "/",
  authenticate,
  requireRole("CITIZEN"),
  validateGrievanceSubmission,
  grievanceController.createGrievance
);

// Get grievances belonging to authenticated citizen
router.get(
  "/",
  authenticate,
  requireRole("CITIZEN"),
  grievanceController.getGrievances
);

// Get single grievance details by ID
router.get(
  "/:id",
  authenticate,
  grievanceController.getGrievanceById
);

module.exports = router;
