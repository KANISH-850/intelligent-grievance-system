import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.grievance import GrievanceRequest, GrievanceResponse
from app.services.pipeline import analysis_pipeline

logger = logging.getLogger("ai_service.routes.analyze")

router = APIRouter(tags=["Analysis"])

@router.post(
    "/analyze",
    response_model=GrievanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Citizen Grievance",
    description="Processes raw grievance text through language detection, translation, category classification, priority prediction, and department routing."
)
async def analyze_grievance(request: GrievanceRequest) -> GrievanceResponse:
    """
    Analyzes input grievance text and returns structured classification metadata.
    """
    try:
        response = analysis_pipeline.process_grievance(request)
        return response
    except ValueError as val_err:
        logger.warning(f"Validation error in analyze_grievance: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as exc:
        logger.error(f"Internal error processing grievance: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing the grievance text."
        )
