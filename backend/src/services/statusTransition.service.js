/**
 * Service providing reusable Status Transition Matrix and Validation Rules
 * for Officer and Admin Grievance Workflows.
 */

// All valid Prisma Status enum values
const VALID_STATUSES = [
  "SUBMITTED",
  "ASSIGNED",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

// Valid state machine transitions
const ALLOWED_TRANSITIONS = {
  SUBMITTED: ["ASSIGNED", "UNDER_REVIEW", "IN_PROGRESS", "REJECTED"],
  ASSIGNED: ["UNDER_REVIEW", "IN_PROGRESS", "REJECTED"],
  UNDER_REVIEW: ["IN_PROGRESS", "RESOLVED", "REJECTED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED"],
  RESOLVED: [], // Terminal state
  REJECTED: [], // Terminal state
};

/**
 * Validates requested status update against allowed transitions and remark requirements.
 *
 * @param {string} currentStatus - Existing grievance status
 * @param {string} targetStatus - Requested new status
 * @param {string} remarks - Remarks provided by Officer/Admin
 * @param {string} userRole - Role of user attempting the status change ('OFFICER' or 'ADMIN')
 */
const validateStatusTransition = ({ currentStatus, targetStatus, remarks, userRole }) => {
  if (!targetStatus || typeof targetStatus !== "string") {
    const error = new Error("Status is required.");
    error.statusCode = 400;
    throw error;
  }

  const upperTarget = targetStatus.trim().toUpperCase();

  if (!VALID_STATUSES.includes(upperTarget)) {
    const error = new Error(`Invalid status '${targetStatus}'. Allowed statuses: ${VALID_STATUSES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  // Officer specific restrictions
  if (userRole === "OFFICER" && upperTarget === "SUBMITTED") {
    const error = new Error("Officers cannot revert grievance status back to SUBMITTED.");
    error.statusCode = 400;
    throw error;
  }

  // Check if target is same as current status
  if (currentStatus === upperTarget) {
    const error = new Error(`Grievance is already in status '${currentStatus}'.`);
    error.statusCode = 400;
    throw error;
  }

  // Verify transition path
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(upperTarget)) {
    const error = new Error(`Invalid status transition from '${currentStatus}' to '${upperTarget}'.`);
    error.statusCode = 400;
    throw error;
  }

  // Validate remarks
  const trimmedRemarks = remarks ? String(remarks).trim() : "";

  if (["RESOLVED", "REJECTED"].includes(upperTarget) && !trimmedRemarks) {
    const error = new Error(`Remarks are required when changing status to '${upperTarget}'.`);
    error.statusCode = 400;
    throw error;
  }

  if (trimmedRemarks.length > 2000) {
    const error = new Error("Remarks exceed maximum allowed length of 2000 characters.");
    error.statusCode = 400;
    throw error;
  }

  return {
    targetStatus: upperTarget,
    remarks: trimmedRemarks || null,
  };
};

module.exports = {
  VALID_STATUSES,
  ALLOWED_TRANSITIONS,
  validateStatusTransition,
};
