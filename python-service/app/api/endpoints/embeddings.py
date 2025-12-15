"""
Embeddings endpoints for future RAG functionality
"""
import logging
from fastapi import APIRouter, HTTPException

from app.api.dto import EmbeddingRequest, EmbeddingResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest):
    """
    Create embeddings for text (placeholder for future RAG)
    
    Args:
        request: Embedding request with text
    
    Returns:
        Embedding vector
    """
    # TODO: Implement embedding generation when RAG is needed
    # For now, return placeholder
    raise HTTPException(
        status_code=501,
        detail="Embeddings endpoint not yet implemented"
    )

