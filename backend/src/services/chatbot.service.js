const { prisma } = require("../config/database");
const { processChatbotMessage } = require("./ai.service");

/**
 * Handles chatbot message processing for authenticated citizen.
 * Fetches citizen's grievances for strict database context isolation.
 *
 * @param {string} userId - Authenticated citizen user ID
 * @param {string} message - Raw message string
 * @param {Object} [sessionContext=null] - Optional lightweight conversation context
 */
const handleChatbotMessage = async (userId, message, sessionContext = null) => {
  if (!message || typeof message !== "string" || !message.trim()) {
    const error = new Error("Message text is required.");
    error.statusCode = 400;
    throw error;
  }

  // Fetch only the authenticated citizen's grievances to enforce RBAC data security
  const userGrievances = await prisma.grievance.findMany({
    where: { user_id: userId },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const aiResult = await processChatbotMessage(message.trim(), userGrievances, sessionContext);

  return {
    success: true,
    message: aiResult.message,
    language: aiResult.language || "English",
    intent: aiResult.intent || "UNKNOWN",
    grievance_number: aiResult.grievance_number || null,
    grievance: aiResult.grievance || null,
    confidence: typeof aiResult.confidence === "number" ? aiResult.confidence : 1.0,
    data: aiResult.data || {},
    session_context: aiResult.session_context || null,
    explanation_terms: aiResult.explanation_terms || [],
  };
};

module.exports = {
  handleChatbotMessage,
};
