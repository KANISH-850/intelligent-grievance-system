import os
import re
import random
import pandas as pd
from typing import List, Dict

# Set fixed random seed for reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

CATEGORIES = [
    "Water Supply",
    "Electricity",
    "Roads and Transport",
    "Healthcare",
    "Education",
    "Sanitation",
    "Municipal Services",
    "Revenue",
    "Other"
]

PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# Realistic synthetic dataset seed templates for each category
TEMPLATES: Dict[str, List[Dict[str, str]]] = {
    "Water Supply": [
        {"text": "No water supply in Ward 12 for the past 4 days. Drinking water pipeline seems broken.", "priority": "HIGH"},
        {"text": "Contaminated yellowish water coming from tap in Shastri Nagar. Children falling sick.", "priority": "CRITICAL"},
        {"text": "Low water pressure in 3rd Floor, Green Park Apartments since last week.", "priority": "MEDIUM"},
        {"text": "Requesting new domestic water connection application status update.", "priority": "LOW"},
        {"text": "Major water pipe burst near main crossroad, thousands of gallons wasted and road flooded.", "priority": "CRITICAL"},
        {"text": "Water bill incorrect for consumer ID W-98421. Overcharged by Rs 2500.", "priority": "LOW"},
        {"text": "Irregular municipal water supply timings in Block B, Janakpuri.", "priority": "MEDIUM"},
        {"text": "Sewage water mixing with drinking water line near community center.", "priority": "CRITICAL"},
        {"text": "Public water fountain in sector park is leaking continuously.", "priority": "LOW"},
        {"text": "Water tanker not arrived despite booking paid three days ago.", "priority": "HIGH"},
    ],
    "Electricity": [
        {"text": "Frequent unannounced power outages occurring daily from 2 PM to 6 PM in Sector 15.", "priority": "MEDIUM"},
        {"text": "Transformer sparked and caught fire near residential building, live wire dangling on street.", "priority": "CRITICAL"},
        {"text": "Voltage fluctuations damaged home electronics appliances like refrigerator and AC.", "priority": "HIGH"},
        {"text": "High electricity bill generated for closed house during vacation period.", "priority": "LOW"},
        {"text": "Electric pole bent dangerously after heavy storm near primary school gate.", "priority": "CRITICAL"},
        {"text": "Street lights not working on Main Ring Road for over two weeks.", "priority": "MEDIUM"},
        {"text": "Delay in installing new smart meter for application number ELEC-2026-44.", "priority": "LOW"},
        {"text": "Low voltage issue in rural feeder line causing irrigation pump failure.", "priority": "HIGH"},
        {"text": "Electricity meter box uncovered and exposed to rain water near market entry.", "priority": "HIGH"},
        {"text": "No electricity in entire colony since 10 PM yesterday despite multiple calls.", "priority": "HIGH"},
    ],
    "Roads and Transport": [
        {"text": "Deep dangerous potholes on MG Road causing frequent accidents and traffic congestion.", "priority": "HIGH"},
        {"text": "Bridge expansion joint loose and creating severe vibration for heavy vehicles.", "priority": "CRITICAL"},
        {"text": "Public bus service route 45 cancelled without prior notice during morning peak hours.", "priority": "MEDIUM"},
        {"text": "Speed breaker required near government high school zone to prevent rash driving.", "priority": "LOW"},
        {"text": "Traffic light signal out of order at Major Intersection causing gridlock.", "priority": "MEDIUM"},
        {"text": "Road resurfacing work left incomplete with loose gravel left everywhere.", "priority": "MEDIUM"},
        {"text": "Illegal parking blocking pedestrian footpath near metro station exit.", "priority": "LOW"},
        {"text": "Overloaded dump trucks causing road collapse near river bridge construction site.", "priority": "CRITICAL"},
        {"text": "Lack of proper street signage and reflectors on bypass highway curve.", "priority": "LOW"},
        {"text": "Drains along arterial road clogged causing severe waterlogging during rain.", "priority": "HIGH"},
    ],
    "Healthcare": [
        {"text": "Primary Health Centre lacks essential emergency medicines and life-saving drugs.", "priority": "CRITICAL"},
        {"text": "Government hospital doctor absent during duty hours in casualty department.", "priority": "CRITICAL"},
        {"text": "Ambulance helpline 108 did not respond for over 45 minutes during medical emergency.", "priority": "CRITICAL"},
        {"text": "Cleanliness and hygiene conditions in ward 4 of district hospital are extremely poor.", "priority": "HIGH"},
        {"text": "X-ray machine out of service for two weeks in community health post.", "priority": "MEDIUM"},
        {"text": "Complaining against rude behavior of staff at blood bank desk.", "priority": "LOW"},
        {"text": "Non-availability of anti-rabies vaccine after dog bite incident.", "priority": "HIGH"},
        {"text": "Requesting medical reimbursement status for Ayushman Bharat card claim.", "priority": "LOW"},
        {"text": "Sub-standard food provided to admitted patients in maternity ward.", "priority": "HIGH"},
        {"text": "Doctor asking for extra fee payment outside official prescription billing.", "priority": "HIGH"},
    ],
    "Education": [
        {"text": "Government school building roof leaking severely and ceiling plaster falling in classroom.", "priority": "CRITICAL"},
        {"text": "Lack of functional toilets for girl students in District High School.", "priority": "HIGH"},
        {"text": "Mid-day meal quality provided to elementary students is stale and unsafe.", "priority": "CRITICAL"},
        {"text": "Shortage of mathematics and science teachers in senior secondary school for 6 months.", "priority": "MEDIUM"},
        {"text": "Free textbook distribution delayed for academic session 2026-27.", "priority": "LOW"},
        {"text": "Computer lab equipment non-functional and lacking internet connection.", "priority": "LOW"},
        {"text": "RTE admission application rejected without valid reason by private school.", "priority": "MEDIUM"},
        {"text": "Playground encroached by local construction material dumping.", "priority": "LOW"},
        {"text": "Scholarship disbursement delayed for SC ST welfare students.", "priority": "MEDIUM"},
        {"text": "Drinking water filter in primary school out of order.", "priority": "MEDIUM"},
    ],
    "Sanitation": [
        {"text": "Garbage overflow from community dustbin spreading terrible foul smell and flies.", "priority": "HIGH"},
        {"text": "Door-to-door waste collection vehicle has not visited area for past 5 days.", "priority": "MEDIUM"},
        {"text": "Open sewage drain overflowing onto main street creating severe health hazard.", "priority": "CRITICAL"},
        {"text": "Public toilet in bus stand premises filthy, clogged, and lacks water.", "priority": "HIGH"},
        {"text": "Decomposing animal carcass lying on road side near market area.", "priority": "HIGH"},
        {"text": "Sanitation workers burning dry leaves and plastic waste causing toxic smoke.", "priority": "MEDIUM"},
        {"text": "Drain cleaning debris left on roadside without removal.", "priority": "LOW"},
        {"text": "Mosquito breeding in stagnant water near residential colony leading to dengue cases.", "priority": "HIGH"},
        {"text": "Commercial shop dumping chemical waste directly into public storm drain.", "priority": "CRITICAL"},
        {"text": "Requesting extra dustbin placement near vegetable market.", "priority": "LOW"},
    ],
    "Municipal Services": [
        {"text": "Delay in issuance of birth certificate after submission of all documents 30 days ago.", "priority": "LOW"},
        {"text": "Property tax online payment portal showing error and transaction failed status.", "priority": "LOW"},
        {"text": "Encroachment on municipal public park land by private vendor structure.", "priority": "MEDIUM"},
        {"text": "Stray dog menace in residential colony with multiple biting incidents reported.", "priority": "HIGH"},
        {"text": "Trade license renewal application pending approval for 2 months.", "priority": "LOW"},
        {"text": "Dangerous dead tree branch hanging over road needing immediate trimming.", "priority": "HIGH"},
        {"text": "Building plan sanction approval delayed past statutory period.", "priority": "MEDIUM"},
        {"text": "Noise pollution from unauthorized commercial loudspeakers late at night.", "priority": "MEDIUM"},
        {"text": "Death certificate correction request pending at zonal ward office.", "priority": "LOW"},
        {"text": "Illegal hoarding board installed without municipal permit blocking traffic view.", "priority": "LOW"},
    ],
    "Revenue": [
        {"text": "Land survey measurement application pending with revenue inspector for 3 months.", "priority": "MEDIUM"},
        {"text": "Bribery demand by patwari for updating land record mutation entry.", "priority": "CRITICAL"},
        {"text": "Errors in land ownership record (Khatauni) after digital record migration.", "priority": "HIGH"},
        {"text": "Delay in issuing caste and domicile certificates required for college admission.", "priority": "MEDIUM"},
        {"text": "Stamp duty refund request pending with Treasury department.", "priority": "LOW"},
        {"text": "Encroachment on government revenue land by local land mafia.", "priority": "HIGH"},
        {"text": "Encumbrance certificate issuance online portal server error.", "priority": "LOW"},
        {"text": "Crop damage compensation assessment not completed by revenue officer.", "priority": "HIGH"},
        {"text": "Discrepancy in property valuation rate calculated for registration fee.", "priority": "LOW"},
        {"text": "Land boundary dispute resolution meeting postponed repeatedly.", "priority": "MEDIUM"},
    ],
    "Other": [
        {"text": "Cyber fraud complaint regarding unauthorized UPI debit transaction from bank account.", "priority": "CRITICAL"},
        {"text": "Ration card member addition application pending at food supply office.", "priority": "LOW"},
        {"text": "LPG cooking gas cylinder delivery delayed by over 10 days.", "priority": "MEDIUM"},
        {"text": "Pension payment not credited to senior citizen account for 2 consecutive months.", "priority": "HIGH"},
        {"text": "Public park maintenance and grass cutting neglected by horticulture division.", "priority": "LOW"},
        {"text": "Telecom tower radiation concern near residential apartment building.", "priority": "LOW"},
        {"text": "RTI application response not provided within 30 days statutory limit.", "priority": "MEDIUM"},
        {"text": "Consumer grievance regarding defective electronic product sold by store.", "priority": "LOW"},
        {"text": "Employment exchange registration card renewal portal link broken.", "priority": "LOW"},
        {"text": "Pollution control board complaint regarding factory noise and smoke emissions.", "priority": "HIGH"},
    ]
}

# Variations and augmentation phrases to create realistic multi-sample dataset
AUGMENTATIONS = [
    "Kindly look into this matter urgently.",
    "Multiple reminders submitted to local ward officer but no action taken.",
    "Citizens in our locality are suffering great inconvenience.",
    "Requesting immediate intervention from higher authorities.",
    "Please send inspection team at the earliest.",
    "This issue has been persisting for several weeks now.",
    "Please resolve this issue as soon as possible.",
    "Reference previous complaint number submitted last month.",
    "Area residents have filed joint representation regarding this.",
    "Hoping for a quick resolution from government portal."
]

def generate_synthetic_dataset(target_per_category: int = 75) -> pd.DataFrame:
    rows = []
    
    for cat, items in TEMPLATES.items():
        base_count = len(items)
        for i in range(target_per_category):
            template = items[i % base_count]
            base_text = template["text"]
            prio = template["priority"]
            
            # Apply slight variation to create realistic dataset
            if i >= base_count:
                aug = random.choice(AUGMENTATIONS)
                text = f"{base_text} {aug}"
            else:
                text = base_text
                
            rows.append({
                "text": text,
                "category": cat,
                "priority": prio,
                "is_synthetic": True
            })
            
    df = pd.DataFrame(rows)
    # Clean text
    df["text"] = df["text"].apply(lambda t: re.sub(r'\s+', ' ', t).strip())
    # Shuffle
    df = df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
    return df

def main():
    print("=" * 60)
    print("PHASE 10 — DATASET PREPARATION & PREPROCESSING")
    print("=" * 60)

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "grievance-classification"))
    os.makedirs(os.path.join(output_dir, "raw"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "processed"), exist_ok=True)

    print(f"Generating synthetic academic dataset (75 examples per category)...")
    df = generate_synthetic_dataset(target_per_category=75)
    total_samples = len(df)
    print(f"Total grievance samples generated: {total_samples}")

    # Validate categories
    for cat in df["category"].unique():
        assert cat in CATEGORIES, f"Invalid category: {cat}"

    # Split dataset: 70% train, 15% validation, 15% test
    n_train = int(total_samples * 0.70)
    n_val = int(total_samples * 0.15)
    
    train_df = df.iloc[:n_train].reset_index(drop=True)
    val_df = df.iloc[n_train:n_train + n_val].reset_index(drop=True)
    test_df = df.iloc[n_train + n_val:].reset_index(drop=True)

    # Save split files
    train_path = os.path.join(output_dir, "train.csv")
    val_path = os.path.join(output_dir, "validation.csv")
    test_path = os.path.join(output_dir, "test.csv")
    full_path = os.path.join(output_dir, "processed", "full_dataset.csv")

    df.to_csv(full_path, index=False)
    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    print("\nDataset split complete:")
    print(f" - Full Dataset : {len(df)} samples ({full_path})")
    print(f" - Train Set    : {len(train_df)} samples (70%) -> {train_path}")
    print(f" - Validation   : {len(val_df)} samples (15%) -> {val_path}")
    print(f" - Test Set     : {len(test_df)} samples (15%) -> {test_path}")

    print("\nCategory Distribution (Full Dataset):")
    print(df["category"].value_counts())

    print("\nPriority Distribution (Full Dataset):")
    print(df["priority"].value_counts())

    # Write README.md
    readme_path = os.path.join(output_dir, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(f"""# Grievance Classification Dataset

## Overview
This dataset contains academic synthetic citizen grievances curated for the **Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals**.

All records are explicitly marked as synthetic data (`is_synthetic=True`).

## Dataset Metrics
- **Total Samples:** {total_samples}
- **Train Set (70%):** {len(train_df)}
- **Validation Set (15%):** {len(val_df)}
- **Test Set (15%):** {len(test_df)}
- **Random Seed:** {RANDOM_SEED}

## Categories ({len(CATEGORIES)})
1. Water Supply
2. Electricity
3. Roads and Transport
4. Healthcare
5. Education
6. Sanitation
7. Municipal Services
8. Revenue
9. Other

## Priority Levels
- LOW
- MEDIUM
- HIGH
- CRITICAL
""")

    print(f"\nDataset documentation saved to: {readme_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
