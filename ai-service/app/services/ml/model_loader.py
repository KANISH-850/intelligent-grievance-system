import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("ai_service.ml_loader")

class ModelLoaderSingleton:
    """
    Singleton Loader for ML Model Artifacts.
    Loads trained scikit-learn / transformer models once on startup,
    maintaining singleton in memory to ensure fast zero-latency inference.
    Falls back gracefully if model files are missing or corrupted.
    """
    _instance: Optional['ModelLoaderSingleton'] = None
    _model: Any = None
    _config: Optional[Dict[str, Any]] = None
    _loaded: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoaderSingleton, cls).__new__(cls)
        return cls._instance

    def load_model(self, force_reload: bool = False) -> bool:
        if self._loaded and not force_reload:
            return True

        model_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "grievance-classifier")
        )
        model_path = os.path.join(model_dir, "model.joblib")
        config_path = os.path.join(model_dir, "config.json")

        if not os.path.exists(model_path):
            logger.warning(f"ML Model file not found at {model_path}. Fallback rule-based classifier will be used.")
            self._loaded = False
            self._model = None
            self._config = None
            return False

        try:
            import joblib
            self._model = joblib.load(model_path)
            
            if os.path.exists(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    self._config = json.load(f)
            else:
                self._config = {"model_type": "tfidf-logistic-regression"}

            self._loaded = True
            logger.info(f"Successfully loaded ML model pipeline from {model_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to load ML model from {model_path}: {e}. Enabling rule-based fallback.")
            self._loaded = False
            self._model = None
            self._config = None
            return False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model(self) -> Any:
        return self._model

    @property
    def config(self) -> Optional[Dict[str, Any]]:
        return self._config

model_loader = ModelLoaderSingleton()
