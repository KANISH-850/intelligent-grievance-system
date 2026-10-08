const { prisma } = require("../config/database");
const { processChatbotMessage } = require("./ai.service");

/**
 * Handles chatbot message processing for authenticated citizen.
 * Fetches citizen's grievances for strict database context isolation.
 *
 * @param {string} userId - Authenticated citizen user ID
 * @param {string} message - Raw message string
 */
const handleChatbotMessage = async (userId, message) => {
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

  const aiResult = await processChatbotMessage(message.trim(), userGrievances);

  return {
    success: true,
    message: aiResult.message,
    language: aiResult.language,
    intent: aiResult.intent,
    grievance: aiResult.grievance || null,
  };
};

module.exports = {
  handleChatbotMessage,
};
