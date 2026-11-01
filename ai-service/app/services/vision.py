"""Multimodal vision analysis service for civic infrastructure grievance inspection.

Analyzes uploaded citizen defect photographs using OpenAI-compatible vision chat endpoints.
Distinguishes genuine civic/public infrastructure issues from unrelated photographs (selfies,
pets, food, vehicles without damage, personal documents, indoor rooms, screenshots, etc.).
"""
import base64
import json
import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.services.cv_model import predict_civic_image

logger = logging.getLogger("ai_service.vision")

# Centralized issue to category/department mappings matching PostgreSQL taxonomy
ISSUE_TAXONOMY = {
    "Road damage": {
        "category": "Roads and Transport",
        "department": "Roads and Transport",
        "keywords": ["road", "pothole", "asphalt", "tar", "broken road", "footpath", "sidewalk", "cracked road", "street"],
    },
    "Garbage/sanitation": {
        "category": "Sanitation",
        "department": "Sanitation",
        "keywords": ["garbage", "trash", "waste", "sanitation", "litter", "dump", "debris", "dustbin", "bin", "refuse"],
    },
    "Waterlogging/leakage": {
        "category": "Water Supply",
        "department": "Water Supply",
        "keywords": ["water", "flood", "leak", "pipe", "drain", "sewage", "waterlogging", "pipeline", "overflow", "drainage"],
    },
    "Electrical infrastructure damage": {
        "category": "Electricity",
        "department": "Electricity",
        "keywords": ["electric", "wire", "pole", "transformer", "power", "spark", "cable", "streetlight", "street light", "blackout"],
    },
    "Public infrastructure damage": {
        "category": "Municipal Services",
        "department": "Municipal Services",
        "keywords": ["infrastructure", "building", "bridge", "park", "bench", "bus shelter", "shelter", "railing", "public property"],
    },
}

ALLOWED_ISSUES = set(ISSUE_TAXONOMY.keys())

# System prompt strictly instructing the model to distinguish civic issues from unrelated images
VISION_SYSTEM_PROMPT = """You are an expert civic infrastructure inspection AI for municipal and central government grievance portals.
Analyze the provided image strictly based on visible physical evidence. Do not guess or infer non-visible facts.

Task:
Determine whether the image represents a recognizable civic/public-service grievance or infrastructure defect.

1. Civic Issues:
- Roads and transport: potholes, broken road/tar, cracked asphalt, damaged footpaths/sidewalks, road obstructions.
- Water supply: burst pipelines, leaking water mains, severe pipe leakage, water wastage.
- Sanitation & drainage: garbage accumulation, overflowing bins, open waste dumping, blocked drains, sewage overflow.
- Electrical infrastructure: damaged electric poles, exposed/hanging live electrical wires, broken streetlights, transformer hazards.
- Public infrastructure: damaged public buildings, broken bus shelters, broken park benches, damaged public railings/barriers.

2. Unrelated / Non-Civic Images:
- Selfies, personal portraits, people without civic defects.
- Animals, domestic pets (dogs, cats), wildlife, birds.
- Food, beverages, meals, plates of food, groceries.
- Normal vehicles, cars, bikes (unless visibly crushed/damaged in a road obstruction hazard).
- Indoor domestic rooms, offices, bedrooms, home furniture, electronics.
- Random objects, abstract art, flowers, plants in nature without civic damage.
- Text screenshots, mobile screenshots, invoices, memes, personal documents.
- Images that are totally blank, black, or too blurry/dark to discern any civic defect.

Output MUST be a valid JSON object ONLY with the following exact keys:
{
  "is_grievance_related": boolean (true if image shows a genuine civic/public infrastructure issue, false otherwise),
  "image_type": "civic_issue" | "unrelated" | "uncertain",
  "issue_detected": boolean (true if a specific civic defect is visibly detected, false otherwise),
  "detected_issue": string or null (one of: "Road damage", "Garbage/sanitation", "Waterlogging/leakage", "Electrical infrastructure damage", "Public infrastructure damage", or null if unrelated),
  "issue_description": string (clear 1-2 sentence description of what is physically visible in the image),
  "recommended_category": string or null ("Roads and Transport", "Sanitation", "Water Supply", "Electricity", "Municipal Services", or null),
  "recommended_department": string or null ("Roads and Transport", "Sanitation", "Water Supply", "Electricity", "Municipal Services", or null),
  "additional_departments": array of strings (e.g. ["Sanitation"] if multiple departments are legitimately affected),
  "visual_observations": array of strings (bullet points of visible evidence, e.g. ["Deep pothole in asphalt", "Water accumulated in cavity"]),
  "human_review_required": boolean (true if uncertain or requires officer verification, false if obvious),
  "citizen_message": string (concise, respectful message explaining the detection outcome to the citizen)
}"""


def _normalize_issue_and_category(raw_issue: Optional[str], raw_category: Optional[str], description: str) -> Optional[str]:
    """Map raw model output into one of the canonical 5 civic issues, or None."""
    if not raw_issue and not raw_category:
        return None

    candidate = (raw_issue or raw_category or "").strip()
    if candidate in ALLOWED_ISSUES:
        return candidate

    candidate_lower = candidate.lower()
    desc_lower = description.lower()
    combined = f"{candidate_lower} {desc_lower}"

    # Priority keyword/regex checks
    if any(k in combined for k in ["garbage", "trash", "waste", "sanitation", "litter", "dump", "dustbin", "refuse", "sewage", "blocked drain"]):
        return "Garbage/sanitation"
    if any(k in combined for k in ["waterlogging", "water logging", "water leak", "pipe leak", "flood", "leakage", "pipeline", "water supply"]):
        return "Waterlogging/leakage"
    if any(k in combined for k in ["electric", "wire", "pole", "transformer", "power", "spark", "cable", "streetlight"]):
        return "Electrical infrastructure damage"
    if any(k in combined for k in ["pothole", "asphalt", "broken road", "road damage", "tar road", "cracked road"]):
        return "Road damage"
    if any(k in combined for k in ["infrastructure", "building", "bridge", "park", "bench", "bus shelter"]):
        return "Public infrastructure damage"
    if any(k in combined for k in ["water", "leak", "pipe", "drain"]):
        return "Waterlogging/leakage"
    if bool(re.search(r'\broads?\b', combined)):
        return "Road damage"

    return None



def analyze_image(image_base64: str, mime_type: str) -> Dict[str, Any]:
    """
    Analyze image bytes using configured vision provider.
    Returns structured analysis result adhering to ImageAnalysisResponse schema.
    """
    fallback_base: Dict[str, Any] = {
        "analysis_status": "unavailable",
        "image_type": "uncertain",
        "is_grievance_related": False,
        "issue_detected": False,
        "detected_issue": None,
        "issue_description": None,
        "image_description": None,
        "recommended_category": None,
        "recommended_department": None,
        "additional_departments": [],
        "visual_observations": [],
        "observations": [],
        "confidence": None,
        "human_review_required": True,
        "citizen_message": "AI vision analysis is currently unconfigured or offline. Your image will be reviewed manually by an officer.",
    }

    if mime_type not in {"image/jpeg", "image/png", "image/webp"}:
        return {
            **fallback_base,
            "analysis_status": "unsupported_format",
            "citizen_message": "Unsupported file format. Please upload JPEG, PNG, or WebP images.",
        }

    try:
        raw = base64.b64decode(image_base64, validate=True)
    except Exception:
        return {
            **fallback_base,
            "analysis_status": "failed",
            "citizen_message": "Invalid base64 image data.",
        }

    if len(raw) > 5 * 1024 * 1024:
        return {
            **fallback_base,
            "analysis_status": "too_large",
            "citizen_message": "Image file exceeds the 5 MB limit. Please upload a smaller image.",
        }

    # Primary: Run trained local Computer Vision model (MobileNetV3 civic transfer learning)
    local_result = predict_civic_image(raw, mime_type)

    # If external vision API is unconfigured or if local model has completed inference, use local model
    if not settings.VISION_API_URL or not settings.VISION_API_KEY:
        if local_result.get("analysis_status") == "analyzed":
            return local_result
        return fallback_base

    # If external provider is configured, attempt secondary reasoning, falling back to local result
    try:
        response = httpx.post(
            settings.VISION_API_URL,
            headers={"Authorization": f"Bearer {settings.VISION_API_KEY}"},
            json={
                "model": settings.VISION_MODEL,
                "temperature": 0,
                "messages": [
                    {"role": "system", "content": VISION_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Inspect this image. Determine if it shows a genuine civic infrastructure grievance or an unrelated image. Return strictly JSON."},
                            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_base64}"}},
                        ],
                    },
                ],
                "response_format": {"type": "json_object"},
            },
            timeout=15.0,
        )
        response.raise_for_status()

        choices = response.json().get("choices", [])
        if not choices:
            raise ValueError("Vision provider returned empty choices")

        body = choices[0]["message"]["content"]
        if isinstance(body, str):
            body = body.strip()
            # Strip markdown fences if present
            if body.startswith("```"):
                lines = body.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                body = "\n".join(lines).strip()

        parsed = json.loads(body)

        desc = str(parsed.get("issue_description") or parsed.get("image_description") or "").strip()
        if not desc:
            desc = "Visual content analyzed."

        raw_type = str(parsed.get("image_type") or "").strip().lower()
        raw_issue = str(parsed.get("detected_issue") or "").strip()
        raw_cat = str(parsed.get("recommended_category") or "").strip()

        # Observations coercion
        obs = parsed.get("visual_observations") or parsed.get("observations") or []
        if isinstance(obs, str):
            obs_list = [obs.strip()]
        elif isinstance(obs, list):
            obs_list = [str(item).strip() for item in obs if str(item).strip()]
        else:
            obs_list = []

        # Deduce is_related if not explicitly set
        is_related_val = parsed.get("is_grievance_related")
        if is_related_val is None:
            is_related = bool(raw_issue and raw_issue not in {"Irrelevant/unclear", "Unrelated", "None", "null"} and raw_type != "unrelated")
        else:
            is_related = bool(is_related_val)



        # Check if uncertain or degraded
        if raw_type == "uncertain":
            return {
                "analysis_status": "analyzed",
                "image_type": "uncertain",
                "is_grievance_related": False,
                "issue_detected": False,
                "detected_issue": None,
                "issue_description": desc,
                "image_description": desc,
                "recommended_category": None,
                "recommended_department": None,
                "additional_departments": [],
                "visual_observations": obs_list[:10],
                "observations": obs_list[:10],
                "confidence": None,
                "human_review_required": True,
                "citizen_message": parsed.get("citizen_message")
                or "The uploaded image is too blurry, dark, or indistinct to reliably identify a civic issue. Please upload a clearer photograph or provide a written description.",
            }

        # Check if the model flagged it as unrelated
        if raw_type == "unrelated" or not is_related or raw_issue in {"Irrelevant/unclear", "Unrelated", "None", "null"}:
            return {
                "analysis_status": "analyzed",
                "image_type": "unrelated",
                "is_grievance_related": False,
                "issue_detected": False,
                "detected_issue": None,
                "issue_description": desc,
                "image_description": desc,
                "recommended_category": None,
                "recommended_department": None,
                "additional_departments": [],
                "visual_observations": obs_list[:10],
                "observations": obs_list[:10],
                "confidence": None,
                "human_review_required": False,
                "citizen_message": parsed.get("citizen_message")
                or "This image does not appear to contain a recognizable civic or public-service issue. Please upload a relevant image showing public infrastructure or describe your grievance.",
            }


        # Civic issue detected
        normalized_issue = _normalize_issue_and_category(raw_issue, raw_cat, desc)
        if not normalized_issue:
            # Fallback to uncertain if no canonical civic category matches
            return {
                "analysis_status": "analyzed",
                "image_type": "uncertain",
                "is_grievance_related": True,
                "issue_detected": False,
                "detected_issue": None,
                "issue_description": desc,
                "image_description": desc,
                "recommended_category": None,
                "recommended_department": None,
                "additional_departments": [],
                "visual_observations": obs_list[:10],
                "observations": obs_list[:10],
                "confidence": None,
                "human_review_required": True,
                "citizen_message": "Visual evidence is suggestive of a civic concern but needs officer review to categorize.",
            }

        taxonomy_info = ISSUE_TAXONOMY[normalized_issue]
        recommended_cat = taxonomy_info["category"]
        recommended_dept = taxonomy_info["department"]

        # Parse additional departments if any
        raw_addl = parsed.get("additional_departments", [])
        addl_depts: List[str] = []
        if isinstance(raw_addl, list):
            for ad in raw_addl:
                ad_str = str(ad).strip()
                if ad_str and ad_str != recommended_dept and ad_str not in addl_depts:
                    addl_depts.append(ad_str)

        # Citizen message
        default_citizen_msg = f"A possible {normalized_issue.lower()} issue was detected ({recommended_dept}). Please verify before submitting."
        citizen_msg = str(parsed.get("citizen_message") or default_citizen_msg).strip()

        requires_review = bool(parsed.get("human_review_required", True))
        if normalized_issue in {"Electrical infrastructure damage", "Waterlogging/leakage"}:
            requires_review = True

        return {
            "analysis_status": "analyzed",
            "image_type": "civic_issue",
            "is_grievance_related": True,
            "issue_detected": True,
            "detected_issue": normalized_issue,
            "issue_description": desc,
            "image_description": desc,
            "recommended_category": recommended_cat,
            "recommended_department": recommended_dept,
            "additional_departments": addl_depts,
            "visual_observations": obs_list[:10],
            "observations": obs_list[:10],
            "confidence": None,
            "human_review_required": requires_review,
            "citizen_message": citizen_msg,
        }


    except (httpx.HTTPError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        logger.warning("External vision provider failed, using trained local CV model: %s", exc)
        if local_result.get("analysis_status") == "analyzed":
            return local_result
        return {
            **fallback_base,
            "analysis_status": "failed",
            "citizen_message": "Image analysis encountered a temporary provider error. The image has been preserved for human review.",
        }
