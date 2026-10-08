from fastapi import APIRouter
from app.routes.health import router as health_router
from app.routes.analyze import router as analyze_router
from app.routes.chatbot import router as chatbot_router

api_router = APIRouter()

# Include routers
api_router.include_router(health_router)
api_router.include_router(analyze_router)
api_router.include_router(chatbot_router)

