import pandas as pd
import pytest

from vibe_widget.core import VibeWidget


class TestVibeWidget:
    def test_extract_data_info(self) -> None:
        widget = VibeWidget(api_key="test-key")
        df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})

        data_info = widget._extract_data_info(df)

        assert data_info["columns"] == ["a", "b"]
        assert data_info["shape"] == (3, 2)
        assert len(data_info["sample"]) == 3

    def test_widget_requires_api_key(self) -> None:
        with pytest.raises(ValueError, match="API key required"):
            VibeWidget(api_key=None)
