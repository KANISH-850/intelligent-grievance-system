import re
import time
import logging
from typing import Dict, Any, Optional, List
from app.schemas.chatbot import ChatbotRequest, ChatbotResponse, ChatbotGrievanceDetail
from app.services.language_detector import language_detector_service
from app.services.translator import translator_service

logger = logging.getLogger("ai_service.chatbot")

DEPARTMENT_KNOWLEDGE = {
    "Water Supply": {
        "code": "WS",
        "description": "Handles public water pipelines, water supply cuts, contamination, drinking water quality, sewage leakage, and water billing disputes.",
        "examples": ["No water supply in street", "Dirty/contaminated drinking water", "Burst water pipe", "Sewage line overflow"]
    },
    "Electricity": {
        "code": "ELEC",
        "description": "Handles power outages, voltage fluctuations, transformer sparks, damaged electric poles, streetlights, and smart meter billing issues.",
        "examples": ["Frequent power cuts", "Transformer spark/fire", "Low voltage", "Streetlights not working"]
    },
    "Roads and Transport": {
        "code": "RT",
        "description": "Handles road repairs, potholes, bus service cancellations, traffic signals, speed breakers, footpaths, and highway maintenance.",
        "examples": ["Dangerous road potholes", "Traffic light signal out of order", "Public bus route cancelled", "Bridge damage"]
    },
    "Healthcare": {
        "code": "HC",
        "description": "Handles government hospitals, primary health centers (PHC), medicine shortages, doctor availability, hygiene, and ambulance services.",
        "examples": ["Medicine shortage in hospital", "Doctor absent on casualty duty", "108 Ambulance delay", "Hospital hygiene issues"]
    },
    "Education": {
        "code": "EDU",
        "description": "Handles government schools, teacher vacancies, classroom building maintenance, mid-day meal quality, textbooks, and RTE admissions.",
        "examples": ["Leaking school building roof", "Mid-day meal quality issue", "Teacher vacancy", "No girl student toilets"]
    },
    "Sanitation": {
        "code": "SAN",
        "description": "Handles community dustbins, door-to-door waste collection, public toilet cleanliness, mosquito breeding control, and drain clearing.",
        "examples": ["Garbage bin overflow", "Door-to-door waste collector absent", "Filthy public toilet", "Stagnant water mosquito risk"]
    },
    "Municipal Services": {
        "code": "MS",
        "description": "Handles birth/death certificates, property tax online portal errors, stray dog menace, tree branch trimming, and building plan approvals.",
        "examples": ["Delay in birth certificate", "Stray dog pack menace", "Property tax payment error", "Tree trimming request"]
    },
    "Revenue": {
        "code": "REV",
        "description": "Handles land records (Khatauni/Patta), revenue officer land surveys, caste/income/domicile certificates, and property stamp duty.",
        "examples": ["Patwari land mutation delay", "Caste certificate issuance delay", "Land survey measurement error", "Encroachment on revenue land"]
    },
    "Other": {
        "code": "OTH",
        "description": "Handles general public services, ration cards, LPG gas refill delays, senior citizen pensions, cyber fraud complaints, and RTI inquiries.",
        "examples": ["LPG cylinder delivery delay", "Pension payment delayed", "Ration card member addition", "Cyber fraud reporting"]
    }
}

class ChatbotService:
    """
    Intent-based Multilingual Citizen Assistance Chatbot Service (Phase 12).
    Supports explicit intent classification, natural language grievance extraction,
    bounded session context recall, department knowledge, process guidance, XAI explanation,
    and safe non-hallucinating responses.
    """

    def process_message(self, request: ChatbotRequest) -> ChatbotResponse:
        start_time = time.perf_counter()
        message = request.message.strip()
        user_grievances = request.user_grievances or []
        session_ctx = request.session_context or {}

        # 1. Language Detection
        lang_result = language_detector_service.detect_language(message)
        detected_language = lang_result.get("language", "English")

        # 2. Grievance Number Extraction (Regex pattern: GRV-YYYY-XXXXXX or GRVYYYYXXXXXX)
        grv_pattern = re.compile(r'\b(GRV-?\d{4}-?\d{6})\b', re.IGNORECASE)
        match = grv_pattern.search(message)

        matched_grv_number = None
        if match:
            raw_matched = match.group(1).upper()
            if "-" not in raw_matched and len(raw_matched) == 13:
                matched_grv_number = f"{raw_matched[:3]}-{raw_matched[3:7]}-{raw_matched[7:]}"
            else:
                matched_grv_number = raw_matched

        msg_lower = message.lower()
        intent = "UNKNOWN"
        intent_confidence = 0.90
        response_text = ""
        grievance_detail: Optional[ChatbotGrievanceDetail] = None
        explanation_terms: List[str] = []

        # Contextual recall from session memory if explicit pronouns are used without new GRV number
        if not matched_grv_number and session_ctx.get("last_grievance_number"):
            if any(kw in msg_lower for kw in ["it", "this complaint", "the complaint", "when was it", "why classified"]):
                matched_grv_number = session_ctx.get("last_grievance_number")

        # --- INTENT CLASSIFICATION ENGINE ---

        # 1. GREETING INTENT
        if any(re.search(r'\b' + kw + r'\b', msg_lower) for kw in ["hi", "hello", "namaste", "hey", "good morning", "good afternoon", "greetings"]):
            intent = "GREETING"
            intent_confidence = 0.95
            response_text = (
                "Namaste! Welcome to the Central Government Grievance Assistance AI. "
                "I can help you check grievance status (e.g., 'Status of GRV-2026-000001'), "
                "explain department routing, guide you through filing a complaint, or answer process questions."
            )

        # 2. PRIORITY INFORMATION INTENT
        elif any(kw in msg_lower for kw in ["priority", "critical", "urgency", "severity", "how priority"]):
            intent = "PRIORITY_INFORMATION"
            intent_confidence = 0.90
            response_text = (
                "Grievances are assigned one of 4 priority levels:\n"
                "• **CRITICAL:** Life-threatening emergencies, fire, gas leaks, hospital ICU failures, toxic leaks.\n"
                "• **HIGH:** Severe infrastructure damage, major water/power outages, broken roads.\n"
                "• **MEDIUM:** Routine service disruptions, regular billing inquiries, unannounced outages.\n"
                "• **LOW:** Non-urgent requests, certificate updates, general feedback."
            )

        # 3. PROCESS INFORMATION INTENT
        elif any(kw in msg_lower for kw in ["process", "workflow", "how it works", "how system work", "how does this system work", "architecture", "what happens after"]):
            intent = "PROCESS_INFORMATION"
            intent_confidence = 0.92
            response_text = (
                "The 9-step automated grievance workflow is:\n"
                "1. Citizen Submits Grievance\n"
                "2. Language Detection\n"
                "3. Text Preprocessing\n"
                "4. AI Category Classification (TF-IDF + Logistic Regression)\n"
                "5. Priority Prediction & Urgency Analysis\n"
                "6. Department Routing & Database Dispatch\n"
                "7. Department Officer Review\n"
                "8. Status Updates (Submitted → In Progress → Resolved/Rejected)\n"
                "9. In-App Citizen Notifications"
            )

        # 4. TRACKING GUIDANCE INTENT
        elif any(kw in msg_lower for kw in ["tracking guidance", "where to track", "how to track", "tracking id", "number format"]):
            intent = "TRACKING_GUIDANCE"
            intent_confidence = 0.90
            response_text = (
                "Every submitted grievance receives a tracking reference number formatted as `GRV-YYYY-XXXXXX` (e.g., `GRV-2026-000001`).\n"
                "You can type your reference number directly in this chat or visit 'My Grievances' to track real-time progress."
            )

        # 5. SUBMIT GRIEVANCE GUIDANCE INTENT
        elif any(kw in msg_lower for kw in ["how can i submit", "how do i submit", "how to submit", "how to file", "submit a complaint", "file a complaint", "lodge a complaint", "register a complaint"]):
            intent = "SUBMIT_GRIEVANCE_GUIDANCE"
            intent_confidence = 0.92
            response_text = (
                "To submit a new public grievance:\n"
                "1. Go to 'Submit Grievance' in the portal sidebar.\n"
                "2. Type your grievance in any supported language (English, Hindi, Tamil, Telugu, Kannada, Malayalam, etc.).\n"
                "3. The system automatically processes language, predicts category & priority, and routes your complaint to the responsible Central/State Department.\n"
                "4. You will receive a unique reference tracking ID (e.g., GRV-2026-000001)."
            )

        # 6. DEPARTMENT INFORMATION INTENT
        elif any(kw in msg_lower for kw in ["department", "who handles", "ministry", "which dept", "water supply department", "electricity department"]):
            intent = "DEPARTMENT_INFORMATION"
            intent_confidence = 0.92
            
            matched_dept = None
            for d_name, info in DEPARTMENT_KNOWLEDGE.items():
                if d_name.lower() in msg_lower or info["code"].lower() in msg_lower:
                    matched_dept = (d_name, info)
                    break
            
            if matched_dept:
                d_name, info = matched_dept
                ex_str = ", ".join(info["examples"])
                response_text = (
                    f"The **{d_name} ({info['code']})** department handles: {info['description']}\n\n"
                    f"**Typical Complaints:** {ex_str}"
                )
            else:
                dept_names = ", ".join(DEPARTMENT_KNOWLEDGE.keys())
                response_text = (
                    f"The framework dispatches grievances to 9 government departments:\n{dept_names}.\n\n"
                    "Ask about any specific department (e.g., 'What does Healthcare handle?') for more details."
                )

        # 7. HELP INTENT
        elif msg_lower == "help" or any(kw in msg_lower for kw in ["help me", "what can you do", "options", "commands", "assistance"]):
            intent = "HELP"
            intent_confidence = 0.95
            response_text = (
                "Here is how I can assist you:\n"
                "1. **Check Status:** Type `Status of GRV-2026-000001` or `My grievances`\n"
                "2. **Filing Guidance:** Ask `How do I submit a complaint?`\n"
                "3. **Departments:** Ask `Which department handles electricity?`\n"
                "4. **Process:** Ask `How does the grievance workflow work?`\n"
                "5. **Priority Info:** Ask `What is critical priority?`"
            )

        # 8. GRIEVANCE STATUS & DETAILS INTENT
        elif matched_grv_number or any(kw in msg_lower for kw in ["my grievance", "my complaint", "list my", "show my", "status of my", "where is my grievance", "when was it", "all my grievances"]):
            if matched_grv_number:
                intent = "GRIEVANCE_DETAILS" if any(kw in msg_lower for kw in ["detail", "why", "when", "submitted"]) else "GRIEVANCE_STATUS"
                intent_confidence = 0.95

                found_grievance = None
                for g in user_grievances:
                    g_num = str(g.get("grievance_number", "")).upper()
                    if g_num == matched_grv_number:
                        found_grievance = g
                        break

                if found_grievance:
                    dept_obj = found_grievance.get("department")
                    dept_name = dept_obj.get("name") if isinstance(dept_obj, dict) else (found_grievance.get("department") or "Assigned Department")
                    status = found_grievance.get("status", "SUBMITTED")
                    category = found_grievance.get("category", "General")
                    created_at = str(found_grievance.get("created_at", ""))
                    conf = found_grievance.get("ai_confidence")
                    terms = found_grievance.get("explanation_terms") or found_grievance.get("ai_explanation_terms", [])
                    explanation_terms = terms if isinstance(terms, list) else []

                    grievance_detail = ChatbotGrievanceDetail(
                        grievance_number=found_grievance.get("grievance_number", matched_grv_number),
                        status=status,
                        department=dept_name,
                        category=category,
                        created_at=created_at,
                        ai_confidence=conf,
                        ai_explanation_terms=explanation_terms
                    )

                    # Update session memory
                    session_ctx["last_grievance_number"] = grievance_detail.grievance_number

                    if any(kw in msg_lower for kw in ["why", "explain", "how category", "classified"]):
                        term_str = ", ".join([f"'{t}'" for t in (explanation_terms or ["category keywords"])])
                        response_text = (
                            f"Your grievance {grievance_detail.grievance_number} was classified as {category} "
                            f"because terms related to {category} were detected in the complaint ({term_str})."
                        )
                    elif any(kw in msg_lower for kw in ["when", "submitted", "date"]):
                        response_text = (
                            f"Grievance {grievance_detail.grievance_number} was submitted on {created_at}. "
                            f"Current status is '{status}' under department '{dept_name}'."
                        )
                    else:
                        response_text = (
                            f"Your grievance {grievance_detail.grievance_number} is currently {status}. "
                            f"Assigned to {dept_name}."
                        )
                else:
                    intent = "GRIEVANCE_STATUS"
                    intent_confidence = 0.85
                    response_text = (
                        f"No grievance record with reference {matched_grv_number} was found under your account. "
                        "For privacy and security, citizens can only query their own complaints."
                    )
            else:
                intent = "LIST_GRIEVANCES" if any(kw in msg_lower for kw in ["list", "show", "all my", "my complaints", "my grievances"]) else "GRIEVANCE_STATUS"
                intent_confidence = 0.90
                if not user_grievances:
                    response_text = "You currently have no registered grievances under your account. You can file a new grievance from the 'Submit Grievance' page."
                else:
                    count = len(user_grievances)
                    items = []
                    for g in user_grievances[:5]:
                        g_num = g.get("grievance_number")
                        g_status = g.get("status")
                        g_cat = g.get("category")
                        items.append(f"• {g_num} [{g_cat}] - {g_status}")
                    
                    response_text = f"You have {count} registered grievance(s):\n" + "\n".join(items)
                    if count > 5:
                        response_text += f"\n...and {count - 5} more. View all under 'My Grievances'."

        # 9. UNKNOWN / OUT-OF-DOMAIN FALLBACK
        else:
            intent = "UNKNOWN"
            intent_confidence = 0.50
            response_text = (
                "I don't have enough information to answer that. "
                "I can help you submit a grievance, track an existing grievance, understand the grievance process, or find the responsible department."
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return ChatbotResponse(
            message=response_text,
            language=detected_language,
            intent=intent,
            confidence=intent_confidence,
            grievance_number=matched_grv_number,
            grievance=grievance_detail,
            session_context=session_ctx,
            explanation_terms=explanation_terms,
            data={"grievance": grievance_detail.model_dump() if grievance_detail else None},
            processing_time_ms=round(elapsed_ms, 2)
        )

chatbot_service = ChatbotService()
