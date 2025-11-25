"""LiteLLM provider implementation for unified LLM access."""

import os
import re
from typing import Any, Callable

import litellm
from litellm import completion

from vibe_widget.llm.base import LLMProvider

# Latest model versions - update these as new models are released
LATEST_MODELS = {
    "anthropic": "claude-opus-4-5-20251101",    # Latest Claude Opus
    "openai": "gpt-5.1-2025-11-13",            # Latest GPT-5.1
    "google": "gemini-3-pro-preview",          # Latest Gemini 3 Pro
}

# Configure LiteLLM settings
litellm.drop_params = True  # Drop unsupported parameters automatically
litellm.num_retries = 3     # Retry failed requests
litellm.request_timeout = 120  # 2 minute timeout


class LiteLLMProvider(LLMProvider):
    """Unified LLM provider using LiteLLM."""
    
    def __init__(self, model: str, api_key: str | None = None):
        """
        Initialize LiteLLM provider.
        
        Args:
            model: Model name or shortcut ("anthropic", "openai", "google")
            api_key: Optional API key (otherwise uses environment)
        """
        # Handle simple provider names
        if model in LATEST_MODELS:
            self.model = LATEST_MODELS[model]
        else:
            self.model = model
        
        # Set API key if provided
        if api_key:
            self._set_api_key(api_key)
    
    def _set_api_key(self, api_key: str):
        """Set the appropriate API key based on model."""
        if "claude" in self.model or "anthropic" in self.model:
            os.environ["ANTHROPIC_API_KEY"] = api_key
        elif "gpt" in self.model or "openai" in self.model:
            os.environ["OPENAI_API_KEY"] = api_key
        elif "gemini" in self.model or "google" in self.model:
            os.environ["GEMINI_API_KEY"] = api_key
    
    def generate_widget_code(
        self,
        description: str,
        data_info: dict[str, Any],
        progress_callback: Callable[[str], None] | None = None,
    ) -> str:
        """Generate widget code using LiteLLM."""
        prompt = self._build_prompt(description, data_info)
        
        try:
            # LiteLLM handles all providers uniformly
            response = completion(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                stream=bool(progress_callback),
                # Let LiteLLM handle max_tokens based on model
                temperature=0.7,
            )
            
            if progress_callback:
                return self._handle_stream(response, progress_callback)
            else:
                return self._clean_code(response.choices[0].message.content)
                
        except Exception as e:
            # LiteLLM provides detailed error messages
            if "context_length_exceeded" in str(e):
                # Try with a shorter prompt
                return self._retry_with_shorter_prompt(description, data_info, progress_callback)
            else:
                raise
    
    def revise_widget_code(
        self,
        current_code: str,
        revision_description: str,
        data_info: dict[str, Any],
        progress_callback: Callable[[str], None] | None = None,
    ) -> str:
        """Revise existing widget code."""
        prompt = self._build_revision_prompt(current_code, revision_description, data_info)
        
        response = completion(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            stream=bool(progress_callback),
            temperature=0.7,
        )
        
        if progress_callback:
            return self._handle_stream(response, progress_callback)
        else:
            return self._clean_code(response.choices[0].message.content)
    
    def fix_code_error(
        self,
        broken_code: str,
        error_message: str,
        data_info: dict[str, Any],
    ) -> str:
        """Fix errors in widget code."""
        prompt = self._build_fix_prompt(broken_code, error_message, data_info)
        
        response = completion(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,  # Lower temperature for fixing
        )
        
        return self._clean_code(response.choices[0].message.content)
    
    def _handle_stream(self, response, progress_callback: Callable[[str], None]) -> str:
        """Handle streaming response."""
        code_chunks = []
        for chunk in response:
            if chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                code_chunks.append(text)
                progress_callback(text)
        
        return self._clean_code("".join(code_chunks))
    
    def _retry_with_shorter_prompt(
        self,
        description: str,
        data_info: dict[str, Any],
        progress_callback: Callable[[str], None] | None = None,
    ) -> str:
        """Retry with a shorter prompt if context length exceeded."""
        # Reduce sample data size
        reduced_info = data_info.copy()
        if "sample" in reduced_info:
            # Keep only first row of sample data
            sample = reduced_info["sample"]
            if isinstance(sample, list) and len(sample) > 1:
                reduced_info["sample"] = sample[:1]
        
        prompt = self._build_prompt(description, reduced_info)
        
        response = completion(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            stream=bool(progress_callback),
            temperature=0.7,
        )
        
        if progress_callback:
            return self._handle_stream(response, progress_callback)
        else:
            return self._clean_code(response.choices[0].message.content)
    
    def _build_prompt(self, description: str, data_info: dict[str, Any]) -> str:
        """Build the prompt for code generation."""
        columns = data_info.get("columns", [])
        dtypes = data_info.get("dtypes", {})
        sample_data = data_info.get("sample", {})
        exports = data_info.get("exports", {})
        imports = data_info.get("imports", {})
        
        exports_imports_section = self._build_exports_imports_section(exports, imports)
        
        return f"""You are an expert JavaScript + React developer building a high-quality interactive visualization that runs inside an AnyWidget React bundle.

TASK: {description}

Data schema:
- Columns: {', '.join(columns) if columns else 'No data (widget uses imports only)'}
- Types: {dtypes}
- Sample data: {sample_data}

{exports_imports_section}

CRITICAL REACT + HTM SPECIFICATION:

MUST FOLLOW EXACTLY:
1. Export a default function: export default function Widget({{ model, html, React }}) {{ ... }}
2. Use html tagged templates (htm) for markup—no JSX or ReactDOM.render
3. Access data with model.get("data") and treat it as immutable
4. Append DOM nodes via refs rendered inside html templates (never touch document.body)
5. Import libraries from ESM CDN with locked versions (d3@7, three@0.160, regl@3, etc.)
6. Initialize exports immediately, update them as interactions occur, and call model.save_changes() each time
7. Subscribe to imported traits with model.on("change:trait", handler) and unsubscribe in cleanup
8. Every React.useEffect MUST return a cleanup that tears down listeners, observers, intervals, animation frames, WebGL resources, etc.
9. Avoid 100vh/100vw—use fixed heights (360–640px) or flex layouts that respect notebook constraints
10. Never wrap the output in markdown code fences

CORRECT Template:
```javascript
import * as d3 from "https://esm.sh/d3@7";

export default function VisualizationWidget({{ model, html, React }}) {{
  const data = model.get("data") || [];
  const [selectedItem, setSelectedItem] = React.useState(null);
  const containerRef = React.useRef(null);

  React.useEffect(() => {{
    if (!containerRef.current) return;
    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", 640)
      .attr("height", 420);

    // ... build chart ...

    return () => svg.remove();
  }}, [data]);

  return html`
    <section class="viz-shell" style=${{{{ padding: '24px', height: '480px' }}}}>
      <h2 class="viz-title">Experience</h2>
      <div ref=${{containerRef}} class="viz-canvas"></div>
      ${{selectedItem && html`<p class="viz-meta">Selected: ${{selectedItem}}</p>`}}
    </section>
  `;
}}
```

Key Syntax Rules:
- Use html`<div>...</div>` NOT <div>...</div>
- Use class= NOT className=
- Event props: onClick=${{handler}} NOT onClick={{handler}}
- Style objects: style=${{{{ padding: '20px' }}}}
- Conditionals: ${{condition && html`...`}}

OUTPUT REQUIREMENTS:

Generate ONLY the working JavaScript code (imports → export default function Widget...).
- NO explanations before or after
- NO markdown fences
- NO console logs unless essential

Begin the response with code immediately."""
    
    def _build_revision_prompt(
        self,
        current_code: str,
        revision_description: str,
        data_info: dict[str, Any],
    ) -> str:
        """Build the prompt for code revision."""
        columns = data_info.get("columns", [])
        dtypes = data_info.get("dtypes", {})
        sample_data = data_info.get("sample", {})
        exports = data_info.get("exports", {})
        imports = data_info.get("imports", {})
        
        exports_imports_section = self._build_exports_imports_section(exports, imports)
        
        return f"""Revise the following AnyWidget React bundle code according to the request.

REVISION REQUEST: {revision_description}

CURRENT CODE:
```javascript
{current_code}
```

Data schema:
- Columns: {', '.join(columns) if columns else 'No data (widget uses imports only)'}
- Types: {dtypes}
- Sample data: {sample_data}

{exports_imports_section}

Follow the SAME constraints as generation:
- export default function Widget({{ model, html, React }})
- html tagged templates only (no JSX)
- ESM CDN imports with locked versions
- Thorough cleanup in every React.useEffect

Return only the full revised JavaScript code. No markdown fences or explanations."""
    
    def _build_fix_prompt(
        self,
        broken_code: str,
        error_message: str,
        data_info: dict[str, Any],
    ) -> str:
        """Build the prompt for fixing code errors."""
        columns = data_info.get("columns", [])
        dtypes = data_info.get("dtypes", {})
        sample_data = data_info.get("sample", {})
        exports = data_info.get("exports", {})
        imports = data_info.get("imports", {})
        
        exports_imports_section = self._build_exports_imports_section(exports, imports)
        
        return f"""Fix the AnyWidget React bundle code below. Keep the interaction model identical while eliminating the runtime error.

ERROR MESSAGE:
{error_message}

BROKEN CODE:
```javascript
{broken_code}
```

Data schema:
- Columns: {', '.join(columns) if columns else 'No data (widget uses imports only)'}
- Types: {dtypes}
- Sample data: {sample_data}

{exports_imports_section}

MANDATORY FIX RULES:
1. Export default function Widget({{ model, html, React }})
2. Use html tagged templates (htm) instead of JSX
3. Guard every model.get payload before iterating
4. Keep CDN imports version-pinned
5. Restore all cleanup handlers
6. Initialize exports and call model.save_changes()

Return ONLY the corrected JavaScript code."""
    
    def _build_exports_imports_section(self, exports: dict, imports: dict) -> str:
        """Build the exports/imports section of the prompt."""
        if not exports and not imports:
            return ""
        
        sections: list[str] = []
        
        if exports:
            export_list = "\n".join([f"- {name}: {desc}" for name, desc in exports.items()])
            sections.append(f"""
EXPORTS (State shared with other widgets):
{export_list}

CRITICAL: Initialize exports when widget mounts, update continuously, call model.save_changes()""")
        
        if imports:
            import_list = "\n".join([f"- {name}: {desc}" for name, desc in imports.items()])
            sections.append(f"""
IMPORTS (State from other widgets):
{import_list}

CRITICAL: Subscribe with model.on("change:trait", handler), unsubscribe in cleanup""")
        
        return "\n".join(sections)
    
    def _clean_code(self, code: str) -> str:
        """Clean the generated code."""
        if not code:
            return ""
        
        # Remove markdown code fences
        code = re.sub(r"```(?:javascript|jsx?|typescript|tsx?)?\s*\n?", "", code)
        code = re.sub(r"\n?```\s*", "", code)
        
        return code.strip()