import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.chatbot import ChatbotRequest, ChatbotResponse
from app.services.chatbot import chatbot_service

logger = logging.getLogger("ai_service.routes.chatbot")

router = APIRouter(tags=["Chatbot"])

@router.post(
    "/chatbot/process",
    response_model=ChatbotResponse,
    status_code=status.HTTP_200_OK,
    summary="Process Citizen Chatbot Message",
    description="Analyzes citizen chatbot message, detects language, extracts intent, matches grievance database records safely, and returns structured assistance response."
)
async def process_chatbot(request: ChatbotRequest) -> ChatbotResponse:
    try:
        response = chatbot_service.process_message(request)
        return response
    except ValueError as val_err:
        logger.warning(f"Validation error in chatbot processing: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as exc:
        logger.error(f"Internal error processing chatbot message: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing chatbot query."
        )
