/**
 * Middleware for validating Grievance Submission requests.
 * Supports text grievances, image-only submissions, and multimodal text+image submissions.
 */
const validateGrievanceSubmission = (req, res, next) => {
  const { text } = req.body;
  const hasImages = Array.isArray(req.files) && req.files.length > 0;

  // If no images are attached, enforce standard text requirements strictly
  if (!hasImages) {
    if (text === undefined || text === null) {
      return res.status(400).json({
        success: false,
        message: "Grievance text is required.",
      });
    }

    if (typeof text !== "string") {
      return res.status(400).json({
        success: false,
        message: "Grievance text must be a string.",
      });
    }

    const trimmedText = text.trim();

    if (!trimmedText) {
      return res.status(400).json({
        success: false,
        message: "Grievance text cannot be empty or whitespace only.",
      });
    }

    if (trimmedText.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Grievance text is too short. Minimum 5 characters required.",
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Grievance text exceeds maximum allowed length of 5000 characters.",
      });
    }

    req.body.text = trimmedText;
    return next();
  }

  // When images are attached, text description is optional
  const rawText = typeof text === "string" ? text.trim() : "";
  if (rawText.length > 5000) {
    return res.status(400).json({
      success: false,
      message: "Grievance text exceeds maximum allowed length of 5000 characters.",
    });
  }

  req.body.text = rawText;
  next();
};

module.exports = {
  validateGrievanceSubmission,
};
