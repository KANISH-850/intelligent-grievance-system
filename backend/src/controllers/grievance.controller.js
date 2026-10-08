const grievanceService = require("../services/grievance.service");

/**
 * @route   POST /api/v1/grievances
 * @desc    Submit a new citizen grievance for AI analysis & routing
 * @access  Private (Citizen)
 */
const createGrievance = async (req, res, next) => {
  try {
    const { text } = req.body;
    const userId = req.user.id;

    const grievance = await grievanceService.submitGrievance({ userId, text });

    return res.status(201).json({
      success: true,
      message: "Grievance submitted successfully",
      data: grievance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/grievances
 * @desc    Get all grievances belonging to the authenticated citizen
 * @access  Private (Citizen)
 */
const getGrievances = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const grievances = await grievanceService.getCitizenGrievances(userId);

    return res.status(200).json({
      success: true,
      data: grievances,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/grievances/:id
 * @desc    Get details of a single grievance by ID (with ownership check for Citizens)
 * @access  Private (Citizen, Officer, Admin)
 */
const getGrievanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const grievance = await grievanceService.getGrievanceById(id, req.user);

    return res.status(200).json({
      success: true,
      data: grievance,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGrievance,
  getGrievances,
  getGrievanceById,
};
