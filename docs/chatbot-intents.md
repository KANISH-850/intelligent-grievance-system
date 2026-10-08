# Chatbot Intent Detection & Specification (Phase 12)

## 1. Supported Intent Taxonomies
The Phase 12 chatbot engine classifies user queries into 10 explicit operational intents:

| Intent ID | Description | Sample Citizen Query | Response Behavior |
| :--- | :--- | :--- | :--- |
| `GREETING` | Citizen greetings & introductory menu | *"Namaste", "Hello", "Good morning"* | Welcome message & interactive capability overview |
| `GRIEVANCE_STATUS` | Querying status of a specific or recent complaint | *"What is the status of GRV-2026-123456?"* | Database lookup filtered by citizen ownership |
| `GRIEVANCE_DETAILS` | Querying specific details or timeline of a complaint | *"When was GRV-2026-123456 submitted?"* | Detailed creation timestamp, category & department |
| `SUBMIT_GRIEVANCE_GUIDANCE` | Instructions on how to file a new complaint | *"How do I submit a complaint?"* | Step-by-step portal submission guide |
| `DEPARTMENT_INFORMATION` | Guidance on 9 Central Departments | *"Which department handles electricity?"* | Department description & typical complaint examples |
| `PRIORITY_INFORMATION` | Explanation of priority levels | *"How is priority assigned?"* | Explanation of CRITICAL, HIGH, MEDIUM, LOW tiers |
| `PROCESS_INFORMATION` | 9-step automated framework workflow | *"How does this system work?"* | Detailed 9-step processing workflow |
| `TRACKING_GUIDANCE` | Guidance on GRV tracking numbers | *"How to track my application?"* | Reference number format & tracking navigation |
| `HELP` | Assistance menu & quick options | *"Help me", "What can you do?"* | List of supported quick actions & prompts |
| `UNKNOWN` | Out-of-domain / unanswerable queries | *"Who won yesterday's cricket match?"* | Safe fallback message without hallucination |

## 2. Intent Detection Algorithm
Intent classification uses modular regex pattern matching combined with lightweight structural intent evaluation.
- High-confidence pattern matching evaluates explicit keywords (e.g., `priority`, `department`, `GRV-2026-XXXXXX`).
- Grievance reference number extraction takes precedence for authenticated status queries.
- Out-of-domain queries fallback cleanly to `UNKNOWN` intent with a structured assistance guide.
