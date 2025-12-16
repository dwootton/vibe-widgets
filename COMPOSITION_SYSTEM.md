# Widget Composition & Revision System

## Overview

The vibe-widgets package now supports iterative widget refinement and component-based composition through the new `vw.revise()` function and enhanced code generation.

## Key Features

### 1. **Widget Revision** (`vw.revise()`)

Iteratively refine widgets by building upon existing code:

```python
# Create initial widget
scatter = vw.create("scatter plot of temperature vs humidity", df)

# Refine it
scatter2 = vw.revise("add hover tooltips and color by sensor_id", scatter)
```

### 2. **Component References**

Access and reuse specific components from existing widgets:

```python
# Use component from previous widget
hist = vw.revise("histogram with range slider", scatter.slider, data=df)

# Autocomplete shows available components:
# scatter.<TAB>
#   - scatter.color_legend
#   - scatter.slider
#   - scatter.tooltip
```

### 3. **Modular Code Generation**

Generated widgets now export reusable components:

```javascript
// Generated code automatically includes named exports
export const Slider = ({ value, onChange, min, max }) => {
  return html`<input type="range" ... />`;
};

export const ColorLegend = ({ colors, labels }) => {
  return html`<div class="legend">...</div>`;
};

export default function Widget({ model, html, React }) {
  // Main widget uses components
  return html`<${Slider} ... />`;
}
```

### 4. **Multiple Source Types**

Load base widgets from various sources:

```python
# From widget variable
vw.revise("add animation", scatter)

# From component reference
vw.revise("create bar chart", scatter.color_legend, data=df)

# From cache by ID
vw.revise("improve layout", "abc123-v1", data=df)

# From local file
vw.revise("adapt for my data", "widgets/base.js", data=df)
```

## Implementation Details

### Architecture Changes

#### 1. **WidgetStore Enhancements** (`widget_store.py`)

- **`extract_components(code)`**: Parses JavaScript to find named exports (PascalCase components)
- **`load_by_id(widget_id)`**: Load cached widget by ID
- **`load_from_file(file_path)`**: Load widget from local JS file
- **Component metadata**: Stored in widget index for autocomplete

```python
widget_entry = {
    "id": "abc123-v1",
    "components": ["Slider", "ColorLegend", "Tooltip"],
    "base_widget_id": "xyz789-v2",  # Provenance tracking
    # ... other metadata
}
```

#### 2. **ComponentReference Class** (`core.py`)

Represents a reference to a component within a widget:

```python
class ComponentReference:
    def __init__(self, widget, component_name):
        self.widget = widget
        self.component_name = component_name
    
    @property
    def code(self) -> str:
        return self.widget.code
```

#### 3. **VibeWidget Autocomplete** (`core.py`)

- **`__dir__()`**: Returns attributes including snake_case component names
- **`__getattr__()`**: Returns `ComponentReference` when accessing components
- **`_to_python_attr()`**: Converts PascalCase → snake_case (e.g., `ColorLegend` → `color_legend`)

```python
# VSCode autocomplete via Python introspection
scatter.color_legend  # Returns ComponentReference
scatter.slider        # Returns ComponentReference
```

#### 4. **Enhanced LLM Prompts** (`base.py`)

**New prompt sections:**

- **Modularity Guidelines**: Instructs LLM to export reusable components
- **Composition Section**: Shows base widget code and available components
- **Focused Revision**: Lower temperature (0.5) for more precise changes

```python
def _build_composition_section(base_code, base_components):
    """Shows base code and lists available components for reuse"""
```

#### 5. **AgenticOrchestrator Updates** (`agentic.py`)

```python
def generate(
    description, df,
    base_code=None,           # Base widget for composition
    base_components=None,     # Focus on these components
    ...
):
    if base_code:
        # Use revision flow
        code = provider.revise_widget_code(...)
    else:
        # Fresh generation
        code = provider.generate_widget_code(...)
```

#### 6. **Provider Updates** (all providers)

Updated `revise_widget_code()` signature:

```python
def revise_widget_code(
    current_code, revision_description, data_info,
    base_code=None,           # Additional reference code
    base_components=None,     # Components to focus on
    progress_callback=None
)
```

### Cache Key Strategy

**Cache includes:**
- Description (whitespace-normalized)
- Data shape
- Export/import signatures

**Cache excludes:**
- Base widget ID (revisions cache separately)
- Model name (avoid regeneration on model change)
- Notebook path

### Provenance Tracking

Revised widgets store `base_widget_id` to track composition lineage:

```python
widget_entry = {
    "id": "def456-v1",
    "base_widget_id": "abc123-v2",  # Source widget
    # ...
}
```

## Usage Examples

### Example 1: Iterative Refinement

```python
import vibe_widget as vw
import pandas as pd

df = pd.read_csv("data.csv")

# Start simple
v1 = vw.create("scatter plot", df)

# Add interactivity
v2 = vw.revise("add brush selection", v1)

# Polish UI
v3 = vw.revise("improve colors and add legend", v2)
```

### Example 2: Component Composition

```python
# Create widget with reusable components
map_widget = vw.create(
    "interactive map with zoom slider and color legend",
    geo_df
)

# Reuse slider in different context
timeline = vw.revise(
    "timeline visualization with zoom slider",
    map_widget.slider,
    data=time_df
)

# Reuse color legend
chart = vw.revise(
    "bar chart with color legend",
    map_widget.color_legend,
    data=stats_df
)
```

### Example 3: Load from File

```python
# Save a widget's code manually
with open("widgets/base_scatter.js", "w") as f:
    f.write(scatter.code)

# Later, load and adapt it
custom_scatter = vw.revise(
    "scatter plot adapted for my dataset",
    "widgets/base_scatter.js",
    data=my_df
)
```

### Example 4: Cross-Widget Interactions with Revision

```python
# Create scatter with selection
scatter = vw.create(
    "scatter plot with brush selection",
    df,
    exports={"selected_indices": "array of selected point indices"}
)

# Create histogram, then revise to highlight selection
hist = vw.create("histogram of values", df)

hist2 = vw.revise(
    "highlight selected points from scatter plot",
    hist,
    imports={"selected_indices": scatter}
)
```

## API Reference

### `vw.revise()`

```python
def revise(
    description: str,
    source: VibeWidget | ComponentReference | str | Path,
    data: pd.DataFrame | str | Path | None = None,
    model: str | None = None,
    show_progress: bool = True,
    exports: dict[str, str] | None = None,
    imports: dict[str, Any] | None = None,
    config: Config | None = None,
) -> VibeWidget
```

**Parameters:**

- **`description`**: Natural language description of changes/additions
- **`source`**: 
  - `VibeWidget` instance
  - `ComponentReference` (e.g., `scatter.slider`)
  - Widget ID string (e.g., `"abc123-v1"`)
  - File path (e.g., `"widgets/base.js"`)
- **`data`**: DataFrame (uses source widget's data if None)
- **`model`**: LLM model (inherits from source if None)
- **`exports`**: New/modified export traits
- **`imports`**: New/modified import traits
- **`config`**: Optional Config object

**Returns:** New VibeWidget instance

### `ComponentReference`

Access widget components for composition:

```python
scatter.slider          # Returns ComponentReference
scatter.color_legend    # Returns ComponentReference

# Properties
ref.widget              # Source widget
ref.component_name      # Component name (PascalCase)
ref.code               # Full widget code
ref.metadata           # Widget metadata dict
```

## Future Enhancements

### Planned Features

1. **Remote Widget Loader** (`utils/remote_loader.py`)
   - GitHub: `vw.revise("...", "github.com/owner/repo/blob/main/widget.js")`
   - S3: `vw.revise("...", "s3://bucket/widget.js")`
   - HTTP: `vw.revise("...", "https://example.com/widget.js")`

2. **Component Documentation**
   - Extract JSDoc from components
   - Display via `help(scatter.slider)`
   - Show parameter types and descriptions

3. **Version Pinning**
   - `vw.revise(..., pin_version=True)` to freeze dependencies
   - Semantic versioning for widgets
   - Dependency resolution

4. **Code Signing**
   - GPG signature verification for remote widgets
   - Trusted source registry
   - Security warnings for untrusted code

## Migration Guide

### For Existing Code

No breaking changes! Existing `vw.create()` usage works identically.

New features are additive:

```python
# Before (still works)
widget = vw.create("visualization", df)

# After (new capabilities)
widget2 = vw.revise("improved version", widget)
widget3 = vw.revise("adapted", widget.slider, data=df2)
```

### Component Export Adoption

Old generated widgets (without named exports) still work but won't have component references.

Re-generate with current version to get modular components:

```python
# Regenerate to get components
new_widget = vw.create(description, df)  # Now has components

# Access components
print(dir(new_widget))  # Shows: [..., 'slider', 'color_legend', ...]
```

## Technical Notes

### Why Snake Case for Component Access?

JavaScript components use PascalCase (`ColorLegend`), but Python convention is snake_case:

```python
scatter.color_legend    # Pythonic ✓
scatter.ColorLegend     # Feels un-Pythonic ✗
```

Conversion is automatic and bidirectional.

### Cache Invalidation

Revisions create new cache entries. Original widget remains cached separately.

To force regeneration: change description slightly or clear cache manually:

```bash
rm -rf .vibewidget/
```

### Performance

- **Component extraction**: Fast regex parsing (~1ms per widget)
- **Autocomplete**: Cached after first access
- **Revision**: Only LLM call is slower; validation/caching is instant

## Testing

Test the new features:

```python
import vibe_widget as vw
import pandas as pd
import numpy as np

# Test data
df = pd.DataFrame({
    'x': np.random.rand(100),
    'y': np.random.rand(100),
    'category': np.random.choice(['A', 'B', 'C'], 100)
})

# Test 1: Basic revision
w1 = vw.create("scatter plot", df)
w2 = vw.revise("add hover tooltips", w1)
assert w2.code != w1.code

# Test 2: Component extraction
assert len(w2._widget_metadata.get('components', [])) > 0

# Test 3: Component access
if hasattr(w2, 'slider'):
    comp_ref = w2.slider
    assert isinstance(comp_ref, vw.ComponentReference)
    assert comp_ref.widget == w2

# Test 4: Load by ID
store = vw.utils.widget_store.WidgetStore()
widget_id = w2._widget_metadata['id']
entry, code = store.load_by_id(widget_id)
assert code == w2.code

print("✓ All tests passed!")
```

## Conclusion

The composition system transforms vibe-widgets from one-shot generation to an iterative, composable ecosystem. Users can now:

- **Refine** widgets incrementally
- **Reuse** components across widgets
- **Compose** new visualizations from existing parts
- **Track** provenance and lineage
- **Autocomplete** components in IDEs

This foundation enables future features like remote widgets, component libraries, and collaborative widget development.
