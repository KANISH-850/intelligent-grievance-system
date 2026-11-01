const express = require("express");
const router = express.Router();
const grievanceController = require("../controllers/grievance.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const { validateGrievanceSubmission } = require("../middleware/grievanceValidation");

// Pre-submission image analysis (interactive citizen feedback)
router.post(
  "/analyze-image",
  authenticate,
  requireRole("CITIZEN"),
  require("../middleware/upload.middleware").upload.single("image"),
  grievanceController.analyzePreSubmissionImage
);

// Pre-submission translation & language detection preview
router.post(
  "/translate-preview",
  authenticate,
  requireRole("CITIZEN"),
  grievanceController.previewTranslation
);

// Submit a new citizen grievance
router.post(
  "/",
  authenticate,
  requireRole("CITIZEN"),
  // Multer middleware for handling optional image uploads (max 5 files)
  require("../middleware/upload.middleware").upload.array("images", 5),
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

// Serve a grievance image (protected — ownership + role enforced in controller)
router.get(
  "/:id/images/:imageId",
  authenticate,
  grievanceController.serveGrievanceImage
);

module.exports = router;
