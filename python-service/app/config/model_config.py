"""
Model configuration loader from YAML
"""
import logging
import yaml
from pathlib import Path
from typing import Dict, Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class ModelConfig:
    """
    Model configuration loaded from YAML file
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize model configuration
        
        Args:
            config_path: Path to YAML config file
        """
        config_file = config_path or settings.MODEL_CONFIG_PATH
        
        # Handle both absolute and relative paths
        if Path(config_file).is_absolute():
            self.config_path = Path(config_file)
        else:
            # Try relative to current working directory
            self.config_path = Path(config_file)
            # If not found, try relative to python-service directory
            if not self.config_path.exists():
                # Try from app directory
                app_dir = Path(__file__).parent.parent.parent
                self.config_path = app_dir / config_file
        
        self._config: Dict[str, Any] = {}
        self.load()
    
    def load(self) -> None:
        """
        Load configuration from YAML file
        """
        if not self.config_path.exists():
            # Use default configuration
            logger.warning(f"Config file not found at {self.config_path}, using defaults")
            self._config = self._get_default_config()
            return
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                loaded_config = yaml.safe_load(f)
                self._config = loaded_config if loaded_config is not None else self._get_default_config()
        except Exception as e:
            logger.warning(f"Failed to load config from {self.config_path}: {e}, using defaults")
            self._config = self._get_default_config()
        
        # Ensure _config is never None
        if self._config is None:
            self._config = self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """
        Get default configuration
        """
        return {
            "model": {
                "name": settings.MODEL_NAME,
                "quantization": settings.QUANTIZATION,
                "device": settings.DEVICE,
                "dtype": settings.DTYPE,
                "context_window": settings.CONTEXT_WINDOW,
                "max_new_tokens": settings.MAX_NEW_TOKENS,
                "temperature": settings.TEMPERATURE,
                "top_p": settings.TOP_P,
                "repetition_penalty": settings.REPETITION_PENALTY
            },
            "streaming": {
                "chunk_size": settings.CHUNK_SIZE,
                "delay_ms": settings.DELAY_MS,
                "buffer_size": settings.BUFFER_SIZE
            },
            "prompt_template": self._get_default_prompt_template()
        }
    
    def _get_default_prompt_template(self) -> str:
        """
        Get default prompt template
        """
        return """<|system|>
You are a helpful AI assistant. Answer the user's questions clearly and concisely.

Previous conversation:
{history}

<|user|>
{question}

<|assistant|>
"""
    
    @property
    def model_name(self) -> str:
        """
        Get model name
        """
        if not self._config:
            return settings.MODEL_NAME
        return self._config.get("model", {}).get("name", settings.MODEL_NAME)
    
    @property
    def quantization(self) -> str:
        """
        Get quantization type
        """
        return self._config.get("model", {}).get("quantization", settings.QUANTIZATION)
    
    @property
    def device(self) -> str:
        """
        Get device type
        """
        return self._config.get("model", {}).get("device", settings.DEVICE)
    
    @property
    def dtype(self) -> str:
        """
        Get data type
        """
        return self._config.get("model", {}).get("dtype", settings.DTYPE)
    
    @property
    def max_new_tokens(self) -> int:
        """
        Get max new tokens
        """
        return self._config.get("model", {}).get("max_new_tokens", settings.MAX_NEW_TOKENS)
    
    @property
    def temperature(self) -> float:
        """
        Get temperature
        """
        return self._config.get("model", {}).get("temperature", settings.TEMPERATURE)
    
    @property
    def top_p(self) -> float:
        """
        Get top_p
        """
        return self._config.get("model", {}).get("top_p", settings.TOP_P)
    
    @property
    def repetition_penalty(self) -> float:
        """
        Get repetition penalty
        """
        return self._config.get("model", {}).get("repetition_penalty", settings.REPETITION_PENALTY)
    
    @property
    def context_window(self) -> int:
        """
        Get context window size
        """
        return self._config.get("model", {}).get("context_window", settings.CONTEXT_WINDOW)
    
    @property
    def chunk_size(self) -> int:
        """
        Get streaming chunk size
        """
        return self._config.get("streaming", {}).get("chunk_size", settings.CHUNK_SIZE)
    
    @property
    def delay_ms(self) -> int:
        """
        Get streaming delay in milliseconds
        """
        return self._config.get("streaming", {}).get("delay_ms", settings.DELAY_MS)
    
    @property
    def buffer_size(self) -> int:
        """
        Get streaming buffer size
        """
        return self._config.get("streaming", {}).get("buffer_size", settings.BUFFER_SIZE)
    
    @property
    def prompt_template(self) -> str:
        """
        Get prompt template
        """
        return self._config.get("prompt_template", self._get_default_prompt_template())
    
    def get_generation_config(self) -> Dict[str, Any]:
        """
        Get generation configuration as dictionary
        """
        return {
            "max_new_tokens": self.max_new_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "repetition_penalty": self.repetition_penalty
        }

