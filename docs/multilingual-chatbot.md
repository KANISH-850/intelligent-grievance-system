# Multilingual Intelligence & Translation Fallback Architecture

## 1. Supported Languages
The chatbot supports 11 official Indian languages:
1. English
2. Tamil (தமிழ்)
3. Hindi (हिन्दी)
4. Telugu (తెలుగు)
5. Kannada (ಕನ್ನಡ)
6. Malayalam (മലയാളം)
7. Bengali (বাংলা)
8. Gujarati (ગુજરાતી)
9. Marathi (मराठी)
10. Punjabi (ਪੰਜਾਬੀ)
11. Urdu (اردو)

## 2. Language Detection & Processing Workflow
1. **Language Identification**: Input text is passed to `language_detector_service` (FastText / Polyglot language detector).
2. **Intent Parsing**: Natural language intent is extracted regardless of input script.
3. **Translation Layer**: If neural translation services (e.g. IndicTrans2) are unavailable or unconfigured, the system explicitly uses the **baseline/fallback translation layer**.
4. **Academic Transparency**: The system honest identifies its translation capabilities as baseline translation fallback without claiming neural IndicTrans2 execution when unavailable.

## 3. Context-Aware Session Memory
- Bounded short-term memory stores recent context (`last_grievance_number`).
- Enables follow-up queries using pronouns (*"When was it submitted?"*, *"Why was it classified under Water Supply?"*).
- Sessions are lightweight and memory-bounded (max 5-10 messages per active citizen session).
