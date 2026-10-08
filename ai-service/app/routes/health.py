from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health", summary="Service Health Check")
async def health_check():
    """
    Returns the operational status of the AI service.
    """
    return {
        "status": "ok",
        "service": "ai-service"
    }
