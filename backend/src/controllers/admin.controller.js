const adminService = require("../services/admin.service");

/**
 * @route   GET /api/v1/admin/grievances
 * @desc    Get all grievances across all departments with filtering
 * @access  Private (Admin)
 */
const getAllGrievances = async (req, res, next) => {
  try {
    const grievances = await adminService.getAllGrievances(req.query);

    return res.status(200).json({
      success: true,
      data: grievances,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/grievances/:id
 * @desc    Get single grievance details across any department
 * @access  Private (Admin)
 */
const getAdminGrievanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const grievance = await adminService.getAdminGrievanceById(id);

    return res.status(200).json({
      success: true,
      data: grievance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/admin/grievances/:id/status
 * @desc    Update status of any grievance in the system
 * @access  Private (Admin)
 */
const updateGrievanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const updatedGrievance = await adminService.updateAdminGrievanceStatus(
      id,
      req.user,
      { status, remarks }
    );

    return res.status(200).json({
      success: true,
      message: "Grievance status updated successfully",
      data: updatedGrievance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/departments/:departmentId/grievances
 * @desc    Get grievances belonging to a specific department
 * @access  Private (Admin)
 */
const getDepartmentGrievances = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const result = await adminService.getDepartmentGrievances(departmentId, req.query);

    return res.status(200).json({
      success: true,
      department: result.department,
      data: result.grievances,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/analytics
 * @desc    Get system-wide analytics metrics for Admin
 * @access  Private (Admin)
 */
const getAdminAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getAdminAnalytics();
    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllGrievances,
  getAdminGrievanceById,
  updateGrievanceStatus,
  getDepartmentGrievances,
  getAdminAnalytics,
};
