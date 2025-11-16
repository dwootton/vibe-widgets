# Vibe Widget

Create interactive visualizations using natural language and LLMs.

## Installation

```bash
pip install vibe-widget
```

Or with `uv`:

```bash
uv pip install vibe-widget
```

## Quick Start

```python
import pandas as pd
import vibe_widget as vw

df = pd.DataFrame({
    'height': [150, 160, 170, 180, 190],
    'weight': [50, 60, 70, 80, 90]
})

vw.create("an interactive scatterplot of height and weight", df)
```

This will:
1. Analyze your data structure
2. Generate a React component via Claude API
3. Return an HTML file with the interactive visualization

## API Key Setup

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

Or pass it directly:

```python
vw.create(
    "a bar chart of sales by region", 
    df, 
    api_key="your-api-key-here"
)
```

## Saving to File

```python
vw.create(
    "an interactive line chart showing trends over time",
    df,
    output_path="output/visualization.html"
)
```

## Development

Install with dev dependencies:

```bash
pip install -e ".[dev]"
```

Run tests:

```bash
pytest
```

Lint and format:

```bash
ruff check .
ruff format .
```

Type checking:

```bash
mypy src/
```

## Features

- 🚀 Modern Python packaging (pyproject.toml, src layout)
- 🤖 LLM-powered visualization generation
- ⚛️ React-based interactive widgets
- 📊 Pandas DataFrame integration
- 🔧 Extensible LLM provider system

## License

MIT
