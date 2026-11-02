from pydantic import BaseModel, Field, field_validator
from typing import Optional

class GrievanceRequest(BaseModel):
    text: str = Field(
        ...,
        description="The original raw text of the citizen grievance",
        json_schema_extra={"example": "There has been no water supply in our area for three days."}
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Grievance text must be a string.")
        
        stripped = v.strip()
        if not stripped:
            raise ValueError("Grievance text must not be empty or whitespace only.")
        
        if len(stripped) < 3:
            raise ValueError("Grievance text is too short (minimum 3 characters required).")
            
        if len(v) > 5000:
            raise ValueError("Grievance text exceeds maximum allowed length of 5000 characters.")
            
        return v


class GrievanceResponse(BaseModel):
    language: str = Field(
        ...,
        description="Detected language of original text",
        json_schema_extra={"example": "English"}
    )
    language_code: Optional[str] = Field(
        default="en",
        description="ISO 639-1 code of detected language",
        json_schema_extra={"example": "en"}
    )
    original_text: Optional[str] = Field(
        default=None,
        description="Original text submitted by citizen",
        json_schema_extra={"example": "Drinking water has not been available."}
    )
    translated_text: str = Field(
        ...,
        description="Translated text in English",
        json_schema_extra={"example": "There has been no water supply in our area for three days."}
    )
    translation_status: Optional[str] = Field(
        None,
        description="Translation outcome such as translated, passthrough, or unsupported_or_failed.",
        json_schema_extra={"example": "translated"}
    )
    translation_method: Optional[str] = Field(
        None,
        description="Translation mechanism used for the result.",
        json_schema_extra={"example": "local_rule_based_translation"}
    )
    translation_error: Optional[str] = Field(
        default=None,
        description="Error details if translation failed",
        json_schema_extra={"example": None}
    )
    translated_at: Optional[str] = Field(
        default=None,
        description="Timestamp of translation completion",
        json_schema_extra={"example": "2026-11-01T08:00:00Z"}
    )
    category: str = Field(
        ...,
        description="Classified category of grievance",
        json_schema_extra={"example": "Water Supply"}
    )
    category_confidence: Optional[float] = Field(
        None,
        description="Confidence score for classification (0.0 to 1.0)",
        json_schema_extra={"example": 0.85}
    )
    priority: str = Field(
        ...,
        description="Predicted priority level (LOW, MEDIUM, HIGH, CRITICAL)",
        json_schema_extra={"example": "HIGH"}
    )
    priority_confidence: Optional[float] = Field(
        None,
        description="Confidence score for priority prediction (0.0 to 1.0)",
        json_schema_extra={"example": 0.80}
    )
    department: str = Field(
        ...,
        description="Mapped destination department",
        json_schema_extra={"example": "Water Supply"}
    )
    
    # Metadata for execution transparency & baseline accounting
    processing_time_ms: Optional[float] = Field(
        None,
        description="Processing execution latency in milliseconds",
        json_schema_extra={"example": 12.5}
    )
    model_used: Optional[str] = Field(
        None,
        description="Model architecture used for inference",
        json_schema_extra={"example": "tfidf-logistic-regression"}
    )
    classification_method: Optional[str] = Field(
        None,
        description="Method used for classification (tfidf_logistic_regression or rule_based_fallback)",
        json_schema_extra={"example": "tfidf_logistic_regression"}
    )
    confidence_level: Optional[str] = Field(
        None,
        description="Confidence level classification (HIGH, MEDIUM, LOW)",
        json_schema_extra={"example": "HIGH"}
    )
    ai_review_required: Optional[bool] = Field(
        None,
        description="Flag indicating if low-confidence human review is required",
        json_schema_extra={"example": False}
    )
    explanation: Optional[dict] = Field(
        None,
        description="TF-IDF feature contribution explainability details",
        json_schema_extra={"example": {"method": "tfidf_feature_contribution", "top_terms": ["water", "supply"]}}
    )
    departments: Optional[list] = Field(
        default_factory=list,
        description="All recommended department assignments with routing rationale and scores",
        json_schema_extra={"example": [
            {"department_name": "Roads and Transport", "category": "Roads and Transport", "confidence": 0.88, "reason": "Mentions large pothole", "source": "text"}
        ]}
    )
    detected_issues: Optional[list] = Field(
        default_factory=list,
        description="All individual detected civic issues with categories and evidence spans",
        json_schema_extra={"example": [
            {"issue_name": "Potholes on road", "category": "Roads and Transport", "department": "Roads and Transport", "matched_phrase": "potholes"}
        ]}
    )


class DepartmentRecommendation(BaseModel):
    department_name: str
    category: str
    confidence: Optional[float] = None
    reason: str
    source: str = "text"  # 'text' | 'image' | 'combined'


class ImageAnalysisRequest(BaseModel):
    image_base64: str
    mime_type: str


class ImageAnalysisResponse(BaseModel):
    analysis_status: str  # "analyzed", "unavailable", "failed", "unsupported_format", "too_large"
    image_type: str = "uncertain"  # "civic_issue", "unrelated", "uncertain"
    is_grievance_related: bool = False
    issue_detected: bool = False
    detected_issue: Optional[str] = None
    issue_description: Optional[str] = None
    image_description: Optional[str] = None
    recommended_category: Optional[str] = None
    recommended_department: Optional[str] = None
    additional_departments: list[str] = Field(default_factory=list)
    visual_observations: list[str] = Field(default_factory=list)
    observations: list[str] = Field(default_factory=list)
    confidence: Optional[float] = None
    confidence_level: Optional[str] = None
    predicted_class: Optional[str] = None
    human_review_required: bool = True
    review_reason: Optional[str] = None
    citizen_message: Optional[str] = None
    model_name: Optional[str] = "MobileNetV3-Small-Civic"
    model_version: Optional[str] = "1.0.0"
    inference_latency_ms: Optional[float] = None


class TranslatePreviewRequest(BaseModel):
    text: str = Field(
        ...,
        description="The grievance text to detect language and translate into English",
        json_schema_extra={"example": "எங்கள் பகுதியில் கடந்த மூன்று நாட்களாக குடிநீர் வரவில்லை."}
    )


class TranslatePreviewResponse(BaseModel):
    original_text: str
    detected_language: str
    detected_language_code: str
    translated_text: str
    translation_status: str  # "translated", "passthrough", "unavailable", "failed", "unsupported"
    translation_method: str
    translation_error: Optional[str] = None
    translated_at: Optional[str] = None
    confidence: float = 1.0
    is_mixed: bool = False



