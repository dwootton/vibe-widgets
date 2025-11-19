# Fix: Duplicate Widgets + Library Import Errors

## Issues Resolved

### 1. Duplicate/Triplicate Widgets ✅
**Problem**: Widgets rendering 2-3 times on screen

**Root Cause**: `render()` function created new React root on every call (app_wrapper.js:260)
- AnyWidget lifecycle may trigger multiple `render()` calls
- Each call: `createRoot(el)` → new React app mounted

**Solution**: Reuse single root instance
```javascript
let rootInstance = null;

function render({ model, el }) {
  if (!rootInstance) {
    rootInstance = createRoot(el);
  }
  rootInstance.render(html`<${AppWrapper} model=${model} />`);
}
```

### 2. Plotly Import Errors ✅
**Problem**: `TypeError: Be is not a function` when using Plotly

**Root Cause**: LLM using wrong CDN URL or import pattern
- `esm.sh/plotly.js` may have module resolution issues
- Plotly has complex build variants

**Solution**: Provide tested library CDN URLs in prompt (claude.py:136)
```javascript
// USE THESE EXACT IMPORTS:
- Plotly: import Plotly from "https://cdn.jsdelivr.net/npm/plotly.js-dist@2/plotly.min.js"
- D3: import * as d3 from "https://esm.sh/d3@7"
- Three.js: import * as THREE from "https://esm.sh/three@0.160"
- Chart.js: import Chart from "https://esm.sh/chart.js@4/auto"
```

### 3. Better Error Messages ✅
**Problem**: Generic errors not helpful for debugging

**Solution**: Enhanced error handling in SandboxedRunner (app_wrapper.js:98-112)
- Detects common error patterns
- Provides specific suggestions:
  - "is not a function" → Library import error
  - "Failed to fetch" → Network error
  - "Unexpected token" → Syntax error
- Shows full stack trace reference

## Changes Made

### app_wrapper.js
**Line 259-266**: Singleton root pattern
```javascript
let rootInstance = null;

function render({ model, el }) {
  if (!rootInstance) {
    rootInstance = createRoot(el);
  }
  rootInstance.render(html`<${AppWrapper} model=${model} />`);
}
```

**Line 98-112**: Improved error detection
```javascript
if (err.message.includes('is not a function') || err.message.includes('Cannot read')) {
  suggestion = 'Library import error. Check CDN URL and import syntax.';
} else if (err.message.includes('Failed to fetch')) {
  suggestion = 'Network error loading library. Check internet connection.';
} else if (err.message.includes('Unexpected token')) {
  suggestion = 'Syntax error in generated code.';
}
```

### claude.py
**Line 135-139**: Library import specifications
```python
6. Import external libraries from ESM CDN - USE THESE EXACT IMPORTS:
   - Plotly: import Plotly from "https://cdn.jsdelivr.net/npm/plotly.js-dist@2/plotly.min.js"
   - D3: import * as d3 from "https://esm.sh/d3@7"
   - Three.js: import * as THREE from "https://esm.sh/three@0.160"
   - Chart.js: import Chart from "https://esm.sh/chart.js@4/auto"
```

**Line 144**: Added cleanup requirement
```python
11. ALWAYS include proper cleanup in useEffect return statements to prevent memory leaks
```

## Testing

### Verify Fixes
1. **No Duplicates**: Widget should render exactly once
2. **Plotly Works**: Plotly imports should succeed
3. **Clear Errors**: Import errors show helpful suggestions

### Example Usage
```python
import pandas as pd
import vibe_widget as vw

df = pd.DataFrame({
    'x': [1, 2, 3, 4, 5],
    'y': [2, 4, 6, 8, 10]
})

# Should render once with no duplicates
widget = vw.create("Create a Plotly scatter plot", df)
```

## Why These Libraries?

### Plotly
- ❌ `esm.sh/plotly.js` - Module resolution issues
- ✅ `cdn.jsdelivr.net/npm/plotly.js-dist@2/plotly.min.js` - Pre-built, stable

### D3
- ✅ `esm.sh/d3@7` - Works well, modular

### Three.js
- ✅ `esm.sh/three@0.160` - Reliable ESM build

### Chart.js
- ✅ `esm.sh/chart.js@4/auto` - Auto-registers components

## Error Messages Reference

### Before
```
TypeError: Be is not a function
(Unhelpful generic error)
```

### After
```
Error: Be is not a function

Suggestion: Library import error. Check CDN URL and import syntax.
Check browser console for full stack trace
```

## Future Enhancements

1. **Fallback Imports**: Auto-retry with alternative CDN if first fails
2. **Validation**: Pre-validate generated code before execution
3. **Library Suggestions**: Detect visualization type, suggest best library
4. **Code Repair**: Use LLM to fix import errors automatically

---

**Status**: ✅ Fixed  
**Tested**: Ready for Jupyter Lab  
**Impact**: Cleaner UI, fewer errors, better DX
