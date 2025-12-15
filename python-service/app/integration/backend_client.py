"""
Backend client for communication with Go service
"""
import logging
import httpx
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class BackendClient:
    """
    Client for communicating with Go backend service
    """
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize backend client
        
        Args:
            base_url: Base URL of Go backend service
        """
        self.base_url = base_url or settings.BACKEND_URL
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=30.0
        )
    
    async def send_token_callback(
        self,
        session_id: str,
        token: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send token callback to Go backend (if needed)
        
        Args:
            session_id: Chat session ID
            token: Generated token
            metadata: Additional metadata
        
        Returns:
            True if successful
        """
        try:
            # This endpoint would be used if Go backend needs callbacks
            # For now, Go backend handles streaming directly
            # This is a placeholder for future use
            pass
        except Exception as e:
            logger.error(f"Failed to send callback: {e}", exc_info=True)
            return False
    
    async def close(self) -> None:
        """
        Close HTTP client
        """
        await self.client.aclose()

