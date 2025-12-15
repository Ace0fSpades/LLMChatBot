"""
Model Manager - handles model loading, caching, and tokenization
"""
import logging
import torch
from typing import Optional, Dict, Any
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig
)

from app.config import settings
from app.config.model_config import ModelConfig

logger = logging.getLogger(__name__)


class ModelManager:
    """
    Singleton manager for LLM model and tokenizer
    Handles lazy loading, quantization, and caching
    """
    
    _instance: Optional['ModelManager'] = None
    _initialized: bool = False
    
    def __init__(self):
        """
        Initialize ModelManager (private, use get_instance)
        """
        # Initialize instance variables
        self._model: Optional[Any] = None
        self._tokenizer: Optional[Any] = None
        self._config: Optional[ModelConfig] = None
        self._device: Optional[str] = None
        
        # Initialize only once (prevent re-initialization)
        if not ModelManager._initialized:
            try:
                self._config = ModelConfig()
                self._device = self._determine_device()
                ModelManager._initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize ModelManager: {e}", exc_info=True)
                ModelManager._initialized = False
                raise
    
    @classmethod
    def get_instance(cls) -> 'ModelManager':
        """
        Get singleton instance of ModelManager
        
        Returns:
            ModelManager instance
        """
        if cls._instance is None:
            cls._instance = cls.__new__(cls)
            cls._instance.__init__()
        return cls._instance
    
    def _determine_device(self) -> str:
        """
        Determine the device to use (cuda or cpu)
        
        Returns:
            Device string
        """
        if settings.DEVICE == "cuda" and torch.cuda.is_available():
            return "cuda"
        return "cpu"
    
    def load_model(self) -> None:
        """
        Load the model and tokenizer with lazy loading
        """
        if self._model is not None and self._tokenizer is not None:
            logger.info("Model already loaded")
            return
        
        logger.info(f"Loading model: {self._config.model_name}")
        logger.info(f"Device: {self._device}, Quantization: {self._config.quantization}")
        
        try:
            # Load tokenizer
            tokenizer_kwargs = {}
            if settings.HUGGINGFACE_TOKEN:
                tokenizer_kwargs["token"] = settings.HUGGINGFACE_TOKEN
            
            self._tokenizer = AutoTokenizer.from_pretrained(
                self._config.model_name,
                trust_remote_code=True,
                **tokenizer_kwargs
            )
            
            # Set pad_token_id if not set (use eos_token_id as fallback)
            if self._tokenizer.pad_token_id is None:
                self._tokenizer.pad_token_id = self._tokenizer.eos_token_id
            
            # Configure quantization if needed
            # For 7B model: use 4bit quantization with bfloat16 for better quality/speed
            quantization_config = None
            if self._config.quantization == "4bit":
                # Determine compute dtype based on config
                if self._config.dtype == "bfloat16":
                    compute_dtype = torch.bfloat16
                elif self._config.dtype == "float16":
                    compute_dtype = torch.float16
                else:
                    compute_dtype = torch.float16
                
                quantization_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=compute_dtype,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4"
                )
            elif self._config.quantization == "8bit":
                quantization_config = BitsAndBytesConfig(
                    load_in_8bit=True
                )
            
            # Load model
            model_kwargs = {
                "trust_remote_code": True,
                "device_map": "auto" if self._device == "cuda" else None
            }
            
            if settings.HUGGINGFACE_TOKEN:
                model_kwargs["token"] = settings.HUGGINGFACE_TOKEN
            
            if quantization_config:
                model_kwargs["quantization_config"] = quantization_config
            else:
                # Set dtype if not quantized
                if self._config.dtype == "float16":
                    model_kwargs["torch_dtype"] = torch.float16
                elif self._config.dtype == "bfloat16":
                    model_kwargs["torch_dtype"] = torch.bfloat16
                else:
                    model_kwargs["torch_dtype"] = torch.float32
            
            self._model = AutoModelForCausalLM.from_pretrained(
                self._config.model_name,
                **model_kwargs
            )
            
            if self._device == "cpu" and quantization_config is None:
                self._model = self._model.to(self._device)
            
            # Set model to evaluation mode
            self._model.eval()
            
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}", exc_info=True)
            raise
    
    def get_model(self):
        """
        Get the loaded model (loads if not already loaded)
        
        Returns:
            Loaded model
        """
        if self._model is None:
            self.load_model()
        return self._model
    
    def get_tokenizer(self):
        """
        Get the loaded tokenizer (loads if not already loaded)
        
        Returns:
            Loaded tokenizer
        """
        if self._tokenizer is None:
            self.load_model()
        return self._tokenizer
    
    def is_model_loaded(self) -> bool:
        """
        Check if model is loaded
        
        Returns:
            True if model is loaded
        """
        return self._model is not None and self._tokenizer is not None
    
    def get_device(self) -> str:
        """
        Get current device
        
        Returns:
            Device string
        """
        return self._device
    
    def get_config(self) -> ModelConfig:
        """
        Get model configuration
        
        Returns:
            ModelConfig instance
        """
        return self._config
    
    def unload_model(self) -> None:
        """
        Unload model from memory (for memory management)
        """
        if self._model is not None:
            del self._model
            self._model = None
        
        if self._tokenizer is not None:
            del self._tokenizer
            self._tokenizer = None
        
        if self._device == "cuda":
            torch.cuda.empty_cache()
        
        logger.info("Model unloaded from memory")

