"""
Data Transfer Objects for API requests and responses
"""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class MessageDTO(BaseModel):
    """
    Message DTO for conversation history
    """
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class GenerationRequest(BaseModel):
    """
    Request for text generation
    """
    prompt: str = Field(..., description="User prompt")
    history: Optional[List[MessageDTO]] = Field(
        default=None,
        description="Conversation history"
    )
    model: Optional[str] = Field(
        default=None,
        description="Model name (optional, uses default if not specified)"
    )


class TokenResponse(BaseModel):
    """
    Token response for streaming
    """
    type: str = Field(..., description="Response type: 'token' or 'complete'")
    content: str = Field(..., description="Token content or full response")
    tokens: Optional[int] = Field(default=None, description="Total tokens generated")


class GenerationResponse(BaseModel):
    """
    Response for synchronous generation
    """
    response: str = Field(..., description="Generated response")
    tokens: int = Field(..., description="Number of tokens generated")


class EmbeddingRequest(BaseModel):
    """
    Request for embedding generation
    """
    text: str = Field(..., description="Text to embed")
    model: Optional[str] = Field(
        default=None,
        description="Model name (optional)"
    )


class EmbeddingResponse(BaseModel):
    """
    Response for embedding generation
    """
    embedding: List[float] = Field(..., description="Embedding vector")
    dimensions: int = Field(..., description="Embedding dimensions")

