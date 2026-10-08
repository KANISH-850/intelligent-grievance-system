/**
 * Middleware for validating Grievance Submission requests.
 */
const validateGrievanceSubmission = (req, res, next) => {
  const { text } = req.body;

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

  // Pass cleaned text forward
  req.body.text = trimmedText;
  next();
};

module.exports = {
  validateGrievanceSubmission,
};
