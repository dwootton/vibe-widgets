import hashlib
from pathlib import Path
from typing import Any

import anywidget
import pandas as pd
import traitlets

from vibe_widget.llm.claude import ClaudeProvider


class VibeWidget(anywidget.AnyWidget):
    data = traitlets.List([]).tag(sync=True)
    description = traitlets.Unicode("").tag(sync=True)

    def __init__(self, description: str, df: pd.DataFrame, api_key: str | None = None, model: str = "claude-sonnet-4-5-20250929", **kwargs):
        llm_provider = ClaudeProvider(api_key=api_key, model=model)
        
        data_info = self._extract_data_info(df)
        widget_code = llm_provider.generate_widget_code(description, data_info)
        
        widget_hash = hashlib.md5(f"{description}{df.shape}".encode()).hexdigest()[:8]
        widget_dir = Path(__file__).parent / "widgets"
        widget_file = widget_dir / f"widget_{widget_hash}.js"
        
        widget_file.write_text(widget_code)
        
        self._esm = widget_code
        
        data_json = df.to_dict(orient="records")
        
        super().__init__(
            data=data_json,
            description=description,
            **kwargs
        )

    def _extract_data_info(self, df: pd.DataFrame) -> dict[str, Any]:
        return {
            "columns": df.columns.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "shape": df.shape,
            "sample": df.head(3).to_dict(orient="records"),
        }


def create(
    description: str,
    df: pd.DataFrame,
    api_key: str | None = None,
    model: str = "claude-sonnet-4-5-20250929",
) -> VibeWidget:
    """
    Create a VibeWidget visualization.
    
    Args:
        description: Natural language description of the visualization
        df: DataFrame to visualize
        api_key: Anthropic API key (or set ANTHROPIC_API_KEY env var)
        model: Claude model to use
    
    Returns:
        VibeWidget instance
    """
    widget = VibeWidget(description=description, df=df, api_key=api_key, model=model)
    
    # Explicitly display the widget to ensure it renders in VS Code
    try:
        from IPython.display import display
        display(widget)
    except ImportError:
        # If IPython is not available, just return the widget
        pass
    
    return widget
