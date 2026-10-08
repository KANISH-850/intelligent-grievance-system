from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Raw user query message")
    user_grievances: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="Authenticated citizen's existing grievances list for database lookup context"
    )
    session_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Lightweight conversation session memory (e.g. last_grievance_number)"
    )

class ChatbotGrievanceDetail(BaseModel):
    grievance_number: str
    status: str
    department: str
    category: Optional[str] = None
    created_at: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_explanation_terms: Optional[List[str]] = Field(default=[])

class ChatbotResponse(BaseModel):
    message: str
    language: str
    intent: str
    confidence: float = Field(default=0.90, description="Intent detection confidence score")
    grievance_number: Optional[str] = Field(default=None, description="Extracted grievance reference number")
    grievance: Optional[ChatbotGrievanceDetail] = None
    session_context: Optional[Dict[str, Any]] = Field(default=None, description="Updated session memory")
    explanation_terms: Optional[List[str]] = Field(default=[], description="XAI keywords explaining classification")
    data: Optional[Dict[str, Any]] = Field(default={}, description="Additional structured response payload")
    processing_time_ms: float
