"""
Inference Service - handles text generation and streaming
"""
import asyncio
import logging
import threading
from typing import List, Dict, AsyncGenerator, Optional
import torch
from transformers import TextIteratorStreamer, StoppingCriteria, StoppingCriteriaList

from app.model.manager import ModelManager
from app.config import settings

logger = logging.getLogger(__name__)


class StopOnTokens(StoppingCriteria):
    """
    Custom stopping criteria that stops generation when any stop token is encountered
    """
    def __init__(self, stop_token_ids: List[int]):
        self.stop_token_ids = stop_token_ids
    
    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor, **kwargs) -> bool:
        for stop_id in self.stop_token_ids:
            if input_ids[0][-1] == stop_id:
                return True
        return False


class StreamingGenerator:
    """
    Handles streaming text generation with token buffering
    """
    
    def __init__(self, model, tokenizer):
        """
        Initialize streaming generator
        
        Args:
            model: Loaded model
            tokenizer: Loaded tokenizer
        """
        self.model = model
        self.tokenizer = tokenizer
        self.device = model.device if hasattr(model, 'device') else next(model.parameters()).device
    
    def _get_stop_tokens(self) -> list:
        """
        Get stop tokens for Qwen 2.5 model
        
        Returns:
            List of stop token IDs
        """
        stop_tokens = []
        
        # EOS token
        if self.tokenizer.eos_token_id is not None:
            stop_tokens.append(self.tokenizer.eos_token_id)
        
        # Qwen 2.5 uses <|im_end|> as end of turn token
        try:
            im_end_token_id = self.tokenizer.convert_tokens_to_ids("<|im_end|>")
            if im_end_token_id is not None and im_end_token_id != self.tokenizer.unk_token_id:
                stop_tokens.append(im_end_token_id)
        except:
            pass
        
        return list(set(stop_tokens))
    
    def format_prompt(self, prompt: str, history: List[Dict[str, str]]) -> str:
        """
        Format prompt with conversation history
        
        Args:
            prompt: Current user prompt
            history: List of previous messages with 'role' and 'content'
        
        Returns:
            Formatted prompt string
        """
        if history is None:
            history = []
        
        # Build messages list for apply_chat_template
        messages = []
        
        # Add system message
        messages.append({
            "role": "system",
            "content": "You are a helpful AI assistant. Answer the user's questions clearly and concisely."
        })
        
        # Add history messages
        for msg in history:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role in ["user", "assistant"]:
                messages.append({"role": role, "content": content})
        
        # Add current user prompt
        messages.append({"role": "user", "content": prompt})
        
        # Use tokenizer's apply_chat_template for proper model format
        try:
            formatted = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
        except Exception as e:
            logger.warning(f"Failed to use apply_chat_template, falling back to manual format: {e}")
            # Fallback to manual formatting (Qwen 2.5 format)
            formatted = "<|im_start|>system\nYou are a helpful AI assistant. Answer the user's questions clearly and concisely.<|im_end|>\n"
            for msg in messages[1:]:  # Skip system message
                if msg["role"] == "user":
                    formatted += f"<|im_start|>user\n{msg['content']}<|im_end|>\n"
                elif msg["role"] == "assistant":
                    formatted += f"<|im_start|>assistant\n{msg['content']}<|im_end|>\n"
            formatted += "<|im_start|>assistant\n"
        
        return formatted
    
    async def generate_stream(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate response stream token by token
        
        Args:
            prompt: User prompt
            history: Conversation history
        
        Yields:
            Generated tokens as strings
        """
        if history is None:
            history = []
        
        # Format prompt with history
        formatted_prompt = self.format_prompt(prompt, history)
        
        # Tokenize input
        inputs = self.tokenizer(
            formatted_prompt,
            return_tensors="pt",
            truncation=True,
            max_length=settings.CONTEXT_WINDOW
        ).to(self.device)
        
        # Create streamer for token-by-token generation
        streamer = TextIteratorStreamer(
            self.tokenizer,
            skip_prompt=True,
            skip_special_tokens=True
        )
        
        # Get stop tokens for Qwen 2.5 model
        stop_token_ids = self._get_stop_tokens()
        
        # Create stopping criteria
        stopping_criteria = StoppingCriteriaList([StopOnTokens(stop_token_ids)])
        
        # Generation parameters for Qwen 2.5
        # Two stopping conditions: stop tokens (via stopping_criteria) and max tokens (via max_new_tokens)
        generation_kwargs = {
            **inputs,
            "max_new_tokens": settings.MAX_NEW_TOKENS,
            "eos_token_id": self.tokenizer.eos_token_id,
            "pad_token_id": self.tokenizer.pad_token_id or self.tokenizer.eos_token_id,
            "temperature": settings.TEMPERATURE,
            "top_p": settings.TOP_P,
            "repetition_penalty": settings.REPETITION_PENALTY,
            "do_sample": True,
            "streamer": streamer,
            "use_cache": False,
            "stopping_criteria": stopping_criteria
        }
        
        # Start generation in separate thread
        generation_thread = threading.Thread(
            target=self._run_generation,
            args=(generation_kwargs,)
        )
        generation_thread.daemon = True  # Make thread daemon so it doesn't block shutdown
        generation_thread.start()
        
        # Stream tokens
        buffer = []
        
        try:
            # Read all tokens from streamer
            for token in streamer:
                buffer.append(token)
                
                # Yield chunks when buffer is full
                if len(buffer) >= settings.CHUNK_SIZE:
                    chunk = "".join(buffer)
                    buffer.clear()
                    yield chunk
                    
                    # Add delay if configured
                    # Note: delay is minimal and shouldn't cause issues
                    if settings.DELAY_MS > 0:
                        await asyncio.sleep(settings.DELAY_MS / 1000.0)
            
            # Always yield remaining tokens, even if buffer is not full
            # This ensures all tokens are sent even for short responses
            if buffer:
                chunk = "".join(buffer)
                buffer.clear()
                yield chunk
            
            # Wait for generation to complete (with timeout to avoid blocking)
            # Increased timeout to ensure generation completes
            generation_thread.join(timeout=2.0)
            
        except GeneratorExit:
            # Client disconnected, stop generation gracefully
            logger.info("Client disconnected, stopping generation")
            # Don't wait for thread - it's daemon and will be cleaned up
            raise
        except Exception as e:
            logger.error(f"Error during streaming generation: {e}", exc_info=True)
            raise
        finally:
            # Ensure thread doesn't block shutdown
            if generation_thread.is_alive():
                logger.warning("Generation thread still alive after stream end, but daemon will be cleaned up")
    
    def _run_generation(self, generation_kwargs: Dict) -> None:
        """
        Run model generation in separate thread
        
        Args:
            generation_kwargs: Generation parameters
        """
        try:
            with torch.no_grad():
                self.model.generate(**generation_kwargs)
        except Exception as e:
            logger.error(f"Error in generation thread: {e}", exc_info=True)
            raise
    
    def generate_sync(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate response synchronously (for testing)
        
        Args:
            prompt: User prompt
            history: Conversation history
        
        Returns:
            Generated response
        """
        if history is None:
            history = []
        
        # Format prompt
        formatted_prompt = self.format_prompt(prompt, history)
        
        # Tokenize
        inputs = self.tokenizer(
            formatted_prompt,
            return_tensors="pt",
            truncation=True,
            max_length=settings.CONTEXT_WINDOW
        ).to(self.device)
        
        # Get stop tokens
        stop_token_ids = self._get_stop_tokens()
        
        # Create stopping criteria
        stopping_criteria = StoppingCriteriaList([StopOnTokens(stop_token_ids)])
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=settings.MAX_NEW_TOKENS,
                eos_token_id=self.tokenizer.eos_token_id,
                pad_token_id=self.tokenizer.pad_token_id or self.tokenizer.eos_token_id,
                temperature=settings.TEMPERATURE,
                top_p=settings.TOP_P,
                repetition_penalty=settings.REPETITION_PENALTY,
                do_sample=True,
                use_cache=False,
                stopping_criteria=stopping_criteria
            )
        
        # Decode response (skip input tokens)
        generated_text = self.tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        )
        
        return generated_text


class InferenceService:
    """
    Service for handling inference requests
    """
    
    def __init__(self):
        """
        Initialize inference service
        """
        self.model_manager = ModelManager.get_instance()
        self._generator: Optional[StreamingGenerator] = None
    
    def _get_generator(self) -> StreamingGenerator:
        """
        Get or create streaming generator
        
        Returns:
            StreamingGenerator instance
        """
        if self._generator is None:
            model = self.model_manager.get_model()
            tokenizer = self.model_manager.get_tokenizer()
            
            self._generator = StreamingGenerator(model, tokenizer)
        
        return self._generator
    
    def get_tokenizer(self):
        """
        Get tokenizer instance
        
        Returns:
            Tokenizer instance
        """
        return self.model_manager.get_tokenizer()
    
    async def generate_stream(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response
        
        Args:
            prompt: User prompt
            history: Conversation history
        
        Yields:
            Generated tokens
        """
        generator = self._get_generator()
        async for token in generator.generate_stream(prompt, history):
            yield token
    
    async def generate(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate complete response (synchronous)
        
        Args:
            prompt: User prompt
            history: Conversation history
        
        Returns:
            Generated response
        """
        generator = self._get_generator()
        return generator.generate_sync(prompt, history)

