const express = require("express");
const router = express.Router();
const officerController = require("../controllers/officer.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// Require Authentication and OFFICER role for all routes in this module
router.use(authenticate, requireRole("OFFICER"));

// Officer Department Grievance List
router.get("/grievances", officerController.getOfficerGrievances);

// Officer Department Single Grievance Detail
router.get("/grievances/:id", officerController.getOfficerGrievanceById);

// Officer Department Status Update
router.patch("/grievances/:id/status", officerController.updateGrievanceStatus);

// Officer Department Analytics
router.get("/analytics", officerController.getOfficerAnalytics);

module.exports = router;
