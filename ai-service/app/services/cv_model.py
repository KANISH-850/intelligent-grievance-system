"""
Trained Civic Infrastructure Computer Vision Model Service.
Loads fine-tuned MobileNetV3-Small weights and runs fast local CPU inference
on genuine citizen photograph uploads. Distinguishes civic issues across 8 categories
and flags unrelated images and low-confidence predictions for human officer review.
"""
import io
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
import torch
import torch.nn as nn
from torchvision import models, transforms

logger = logging.getLogger("ai_service.cv_model")

MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "models"
CHECKPOINT_PATH = MODEL_DIR / "civic_mobilenet_v3_best.pth"
if not CHECKPOINT_PATH.exists():
    CHECKPOINT_PATH = MODEL_DIR / "civic_mobilenet_v3.pth"

# Class mappings matching the trained MobileNetV3 civic taxonomy
CLASS_TAXONOMY = {
    "pothole_road_damage": {
        "civic_issue": "Road damage",
        "category": "Roads and Transport",
        "department": "Roads and Transport",
        "additional_departments": [],
        "description": "Asphalt road pothole or damaged pavement surface detected.",
        "observations": [
            "Visible cavity or asphalt surface crater in road pavement",
            "Vehicle hazard due to road surface breakdown",
        ],
        "citizen_msg": "A road damage issue (pothole/broken pavement) was detected in the photograph.",
        "is_grievance": True,
        "image_type": "civic_issue",
    },
    "garbage_dumping": {
        "civic_issue": "Garbage/sanitation",
        "category": "Sanitation",
        "department": "Sanitation",
        "additional_departments": [],
        "description": "Accumulated street garbage, open waste pile, or overflowing refuse detected.",
        "observations": [
            "Visible solid waste accumulation in public thoroughfare",
            "Sanitation and hygiene concern requiring municipal waste collection",
        ],
        "citizen_msg": "A garbage accumulation or sanitation issue was detected in the photograph.",
        "is_grievance": True,
        "image_type": "civic_issue",
    },
    "water_leakage": {
        "civic_issue": "Waterlogging/leakage",
        "category": "Water Supply",
        "department": "Water Supply",
        "additional_departments": [],
        "description": "Burst water main or leaking distribution pipeline detected.",
        "observations": [
            "Pressurized water discharge or visible supply pipe rupture",
            "Public water loss requiring water board intervention",
        ],
        "citizen_msg": "A water pipeline leakage or supply issue was detected in the photograph.",
        "is_grievance": True,
        "image_type": "civic_issue",
    },
    "blocked_drainage": {
        "civic_issue": "Garbage/sanitation",
        "category": "Sanitation",
        "department": "Sanitation",
        "additional_departments": ["Water Supply"],
        "description": "Blocked storm drain grate, clogged drainage conduit, or sewage overflow detected.",
        "observations": [
            "Debris obstruction in drain inlet or overflowing sewage manhole",
            "Impeded stormwater runoff causing local stagnant pooling",
        ],
        "citizen_msg": "A drainage blockage or sewer overflow issue was detected in the photograph.",
        "is_grievance": True,
        "image_type": "civic_issue",
    },
    "broken_streetlight": {
        "civic_issue": "Electrical infrastructure damage",
        "category": "Electricity",
        "department": "Electricity",
        "additional_departments": [],
        "description": "Damaged streetlight pole, broken luminaire, or unlit streetlight detected.",
        "observations": [
            "Physical defect in lamppost, fractured light fixture, or unlit streetlight luminaire",
            "Public illumination hazard affecting pedestrian and traffic visibility",
        ],
        "citizen_msg": "A damaged or non-functional streetlight issue was detected in the photograph.",
        "is_grievance": True,
        "image_type": "civic_issue",
    },
    "waterlogging": {
        "civic_issue": "Waterlogging/leakage",
        "category": "Water Supply",
        "department": "Water Supply",
        "additional_departments": ["Roads and Transport"],
        "description": "Urban road waterlogging or inundated street section detected.",
        "observations": [
            "Extensive standing water submerging road or carriageway",
            "Severe impediment to vehicular and pedestrian movement",
        ],
        "citizen_msg": "A waterlogging or flooded road issue was detected in the photograph.",
        "is_grievance": True,
        "image_type": "civic_issue",
    },
    "exposed_electrical_wires": {
        "civic_issue": "Electrical infrastructure damage",
        "category": "Electricity",
        "department": "Electricity",
        "additional_departments": [],
        "description": "Dangling electrical wires, damaged utility pole, or power hazard detected.",
        "observations": [
            "Hanging or exposed electrical conductor wires presenting public shock hazard",
            "Damaged utility distribution equipment requiring urgent electrical repair",
        ],
        "citizen_msg": "An exposed electrical wire hazard was detected in the photograph.",
        "is_grievance": True,
        "image_type": "civic_issue",
    },
    "damaged_public_infrastructure": {
        "civic_issue": "Public infrastructure damage",
        "category": "Municipal Services",
        "department": "Municipal Services",
        "additional_departments": [],
        "description": "Damaged public structure (bus shelter, park bench, guardrail, or civic fixture) detected.",
        "observations": [
            "Physical fracture or structural vandalization of municipal asset",
            "Civic amenity damage requiring municipal public works repair",
        ],
        "citizen_msg": "A damaged public infrastructure issue was detected in the photograph.",
        "is_grievance": True,
        "image_type": "civic_issue",
    },
    "unrelated_negative": {
        "civic_issue": None,
        "category": None,
        "department": None,
        "additional_departments": [],
        "description": "Non-civic photograph (portrait/selfie, domestic pet, food dish, indoor room, or vehicle).",
        "observations": [
            "Photograph does not contain recognizable municipal infrastructure defect",
            "Visual features correspond to personal, domestic, or unrelated imagery",
        ],
        "citizen_msg": "This image does not appear to contain a recognizable civic infrastructure defect. Please upload a clear photo showing the civic problem.",
        "is_grievance": False,
        "image_type": "unrelated",
    },
}

_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

_MODEL_INSTANCE: Optional[nn.Module] = None
_CLASS_NAMES: List[str] = []
_DEVICE = torch.device("cpu")


def get_trained_model() -> Tuple[Optional[nn.Module], List[str]]:
    """Singleton loader for fine-tuned MobileNetV3 civic model."""
    global _MODEL_INSTANCE, _CLASS_NAMES
    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE, _CLASS_NAMES

    if not CHECKPOINT_PATH.exists():
        logger.warning(f"Civic CV model checkpoint not found at {CHECKPOINT_PATH}")
        return None, []

    try:
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=_DEVICE)
        _CLASS_NAMES = checkpoint.get("class_names", sorted(list(CLASS_TAXONOMY.keys())))

        model = models.mobilenet_v3_small(weights=None)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, len(_CLASS_NAMES)),
        )
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(_DEVICE)
        model.eval()
        _MODEL_INSTANCE = model
        logger.info(f"Loaded trained Civic CV Model ({checkpoint.get('architecture', 'MobileNetV3')}) with {len(_CLASS_NAMES)} classes.")
        return _MODEL_INSTANCE, _CLASS_NAMES
    except Exception as e:
        logger.error(f"Failed to load Civic CV model: {e}")
        return None, []


def predict_civic_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    """
    Run inference on uploaded image bytes using fine-tuned MobileNetV3 civic model.
    Returns structured analysis complying with ImageAnalysisResponse schema.
    """
    fallback_result = {
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
        "citizen_message": "CV model is currently unavailable. Your photo will be reviewed manually by an officer.",
        "model_name": "MobileNetV3-Small-Civic",
        "model_version": "1.0.0",
        "inference_latency_ms": None,
    }

    if mime_type not in {"image/jpeg", "image/png", "image/webp"}:
        return {
            **fallback_result,
            "analysis_status": "unsupported_format",
            "citizen_message": "Unsupported file format. Please upload JPEG, PNG, or WebP photographs.",
        }

    if len(image_bytes) > 5 * 1024 * 1024:
        return {
            **fallback_result,
            "analysis_status": "too_large",
            "citizen_message": "Image file exceeds the 5 MB limit. Please upload a smaller photograph.",
        }

    model, class_names = get_trained_model()
    if model is None or not class_names:
        return fallback_result

    start_time = time.perf_counter()
    try:
        with Image.open(io.BytesIO(image_bytes)) as pil_img:
            rgb_img = pil_img.convert("RGB")
            # Quality / Blurry check: images that are degenerate or too tiny
            if rgb_img.width < 50 or rgb_img.height < 50:
                return {
                    **fallback_result,
                    "analysis_status": "analyzed",
                    "image_type": "uncertain",
                    "human_review_required": True,
                    "citizen_message": "The uploaded photograph is too low-resolution or indistinct to identify a civic issue.",
                }
            input_tensor = _TRANSFORM(rgb_img).unsqueeze(0).to(_DEVICE)

        with torch.no_grad():
            outputs = model(input_tensor)
            probs = torch.softmax(outputs, dim=1)[0]
            conf, pred_idx = torch.max(probs, dim=0)

        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        confidence_val = round(float(conf.item()), 4)
        pred_class = class_names[pred_idx.item()]
        class_info = CLASS_TAXONOMY.get(pred_class, CLASS_TAXONOMY["unrelated_negative"])

        # Check for uncertain confidence (threshold 0.22, where random baseline across 9 classes is 0.11)
        is_uncertain = confidence_val < 0.22
        is_grievance = class_info["is_grievance"] and (pred_class != "unrelated_negative")
        image_type = "unrelated" if pred_class == "unrelated_negative" else ("uncertain" if is_uncertain else "civic_issue")
        issue_detected = is_grievance and not is_uncertain
        detected_issue = class_info["civic_issue"] if is_grievance else None

        # Rejection handling for non-civic photos
        if pred_class == "unrelated_negative":
            return {
                "analysis_status": "analyzed",
                "image_type": "unrelated",
                "is_grievance_related": False,
                "issue_detected": False,
                "detected_issue": None,
                "issue_description": class_info["description"],
                "image_description": class_info["description"],
                "recommended_category": None,
                "recommended_department": None,
                "additional_departments": [],
                "visual_observations": class_info["observations"],
                "observations": class_info["observations"],
                "confidence": confidence_val,
                "human_review_required": False,
                "citizen_message": class_info["citizen_msg"],
                "model_name": "MobileNetV3-Small-Civic",
                "model_version": "1.0.0",
                "inference_latency_ms": latency_ms,
            }

        # Uncertain civic issue
        if is_uncertain:
            return {
                "analysis_status": "analyzed",
                "image_type": "uncertain",
                "is_grievance_related": True,
                "issue_detected": False,
                "detected_issue": None,
                "issue_description": f"Tentative visual match for {class_info['civic_issue'].lower()}, but confidence is low ({confidence_val:.2f}).",
                "image_description": class_info["description"],
                "recommended_category": class_info["category"],
                "recommended_department": class_info["department"],
                "additional_departments": class_info["additional_departments"],
                "visual_observations": class_info["observations"],
                "observations": class_info["observations"],
                "confidence": confidence_val,
                "human_review_required": True,
                "citizen_message": "Visual evidence suggests a possible civic issue, but image clarity requires human officer verification.",
                "model_name": "MobileNetV3-Small-Civic",
                "model_version": "1.0.0",
                "inference_latency_ms": latency_ms,
            }

        # Human review policy: Always require review for critical hazards (wires, deep waterlogging) or moderate confidence
        review_required = bool(
            confidence_val < 0.60
            or pred_class in {"exposed_electrical_wires", "damaged_public_infrastructure", "waterlogging"}
        )

        return {
            "analysis_status": "analyzed",
            "image_type": "civic_issue",
            "is_grievance_related": True,
            "issue_detected": True,
            "detected_issue": detected_issue,
            "issue_description": class_info["description"],
            "image_description": class_info["description"],
            "recommended_category": class_info["category"],
            "recommended_department": class_info["department"],
            "additional_departments": class_info["additional_departments"],
            "visual_observations": class_info["observations"],
            "observations": class_info["observations"],
            "confidence": confidence_val,
            "human_review_required": review_required,
            "citizen_message": class_info["citizen_msg"],
            "model_name": "MobileNetV3-Small-Civic",
            "model_version": "1.0.0",
            "inference_latency_ms": latency_ms,
        }

    except Exception as e:
        logger.error(f"Inference error on image: {e}")
        return {
            **fallback_result,
            "analysis_status": "failed",
            "citizen_message": "An error occurred during local image analysis. The photo will be preserved for officer review.",
        }
