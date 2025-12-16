"""
Core VibeWidget implementation.
Clean, robust widget generation without legacy profile logic.
"""
from pathlib import Path
from typing import Any

import anywidget
import pandas as pd
import traitlets

from vibe_widget.utils.code_parser import CodeStreamParser
from vibe_widget.llm import get_provider
from vibe_widget.llm.agentic import AgenticOrchestrator
from vibe_widget.llm.providers.base import LLMProvider
from vibe_widget.llm.tools.data_tools import DataLoadTool
from vibe_widget.config import get_global_config, Config
from vibe_widget.utils.widget_store import WidgetStore
from vibe_widget.utils.util import clean_for_json, initial_import_value, serialize_imports_for_prompt


class ComponentReference:
    """Reference to a component within a widget for composition."""
    
    def __init__(self, widget: "VibeWidget", component_name: str):
        """
        Initialize component reference.
        
        Args:
            widget: Source widget containing the component
            component_name: Name of the component
        """
        self.widget = widget
        self.component_name = component_name
    
    def __repr__(self) -> str:
        return f"<ComponentReference: {self.component_name} from widget {self.widget._widget_metadata.get('slug', 'unknown') if self.widget._widget_metadata else 'unknown'}>"
    
    @property
    def code(self) -> str:
        """Get the full code of the source widget."""
        return self.widget.code
    
    @property
    def metadata(self) -> dict[str, Any]:
        """Get the widget metadata."""
        return self.widget._widget_metadata or {}


class VibeWidget(anywidget.AnyWidget):
    data = traitlets.List([]).tag(sync=True)
    description = traitlets.Unicode("").tag(sync=True)
    status = traitlets.Unicode("idle").tag(sync=True)
    logs = traitlets.List([]).tag(sync=True)
    code = traitlets.Unicode("").tag(sync=True)
    error_message = traitlets.Unicode("").tag(sync=True)
    retry_count = traitlets.Int(0).tag(sync=True)

    @classmethod
    def _create_with_dynamic_traits(
        cls,
        description: str,
        df: pd.DataFrame,
        model: str = "claude-haiku-4-5-20251001",
        show_progress: bool = True,
        exports: dict[str, str] | None = None,
        imports: dict[str, Any] | None = None,
        data_var_name: str | None = None,
        base_code: str | None = None,
        base_components: list[str] | None = None,
        base_widget_id: str | None = None,
        **kwargs,
    ) -> "VibeWidget":
        """Return a widget instance that includes traitlets for declared exports/imports."""
        exports = exports or {}
        imports = imports or {}

        dynamic_traits: dict[str, traitlets.TraitType] = {}
        for export_name in exports.keys():
            dynamic_traits[export_name] = traitlets.Any(default_value=None).tag(sync=True)
        for import_name in imports.keys():
            if import_name not in dynamic_traits:
                dynamic_traits[import_name] = traitlets.Any(default_value=None).tag(sync=True)

        widget_class = (
            type("DynamicVibeWidget", (cls,), dynamic_traits) if dynamic_traits else cls
        )

        init_values: dict[str, Any] = {}
        for export_name in exports.keys():
            init_values[export_name] = None
        for import_name, import_source in imports.items():
            init_values[import_name] = initial_import_value(import_name, import_source)

        return widget_class(
            description=description,
            df=df,
            model=model,
            show_progress=show_progress,
            exports=exports,
            imports=imports,
            data_var_name=data_var_name,
            base_code=base_code,
            base_components=base_components,
            base_widget_id=base_widget_id,
            **init_values,
            **kwargs,
        )

    def __init__(
        self, 
        description: str, 
        df: pd.DataFrame, 
        model: str = "claude-haiku-4-5-20251001",
        show_progress: bool = True,
        exports: dict[str, str] | None = None,
        imports: dict[str, Any] | None = None,
        data_var_name: str | None = None,
        base_code: str | None = None,
        base_components: list[str] | None = None,
        base_widget_id: str | None = None,
        **kwargs
    ):
        """
        Create a VibeWidget with automatic code generation.
        
        Args:
            description: Natural language description of desired visualization
            df: DataFrame to visualize
            model: Claude model to use
            show_progress: Whether to show progress widget (deprecated - now uses internal state)
            exports: Dict of trait_name -> description for state this widget exposes
            imports: Dict of trait_name -> source widget/value for state this widget consumes
            data_var_name: Variable name of the data parameter for cache key
            base_code: Optional base widget code for revision/composition
            base_components: Optional list of component names from base widget
            base_widget_id: Optional ID of base widget for provenance tracking
            **kwargs: Additional widget parameters
        """
        parser = CodeStreamParser()
        self._exports = exports or {}
        self._imports = imports or {}
        self._widget_metadata = None
        self._base_code = base_code
        self._base_components = base_components or []
        self._base_widget_id = base_widget_id
        
        app_wrapper_path = Path(__file__).parent / "app_wrapper.js"
        self._esm = app_wrapper_path.read_text()
        
        data_json = df.to_dict(orient="records")
        data_json = clean_for_json(data_json)
        
        super().__init__(
            data=data_json,
            description=description,
            status="generating",
            logs=[],
            code="",
            error_message="",
            retry_count=0,
            **kwargs
        )
        
        self.observe(self._on_error, names='error_message')
        
        if show_progress:
            try:
                from IPython.display import display
                display(self)
            except ImportError:
                pass
        
        try:
            self.logs = [f"Analyzing data: {df.shape[0]} rows × {df.shape[1]} columns"]
            
            config = get_global_config()
            provider = get_provider(model, config.api_key)
            
            # Serialize imports for cache lookup
            # For cache purposes, we only care about the trait names, not the widget instances
            imports_serialized = {}
            if self._imports:
                for import_name in self._imports.keys():
                    # Just use the trait name as a placeholder - the actual widget instance
                    # shouldn't affect caching since we only care about the interface
                    imports_serialized[import_name] = f"<imported_trait:{import_name}>"
            
            # Check cache first
            store = WidgetStore()
            cached_widget = store.lookup(
                description=description,
                data_var_name=data_var_name,
                data_shape=df.shape,
                exports=self._exports,
                imports_serialized=imports_serialized,
            )
            
            if cached_widget:
                # Use cached widget
                self.logs = self.logs + ["✓ Found cached widget"]
                self.logs = self.logs + [f"  {cached_widget['slug']} v{cached_widget['version']}"]
                self.logs = self.logs + [f"  Created: {cached_widget['created_at'][:10]}"]
                widget_code = store.load_widget_code(cached_widget)
                self.code = widget_code
                self.status = "ready"
                self.description = description
                self._widget_metadata = cached_widget
                
                # Store data_info for error recovery
                self.data_info = LLMProvider.build_data_info(df, self._exports, imports_serialized)
                return
            
            # Create agentic orchestrator with the provider
            self.orchestrator = AgenticOrchestrator(provider=provider)
            
            self.logs = self.logs + ["Generating widget code..."]
            
            chunk_buffer = []
            update_counter = 0
            last_pattern_count = 0
            
            def stream_callback(event_type: str, message: str):
                """Handle progress events from orchestrator."""
                nonlocal update_counter, last_pattern_count
                
                event_messages = {
                    "step": f"➤ {message}",
                    "thinking": f"💭 {message[:150]}...",
                    "complete": f"✓ {message}",
                    "error": f"✘ {message}",
                    "chunk": message,
                }
                
                display_msg = event_messages.get(event_type, message)
                
                if event_type == "chunk":
                    chunk_buffer.append(message)
                    update_counter += 1
                    
                    updates = parser.parse_chunk(message)
                    
                    should_update = (
                        update_counter % 30 == 0 or 
                        parser.has_new_pattern() or
                        len(''.join(chunk_buffer)) > 500
                    )
                    
                    if should_update:
                        if chunk_buffer:
                            chunk_buffer.clear()
                        
                        for update in updates:
                            if update["type"] == "micro_bubble":
                                current_logs = list(self.logs)
                                current_logs.append(update["message"])
                                self.logs = current_logs
                        
                        current_pattern_count = len(parser.detected)
                        if current_pattern_count == last_pattern_count and update_counter % 100 == 0:
                            current_logs = list(self.logs)
                            current_logs.append(f"Generating code... ({update_counter} chunks)")
                            self.logs = current_logs
                        last_pattern_count = current_pattern_count
                else:
                    current_logs = list(self.logs)
                    current_logs.append(display_msg)
                    self.logs = current_logs
            
            # Generate code using the agentic orchestrator
            widget_code, processed_df = self.orchestrator.generate(
                description=description,
                df=df,
                exports=self._exports,
                imports=imports_serialized,
                base_code=self._base_code,
                base_components=self._base_components,
                progress_callback=stream_callback if show_progress else None,
            )
            
            current_logs = list(self.logs)
            current_logs.append(f"Code generated: {len(widget_code)} characters")
            self.logs = current_logs
            
            # Save to widget store (reuse store instance from cache lookup)
            notebook_path = store.get_notebook_path()
            widget_entry = store.save(
                widget_code=widget_code,
                description=description,
                data_var_name=data_var_name,
                data_shape=df.shape,
                model=model,
                exports=self._exports,
                imports_serialized=imports_serialized,
                notebook_path=notebook_path,
            )
            
            # Update widget_entry with base_widget_id if this is a revision
            if self._base_widget_id:
                widget_entry["base_widget_id"] = self._base_widget_id
                # Update in index
                for entry in store.index["widgets"]:
                    if entry["id"] == widget_entry["id"]:
                        entry["base_widget_id"] = self._base_widget_id
                        break
                store._save_index()
            
            self.logs = self.logs + [f"Widget saved: {widget_entry['slug']} v{widget_entry['version']}"]
            self.logs = self.logs + [f"Location: .vibewidget/widgets/{widget_entry['file_name']}"]
            self.code = widget_code
            self.status = "ready"
            self.description = description
            self._widget_metadata = widget_entry
            
            # Store data_info for error recovery  (build from LLMProvider method)
            self.data_info = LLMProvider.build_data_info(df, self._exports, imports_serialized)
            
        except Exception as e:
            self.status = "error"
            self.logs = self.logs + [f"Error: {str(e)}"]
            raise
    
    def _on_error(self, change):
        """Called when frontend reports a runtime error."""
        error_msg = change['new']
        
        if not error_msg or self.retry_count >= 2:
            return
        
        self.retry_count += 1
        self.status = 'generating'
        
        error_preview = error_msg.split('\n')[0][:100]
        self.logs = self.logs + [f"Error detected (attempt {self.retry_count}): {error_preview}"]
        self.logs = self.logs + ["Asking LLM to fix the error..."]
        
        try:
            clean_data_info = clean_for_json(self.data_info)
            
            fixed_code = self.orchestrator.fix_runtime_error(
                code=self.code,
                error_message=error_msg,
                data_info=clean_data_info,
            )
            
            self.logs = self.logs + ["Code fixed, retrying..."]
            self.code = fixed_code
            self.status = 'ready'
            self.error_message = ""
        except Exception as e:
            self.status = "error"
            self.logs = self.logs + [f"Fix attempt failed: {str(e)}"]
            self.error_message = ""
    
    def __dir__(self):
        """Return list of attributes including component names for autocomplete."""
        # Get default attributes
        default_attrs = object.__dir__(self)
        
        # Add component names if widget has been generated
        if hasattr(self, '_widget_metadata') and self._widget_metadata and "components" in self._widget_metadata:
            components = self._widget_metadata["components"]
            # Convert to lowercase for pythonic access (e.g., ColorLegend -> color_legend)
            component_attrs = [self._to_python_attr(comp) for comp in components]
            return list(set(default_attrs + component_attrs))
        
        return default_attrs
    
    def __getattr__(self, name: str):
        """
        Enable access to components via dot notation.
        
        Examples:
            scatter.slider -> ComponentReference
            scatter.color_legend -> ComponentReference
        """
        # Avoid infinite recursion for special attributes
        if name.startswith('_'):
            raise AttributeError(f"'{type(self).__name__}' object has no attribute '{name}'")
        
        # Check if this is a component access
        if hasattr(self, '_widget_metadata') and self._widget_metadata and "components" in self._widget_metadata:
            components = self._widget_metadata["components"]
            
            # Try to find matching component (handle both PascalCase and snake_case)
            for comp in components:
                if self._to_python_attr(comp) == name or comp.lower() == name.lower():
                    return ComponentReference(self, comp)
        
        raise AttributeError(f"'{type(self).__name__}' object has no attribute '{name}'")
    
    @staticmethod
    def _to_python_attr(component_name: str) -> str:
        """Convert PascalCase component name to snake_case attribute."""
        # Insert underscore before uppercase letters and convert to lowercase
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', component_name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def create(
    description: str,
    data: pd.DataFrame | str | Path | None = None,
    model: str | None = None,
    show_progress: bool = True,
    exports: dict[str, str] | None = None,
    imports: dict[str, Any] | None = None,
    config: Config | None = None,
) -> VibeWidget:
    """
    Create a VibeWidget visualization with automatic data processing.
    
    Args:
        description: Natural language description of the visualization
        data: DataFrame to visualize OR path to data file (CSV, NetCDF, GeoJSON, etc.) OR URL OR None when using imports only
        model: Model to use (e.g., "gemini", "openai", "anthropic") or specific model ID. See vw.models() for available options
        show_progress: Whether to show progress widget
        exports: Dict of {trait_name: description} for traits this widget exposes
        imports: Dict of {trait_name: source} where source is another widget's trait
        config: Optional Config object with model settings (overrides model parameter)
    
    Returns:
        VibeWidget instance
    
    Examples:
        >>> widget = create("show temperature trends", df)
        >>> widget = create("visualize sales data", "sales.csv")
        >>> widget = create("extract and visualize tables", "report.pdf")
        >>> widget = create("visualize top stories", "https://news.ycombinator.com")
    """
    if config:
        if not model:
            model = config.model
    elif not model:
        global_config = get_global_config()
        if not model:
            model = global_config.model
    

    if data is None:
        df = pd.DataFrame()
    elif isinstance(data, pd.DataFrame):
        df = data
    else:
        # Use DataLoadTool to load any supported data source
        result = DataLoadTool().execute(data)
        print("Loading data...", result)
        if result.success:
            df = result.output.get("dataframe", pd.DataFrame())
        else:
            raise ValueError(f"Failed to load data: {result.error}")
    
    # TODO: better data wrangling and preprocessing
    if len(df) > 5000:
        df = df.sample(5000)
        print("Note: Data truncated to 5000 rows for visualization.")

    widget = VibeWidget._create_with_dynamic_traits(
        description=description,
        df=df,
        model=model,
        show_progress=show_progress,
        exports=exports,
        imports=imports,
        data_var_name=None,  # Set to None as it's not a parameter of create()
    )

    # Link imported traits
    if imports:
        for import_name, import_source in imports.items():
            if hasattr(import_source, "trait_names") and hasattr(import_source, import_name):
                try:
                    traitlets.link((import_source, import_name), (widget, import_name))
                except Exception as exc:
                    print(f"Failed to link {import_name}: {exc}")
            elif hasattr(import_source, "__self__"):
                source_widget = import_source.__self__
                if hasattr(source_widget, import_name):
                    try:
                        traitlets.link((source_widget, import_name), (widget, import_name))
                    except Exception as exc:
                        print(f"Failed to link {import_name}: {exc}")
    
    # Display widget
    try:
        from IPython.display import display
        display(widget)
    except ImportError:
        pass
    
    return widget


def revise(
    description: str,
    source: "VibeWidget | ComponentReference | str | Path",
    data: pd.DataFrame | str | Path | None = None,
    model: str | None = None,
    show_progress: bool = True,
    exports: dict[str, str] | None = None,
    imports: dict[str, Any] | None = None,
    config: Config | None = None,
) -> "VibeWidget":
    """
    Revise a widget by building upon existing widget code.
    
    This enables iterative refinement and composition:
    - Start from an existing widget variable: revise("add tooltip", scatter)
    - Reuse a component from a widget: revise("histogram", scatter.slider, data=df)
    - Load from cache by ID: revise("improve", "abc123-v1")
    - Load from file: revise("adapt", "path/to/widget.js", data=df)
    
    Args:
        description: Natural language description of changes/additions
        source: Widget variable, ComponentReference, widget ID, or file path
        data: DataFrame to visualize (uses source widget's data if None)
        model: Model to use (inherits from source if None)
        show_progress: Whether to show progress widget
        exports: Dict of {trait_name: description} for new/modified exports
        imports: Dict of {trait_name: source} for new/modified imports
        config: Optional Config object with model settings
    
    Returns:
        New VibeWidget instance with revised code
    
    Examples:
        >>> # Iterative refinement
        >>> scatter2 = revise("add hover tooltips", scatter)
        >>> 
        >>> # Component composition
        >>> hist = revise("histogram with slider", scatter.slider, data=df)
        >>> 
        >>> # Load from cache
        >>> widget = revise("make it 3D", "abc123-v1", data=df)
        >>> 
        >>> # Load from file
        >>> widget = revise("adapt for my data", "widgets/base.js", data=df)
    """
    # Resolve config and model
    if config:
        if not model:
            model = config.model
    elif not model:
        global_config = get_global_config()
        model = global_config.model
    
    # Initialize store for loading
    store = WidgetStore()
    
    # Resolve source to (base_code, base_metadata, base_components)
    base_code: str
    base_metadata: dict[str, Any] | None = None
    base_components: list[str] = []
    source_df: pd.DataFrame | None = None
    
    if isinstance(source, VibeWidget):
        # Source is a widget instance
        base_code = source.code
        base_metadata = source._widget_metadata
        base_components = base_metadata.get("components", []) if base_metadata else []
        # Try to get data from source widget
        source_data = source.data
        if source_data:
            source_df = pd.DataFrame(source_data)
    
    elif isinstance(source, ComponentReference):
        # Source is a component reference - extract from parent widget
        base_code = source.code
        base_metadata = source.metadata
        base_components = [source.component_name]  # Focus on this component
        # Try to get data from source widget
        source_data = source.widget.data
        if source_data:
            source_df = pd.DataFrame(source_data)
    
    elif isinstance(source, str):
        # Source is either a widget ID or file path
        # Try as widget ID first
        result = store.load_by_id(source)
        if result:
            base_metadata, base_code = result
            base_components = base_metadata.get("components", [])
        else:
            # Try as file path
            result = store.load_from_file(Path(source))
            if result:
                base_metadata, base_code = result
                base_components = base_metadata.get("components", [])
            else:
                raise ValueError(f"Could not find widget with ID '{source}' or file at '{source}'")
    
    elif isinstance(source, Path):
        # Source is a file path
        result = store.load_from_file(source)
        if result:
            base_metadata, base_code = result
            base_components = base_metadata.get("components", [])
        else:
            raise FileNotFoundError(f"Widget file not found: {source}")
    
    else:
        raise TypeError(f"Invalid source type: {type(source)}. Expected VibeWidget, ComponentReference, str, or Path")
    
    # Resolve data: use provided data, else source data, else empty
    if data is None:
        if source_df is not None:
            df = source_df
        else:
            df = pd.DataFrame()
    elif isinstance(data, pd.DataFrame):
        df = data
    else:
        # Load data from file/URL
        result = DataLoadTool().execute(data)
        if result.success:
            df = result.output.get("dataframe", pd.DataFrame())
        else:
            raise ValueError(f"Failed to load data: {result.error}")
    
    # Truncate if needed
    if len(df) > 5000:
        df = df.sample(5000)
        print("Note: Data truncated to 5000 rows for visualization.")
    
    # Inherit model from base metadata if not specified
    if not model and base_metadata:
        model = base_metadata.get("model", "claude-haiku-4-5-20251001")
    
    # Create widget with revision
    widget = VibeWidget._create_with_dynamic_traits(
        description=description,
        df=df,
        model=model,
        show_progress=show_progress,
        exports=exports,
        imports=imports,
        data_var_name=None,
        base_code=base_code,
        base_components=base_components,
        base_widget_id=base_metadata.get("id") if base_metadata else None,
    )
    
    # Link imported traits
    if imports:
        for import_name, import_source in imports.items():
            if hasattr(import_source, "trait_names") and hasattr(import_source, import_name):
                try:
                    traitlets.link((import_source, import_name), (widget, import_name))
                except Exception as exc:
                    print(f"Failed to link {import_name}: {exc}")
            elif hasattr(import_source, "__self__"):
                source_widget = import_source.__self__
                if hasattr(source_widget, import_name):
                    try:
                        traitlets.link((source_widget, import_name), (widget, import_name))
                    except Exception as exc:
                        print(f"Failed to link {import_name}: {exc}")
    
    # Display widget
    try:
        from IPython.display import display
        display(widget)
    except ImportError:
        pass
    
    return widget
