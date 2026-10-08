from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Raw user query message")
    user_grievances: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="Authenticated citizen's existing grievances list for database lookup context"
    )

class ChatbotGrievanceDetail(BaseModel):
    grievance_number: str
    status: str
    department: str
    category: Optional[str] = None
    created_at: Optional[str] = None

class ChatbotResponse(BaseModel):
    message: str
    language: str
    intent: str
    grievance: Optional[ChatbotGrievanceDetail] = None
    processing_time_ms: float
