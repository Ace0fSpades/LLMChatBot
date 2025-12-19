"""
Generation endpoints for text generation
"""
import json
import logging
from typing import List, Dict

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.api.dto import (
    GenerationRequest,
    GenerationResponse,
    TokenResponse,
    MessageDTO
)
from app.service import InferenceService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=GenerationResponse)
async def generate_completion(request: GenerationRequest):
    """
    Synchronous text generation endpoint (for testing)
    
    Args:
        request: Generation request with prompt and history
    
    Returns:
        Generated response
    """
    try:
        service = InferenceService()
        
        # Convert DTOs to dict format
        history = None
        if request.history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.history
            ]
        
        # Generate response
        response = await service.generate(request.prompt, history)
        
        # Count tokens (approximate)
        tokenizer = service.get_tokenizer()
        tokens = len(tokenizer.encode(response))
        
        return GenerationResponse(
            response=response,
            tokens=tokens
        )
    
    except Exception as e:
        logger.error(f"Error in generate_completion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_completion(request: GenerationRequest):
    """
    Streaming text generation endpoint
    Returns newline-delimited JSON for Go backend compatibility
    
    Args:
        request: Generation request with prompt and history
    
    Returns:
        Streaming response with newline-delimited JSON
    """
    from fastapi.responses import StreamingResponse
    
    async def json_stream_generator():
        """
        Generator for newline-delimited JSON stream
        """
        service = InferenceService()
        
        # Convert DTOs to dict format
        history = None
        if request.history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.history
            ]
        
        # Track full response and token count
        full_response = ""
        token_count = 0
        tokenizer = service.get_tokenizer()
        has_tokens = False
        
        try:
            # Stream tokens
            async for token_chunk in service.generate_stream(request.prompt, history):
                has_tokens = True
                full_response += token_chunk
                token_count += len(tokenizer.encode(token_chunk))
                
                # Send token chunk as JSON line
                token_response = TokenResponse(
                    type="token",
                    content=token_chunk,
                    tokens=token_count
                )
                
                yield json.dumps(token_response.dict()) + "\n"
            
            # Always send completion signal if we have tokens
            # This is critical for proper stream termination
            if has_tokens:
                completion_response = TokenResponse(
                    type="complete",
                    content=full_response,
                    tokens=token_count
                )
                yield json.dumps(completion_response.dict()) + "\n"
            else:
                # Even if no tokens, send empty completion to signal end of stream
                completion_response = TokenResponse(
                    type="complete",
                    content="",
                    tokens=0
                )
                yield json.dumps(completion_response.dict()) + "\n"
        
        except GeneratorExit:
            # Client disconnected - this is normal, just log and exit
            logger.info("Client disconnected during streaming")
            raise
        except Exception as e:
            logger.error(f"Error in stream_completion: {e}", exc_info=True)
            # If we have partial response, send it as complete (incomplete) before error
            if has_tokens and full_response:
                try:
                    completion_response = TokenResponse(
                        type="complete",
                        content=full_response,
                        tokens=token_count
                    )
                    yield json.dumps(completion_response.dict()) + "\n"
                except GeneratorExit:
                    # Client already disconnected, just exit
                    raise
            else:
                # Only send error if we have no tokens
                try:
                    error_response = TokenResponse(
                        type="error",
                        content=str(e)
                    )
                    yield json.dumps(error_response.dict()) + "\n"
                except GeneratorExit:
                    # Client already disconnected, just exit
                    raise
    
    response = StreamingResponse(
        json_stream_generator(),
        media_type="application/x-ndjson",
        headers={
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
    
    # Ensure response is properly closed after streaming
    return response


@router.websocket("/ws")
async def websocket_generate(websocket):
    """
    WebSocket endpoint for streaming generation
    
    Args:
        websocket: WebSocket connection
    """
    from fastapi import WebSocket
    
    await websocket.accept()
    
    try:
        # Receive request
        data = await websocket.receive_json()
        request = GenerationRequest(**data)
        
        service = InferenceService()
        
        # Convert DTOs to dict format
        history = None
        if request.history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.history
            ]
        
        # Track full response
        full_response = ""
        token_count = 0
        tokenizer = service.get_tokenizer()
        
        # Stream tokens
        async for token_chunk in service.generate_stream(request.prompt, history):
            full_response += token_chunk
            token_count += len(tokenizer.encode(token_chunk))
            
            # Send token chunk
            token_response = TokenResponse(
                type="token",
                content=token_chunk,
                tokens=token_count
            )
            
            await websocket.send_json(token_response.dict())
        
        # Send completion
        completion_response = TokenResponse(
            type="complete",
            content=full_response,
            tokens=token_count
        )
        
        await websocket.send_json(completion_response.dict())
    
    except Exception as e:
        logger.error(f"Error in websocket_generate: {e}", exc_info=True)
        error_response = TokenResponse(
            type="error",
            content=str(e)
        )
        await websocket.send_json(error_response.dict())
    
    finally:
        await websocket.close()

