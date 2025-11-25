"""
Simplified configuration management for Vibe Widget using LiteLLM.
"""

import os
from dataclasses import dataclass
from typing import Optional
from pathlib import Path
import json


# Latest model versions - update these as new models are released
LATEST_MODELS = {
    "anthropic": "claude-opus-4-5-20251101",    # Latest Claude Opus
    "openai": "gpt-5.1-2025-11-13",            # Latest GPT-5.1
    "google": "gemini-3-pro-preview",          # Latest Gemini 3 Pro
}


@dataclass
class Config:
    """Configuration for Vibe Widget LLM models."""
    
    model: str = "anthropic"  # Default to latest Claude
    api_key: Optional[str] = None
    temperature: float = 0.7
    streaming: bool = True
    
    def __post_init__(self):
        """Resolve model name and load API key from environment."""
        # Handle simple provider names
        if self.model in LATEST_MODELS:
            self.model = LATEST_MODELS[self.model]
        
        # Load API key from environment if not provided
        if not self.api_key:
            self.api_key = self._get_api_key_from_env()
    
    def _get_api_key_from_env(self) -> Optional[str]:
        """Get the appropriate API key from environment based on model."""
        # Check which model we're using and get the right key
        if "claude" in self.model or "anthropic" in self.model:
            return os.getenv("ANTHROPIC_API_KEY")
        elif "gpt" in self.model or "openai" in self.model:
            return os.getenv("OPENAI_API_KEY")
        elif "gemini" in self.model or "google" in self.model:
            return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        
        # Fallback: check all common API keys
        return (
            os.getenv("ANTHROPIC_API_KEY") or
            os.getenv("OPENAI_API_KEY") or
            os.getenv("GEMINI_API_KEY") or
            os.getenv("GOOGLE_API_KEY")
        )
    
    def validate(self):
        """Validate that the configuration has required fields."""
        if not self.model:
            raise ValueError("No model specified")
        
        if not self.api_key:
            # Provide helpful error message based on model
            if "claude" in self.model:
                key_name = "ANTHROPIC_API_KEY"
            elif "gpt" in self.model:
                key_name = "OPENAI_API_KEY"
            elif "gemini" in self.model:
                key_name = "GEMINI_API_KEY or GOOGLE_API_KEY"
            else:
                key_name = "API_KEY"
            
            raise ValueError(
                f"No API key found for {self.model}. "
                f"Set {key_name} environment variable or pass api_key parameter."
            )
    
    def to_dict(self) -> dict:
        """Convert configuration to dictionary."""
        return {
            "model": self.model,
            "api_key": self.api_key,
            "temperature": self.temperature,
            "streaming": self.streaming,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Config":
        """Create configuration from dictionary."""
        return cls(**data)
    
    def save(self, path: Optional[Path] = None):
        """Save configuration to file (without API key for security)."""
        if path is None:
            path = Path.home() / ".vibe_widget" / "config.json"
        
        path.parent.mkdir(parents=True, exist_ok=True)
        
        # Don't save API keys to file
        data = self.to_dict()
        data["api_key"] = None
        
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
    
    @classmethod
    def load(cls, path: Optional[Path] = None) -> "Config":
        """Load configuration from file."""
        if path is None:
            path = Path.home() / ".vibe_widget" / "config.json"
        
        if not path.exists():
            return cls()
        
        with open(path, "r") as f:
            data = json.load(f)
        
        return cls.from_dict(data)


# Global configuration instance
_global_config: Optional[Config] = None


def get_global_config() -> Config:
    """Get the global configuration instance."""
    global _global_config
    if _global_config is None:
        _global_config = Config()
    return _global_config


def set_global_config(config: Config):
    """Set the global configuration instance."""
    global _global_config
    _global_config = config


def config(
    model: str = None,
    api_key: str = None,
    temperature: float = None,
    **kwargs
) -> Config:
    """
    Configure Vibe Widget with model settings.
    
    Args:
        model: Model name or shortcut ("anthropic", "openai", "google")
        api_key: API key for the model provider
        temperature: Temperature setting for generation
        **kwargs: Additional configuration options
    
    Returns:
        Configuration instance
    
    Examples:
        >>> import vibe_widget as vw
        >>> 
        >>> # Use latest models with simple names
        >>> vw.config(model="anthropic")  # Latest Claude
        >>> vw.config(model="openai")     # Latest GPT
        >>> vw.config(model="google")     # Latest Gemini
        >>> 
        >>> # Use specific model versions
        >>> vw.config(model="gpt-4-turbo")
        >>> vw.config(model="claude-3-haiku")
    """
    global _global_config
    
    # Create new config or update existing
    if _global_config is None:
        _global_config = Config(
            model=model or "anthropic",
            api_key=api_key,
            temperature=temperature or 0.7,
            **kwargs
        )
    else:
        # Update existing config
        if model is not None:
            _global_config.model = model
            # Re-resolve if it's a shortcut
            if model in LATEST_MODELS:
                _global_config.model = LATEST_MODELS[model]
        
        if api_key is not None:
            _global_config.api_key = api_key
        
        if temperature is not None:
            _global_config.temperature = temperature
        
        # Update any additional kwargs
        for key, value in kwargs.items():
            if hasattr(_global_config, key):
                setattr(_global_config, key, value)
        
        # Re-load API key if needed
        if not _global_config.api_key:
            _global_config.api_key = _global_config._get_api_key_from_env()
    
    return _global_config