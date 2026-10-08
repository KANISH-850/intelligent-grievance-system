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
    translated_text: str = Field(
        ...,
        description="Translated text in English",
        json_schema_extra={"example": "There has been no water supply in our area for three days."}
    )
    category: str = Field(
        ...,
        description="Classified category of grievance",
        json_schema_extra={"example": "Water Supply"}
    )
    category_confidence: float = Field(
        ...,
        description="Confidence score for classification (0.0 to 1.0)",
        json_schema_extra={"example": 0.85}
    )
    priority: str = Field(
        ...,
        description="Predicted priority level (LOW, MEDIUM, HIGH, CRITICAL)",
        json_schema_extra={"example": "HIGH"}
    )
    priority_confidence: float = Field(
        ...,
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
        description="Method used for classification (ml_transformer_pipeline or rule_based_fallback)",
        json_schema_extra={"example": "ml_transformer_pipeline"}
    )

