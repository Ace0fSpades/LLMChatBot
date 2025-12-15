"""
Main FastAPI application entry point
"""
import asyncio
import logging

from fastapi import FastAPI

from app.api import router as api_router
from app.config import settings
from app.monitoring import setup_logging, setup_metrics

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LLM Chat Service",
    description="Python microservice for LLM inference (internal service)",
    version="1.0.0"
)

# Note: CORS is not needed here as this is an internal service
# Only the Go backend communicates with this service
# CORS is configured on the Go backend which handles client requests

# Setup logging and metrics
setup_logging()
setup_metrics(app)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """
    Startup event: Pre-load model before accepting requests
    """
    logger.info("Starting up ML service...")
    
    try:
        from app.model.manager import ModelManager
        
        # Get model manager instance
        manager = ModelManager.get_instance()
        
        # Pre-load model in background to avoid blocking startup
        logger.info("Pre-loading model in background...")
        
        def load_model_sync():
            """Load model synchronously in background thread"""
            try:
                manager.load_model()
                logger.info("Model loaded successfully during startup")
            except Exception as e:
                logger.error(f"Failed to load model during startup: {e}", exc_info=True)
        
        # Run model loading in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, load_model_sync)
        
        logger.info("Startup completed")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}", exc_info=True)
        # Don't fail startup, model will be loaded on first request
        logger.warning("Model will be loaded on first request")


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    from app.model.manager import ModelManager
    
    manager = ModelManager.get_instance()
    status = {
        "status": "healthy",
        "model_loaded": manager.is_model_loaded(),
        "device": manager.get_device() if manager.is_model_loaded() else None
    }
    
    return status


@app.get("/metrics")
async def get_metrics():
    """
    Metrics endpoint for Prometheus
    """
    from app.monitoring import get_metrics
    
    return get_metrics()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

