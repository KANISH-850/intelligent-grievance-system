import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.routes import api_router
from app.services.ml.model_loader import model_loader

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_service")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microservice providing NLP processing, language detection, classification, priority prediction, and department routing for citizen grievances.",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def startup_event():
    logger.info("Initializing AI Microservice & loading ML model singleton...")
    success = model_loader.load_model()
    if success:
        logger.info("ML classification model loaded successfully.")
    else:
        logger.warning("ML model could not be loaded. Rule-based baseline fallback is active.")

# Custom exception handler for Pydantic validation errors (422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_msg = errors[0].get("msg", "Invalid input data") if errors else "Invalid request input."
    logger.warning(f"Request validation failed for {request.url}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": error_msg}
    )

# Custom exception handler for unhandled server errors (500)
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred while processing the request."}
    )

# Include API routes (both /health and /analyze mounted at root as well as standard routes)
app.include_router(api_router)
