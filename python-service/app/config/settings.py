"""
Application settings and configuration
"""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    DEBUG: bool = False
    
    # Note: CORS is not configured here as this is an internal service
    # Only the Go backend communicates with this service
    # CORS is handled by the Go backend for client requests
    
    # Model settings
    MODEL_NAME: str = "Qwen/Qwen2.5-3B-Instruct"  # For 7B: "Qwen/Qwen2.5-7B-Instruct"
    HUGGINGFACE_TOKEN: str = ""
    DEVICE: str = "cuda"  # or "cpu"
    QUANTIZATION: str = "none"  # "4bit" (for 7B), "8bit", or "none" (for 3B)
    DTYPE: str = "bfloat16"  # "float16", "bfloat16" (recommended for Qwen), or "float32"
    
    # Generation settings
    MAX_NEW_TOKENS: int = 512
    TEMPERATURE: float = 0.6  # Balanced for chat
    TOP_P: float = 0.9
    REPETITION_PENALTY: float = 1.1
    CONTEXT_WINDOW: int = 32768  # Qwen 2.5 supports up to 32K context
    
    # Streaming settings
    CHUNK_SIZE: int = 10
    DELAY_MS: int = 50
    BUFFER_SIZE: int = 100
    
    # Backend integration
    BACKEND_URL: str = "http://localhost:8080"
    
    # Model config file path
    MODEL_CONFIG_PATH: str = "config/model_config.yaml"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    """
    return Settings()

