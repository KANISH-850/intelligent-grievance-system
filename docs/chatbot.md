# Citizen Multilingual AI Assistant Architecture (Phase 12)

## 1. Executive Summary
The Intelligent Citizen Chatbot is an intent-driven, multilingual conversational assistant integrated into Central Government Grievance Portals. Upgraded in Phase 12, it provides deterministic intent detection, strict RBAC database isolation, bounded short-term session memory context, department knowledge dispatch, workflow process guidance, and explainable AI (XAI) rationale.

## 2. Architectural Data Flow
```text
Citizen User Query (Web Frontend / Chatbot UI)
       ↓
Language Selector & Input Text
       ↓
POST /api/v1/chatbot/message (Authenticated Node.js Express Gateway)
       ↓ (Fetches authenticated citizen's grievances for data privacy)
POST /chatbot/process (FastAPI Python AI Microservice)
       ↓
1. Language Detector (Polyglot / FastText Language Identification)
       ↓
2. Natural Language Grievance Number Extraction (Regex: GRV-YYYY-XXXXXX)
       ↓
3. Modular Intent Classification Engine (10 Explicit Intents)
       ↓
4. Bounded Session Memory & Contextual Recall
       ↓
5. Authenticated Grievance Database Lookup (Strict Citizen Ownership Isolation)
       ↓
6. Structured Response Generation & Translation Fallback
       ↓
Citizen Interface (Formatted Markdown + Interactive Grievance Status Badges)
```

## 3. Core Principles & Truthful Terminology
- **Architecture Model**: Intent-based multilingual citizen assistance chatbot.
- **Language Detection**: Empirical language identification supporting 11 official Indian languages.
- **Translation Model**: Standard baseline/fallback translation layer (No false claims of neural IndicTrans2 or generative LLM fine-tuning).
- **Data Security**: Strict citizen privacy enforcement where Citizen A can never query Citizen B's complaint details.
- **Response Safety**: Zero hallucination on grievance status, officer identities, or unsupported government contact numbers.
