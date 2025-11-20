import os
import re
from pathlib import Path
from typing import Any, Callable

from anthropic import Anthropic
from dotenv import load_dotenv

from vibe_widget.llm.base import LLMProvider

load_dotenv()


class ClaudeProvider(LLMProvider):
    def __init__(self, api_key: str | None = None, model: str = "claude-haiku-4-5-20251001"):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError(
                "API key required. Pass api_key or set ANTHROPIC_API_KEY env variable."
            )
        self.model = model
        self.client = Anthropic(api_key=self.api_key)
    
    def _build_exports_imports_section(self, exports: dict, imports: dict) -> str:
        """Build the exports/imports section of the prompt"""
        if not exports and not imports:
            return ""
        
        sections = []
        
        if exports:
            export_list = "\n".join([f"- {name}: {desc}" for name, desc in exports.items()])
            sections.append(f"""
═══════════════════════════════════════════════════════════════
EXPORTS (State to share with other widgets):
═══════════════════════════════════════════════════════════════
{export_list}

🔴 CRITICAL EXPORT REQUIREMENTS:
1. ALWAYS initialize exports immediately in render() with default values
2. ALWAYS update exports CONTINUOUSLY during user interactions (not just once!)
3. ALWAYS call model.save_changes() after EVERY model.set() call
4. Exports are meant to be consumed by other widgets - keep them updated!

✅ CORRECT Pattern for exporting selected_indices:
```javascript
function render({{ model, el }}) {{
  // 1. Initialize immediately
  model.set("selected_indices", []);
  model.save_changes();
  
  // 2. Update continuously on EVERY interaction
  canvas.addEventListener('mousedown', (e) => {{
    isDrawing = true;
    paint(e.clientX - rect.left, e.clientY - rect.top);
  }});
  
  canvas.addEventListener('mousemove', (e) => {{
    if (!isDrawing) return;
    paint(e.clientX - rect.left, e.clientY - rect.top);
    // Export updates DURING the interaction!
  }});
  
  function paint(x, y) {{
    // Calculate new values...
    const newData = calculateData(x, y);
    
    // Update export immediately
    model.set("selected_indices", newData);
    model.save_changes();
  }}
}}
```

✅ CORRECT Pattern for exporting heightmap with brush painting:
```javascript
function render({{ model, el }}) {{
  // Initialize
  const gridSize = 64;
  let heightmap = new Array(gridSize * gridSize).fill(0);
  model.set("heightmap", heightmap);
  model.save_changes();
  
  let isDrawing = false;
  
  function paint(x, y) {{
    // Get current heightmap
    heightmap = [...model.get("heightmap")];
    
    // Apply brush effect with radius
    const radius = 3;
    const intensity = 0.05;
    for (let dy = -radius; dy <= radius; dy++) {{
      for (let dx = -radius; dx <= radius; dx++) {{
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist <= radius) {{
          const idx = /* calculate index */;
          heightmap[idx] += (1 - dist/radius) * intensity;
        }}
      }}
    }}
    
    // Export EVERY paint stroke
    model.set("heightmap", heightmap);
    model.save_changes();
  }}
  
  canvas.addEventListener('mousedown', (e) => {{
    isDrawing = true;
    paint(getX(e), getY(e));
  }});
  
  canvas.addEventListener('mousemove', (e) => {{
    if (!isDrawing) return;
    paint(getX(e), getY(e)); // Updates export continuously!
  }});
}}
```

❌ WRONG - Only updating once:
```javascript
// BAD: Only updates on final mouseup
canvas.addEventListener('mouseup', () => {{
  model.set("selected_indices", finalSelection);
  model.save_changes();
}});
```

❌ WRONG - Forgetting save_changes():
```javascript
// BAD: Missing save_changes()
model.set("selected_indices", data);
// Changes won't sync to Python!
```
""")
        
        if imports:
            import_list = "\n".join([f"- {name}: {desc}" for name, desc in imports.items()])
            sections.append(f"""
═══════════════════════════════════════════════════════════════
IMPORTS (State from other widgets):
═══════════════════════════════════════════════════════════════
{import_list}

🔴 CRITICAL IMPORT REQUIREMENTS:
1. Read imported values using model.get("trait_name")
2. ALWAYS listen for changes with model.on("change:trait_name", callback)
3. Handle null/undefined/empty cases gracefully
4. Update visualization immediately when imports change

✅ CORRECT Pattern for importing heightmap (3D terrain):
```javascript
import * as THREE from "https://esm.sh/three@0.154.0";
import {{ OrbitControls }} from "https://esm.sh/three@0.154.0/examples/jsm/controls/OrbitControls.js";

function render({{ model, el }}) {{
  // Setup Three.js scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({{ antialias: true }});
  el.appendChild(renderer.domElement);
  
  const gridSize = 64;
  const geometry = new THREE.PlaneGeometry(64, 64, gridSize - 1, gridSize - 1);
  const material = new THREE.MeshStandardMaterial({{ 
    color: 0x228833,
    flatShading: true 
  }});
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);
  
  // Function to update terrain from heightmap
  function updateTerrain() {{
    const heightmap = model.get("heightmap");
    if (!heightmap || heightmap.length === 0) return;
    
    const positions = geometry.attributes.position;
    
    // Update vertex heights
    for (let i = 0; i < positions.count; i++) {{
      const h = heightmap[i] * 20; // Scale to visible range
      positions.setZ(i, h);
    }}
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }}
  
  // Initial render
  updateTerrain();
  
  // CRITICAL: Listen for changes!
  model.on("change:heightmap", updateTerrain);
  
  // Animation loop
  function animate() {{
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }}
  animate();
}}
```

✅ CORRECT Pattern for importing selected_indices (filtering):
```javascript
function render({{ model, el }}) {{
  function updateVisualization() {{
    const allData = model.get("data");
    const selectedIndices = model.get("selected_indices") || [];
    
    // Filter data based on selection
    const displayData = selectedIndices.length > 0
      ? selectedIndices.map(i => allData[i]).filter(d => d !== undefined)
      : allData;
    
    // Re-render visualization with filtered data
    renderChart(displayData);
  }}
  
  // Initial render
  updateVisualization();
  
  // CRITICAL: Listen for BOTH data and selection changes!
  model.on("change:data", updateVisualization);
  model.on("change:selected_indices", updateVisualization);
}}
```

❌ WRONG - Not listening for changes:
```javascript
// BAD: Only reads once, never updates!
const heightmap = model.get("heightmap");
updateMesh(heightmap);
// Missing: model.on("change:heightmap", ...)
```
""")
        
        return "\n".join(sections)

    def generate_widget_code(
        self, 
        description: str, 
        data_info: dict[str, Any], 
        progress_callback: Callable[[str], None] | None = None
    ) -> str:
        prompt = self._build_prompt(description, data_info)

        if progress_callback:
            code_chunks = []
            with self.client.messages.stream(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                for text in stream.text_stream:
                    code_chunks.append(text)
                    progress_callback(text)
            
            code = "".join(code_chunks)
        else:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            code = message.content[0].text
        
        return self._clean_code(code)

    def _clean_code(self, code: str) -> str:
        code = re.sub(r'```(?:javascript|jsx?|typescript|tsx?)?\s*\n?', '', code)
        code = re.sub(r'\n?```\s*', '', code)
        return code.strip()

    def revise_widget_code(
        self,
        current_code: str,
        revision_description: str,
        data_info: dict[str, Any],
        progress_callback: Callable[[str], None] | None = None
    ) -> str:
        prompt = self._build_revision_prompt(current_code, revision_description, data_info)

        if progress_callback:
            code_chunks = []
            with self.client.messages.stream(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                for text in stream.text_stream:
                    code_chunks.append(text)
                    progress_callback(text)
            
            code = "".join(code_chunks)
        else:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            code = message.content[0].text
        
        return self._clean_code(code)

    def _build_revision_prompt(self, current_code: str, revision_description: str, data_info: dict[str, Any]) -> str:
        columns = data_info.get("columns", [])
        dtypes = data_info.get("dtypes", {})
        sample_data = data_info.get("sample", {})

        return f"""You are revising a JavaScript visualization. Apply the requested changes while maintaining code quality.

═══════════════════════════════════════════════════════════════
REVISION REQUEST: {revision_description}
═══════════════════════════════════════════════════════════════

CURRENT CODE:
```javascript
{current_code}
```

Data schema:
- Columns: {', '.join(columns)}
- Types: {dtypes}
- Sample: {sample_data}

═══════════════════════════════════════════════════════════════
🔴 REQUIREMENTS
═══════════════════════════════════════════════════════════════

1. Maintain anywidget format: export default {{ render }}
2. Keep function signature: function render({{ model, el }}) {{ ... }}
3. Preserve imports and library usage patterns
4. Fix any bugs or typos (e.g., THREE.PCFShadowShadowMap → THREE.PCFSoftShadowMap)
5. Ensure all Three.js imports use correct version format:
   - ✅ CORRECT: https://esm.sh/three@0.154.0
   - ❌ WRONG: https://esm.sh/three@r128
6. Check all geometry attributes exist before use
7. Null-check all model.get() calls
8. Append elements to 'el', never document.body
9. No markdown code fences in output
10. Keep it interactive and visually appealing

═══════════════════════════════════════════════════════════════
📝 OUTPUT
═══════════════════════════════════════════════════════════════

Return ONLY the complete revised JavaScript code.
- NO markdown fences
- NO explanations
- JUST the working code

Begin immediately:
"""

    def _build_prompt(self, description: str, data_info: dict[str, Any]) -> str:
        columns = data_info.get("columns", [])
        dtypes = data_info.get("dtypes", {})
        sample_data = data_info.get("sample", {})
        exports = data_info.get("exports", {})
        imports = data_info.get("imports", {})

        return f"""You are an expert JavaScript developer creating a high-quality interactive visualization.

═══════════════════════════════════════════════════════════════
TASK: {description}
═══════════════════════════════════════════════════════════════

Data schema:
- Columns: {', '.join(columns) if columns else 'No data (widget uses imports only)'}
- Types: {dtypes}
- Sample: {sample_data}

{self._build_exports_imports_section(exports, imports)}

═══════════════════════════════════════════════════════════════
🔴 CRITICAL ANYWIDGET SPECIFICATION
═══════════════════════════════════════════════════════════════

MUST FOLLOW EXACTLY:
1. Export default object with render function: export default {{ render }}
2. Function signature: function render({{ model, el }}) {{ ... }}
3. Access data: const data = model.get("data")
4. Append all elements to 'el' parameter (never to document.body)
5. Use vanilla JS or import from CDN/ESM (d3, plotly, three.js, etc)
6. NO React/ReactDOM - pure JavaScript only
7. NO markdown code fences in output
8. NO 100vh heights - use fixed pixel values or 100%

✅ CORRECT Template:
```javascript
import * as d3 from "https://esm.sh/d3@7";

function render({{ model, el }}) {{
  const data = model.get("data");
  
  // Create container
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "400px";
  el.appendChild(container);
  
  // Build visualization
  // ... your code here ...
  
  // Listen to data changes if needed
  model.on("change:data", () => {{
    // Update visualization
  }});
}}

export default {{ render }};
```

═══════════════════════════════════════════════════════════════
🚫 COMMON PITFALLS TO AVOID
═══════════════════════════════════════════════════════════════

❌ WRONG: Typos in Three.js constants
```javascript
renderer.shadowMap.type = THREE.PCFShadowShadowMap; // TYPO!
```
✅ CORRECT:
```javascript
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // or THREE.PCFShadowMap
```

❌ WRONG: Missing geometry attribute checks
```javascript
positions.setZ(i, h); // Crashes if positions undefined!
```
✅ CORRECT:
```javascript
const positions = geometry.attributes.position;
if (!positions) return;
for (let i = 0; i < positions.count; i++) {{
  positions.setZ(i, h);
}}
positions.needsUpdate = true;
```

❌ WRONG: Incorrect Three.js imports
```javascript
import * as THREE from "https://esm.sh/three@r128"; // Wrong version format
```
✅ CORRECT:
```javascript
import * as THREE from "https://esm.sh/three@0.154.0";
import {{ OrbitControls }} from "https://esm.sh/three@0.154.0/examples/jsm/controls/OrbitControls.js";
```

❌ WRONG: Not handling empty/null data
```javascript
const heightmap = model.get("heightmap");
for (let i = 0; i < heightmap.length; i++) // Crashes if null!
```
✅ CORRECT:
```javascript
const heightmap = model.get("heightmap");
if (!heightmap || heightmap.length === 0) {{
  // Use default or return early
  return;
}}
```

❌ WRONG: Creating elements but not appending to el
```javascript
const canvas = document.createElement("canvas");
document.body.appendChild(canvas); // WRONG! Goes to document!
```
✅ CORRECT:
```javascript
const canvas = document.createElement("canvas");
el.appendChild(canvas); // Append to el parameter
```

❌ WRONG: Forgetting to clean up event listeners
```javascript
window.addEventListener("resize", onResize);
// Memory leak when widget is destroyed!
```
✅ CORRECT:
```javascript
window.addEventListener("resize", onResize);

// Return cleanup function
return () => {{
  window.removeEventListener("resize", onResize);
  renderer.dispose();
}};
```

═══════════════════════════════════════════════════════════════
🎯 QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════

Before submitting code, verify:
✓ All imported libraries use correct versions and URLs
✓ All Three.js constants are spelled correctly (no double words)
✓ All geometry attributes are checked before use
✓ All data from model.get() is null-checked
✓ All elements append to 'el' parameter, never document.body
✓ Canvas/renderer sizing uses container dimensions, not 100vh
✓ Event listeners have cleanup in return function
✓ Exports are initialized AND updated continuously during interactions
✓ Imports are read with model.get() AND have model.on() listeners
✓ Code has no syntax errors (check brackets, semicolons, quotes)
✓ No markdown code fences (```) in the output

═══════════════════════════════════════════════════════════════
📝 OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════

Generate ONLY the JavaScript code.
- NO explanations before or after
- NO markdown code fences
- NO comments like "Here's the code..."
- JUST the working JavaScript code starting with imports (if any) and ending with export default {{ render }};

Begin your response with the code immediately:
"""
