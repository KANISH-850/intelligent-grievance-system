import re
import time
import logging
from typing import Dict, Any, Optional, List
from app.schemas.chatbot import ChatbotRequest, ChatbotResponse, ChatbotGrievanceDetail
from app.services.language_detector import language_detector_service
from app.services.translator import translator_service

logger = logging.getLogger("ai_service.chatbot")

class ChatbotService:
    """
    Multilingual AI Chatbot Service.
    Handles intent extraction, language identification, database context matching,
    and conversational response synthesis for citizen grievance queries.
    """

    def process_message(self, request: ChatbotRequest) -> ChatbotResponse:
        start_time = time.perf_counter()
        message = request.message.strip()
        user_grievances = request.user_grievances or []

        # 1. Detect user language
        lang_result = language_detector_service.detect_language(message)
        detected_language = lang_result.get("language", "English")

        # 2. Extract potential grievance number (e.g., GRV-2026-000003)
        grv_pattern = re.compile(r'\b(GRV-?\d{4}-?\d{6}|GRV-[A-Z0-9]+)\b', re.IGNORECASE)
        match = grv_pattern.search(message)

        matched_grv_number = match.group(1).upper() if match else None

        intent = "GENERAL_GUIDANCE"
        response_text = ""
        grievance_detail: Optional[ChatbotGrievanceDetail] = None

        if matched_grv_number:
            intent = "GRIEVANCE_STATUS"
            # Normalize grievance number hyphenation if needed (e.g. GRV2026000003 -> GRV-2026-000003)
            search_num = matched_grv_number
            if not "-" in search_num and len(search_num) == 14:
                search_num = f"{search_num[:3]}-{search_num[3:7]}-{search_num[7:]}"

            # Check if this grievance belongs to the authenticated user
            found_grievance = None
            for g in user_grievances:
                g_num = str(g.get("grievance_number", "")).upper()
                if g_num == search_num or g_num == matched_grv_number:
                    found_grievance = g
                    break

            if found_grievance:
                dept_name = found_grievance.get("department", {}).get("name") if isinstance(found_grievance.get("department"), dict) else (found_grievance.get("department") or "Assigned Department")
                status = found_grievance.get("status", "SUBMITTED")
                category = found_grievance.get("category", "General")
                created_at = str(found_grievance.get("created_at", ""))

                grievance_detail = ChatbotGrievanceDetail(
                    grievance_number=found_grievance.get("grievance_number", search_num),
                    status=status,
                    department=dept_name,
                    category=category,
                    created_at=created_at
                )

                response_text = (
                    f"Your grievance {grievance_detail.grievance_number} is currently marked as {status}. "
                    f"It is assigned to the {dept_name} department under category '{category}'."
                )
            else:
                response_text = (
                    f"No grievance record with reference {matched_grv_number} was found under your registered account. "
                    "For privacy and security, you can only check the status of grievances submitted by your own account."
                )

        else:
            msg_lower = message.lower()
            if any(kw in msg_lower for kw in ["my grievance", "my complaint", "list my", "show my", "status of my", "all my"]):
                intent = "LIST_GRIEVANCES"
                if not user_grievances:
                    response_text = "You currently have no registered grievances in the system. You can submit a new grievance anytime from the 'Submit Grievance' page."
                else:
                    count = len(user_grievances)
                    grv_list_strs = []
                    for g in user_grievances[:5]:
                        g_num = g.get("grievance_number")
                        g_status = g.get("status")
                        grv_list_strs.append(f"• {g_num} [{g_status}]")
                    
                    response_text = f"You have {count} registered grievance(s):\n" + "\n".join(grv_list_strs)
                    if count > 5:
                        response_text += f"\n...and {count - 5} more. View all under 'My Grievances'."

            elif any(kw in msg_lower for kw in ["submit", "how to", "register", "file", "new complaint"]):
                intent = "GENERAL_GUIDANCE"
                response_text = (
                    "To file a public grievance:\n"
                    "1. Click 'Submit Grievance' in the sidebar.\n"
                    "2. Enter your complaint details in any supported official language.\n"
                    "3. Our AI framework automatically detects the language, translates it, determines severity, and routes it to the responsible Central Government Department.\n"
                    "4. You will receive a unique reference tracking ID (e.g. GRV-2026-000001)."
                )
            elif any(kw in msg_lower for kw in ["department", "who handles", "routing", "ministry"]):
                intent = "GENERAL_GUIDANCE"
                response_text = (
                    "Our system automatically dispatches grievances to 9 government departments including Water Supply (WS), Electricity (ELEC), Roads & Transport (RT), Healthcare (HC), Education (EDU), Sanitation (SAN), Municipal Services (MS), Revenue (REV), and Other (OTH)."
                )
            else:
                intent = "GENERAL_GUIDANCE"
                response_text = (
                    "Welcome to the Intelligent Multilingual Grievance AI Assistant. "
                    "I can help you check grievance statuses (e.g., 'What is the status of GRV-2026-000003?'), list your active complaints, or guide you through filing a new grievance."
                )

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return ChatbotResponse(
            message=response_text,
            language=detected_language,
            intent=intent,
            grievance=grievance_detail,
            processing_time_ms=round(elapsed_ms, 2)
        )

chatbot_service = ChatbotService()
