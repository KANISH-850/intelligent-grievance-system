const officerService = require("../services/officer.service");

/**
 * @route   GET /api/v1/officer/grievances
 * @desc    Get grievances assigned to the officer's department
 * @access  Private (Officer)
 */
const getOfficerGrievances = async (req, res, next) => {
  try {
    const grievances = await officerService.getDepartmentGrievances(req.user, req.query);

    return res.status(200).json({
      success: true,
      data: grievances,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/officer/grievances/:id
 * @desc    Get single grievance details for officer's department
 * @access  Private (Officer)
 */
const getOfficerGrievanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const grievance = await officerService.getOfficerGrievanceById(id, req.user);

    return res.status(200).json({
      success: true,
      data: grievance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/officer/grievances/:id/status
 * @desc    Update status of a grievance in officer's department
 * @access  Private (Officer)
 */
const updateGrievanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const updatedGrievance = await officerService.updateOfficerGrievanceStatus(
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
 * @route   GET /api/v1/officer/analytics
 * @desc    Get departmental analytics metrics for logged-in Officer
 * @access  Private (Officer)
 */
const getOfficerAnalytics = async (req, res, next) => {
  try {
    const analytics = await officerService.getOfficerAnalytics(req.user);
    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/officer/grievances/:id/images/:imageId
 * @desc    Stream a grievance image (officer must belong to the grievance's department)
 * @access  Private (Officer)
 */
const serveOfficerGrievanceImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const grievance = await officerService.getOfficerGrievanceById(id, req.user);

    const image = (grievance.images || []).find((img) => img.id === imageId);
    if (!image) {
      const err = new Error("Image not found");
      err.statusCode = 404;
      return next(err);
    }

    const fs = require("fs");
    if (!fs.existsSync(image.path)) {
      const err = new Error("Image file missing on server");
      err.statusCode = 404;
      return next(err);
    }

    res.setHeader("Content-Type", image.mime_type);
    res.setHeader("Content-Length", image.size);
    res.setHeader("Cache-Control", "private, max-age=3600");
    fs.createReadStream(image.path).pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOfficerGrievances,
  getOfficerGrievanceById,
  updateGrievanceStatus,
  getOfficerAnalytics,
  serveOfficerGrievanceImage,
};
