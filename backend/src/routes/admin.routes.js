const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// Require Authentication and ADMIN role for all routes in this module
router.use(authenticate, requireRole("ADMIN"));

// Admin System-Wide Grievance List
router.get("/grievances", adminController.getAllGrievances);

// Admin System-Wide Single Grievance Detail
router.get("/grievances/:id", adminController.getAdminGrievanceById);

// Admin System-Wide Status Update
router.patch("/grievances/:id/status", adminController.updateGrievanceStatus);

// Admin Department-Specific Grievances View
router.get("/departments/:departmentId/grievances", adminController.getDepartmentGrievances);

// Admin System-Wide Analytics
router.get("/analytics", adminController.getAdminAnalytics);

module.exports = router;
