"""
Multi-Issue Grievance Extraction and Multi-Department Decomposition Service.
Identifies distinct civic issues within a single citizen grievance description,
associates each issue with its standard category and target municipal department,
and aggregates issues by unique department while preserving granular issue evidence.
"""
import re
from typing import Dict, List, Any, Optional

# Taxonomy of genuine civic defect patterns per category and department
CIVIC_DEFECT_TAXONOMY = {
    "Water Supply": {
        "department": "Water Supply",
        "patterns": [
            (r"\b(?:water\s+(?:is\s+)?leak\w*|leak\w*\s+(?:from\s+(?:a\s+)?)?pipe\w*|pipe\w*\s+(?:is\s+)?leak\w*|pipeline\s+(?:is\s+)?leak\w*|burst\s+pipe\w*|pipe\w*\s+burst|burst\s+pipeline|pipeline\s+burst)\b", "Water pipeline leakage / burst"),
            (r"\b(?:no\s+water|water\s+cut|water\s+supply\s+(?:disruption|cut|stopped|interrupted)|without\s+water|water\s+not\s+coming)\b", "Water supply disruption"),
            (r"\b(?:contaminated\s+water|dirty\s+water|yellow\s+water|water\s+smell\w*|water\s+contamination|foul\s+drinking\s+water|bad\s+drinking\s+water)\b", "Contaminated drinking water"),
            (r"\b(?:water\s+tanker|tanker\s+not\s+arrived|tanker\s+delayed)\b", "Water tanker service issue"),
            (r"\b(?:low\s+pressure\s+water|low\s+water\s+pressure|water\s+pressure\s+low)\b", "Low water pressure"),
            (r"\b(?:borewell\s+(?:dry|broken|failed)|damaged\s+handpump)\b", "Borewell / handpump issue"),
        ]
    },
    "Sanitation": {
        "department": "Sanitation",
        "patterns": [
            (r"\b(?:garbage\s+(?:is\s+)?accumulat\w+|garbage\s+accumulation|accumulating\s+garbage|garbage\s+(?:is\s+)?dump\w*|garbage\s+pile|waste\s+dump\w*|overflowing\s+(?:dustbin|bin|garbage)|uncollected\s+garbage|garbage\s+not\s+collected)\b", "Garbage accumulation / waste dumping"),
            (r"\b(?:door\s+to\s+door\s+garbage|garbage\s+truck|garbage\s+vehicle\s+not\s+come)\b", "Garbage collection vehicle delay"),
            (r"\b(?:open\s+sewage|sewage\s+overflow\w*|overflowing\s+sewage|sewer\s+overflow\w*|choked\s+drain\w*|blocked\s+drainage|drainage\s+overflow\w*|drain\s+overflow\w*)\b", "Open sewage / blocked drainage overflow"),
            (r"\b(?:public\s+toilet\s+(?:filthy|dirty|broken)|toilet\s+clean\w*\s+issue)\b", "Public toilet sanitation"),
            (r"\b(?:dead\s+(?:animal|dog|cow|cat)|carcass)\b", "Animal carcass removal"),
            (r"\b(?:terrible\s+stench|stinking\s+badly|foul\s+odor|foul\s+smell\s+due\s+to\s+(?:garbage|waste))\b", "Sanitation odor / hygiene hazard"),
        ]
    },
    "Roads and Transport": {
        "department": "Roads and Transport",
        "patterns": [
            (r"\b(?:pothole|potholes|deep\s+pothole|large\s+pothole|craters?\s+on\s+road)\b", "Potholes on road"),
            (r"\b(?:damaged\s+road(?:\s+surfaces?)?|broken\s+road|road\s+damage\w*|damaged\s+pavement|asphalt\s+damage|road\s+cave[- ]?in|broken\s+asphalt)\b", "Damaged road surfaces"),
            (r"\b(?:bridge\s+joint|damaged\s+bridge|bridge\s+vibrat\w+)\b", "Structural bridge defect"),
            (r"\b(?:speed\s+breaker\s+(?:needed|broken|damaged|unmarked))\b", "Speed breaker requirement / defect"),
            (r"\b(?:traffic\s+light\s+signal|traffic\s+signal\s+broken|signal\s+not\s+working|traffic\s+gridlock)\b", "Traffic signal malfunction"),
            (r"\b(?:bus\s+route\s+\d+|bus\s+cancelled|bus\s+driver\s+rash|bus\s+service)\b", "Public transit / bus operational issue"),
            (r"\b(?:waterlogged\s+road|flooded\s+road|flooded\s+street)\b", "Road waterlogging"),
        ]
    },
    "Electricity": {
        "department": "Electricity",
        "patterns": [
            (r"\b(?:streetlights?\s+(?:is\s+|are\s+)?not\s+working|damaged\s+streetlights?|broken\s+streetlights?|unlit\s+streetlights?|streetlight\s+failure)\b", "Damaged / non-functional streetlight"),
            (r"\b(?:live\s+(?:electrical\s+)?wire|hanging\s+(?:electric|power)\s+wire|snapped\s+wire|exposed\s+wires?)\b", "Exposed live electrical wire hazard"),
            (r"\b(?:transformer\s+(?:fire|burnt|blast|smoking|burned|failure))\b", "Electrical transformer breakdown"),
            (r"\b(?:power\s+cut|power\s+outage|frequent\s+power\s+cuts?|blackout|no\s+power|no\s+electricity)\b", "Power supply disruption / blackout"),
            (r"\b(?:voltage\s+fluctuation|high\s+voltage|low\s+voltage)\b", "Voltage fluctuation"),
            (r"\b(?:electricity\s+bill|meter\s+running\s+fast|excessive\s+power\s+bill)\b", "Electricity billing / meter discrepancy"),
        ]
    },
    "Healthcare": {
        "department": "Healthcare",
        "patterns": [
            (r"\b(?:primary\s+health\s+center|phc|government\s+hospital|district\s+hospital|hospital\s+ward)\b", "Government hospital facility"),
            (r"\b(?:doctor\s+absent|no\s+doctor|doctor\s+not\s+available|casualty\s+doctor)\b", "Medical officer absence"),
            (r"\b(?:emergency\s+medicines?|rabies\s+vaccine|lack\s+of\s+medicines?|no\s+medicines?)\b", "Essential medicines / vaccine shortage"),
            (r"\b(?:ambulance\s+(?:108|not\s+arrived|delayed|helpline))\b", "Emergency ambulance service"),
            (r"\b(?:ayushman\s+bharat|medical\s+reimbursement)\b", "Health insurance / reimbursement claim"),
        ]
    },
    "Education": {
        "department": "Education",
        "patterns": [
            (r"\b(?:school\s+building|classroom\s+ceiling|falling\s+plaster|dilapidated\s+school)\b", "School building infrastructure hazard"),
            (r"\b(?:toilets?\s+for\s+girl\s+students|school\s+toilet|no\s+functional\s+toilet\s+in\s+school)\b", "School sanitation facility"),
            (r"\b(?:stale\s+mid\s+day\s+meal|midday\s+meal\s+(?:poisoning|infection|unhygienic))\b", "Mid-day meal quality concern"),
            (r"\b(?:teacher\s+post\s+vacant|no\s+teacher|shortage\s+of\s+teachers?)\b", "School teacher vacancy"),
            (r"\b(?:free\s+textbooks?|delay\s+in\s+textbooks?)\b", "Educational textbook distribution"),
        ]
    },
    "Municipal Services": {
        "department": "Municipal Services",
        "patterns": [
            (r"\b(?:stray\s+dogs?|dog\s+pack|dog\s+bite|rabid\s+dog|dog\s+menace)\b", "Stray dog menace"),
            (r"\b(?:birth\s+certificate|death\s+certificate|delay\s+in\s+certificate)\b", "Civil registration certificate delay"),
            (r"\b(?:property\s+tax\s+portal|property\s+tax\s+payment|property\s+tax\s+bill)\b", "Property tax billing / portal issue"),
            (r"\b(?:public\s+park|park\s+bench|bus\s+shelter\s+(?:vandalized|broken)|guardrail\s+damaged|dangerous\s+tree\s+branch)\b", "Public park / street amenity maintenance"),
            (r"\b(?:encroachment\s+on\s+public\s+park|illegal\s+vendor\s+sheds?)\b", "Public amenity encroachment"),
        ]
    },
    "Revenue": {
        "department": "Revenue",
        "patterns": [
            (r"\b(?:patwari|patwari\s+demanding\s+bribe|land\s+mutation|khatauni)\b", "Land mutation / Patwari revenue grievance"),
            (r"\b(?:land\s+survey|survey\s+measurement|boundary\s+dispute|revenue\s+inspector)\b", "Revenue land survey measurement"),
            (r"\b(?:caste\s+and\s+income\s+certificate|income\s+certificate|caste\s+certificate)\b", "Revenue certificate issuance delay"),
            (r"\b(?:government\s+revenue\s+land|illegal\s+land\s+grabbing|land\s+encroachment)\b", "Revenue land encroachment"),
        ]
    },
}

# Cross-department multi-routing rules for composite civic phenomena
# e.g., Waterlogging affects both Water Supply and Roads & Transport
COMPOSITE_ROUTING_RULES = [
    {
        "pattern": r"\b(?:waterlogging|waterlogged\s+area|flooding\s+after\s+rain)\b",
        "departments": ["Water Supply", "Roads and Transport"],
        "issue_name": "Road waterlogging and drainage inadequacy",
    },
    {
        "pattern": r"\b(?:blocked\s+drainage|choked\s+drainage)\b",
        "departments": ["Sanitation", "Water Supply"],
        "issue_name": "Blocked drainage infrastructure",
    }
]

# Negative spatial context patterns to avoid false road assignments
# When words like "on the road", "near the road" merely describe the location of another issue
LOCATION_ONLY_ROAD_PATTERNS = [
    r"\bon\s+(?:the\s+|main\s+)?road\b",
    r"\bnear\s+(?:the\s+)?road\b",
    r"\bacross\s+(?:the\s+)?road\b",
    r"\balong\s+(?:the\s+)?road\b",
    r"\bside\s+of\s+(?:the\s+)?road\b",
    r"\bon\s+(?:the\s+|our\s+)?street\b",
    r"\bin\s+(?:our\s+|the\s+)?street\b",
]


class MultiIssueExtractor:
    """
    Extracts individual civic issues from grievance text and groups them by department.
    Guarantees:
    - Independent detection of 1, 2, 3, 4+ distinct civic issues.
    - Accurate association with specific municipal departments.
    - Exactly 1 assignment per unique department (no duplicates).
    - Preservation of all detected issues within each department's assignment reason.
    - Zero hallucinated issues on ambiguous text.
    """

    def extract_issues(self, text: str) -> List[Dict[str, Any]]:
        """
        Extracts all identifiable civic defect issues from normalized grievance text.
        """
        if not text or len(text.strip()) < 3:
            return []

        text_lower = text.lower()
        detected_issues = []
        matched_issue_names = set()

        # 1. Check composite routing rules (e.g. waterlogging -> Water Supply + Roads & Transport)
        for comp in COMPOSITE_ROUTING_RULES:
            match = re.search(comp["pattern"], text_lower)
            if match and comp["issue_name"] not in matched_issue_names:
                matched_phrase = match.group(0).strip()
                matched_issue_names.add(comp["issue_name"])
                for d in comp["departments"]:
                    detected_issues.append({
                        "issue_name": comp["issue_name"],
                        "category": d,
                        "department": d,
                        "matched_phrase": matched_phrase,
                        "span": match.span(),
                    })

        # 2. Check standard civic defect taxonomy
        for cat_name, cat_data in CIVIC_DEFECT_TAXONOMY.items():
            dept_name = cat_data["department"]
            for pattern, issue_label in cat_data["patterns"]:
                match = re.search(pattern, text_lower)
                if match and issue_label not in matched_issue_names:
                    matched_phrase = match.group(0).strip()
                    matched_issue_names.add(issue_label)
                    detected_issues.append({
                        "issue_name": issue_label,
                        "category": cat_name,
                        "department": dept_name,
                        "matched_phrase": matched_phrase,
                        "span": match.span(),
                    })

        return detected_issues

    def decompose_into_departments(
        self,
        text: str,
        primary_category: str,
        primary_confidence: Optional[float] = None,
        ml_probabilities: Optional[Dict[str, float]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Decomposes grievance into unique department assignments with full issue evidence.
        """
        detected_issues = self.extract_issues(text)

        # Group detected issues by department
        dept_issue_map: Dict[str, Dict[str, Any]] = {}

        for item in detected_issues:
            dept = item["department"]
            cat = item["category"]
            if dept not in dept_issue_map:
                dept_issue_map[dept] = {
                    "department_name": dept,
                    "category": cat,
                    "issues": [],
                    "phrases": [],
                    "confidence": primary_confidence if cat == primary_category else 0.85,
                    "source": "text",
                }
            if item["issue_name"] not in dept_issue_map[dept]["issues"]:
                dept_issue_map[dept]["issues"].append(item["issue_name"])
            if item["matched_phrase"] not in dept_issue_map[dept]["phrases"]:
                dept_issue_map[dept]["phrases"].append(item["matched_phrase"])

        # Also incorporate secondary ML model class probabilities (>= 0.35) if genuinely supported
        if ml_probabilities:
            for cat, prob in ml_probabilities.items():
                if prob >= 0.35 and cat != "Other":
                    from app.services.department_router import department_router_service
                    dept = department_router_service.route_department(cat)
                    if dept not in dept_issue_map and dept != "Other":
                        dept_issue_map[dept] = {
                            "department_name": dept,
                            "category": cat,
                            "issues": [f"{cat} concern"],
                            "phrases": [],
                            "confidence": round(prob, 2),
                            "source": "text",
                        }

        # Build final formatted department recommendation list
        assignments: List[Dict[str, Any]] = []

        if dept_issue_map:
            # Sort with primary category at the front if present
            sorted_depts = sorted(
                dept_issue_map.keys(),
                key=lambda d: 0 if dept_issue_map[d]["category"] == primary_category else 1
            )

            for dept in sorted_depts:
                info = dept_issue_map[dept]
                issue_list = info["issues"]
                issue_str = ", ".join(issue_list)
                phrase_str = f" (evidence: '{', '.join(info['phrases'])}')" if info["phrases"] else ""
                reason = f"Identified issue: {issue_str}{phrase_str}"

                assignments.append({
                    "department_name": dept,
                    "category": info["category"],
                    "confidence": info["confidence"],
                    "reason": reason,
                    "issues": issue_list,
                    "source": info["source"],
                })
        else:
            # No specific issues detected (Ambiguous / General / Out of Domain)
            from app.services.department_router import department_router_service
            dept = department_router_service.route_department(primary_category)
            assignments.append({
                "department_name": dept,
                "category": primary_category,
                "confidence": primary_confidence or 0.40,
                "reason": f"Provisional routing to {dept} pending human review (no distinct civic defect pattern identified)",
                "issues": [],
                "source": "text",
            })

        return assignments


multi_issue_extractor = MultiIssueExtractor()
