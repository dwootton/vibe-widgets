"""Base class for LLM providers."""

from abc import ABC, abstractmethod
from typing import Any, Callable


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    def generate_widget_code(
        self,
        description: str,
        data_info: dict[str, Any],
        progress_callback: Callable[[str], None] | None = None,
    ) -> str:
        """Generate widget code from description and data info.
        
        Args:
            description: Natural language description of the widget
            data_info: Dictionary containing data profile information
            progress_callback: Optional callback for streaming progress updates
            
        Returns:
            Generated widget code as a string
        """
        pass
    
    @abstractmethod
    def revise_widget_code(
        self,
        current_code: str,
        revision_description: str,
        data_info: dict[str, Any],
        progress_callback: Callable[[str], None] | None = None,
    ) -> str:
        """Revise existing widget code based on a revision description.
        
        Args:
            current_code: The current widget code
            revision_description: Description of what to change
            data_info: Dictionary containing data profile information
            progress_callback: Optional callback for streaming progress updates
            
        Returns:
            Revised widget code as a string
        """
        pass
    
    @abstractmethod
    def fix_code_error(
        self,
        broken_code: str,
        error_message: str,
        data_info: dict[str, Any],
    ) -> str:
        """Fix errors in widget code.
        
        Args:
            broken_code: The code with errors
            error_message: Description of the error
            data_info: Dictionary containing data profile information
            
        Returns:
            Fixed widget code as a string
        """
        pass

