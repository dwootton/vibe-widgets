# Auto-Fix Runtime Errors - Implementation Summary

## Problem Solved
**Issue**: Generated code has runtime errors (e.g., `ReferenceError: survivalRate is not defined`) that only appear after rendering.

**Solution**: Automatic error detection and LLM-based repair with up to 2 retry attempts.

## How It Works

### Error Recovery Flow

```
1. Widget generates code
2. Code executes in browser (SandboxedRunner)
3. ❌ Runtime error occurs (e.g., undefined variable)
4. Error caught → sent to Python via traitlet
5. Python detects error via observer
6. LLM receives: broken code + error message + data context
7. LLM returns fixed code
8. Code traitlet updated → triggers re-render
9. ✅ Widget renders successfully
```

### Retry Logic
- **Max 2 attempts** to fix errors automatically
- **Attempt 1**: Error detected → Ask LLM to fix → Retry
- **Attempt 2**: Still broken → Ask LLM again → Retry
- **After 2 retries**: Show final error to user

## Changes Made

### 1. New Traitlets (core.py:59-60)
```python
error_message = traitlets.Unicode("").tag(sync=True)  # Error from browser
retry_count = traitlets.Int(0).tag(sync=True)          # Track retry attempts
```

### 2. Error Observer (core.py:106 + 182-212)
```python
# Wire up observer in __init__
self.observe(self._on_error, names='error_message')

# Error handler method
def _on_error(self, change):
    error_msg = change['new']
    
    if not error_msg or self.retry_count >= 2:
        return  # Max retries reached
    
    self.retry_count += 1
    self.status = 'generating'
    self.logs = self.logs + [f"Error detected (attempt {self.retry_count})"]
    self.logs = self.logs + ["Asking LLM to fix the error..."]
    
    fixed_code = self.llm_provider.fix_code_error(
        self.code,
        error_msg,
        self.data_info
    )
    
    self.logs = self.logs + ["Code fixed, retrying..."]
    self.code = fixed_code
    self.status = 'ready'
```

### 3. Error Reporting (app_wrapper.js:77-167)
```javascript
function SandboxedRunner({ code, model }) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  
  React.useEffect(() => {
    const executeCode = async () => {
      try {
        // Execute code...
        model.set('error_message', '');  // Clear on success
      } catch (err) {
        const retryCount = model.get('retry_count') || 0;
        
        if (retryCount < 2) {
          // Send error to Python for auto-fix
          setIsRetrying(true);
          model.set('error_message', err.toString() + '\n\nStack:\n' + err.stack);
          model.save_changes();
        } else {
          // Max retries reached - show final error
          setError(err.message);
        }
      }
    };
  }, [code]);
  
  if (isRetrying) {
    return html`<div>Error detected. Asking LLM to fix...</div>`;
  }
}
```

### 4. LLM Fix Method (claude.py:59-101)
```python
def fix_code_error(
    self,
    broken_code: str,
    error_message: str,
    data_info: dict[str, Any]
) -> str:
    """Fix code based on runtime error"""
    
    prompt = f"""The following widget code has a runtime error. Fix it.

ERROR MESSAGE:
{error_message}

BROKEN CODE:
```javascript
{broken_code}
```

CRITICAL FIXES TO APPLY:
1. Ensure ALL variables are defined before use
2. Check for typos in variable names
3. Verify all imports are correct
4. Use dependency injection pattern
5. Include proper cleanup in useEffect

Return ONLY the fixed JavaScript code.
"""
    
    message = self.client.messages.create(
        model=self.model,
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return self._clean_code(message.content[0].text)
```

## User Experience Examples

### Example 1: Success After 1 Retry
```
Logs shown to user:

1. Generating Widget...
2. Code generated: 5234 characters
3. Widget saved: widget_a1b2c3d4.js
4. Error detected (attempt 1): survivalRate is not defined
5. Asking LLM to fix the error...
6. Code fixed, retrying...
7. [Widget renders successfully]
```

### Example 2: Success After 2 Retries
```
1. Generating Widget...
2. Code generated: 6123 characters
3. Error detected (attempt 1): Cannot read property 'map' of undefined
4. Asking LLM to fix the error...
5. Code fixed, retrying...
6. Error detected (attempt 2): data is not iterable
7. Asking LLM to fix the error...
8. Code fixed, retrying...
9. [Widget renders successfully]
```

### Example 3: Max Retries Exceeded
```
1. Generating Widget...
2. Error detected (attempt 1): ...
3. Code fixed, retrying...
4. Error detected (attempt 2): ...
5. Code fixed, retrying...
6. [Shows error message]
   Error (after 2 retry attempts): ...
   Check browser console for full stack trace
```

## Error Types Handled

### Common Runtime Errors
- **ReferenceError**: `survivalRate is not defined` → Undefined variables
- **TypeError**: `Cannot read property 'map' of undefined` → Null/undefined data access
- **Import Errors**: `Be is not a function` → Wrong library imports
- **Syntax Errors**: Malformed code

### LLM Fix Strategy
1. **Variable typos**: `survivalRate` → `survival_rate`
2. **Missing definitions**: Add variable declarations
3. **Import corrections**: Fix CDN URLs
4. **Null checks**: Add defensive programming

## Benefits

### For Users
- ✅ Automatic error recovery
- ✅ Transparent retry process (shown in logs)
- ✅ Higher success rate for complex visualizations
- ✅ No manual debugging required

### For Developers
- ✅ Self-healing widgets
- ✅ LLM learns from its own mistakes
- ✅ Error context preserved for debugging
- ✅ Graceful degradation (shows error after max retries)

## Architecture Details

### State Machine
```
idle → generating → ready → [error detected] → generating → ready
                                    ↓
                           (max 2 loops)
                                    ↓
                            error (final state)
```

### Communication Flow
```
Browser (JavaScript)          Python (Backend)
─────────────────────        ─────────────────
SandboxedRunner              VibeWidget
     │                            │
     ├─ catch error              │
     ├─ model.set('error_msg')   │
     │         └──────────────────┤
     │                            ├─ _on_error() triggered
     │                            ├─ call LLM fix_code_error()
     │                            ├─ model.code = fixed_code
     │         ┌──────────────────┘
     ├─ React.useEffect([code])  │
     ├─ re-execute fixed code    │
     └─ success or retry         │
```

### Traitlet Synchronization
- `error_message`: Browser → Python (error reporting)
- `retry_count`: Python → Browser (retry tracking)
- `code`: Python → Browser (fixed code delivery)
- `logs`: Python → Browser (progress updates)
- `status`: Python → Browser (state changes)

## Testing

### Test Scenarios
1. **Undefined variable** → Should auto-fix variable name
2. **Missing import** → Should correct CDN URL
3. **Null data access** → Should add null checks
4. **Persistent error** → Should show error after 2 retries

### Manual Testing
```python
import pandas as pd
import vibe_widget as vw

# Generate widget that might have errors
df = pd.DataFrame({'x': [1,2,3], 'y': [4,5,6]})
widget = vw.create("complex visualization with survival rates", df)

# Watch logs for auto-fix attempts
# Should see: "Error detected (attempt 1)" → "Code fixed, retrying..."
```

## Future Enhancements

1. **Error Pattern Learning**: Cache common fixes for faster recovery
2. **Validation Pre-check**: Catch obvious errors before execution
3. **User Override**: Allow manual code editing if auto-fix fails
4. **Error Analytics**: Track which errors are most common

---

**Status**: ✅ Implemented  
**Ready**: Jupyter Lab Testing  
**Impact**: Significantly improved widget reliability
