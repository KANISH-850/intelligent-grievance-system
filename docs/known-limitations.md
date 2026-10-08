# System Limitations & Future Scope Documentation

**Project:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework  
**Document Version:** 1.0  
**Phase:** Phase 13 Final System Integration  

---

## 1. Technical & Architecture Limitations

### 1.1 Machine Learning Model Scope
- **Classifier**: TF-IDF (Term Frequency-Inverse Document Frequency) vectorization with Logistic Regression.
- **Limitation**: While lightweight and highly explainable, n-gram TF-IDF representations do not capture deep contextual semantics or long-range dependencies in complex, highly ambiguous sentence structures.
- **Academic Disclaimer**: The current system does NOT implement Transformer architectures (BERT, RoBERTa, GPT) or Large Language Models (LLMs).

### 1.2 Multilingual & Translation Capabilities
- **Language Detection**: Powered by `langdetect` for ISO-639-1 code identification (English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati).
- **Limitation**: The system does NOT integrate production neural machine translation engines (such as IndicTrans2 or Google Translate API). Regional language grievances are analyzed using language-specific keyword features or fallback rule sets, preserving original text without automatic deep translation.

### 1.3 Chatbot Scope
- **Pattern Matching & Intent Engine**: Operates via explicit rule-based regex intent matching and entity extraction for grievance reference codes (`GRV-\d{4}-\d{5}`).
- **Limitation**: The chatbot is not a generative conversational AI. Unrecognized queries outside configured intent schemas fall back to predefined helpful guidance.

### 1.4 Notification & Communication Channels
- **In-App Notifications**: Workflow triggers deliver notifications within the React web interface.
- **Limitation**: Direct external SMS (e.g., Twilio/NIC SMS gateway) and email (SMTP) dispatchers are mocked/simulated and not connected to live telecommunication infrastructure.

---

## 2. Recommended Future Enhancements

1. **Transformer-Based Neural NLP**:
   - Upgrade classification engine from TF-IDF + Logistic Regression to fine-tuned `IndicBERT` or `mBERT` embeddings for deep Indic semantic understanding.

2. **Neural Machine Translation Integration**:
   - Integrate open-source `IndicTrans2` model within the FastAPI microservice for high-fidelity translation from 22 official Indic languages into English.

3. **Active Learning & Automated Model Retraining**:
   - Implement an automated retraining pipeline that periodically collects human-corrected classifications (`is_human_corrected == true`) to re-fit TF-IDF weights.

4. **Multi-Channel Dispatch & Telephony Integration**:
   - Connect SMS/WhatsApp Webhook APIs for real-time citizen alerts and voice-bot grievance submission for low-literacy populations.
