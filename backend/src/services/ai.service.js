const { AI_SERVICE_URL } = require("../config/env");

const FALLBACK_CATEGORIES = {
  "Water Supply": [
    /\b(?:water\s+(?:is\s+)?leak\w*|leak\w*\s+(?:from\s+(?:a\s+)?)?pipe\w*|pipe\w*\s+(?:is\s+)?leak\w*|pipeline\s+(?:is\s+)?leak\w*|burst\s+pipe\w*|pipe\w*\s+burst|burst\s+pipeline|pipeline\s+burst)\b/i,
    /\b(?:no\s+water|water\s+cut|water\s+supply\s+(?:disruption|cut|stopped)|without\s+water)\b/i,
    /\b(?:contaminated\s+water|dirty\s+water|yellow\s+water|water\s+smell\w*|water\s+contamination|foul\s+drinking\s+water)\b/i,
    /\b(?:water\s+tanker|tanker\s+not\s+arrived|tanker\s+delayed)\b/i,
    /\b(?:low\s+pressure\s+water|low\s+water\s+pressure|water\s+pressure\s+low)\b/i,
    /\b(?:borewell\s+(?:dry|broken|failed)|damaged\s+handpump)\b/i,
    /\b(?:water\s+supply|drinking\s+water|water\s+tap)\b/i,
  ],
  Electricity: [
    /\b(?:streetlights?\s+(?:is\s+|are\s+)?not\s+working|damaged\s+streetlights?|broken\s+streetlights?|unlit\s+streetlights?|streetlight\s+failure)\b/i,
    /\b(?:live\s+(?:electrical\s+)?wire|hanging\s+(?:electric|power)\s+wire|snapped\s+wire|exposed\s+wires?)\b/i,
    /\b(?:transformer\s+(?:fire|burnt|blast|smoking|burned|failure))\b/i,
    /\b(?:power\s+cut|power\s+outage|frequent\s+power\s+cuts?|blackout|no\s+power|no\s+electricity)\b/i,
    /\b(?:voltage\s+fluctuation|high\s+voltage|low\s+voltage)\b/i,
    /\b(?:electricity\s+bill|meter\s+running\s+fast|excessive\s+power\s+bill)\b/i,
  ],
  "Roads and Transport": [
    /\b(?:pothole|potholes|deep\s+pothole|large\s+pothole|craters?\s+on\s+road)\b/i,
    /\b(?:damaged\s+road(?:\s+surfaces?)?|broken\s+road|road\s+damage\w*|damaged\s+pavement|asphalt\s+damage|road\s+cave[- ]?in|broken\s+asphalt)\b/i,
    /\b(?:bridge\s+joint|damaged\s+bridge|bridge\s+vibrat\w+)\b/i,
    /\b(?:speed\s+breaker\s+(?:needed|broken|damaged|unmarked))\b/i,
    /\b(?:traffic\s+light\s+signal|traffic\s+signal\s+broken|signal\s+not\s+working|traffic\s+gridlock)\b/i,
    /\b(?:bus\s+route\s+\d+|bus\s+cancelled|bus\s+driver\s+rash|bus\s+service)\b/i,
  ],
  Healthcare: [
    /\b(?:primary\s+health\s+center|phc|government\s+hospital|district\s+hospital|hospital\s+ward)\b/i,
    /\b(?:doctor\s+absent|no\s+doctor|doctor\s+not\s+available|casualty\s+doctor)\b/i,
    /\b(?:emergency\s+medicines?|rabies\s+vaccine|lack\s+of\s+medicines?|no\s+medicines?)\b/i,
    /\b(?:ambulance\s+(?:108|not\s+arrived|delayed|helpline))\b/i,
  ],
  Education: [
    /\b(?:school\s+building|classroom\s+ceiling|falling\s+plaster|dilapidated\s+school)\b/i,
    /\b(?:toilets?\s+for\s+girl\s+students|school\s+toilet|no\s+functional\s+toilet\s+in\s+school)\b/i,
    /\b(?:stale\s+mid\s+day\s+meal|midday\s+meal\s+(?:poisoning|infection|unhygienic))\b/i,
    /\b(?:teacher\s+post\s+vacant|no\s+teacher|shortage\s+of\s+teachers?)\b/i,
  ],
  Sanitation: [
    /\b(?:garbage\s+(?:is\s+)?accumulat\w+|garbage\s+accumulation|accumulating\s+garbage|garbage\s+(?:is\s+)?dump\w*|garbage\s+pile|waste\s+dump\w*|overflowing\s+(?:dustbin|bin|garbage)|uncollected\s+garbage|garbage\s+not\s+collected)\b/i,
    /\b(?:open\s+sewage|sewage\s+overflow\w*|overflowing\s+sewage|sewer\s+overflow\w*|choked\s+drain\w*|blocked\s+drainage|drainage\s+overflow\w*|drain\s+overflow\w*)\b/i,
    /\b(?:public\s+toilet\s+(?:filthy|dirty|broken)|toilet\s+clean\w*\s+issue)\b/i,
    /\b(?:dead\s+(?:animal|dog|cow|cat)|carcass)\b/i,
    /\b(?:terrible\s+stench|stinking\s+badly|foul\s+odor|foul\s+smell\s+due\s+to\s+(?:garbage|waste))\b/i,
  ],
  "Municipal Services": [
    /\b(?:stray\s+dogs?|dog\s+pack|dog\s+bite|rabid\s+dog|dog\s+menace)\b/i,
    /\b(?:birth\s+certificate|death\s+certificate|delay\s+in\s+certificate)\b/i,
    /\b(?:property\s+tax\s+portal|property\s+tax\s+payment|property\s+tax\s+bill)\b/i,
    /\b(?:public\s+park|park\s+bench|bus\s+shelter\s+(?:vandalized|broken)|guardrail\s+damaged|dangerous\s+tree\s+branch)\b/i,
  ],
  Revenue: [
    /\b(?:patwari|patwari\s+demanding\s+bribe|land\s+mutation|khatauni)\b/i,
    /\b(?:land\s+survey|survey\s+measurement|boundary\s+dispute|revenue\s+inspector)\b/i,
    /\b(?:caste\s+and\s+income\s+certificate|income\s+certificate|caste\s+certificate)\b/i,
    /\b(?:government\s+revenue\s+land|illegal\s+land\s+grabbing|land\s+encroachment)\b/i,
  ],
};

const classifyFallbackCategory = (text) => {
  let bestCategory = "Other";
  let bestMatchCount = 0;

  for (const [category, patterns] of Object.entries(FALLBACK_CATEGORIES)) {
    const matchCount = patterns.filter((pattern) => pattern.test(text)).length;
    if (matchCount > bestMatchCount) {
      bestCategory = category;
      bestMatchCount = matchCount;
    }
  }

  return bestCategory;
};

const detectFallbackLanguage = (text) => {
  if (/[\u0b00-\u0b7f]/u.test(text)) return { language: "Odia", language_code: "or" };
  if (/[\u0b80-\u0bff]/u.test(text)) return { language: "Tamil", language_code: "ta" };
  if (/[\u0c00-\u0c7f]/u.test(text)) return { language: "Telugu", language_code: "te" };
  if (/[\u0c80-\u0cff]/u.test(text)) return { language: "Kannada", language_code: "kn" };
  if (/[\u0d00-\u0d7f]/u.test(text)) return { language: "Malayalam", language_code: "ml" };
  if (/[\u0a80-\u0aff]/u.test(text)) return { language: "Gujarati", language_code: "gu" };
  if (/[\u0a00-\u0a7f]/u.test(text)) return { language: "Punjabi", language_code: "pa" };
  if (/[\u0980-\u09ff]/u.test(text)) {
    if (/[\u09F0\u09F1]/u.test(text)) return { language: "Assamese", language_code: "as" };
    return { language: "Bengali", language_code: "bn" };
  }
  if (/[\u0900-\u097f]/u.test(text)) {
    if (/आहे|नाही|च्या|चे|मध्ये|पाणी|रस्ता/u.test(text)) return { language: "Marathi", language_code: "mr" };
    return { language: "Hindi", language_code: "hi" };
  }
  if (/[\u0600-\u06ff]/u.test(text)) return { language: "Urdu", language_code: "ur" };
  if (/[\u3040-\u309f\u30a0-\u30ff]/u.test(text)) return { language: "Japanese", language_code: "ja" };
  if (/[\u4e00-\u9fff]/u.test(text)) return { language: "Chinese (Simplified)", language_code: "zh" };
  return /[a-z]/i.test(text) ? { language: "English", language_code: "en" } : { language: "Unknown", language_code: "und" };
};

const createFallbackAnalysis = (text) => {
  const { language, language_code } = detectFallbackLanguage(text);
  const translatable = language === "English";
  const category = translatable ? classifyFallbackCategory(text) : "Other";
  return {
    language,
    language_code,
    translated_text: text,
    translation_status: translatable ? "passthrough" : "unavailable",
    translation_method: translatable ? "native_english_passthrough" : "provider_unavailable",
    translation_error: translatable ? null : "Translation provider unavailable",
    translated_at: translatable ? new Date() : null,
    category,
    category_confidence: null,
    confidence_level: "LOW",
    ai_review_required: true,
    classification_method: "backend_keyword_fallback",
    model_used: "none",
    explanation_terms: [],
    priority: /(?:life[- ]threatening|electrocution|fatal|collapsed|collapse|emergency|urgent)/i.test(text)
      ? "CRITICAL"
      : /(?:no water|no electricity|outage|without water|without power|days|week|accident|severe)/i.test(text)
        ? "HIGH"
        : "MEDIUM",
    priority_confidence: null,
    department: category,
    departments: (() => {
      if (!translatable) {
        return [
          {
            department_name: category,
            category,
            confidence: null,
            reason: "Routed to Other pending human translation and review",
            source: "text",
          },
        ];
      }
      const depts = [];
      const seen = new Set();
      // Primary category first
      depts.push({
        department_name: category,
        category,
        confidence: null,
        reason: `Primary routing to ${category} from keyword detection`,
        source: "text",
      });
      seen.add(category);

      // Check all other categories for defect patterns
      for (const [catName, patterns] of Object.entries(FALLBACK_CATEGORIES)) {
        if (!seen.has(catName)) {
          const match = patterns.some((pattern) => pattern.test(text));
          if (match) {
            depts.push({
              department_name: catName,
              category: catName,
              confidence: null,
              reason: `Secondary routing to ${catName} from defect pattern detection`,
              source: "text",
            });
            seen.add(catName);
          }
        }
      }
      return depts;
    })(),
    processing_time_ms: 0,
  };
};

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
      if (response.status >= 500 || response.status === 429) {
        console.warn("AI Service unavailable; submitting with local keyword analysis for human review.");
        return createFallbackAnalysis(text);
      }

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
      console.warn("Submitting with local keyword analysis for human review.");
      return createFallbackAnalysis(text);
    }

    const category_confidence = typeof data.category_confidence === "number" ? data.category_confidence : null;
    const confidence_level = data.confidence_level || (category_confidence >= 0.75 ? "HIGH" : category_confidence >= 0.50 ? "MEDIUM" : "LOW");
    const ai_review_required = typeof data.ai_review_required === "boolean" ? data.ai_review_required : (category_confidence < 0.75);
    const classification_method = data.classification_method || "tfidf_logistic_regression";
    const model_used = data.model_used || "tfidf-logistic-regression";
    const explanation_terms = Array.isArray(data.explanation?.top_terms) ? data.explanation.top_terms : [];

    return {
      language: data.language,
      language_code: data.language_code || (data.language === "English" ? "en" : null),
      translated_text: data.translated_text,
      translation_status: data.translation_status || (data.language === "English" ? "passthrough" : "unavailable"),
      translation_method: data.translation_method || null,
      translation_error: data.translation_error || null,
      translated_at: data.translated_at ? new Date(data.translated_at) : (data.translation_status === "translated" ? new Date() : null),
      category: data.category,
      category_confidence,
      confidence_level,
      ai_review_required,
      classification_method,
      model_used,
      explanation_terms,
      priority: data.priority,
      priority_confidence: typeof data.priority_confidence === "number" ? data.priority_confidence : null,
      department: data.department,
      departments: Array.isArray(data.departments) ? data.departments : [
        {
          department_name: data.department,
          category: data.category,
          confidence: category_confidence,
          reason: `Routed to ${data.department} via ${classification_method}`,
          source: "text",
        },
      ],
      processing_time_ms: typeof data.processing_time_ms === "number" ? data.processing_time_ms : 0,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.statusCode) {
      throw error;
    }

    console.warn("AI Service communication failure; submitting with local keyword analysis for human review:", error.message);
    return createFallbackAnalysis(text);
  }
};

const analyzeImageFromBase64 = async (image_base64, mimeType) => {
  const url = `${AI_SERVICE_URL}/analyze-image`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64, mime_type: mimeType }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Vision service returned ${response.status}`);
    const result = await response.json();
    if (!result || typeof result.analysis_status !== "string") throw new Error("Invalid vision response");

    const visualObs = Array.isArray(result.visual_observations)
      ? result.visual_observations
      : (Array.isArray(result.observations) ? result.observations : []);

    return {
      analysis_status: result.analysis_status || "unavailable",
      image_type: result.image_type || "uncertain",
      is_grievance_related: Boolean(result.is_grievance_related),
      issue_detected: Boolean(result.issue_detected),
      detected_issue: result.detected_issue || null,
      issue_description: result.issue_description || result.image_description || null,
      image_description: result.image_description || result.issue_description || null,
      recommended_category: result.recommended_category || null,
      recommended_department: result.recommended_department || null,
      additional_departments: Array.isArray(result.additional_departments) ? result.additional_departments : [],
      visual_observations: visualObs,
      observations: visualObs,
      confidence: typeof result.confidence === "number" ? result.confidence : null,
      confidence_level: result.confidence_level || (typeof result.confidence === "number" ? (result.confidence >= 0.70 ? "HIGH" : result.confidence >= 0.40 ? "MEDIUM" : "LOW") : "LOW"),
      predicted_class: result.predicted_class || null,
      human_review_required: result.human_review_required !== false,
      review_reason: result.review_reason || null,
      citizen_message: result.citizen_message || null,
      model_name: result.model_name || "MobileNetV3-Small-Civic",
      model_version: result.model_version || "1.0.0",
      inference_latency_ms: typeof result.inference_latency_ms === "number" ? result.inference_latency_ms : null,
    };
  } catch (error) {
    console.warn("Image analysis unavailable:", error.message);
    return {
      analysis_status: "unavailable",
      image_type: "uncertain",
      is_grievance_related: false,
      issue_detected: false,
      detected_issue: null,
      issue_description: null,
      image_description: null,
      recommended_category: null,
      recommended_department: null,
      additional_departments: [],
      visual_observations: [],
      observations: [],
      confidence: null,
      confidence_level: "LOW",
      predicted_class: null,
      human_review_required: true,
      review_reason: `AI vision service unavailable: ${error.message}`,
      citizen_message: "AI vision service is currently unavailable. Your image will be reviewed by an officer.",
      model_name: "MobileNetV3-Small-Civic",
      model_version: "1.0.0",
      inference_latency_ms: null,
    };
  }
};

const analyzeImage = async (filePath, mimeType) => {
  const fs = require("fs");
  try {
    const image_base64 = await fs.promises.readFile(filePath, { encoding: "base64" });
    return await analyzeImageFromBase64(image_base64, mimeType);
  } catch (error) {
    console.warn("Failed reading image file for analysis:", error.message);
    return {
      analysis_status: "unavailable",
      image_type: "uncertain",
      is_grievance_related: false,
      issue_detected: false,
      detected_issue: null,
      issue_description: null,
      image_description: null,
      recommended_category: null,
      recommended_department: null,
      additional_departments: [],
      visual_observations: [],
      observations: [],
      confidence: null,
      confidence_level: "LOW",
      predicted_class: null,
      human_review_required: true,
      review_reason: `Failed reading image file: ${error.message}`,
      citizen_message: "Failed to read image file on server.",
      model_name: "MobileNetV3-Small-Civic",
      model_version: "1.0.0",
      inference_latency_ms: null,
    };
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
      if (!data || typeof data.message !== "string" || !data.message.trim()) {
        throw new Error("AI chatbot returned an invalid response");
      }
      return {
        message: data.message,
        language: data.language || "English",
        intent: data.intent || "UNKNOWN",
        grievance_number: data.grievance_number || null,
        grievance: data.grievance || null,
        confidence: typeof data.confidence === "number" ? data.confidence : null,
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
  let grvNum = grvMatch ? grvMatch[1].toUpperCase() : null;

  if (!grvNum && sessionContext?.last_grievance_number) {
    if (/\b(it|this|that|complaint|grievance|status|department|handling|handler|who|when|why)\b/i.test(message)) {
      grvNum = sessionContext.last_grievance_number;
    }
  }

  if (grvNum) {
    const found = userGrievances.find((g) => g.grievance_number === grvNum);
    if (found) {
      const dept = found.department?.name || found.category || "Assigned Department";
      const isDeptQuery = /\b(department|who handles|who is handling|which dept|handling|handler|assigned)\b/i.test(message);
      const isDateQuery = /\b(when|submitted|date|created)\b/i.test(message);
      const isWhyQuery = /\b(why|explain|how category|classified)\b/i.test(message);

      let replyMsg = `Your grievance ${found.grievance_number} is currently ${found.status}. Assigned to ${dept}.`;
      let replyIntent = "GRIEVANCE_STATUS";

      if (isDeptQuery) {
        replyMsg = `Your grievance ${found.grievance_number} is assigned to the ${dept} department. Current status: '${found.status}' (Category: ${found.category}).`;
        replyIntent = "GRIEVANCE_DETAILS";
      } else if (isDateQuery) {
        replyMsg = `Grievance ${found.grievance_number} was submitted on ${found.created_at}. Current status is '${found.status}' under department '${dept}'.`;
        replyIntent = "GRIEVANCE_DETAILS";
      } else if (isWhyQuery) {
        replyMsg = `Your grievance ${found.grievance_number} was classified as ${found.category} based on detected complaint terms.`;
        replyIntent = "GRIEVANCE_DETAILS";
      }

      return {
        message: replyMsg,
        language: "English",
        intent: replyIntent,
        grievance_number: found.grievance_number,
        grievance: {
          grievance_number: found.grievance_number,
          status: found.status,
          department: dept,
          category: found.category,
        },
        confidence: null,
        data: { grievance: found },
        session_context: { last_grievance_number: found.grievance_number },
        explanation_terms: found.ai_explanation_terms || [],
      };
    } else {
      return {
        message: `No grievance record with reference ${grvNum} was found under your account. For privacy and security, citizens can only query their own complaints.`,
        language: "English",
        intent: "GRIEVANCE_STATUS",
        grievance_number: grvNum,
        grievance: null,
        confidence: null,
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
        confidence: null,
        data: {},
        session_context: sessionContext,
        explanation_terms: [],
      };
    }
    const listStr = userGrievances.map((g) => `• ${g.grievance_number} [${g.status}]`).join("\n");
    const firstG = userGrievances[0];
    const deptName = firstG.department?.name || firstG.category || "Assigned Department";
    return {
      message: `You have ${userGrievances.length} registered grievance(s):\n${listStr}`,
      language: "English",
      intent: "LIST_GRIEVANCES",
      grievance_number: firstG.grievance_number,
      grievance: {
        grievance_number: firstG.grievance_number,
        status: firstG.status,
        department: deptName,
        category: firstG.category,
      },
      confidence: null,
      data: { count: userGrievances.length },
      session_context: { last_grievance_number: firstG.grievance_number },
      explanation_terms: firstG.ai_explanation_terms || [],
    };
  }

  const msgLower = message.toLowerCase();

  if (/^(hi|hello|namaste|hey|greetings)/i.test(msgLower)) {
    return {
      message: "Namaste! Welcome to the Central Government Grievance Assistance AI. You can check grievance status, ask about departments, or inquire about filing guidance.",
      language: "English",
      intent: "GREETING",
      grievance_number: null,
      grievance: null,
      confidence: null,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  if (/tracking|where to track|how to track|track my|track grievance|tracking id|number format/i.test(msgLower)) {
    return {
      message: "Every submitted grievance receives a tracking reference number formatted as `GRV-YYYY-XXXXXX` (e.g., `GRV-2026-000001`). You can type your reference number directly in this chat or visit 'My Grievances' to track real-time progress.",
      language: "English",
      intent: "TRACKING_GUIDANCE",
      grievance_number: null,
      grievance: null,
      confidence: null,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  if (/process|workflow|how it works|how system work|how does this system work|architecture/i.test(msgLower)) {
    return {
      message: "The 9-step automated grievance workflow is:\n1. Citizen Submits Grievance\n2. Language Detection\n3. Text Preprocessing\n4. AI Category Classification\n5. Priority Prediction\n6. Department Routing & Automated Dispatch\n7. Officer Review\n8. Status Updates\n9. Citizen Notifications",
      language: "English",
      intent: "PROCESS_INFORMATION",
      grievance_number: null,
      grievance: null,
      confidence: null,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  if (/priority|critical|urgency|severity|how priority/i.test(msgLower)) {
    return {
      message: "Grievances are assigned one of 4 priority levels:\n• CRITICAL: Emergencies, life safety, hospital failures.\n• HIGH: Severe disruptions, major water/power outages.\n• MEDIUM: Routine issues, regular outages.\n• LOW: Non-urgent requests, general feedback.",
      language: "English",
      intent: "PRIORITY_INFORMATION",
      grievance_number: null,
      grievance: null,
      confidence: null,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  if (/department|who handles|ministry|which dept|electricity|water supply/i.test(msgLower)) {
    return {
      message: "The framework dispatches grievances to 9 government departments: Water Supply, Electricity, Roads and Transport, Healthcare, Education, Sanitation, Municipal Services, Revenue, and Other.",
      language: "English",
      intent: "DEPARTMENT_INFORMATION",
      grievance_number: null,
      grievance: null,
      confidence: null,
      data: {},
      session_context: sessionContext,
      explanation_terms: [],
    };
  }

  if (/how (can|do) i submit|submit a complaint|how to file|file a complaint/i.test(msgLower)) {
    return {
      message: "To submit a new public grievance, navigate to 'Submit Grievance' in the portal sidebar. You can type in any of the 11 supported Indian languages.",
      language: "English",
      intent: "SUBMIT_GRIEVANCE_GUIDANCE",
      grievance_number: null,
      grievance: null,
      confidence: null,
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
      confidence: null,
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
    confidence: null,
    data: {},
    session_context: sessionContext,
    explanation_terms: [],
  };
};

/**
 * Preview language detection and English translation for interactive citizen feedback.
 * @param {string} text Raw grievance text
 * @returns {Promise<Object>} Language and translation metadata
 */
const previewTranslation = async (text) => {
  if (!text || !text.trim()) {
    return {
      original_text: text || "",
      detected_language: "Unknown",
      detected_language_code: "und",
      translated_text: "",
      translation_status: "failed",
      translation_method: "empty_input",
      translation_error: "Input text is empty",
      translated_at: null,
      confidence: 0.0,
      is_mixed: false,
    };
  }

  const url = `${AI_SERVICE_URL}/translate`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("AI Service /translate preview unavailable; using fallback detection.");
  }

  // Fallback if AI Service is unreachable
  const { language, language_code } = detectFallbackLanguage(text);
  const isEnglish = language === "English";
  return {
    original_text: text,
    detected_language: language,
    detected_language_code: language_code,
    translated_text: text,
    translation_status: isEnglish ? "passthrough" : "unavailable",
    translation_method: isEnglish ? "native_english_passthrough" : "provider_offline_fallback",
    translation_error: isEnglish ? null : "Translation service temporarily unreachable",
    translated_at: new Date().toISOString(),
    confidence: 0.85,
    is_mixed: false,
  };
};

module.exports = {
  analyzeGrievance,
  previewTranslation,
  analyzeImage,
  analyzeImageFromBase64,
  processChatbotMessage,
};


