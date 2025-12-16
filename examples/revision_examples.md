# Example: Widget Revision and Component Composition

## Quick Start

```python
import vibe_widget as vw
import pandas as pd
import numpy as np

# Configure API
vw.config(model="anthropic", api_key="your-key-here")

# Sample data
df = pd.DataFrame({
    'temperature': np.random.normal(20, 5, 200),
    'humidity': np.random.uniform(30, 90, 200),
    'sensor_id': np.random.choice(['A', 'B', 'C', 'D'], 200),
})
```

## Example 1: Iterative Refinement

```python
# Create initial widget
scatter = vw.create(
    "scatter plot of temperature vs humidity, color by sensor_id",
    df
)

# Refine: Add interactivity
scatter2 = vw.revise(
    "add hover tooltips showing exact values",
    scatter
)

# Refine: Add selection
scatter3 = vw.revise(
    "add brush selection to highlight regions",
    scatter2,
    exports={"selected_indices": "array of selected point indices"}
)
```

## Example 2: Component Reuse

```python
# Create widget with useful components
map_widget = vw.create(
    "interactive map with zoom slider and color legend showing categories",
    df
)

# Check available components (autocomplete works in IDE)
print(dir(map_widget))
# Output: [..., 'color_legend', 'slider', ...]

# Reuse slider in different visualization
timeline = vw.revise(
    "timeline chart with zoom slider for date range",
    map_widget.slider,
    data=time_df
)

# Reuse color legend
bar_chart = vw.revise(
    "bar chart with color legend for categories",
    map_widget.color_legend,
    data=category_df
)
```

## Example 3: Load from Cache/File

```python
# Load by widget ID (from cache)
widget = vw.revise(
    "improve layout and styling",
    "abc123-v1",  # Widget ID from .vibewidget/index/widgets.json
    data=df
)

# Load from local file
custom = vw.revise(
    "adapt this widget for my data",
    "saved_widgets/base_scatter.js",
    data=df
)
```

## Example 4: Cross-Widget with Revision

```python
# Create scatter with selection
scatter = vw.create(
    "scatter plot with brush selection",
    df,
    exports={"selected_indices": "array of indices of brushed points"}
)

# Create histogram
hist = vw.create("histogram of temperature", df)

# Revise histogram to use scatter's selection
hist_linked = vw.revise(
    "highlight bars corresponding to selected scatter points (orange for selected, gray for unselected)",
    hist,
    imports={"selected_indices": scatter}
)

# Now brushing scatter automatically updates histogram!
```

## Example 5: Component Inspection

```python
# Create widget
widget = vw.create("complex dashboard with multiple controls", df)

# Inspect components
for comp_name in dir(widget):
    if not comp_name.startswith('_'):
        try:
            comp = getattr(widget, comp_name)
            if isinstance(comp, vw.ComponentReference):
                print(f"Component: {comp.component_name}")
        except AttributeError:
            pass
```

## Tips

1. **Autocomplete**: In VS Code/Jupyter, type `widget.` and press Tab to see available components

2. **Data inheritance**: If you don't pass `data=`, revise uses the source widget's data

3. **Model inheritance**: If you don't pass `model=`, revise uses the source widget's model

4. **Composition focus**: When using `widget.component`, the LLM focuses on that specific component

5. **Cache lookup**: Widgets with identical (description, data_shape, exports, imports) reuse cached code

## Troubleshooting

### No components showing up?

Re-generate with the latest version to get modular exports:

```python
# Old widget (no components)
old = vw.create("scatter plot", df)
print(len(old._widget_metadata.get('components', [])))  # 0

# Clear cache and regenerate
import shutil
shutil.rmtree('.vibewidget')

# New widget (with components)
new = vw.create("scatter plot with slider and legend", df)
print(len(new._widget_metadata.get('components', [])))  # > 0
```

### Component names in autocomplete?

Component names are converted from PascalCase to snake_case:

```javascript
// Generated JS
export const ColorLegend = ...
export const ZoomSlider = ...
```

```python
# Python access
widget.color_legend  # ColorLegend
widget.zoom_slider   # ZoomSlider
```

### Revision not working?

Make sure the source exists:

```python
# Check widget metadata
print(scatter._widget_metadata)

# Check if widget code exists
print(len(scatter.code))  # Should be > 0

# Check widget ID
print(scatter._widget_metadata['id'])
```
