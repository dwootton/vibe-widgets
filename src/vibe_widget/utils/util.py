"""
Utility functions for VibeWidget.
Helper functions for data cleaning, serialization, and trait management.
"""
from typing import Any
import pandas as pd
import numpy as np


def clean_for_json(obj: Any) -> Any:
    """
    Recursively clean data structures for JSON serialization.
    Converts NaT, NaN, and other non-JSON-serializable values to None.
    
    Args:
        obj: Any Python object to clean
        
    Returns:
        JSON-serializable version of the object
    """
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif isinstance(obj, pd.Timestamp):
        if pd.isna(obj):
            return None
        return obj.isoformat()
    elif pd.isna(obj):
        return None
    elif isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    elif hasattr(obj, 'isoformat'):
        try:
            return obj.isoformat()
        except (ValueError, AttributeError):
            return str(obj)
    else:
        return obj


def initial_import_value(import_name: str, import_source: Any) -> Any:
    """
    Extract the initial value from an import source (widget trait or direct value).
    
    Args:
        import_name: Name of the import trait
        import_source: Source widget/trait or direct value
        
    Returns:
        The actual value to use for the import
    """
    if hasattr(import_source, 'value'):
        return import_source.value
    elif hasattr(import_source, import_name):
        trait_value = getattr(import_source, import_name)
        return trait_value.value if hasattr(trait_value, 'value') else trait_value
    else:
        return import_source


def serialize_imports_for_prompt(imports: dict[str, Any] | None) -> dict[str, str]:
    """
    Convert import sources to human-readable descriptions for the LLM prompt.
    
    Args:
        imports: Dict of import name -> source widget/value
        
    Returns:
        Dict of import name -> string description
    """
    if not imports:
        return {}
        
    serialized: dict[str, str] = {}
    for name, source in imports.items():
        if hasattr(source, 'value'):
            serialized[name] = f"{type(source.value).__name__}: {source.value}"
        else:
            serialized[name] = f"{type(source).__name__}: {source}"
    return serialized
