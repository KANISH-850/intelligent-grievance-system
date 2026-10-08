const { AI_SERVICE_URL } = require("../config/env");

/**
 * Communicates with the external Python AI Microservice (/analyze endpoint).
 *
 * @param {string} text - Raw grievance text to analyze
 * @returns {Promise<Object>} Normalized AI classification result
 */
const analyzeGrievance = async (text) => {
  const url = `${AI_SERVICE_URL}/analyze`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`AI Service HTTP error ${response.status}: ${errorBody}`);
      const error = new Error("AI grievance analysis service is currently unavailable");
      error.statusCode = 503;
      throw error;
    }

    const data = await response.json();

    // Validate expected structure from AI Service
    if (
      !data ||
      typeof data.language !== "string" ||
      typeof data.translated_text !== "string" ||
      typeof data.category !== "string" ||
      typeof data.priority !== "string" ||
      typeof data.department !== "string"
    ) {
      console.error("AI Service returned invalid schema:", data);
      const error = new Error("AI grievance analysis service returned invalid response format");
      error.statusCode = 503;
      throw error;
    }

    const category_confidence = typeof data.category_confidence === "number" ? data.category_confidence : 1.0;
    const confidence_level = data.confidence_level || (category_confidence >= 0.75 ? "HIGH" : category_confidence >= 0.50 ? "MEDIUM" : "LOW");
    const ai_review_required = typeof data.ai_review_required === "boolean" ? data.ai_review_required : (category_confidence < 0.75);
    const classification_method = data.classification_method || "tfidf_logistic_regression";
    const model_used = data.model_used || "tfidf-logistic-regression";
    const explanation_terms = Array.isArray(data.explanation?.top_terms) ? data.explanation.top_terms : [];

    return {
      language: data.language,
      translated_text: data.translated_text,
      category: data.category,
      category_confidence,
      confidence_level,
      ai_review_required,
      classification_method,
      model_used,
      explanation_terms,
      priority: data.priority,
      priority_confidence: typeof data.priority_confidence === "number" ? data.priority_confidence : 1.0,
      department: data.department,
      processing_time_ms: typeof data.processing_time_ms === "number" ? data.processing_time_ms : 0,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.statusCode) {
      throw error;
    }

    console.error("AI Service communication failure:", error.message);
    const serviceError = new Error("AI grievance analysis service is currently unavailable");
    serviceError.statusCode = 503;
    throw serviceError;
  }
};

/**
 * Communicates with the external Python AI Microservice (/chatbot/process endpoint).
 * Fallback to Node.js intent parser if AI service is unavailable.
 *
 * @param {string} message - Raw citizen query
 * @param {Array} userGrievances - Authenticated citizen's grievances from DB
 * @param {Object} [sessionContext=null] - Lightweight conversation context
 * @returns {Promise<Object>} Chatbot response
 */
const processChatbotMessage = async (message, userGrievances = [], sessionContext = null) => {
  const url = `${AI_SERVICE_URL}/chatbot/process`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        user_grievances: userGrievances,
        session_context: sessionContext,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        message: data.message,
        language: data.language || "English",
        intent: data.intent || "UNKNOWN",
        grievance_number: data.grievance_number || null,
        grievance: data.grievance || null,
        confidence: typeof data.confidence === "number" ? data.confidence : 1.0,
        data: data.data || {},
        session_context: data.session_context || null,
        explanation_terms: Array.isArray(data.explanation_terms) ? data.explanation_terms : [],
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("AI Chatbot Microservice offline or timed out, using backend fallback processing:", err.message);
  }

  // Fallback backend chatbot processor (preserves functionality if AI microservice fails)
  const grvMatch = message.match(/\b(GRV-?\d{4}-?\d{6}|GRV-[A-Z0-9]+)\b/i);
  if (grvMatch) {
    const grvNum = grvMatch[1].toUpperCase();
    const found = userGrievances.find((g) => g.grievance_number === grvNum);
    if (found) {
      const dept = found.department?.name || found.category || "Assigned Department";
      return {
        message: `Your grievance ${found.grievance_number} is currently ${found.status}. Assigned to ${dept}.`,
        language: "English",
        intent: "GRIEVANCE_STATUS",
        grievance_number: found.grievance_number,
        grievance: {
          grievance_number: found.grievance_number,
          status: found.status,
          department: dept,
          category: found.category,
        },
        confidence: 0.95,
        data: { grievance: found },
        session_context: { last_grievance_number: found.grievance_number },
        explanation_terms: [],
      };
    } else {
      return {
        message: `No grievance record with reference ${grvNum} was found under your account. For privacy and security, citizens can only query their own complaints.`,
        language: "English",
        intent: "GRIEVANCE_STATUS",
        grievance_number: grvNum,
        grievance: null,
        confidence: 0.9,
        data: {},
        session_context: sessionContext,
        explanation_terms: [],
      };
    }
  }

  if (/my grievance|my complaint|list my|show all/i.test(message)) {
    if (userGrievances.length === 0) {
      return {
        message: "You currently have no registered grievances in the system.",
        language: "English",
        intent: "LIST_GRIEVANCES",
        grievance_number: null,
        grievance: null,
        confidence: 0.9,
        data: {},
        session_context: sessionContext,
        explanation_terms: [],
      };
    }
    const listStr = userGrievances.map((g) => `• ${g.grievance_number} [${g.status}]`).join("\n");
    return {
      message: `You have ${userGrievances.length} registered grievance(s):\n${listStr}`,
      language: "English",
      intent: "LIST_GRIEVANCES",
      grievance_number: userGrievances[0].grievance_number,
      grievance: userGrievances[0],
      confidence: 0.9,
      data: { count: userGrievances.length },
      session_context: { last_grievance_number: userGrievances[0].grievance_number },
      explanation_terms: [],
    };
  }

  const msgLower = message.toLowerCase();

  if (/^(hi|hello|namaste|hey|greetings)/i.test(msgLower)) {
    return {
      message: "Namaste! Welcome to the Central Government Grievance Assistance AI.",
      language: "English",
      intent: "GREETING",
      grievance_number: null,
      grievance: null,
      confidence: 0.95,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  if (/department|who handles|ministry|which dept|electricity|water supply/i.test(msgLower)) {
    return {
      message: "The framework dispatches grievances to 9 government departments including Electricity, Water Supply, Healthcare, Roads and Transport, etc.",
      language: "English",
      intent: "DEPARTMENT_INFORMATION",
      grievance_number: null,
      grievance: null,
      confidence: 0.92,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  if (/how (can|do) i submit|submit a complaint|how to file|file a complaint/i.test(msgLower)) {
    return {
      message: "To submit a new public grievance, navigate to 'Submit Grievance' in the portal sidebar.",
      language: "English",
      intent: "SUBMIT_GRIEVANCE_GUIDANCE",
      grievance_number: null,
      grievance: null,
      confidence: 0.92,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  if (/cricket|football|match|weather|movie|who won/i.test(msgLower)) {
    return {
      message: "I don't have enough information to answer that. I can assist you with submitting a grievance or tracking a complaint.",
      language: "English",
      intent: "UNKNOWN",
      grievance_number: null,
      grievance: null,
      confidence: 0.5,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  return {
    message: "Welcome to the Intelligent Multilingual Grievance AI Assistant. You can ask for grievance status (e.g., 'Status of GRV-2026-000003'), list your complaints, or get filing guidance.",
    language: "English",
    intent: "HELP",
    grievance_number: null,
    grievance: null,
    confidence: 1.0,
    data: {},
    session_context: sessionContext,
    explanation_terms: [],
  };
};

module.exports = {
  analyzeGrievance,
  processChatbotMessage,
};
