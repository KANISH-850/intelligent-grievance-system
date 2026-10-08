const { handleChatbotMessage } = require("../services/chatbot.service");

/**
 * POST /api/v1/chatbot/message
 * Handles authenticated citizen chatbot requests.
 */
const postMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    const result = await handleChatbotMessage(userId, message);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  postMessage,
};
