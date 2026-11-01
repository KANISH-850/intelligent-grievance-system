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
    const images = req.files || [];

    const grievance = await grievanceService.submitGrievance({ userId, text, images });

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

/**
 * @route   GET /api/v1/grievances/:id/images/:imageId
 * @desc    Stream a single grievance image with ownership/role check
 * @access  Private (Citizen – own grievance; Officer/Admin – any)
 */
const serveGrievanceImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const grievance = await grievanceService.getGrievanceById(id, req.user);

    // Officer department isolation check
    if (req.user.role === "OFFICER") {
      const isAssigned =
        grievance.department_id === req.user.department_id ||
        (grievance.assignments && grievance.assignments.some((a) => a.department_id === req.user.department_id));
      if (!isAssigned) {
        const err = new Error("Access denied: Officers can only view images for grievances assigned to their department.");
        err.statusCode = 403;
        return next(err);
      }
    }

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

/**
 * @route   POST /api/v1/grievances/analyze-image
 * @desc    Analyze an uploaded image prior to submission for citizen confirmation
 * @access  Private (Citizen)
 */
const analyzePreSubmissionImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided for analysis.",
      });
    }

    const aiService = require("../services/ai.service");
    const analysis = await aiService.analyzeImage(req.file.path, req.file.mimetype);

    return res.status(200).json({
      success: true,
      message: "Image analysis completed",
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/grievances/translate-preview
 * @desc    Detect language and preview English translation before submission
 * @access  Private (Citizen)
 */
const previewTranslation = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({
        success: false,
        message: "Text field must be a string.",
      });
    }

    const aiService = require("../services/ai.service");
    const preview = await aiService.previewTranslation(text);

    return res.status(200).json({
      success: true,
      message: "Translation preview generated",
      data: preview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/grievances/:id/assignments
 * @desc    Get all department assignments for a specific parent grievance
 * @access  Private (Citizen, Officer, Admin)
 */
const getGrievanceAssignments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignments = await grievanceService.getGrievanceAssignments(id, req.user);

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/grievances/:id/assignments/:assignmentId/history
 * @desc    Get progress history for a specific department assignment
 * @access  Private (Citizen, Officer, Admin)
 */
const getAssignmentHistory = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const officerService = require("../services/officer.service");
    const history = await officerService.getAssignmentHistory(assignmentId, req.user);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGrievance,
  getGrievances,
  getGrievanceById,
  getGrievanceAssignments,
  getAssignmentHistory,
  serveGrievanceImage,
  analyzePreSubmissionImage,
  previewTranslation,
};


