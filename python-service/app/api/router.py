"""
API router with all endpoints
"""
from fastapi import APIRouter

from app.api.endpoints import generate, embeddings

router = APIRouter()

# Include endpoint routers
router.include_router(generate.router, prefix="/generate", tags=["generation"])
router.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])

