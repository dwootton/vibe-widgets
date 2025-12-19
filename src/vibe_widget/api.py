from __future__ import annotations

"""Small helpers for the public export/import API."""

from dataclasses import dataclass
from typing import Any


@dataclass
class ExportDefinition:
    """Definition of a widget export."""

    description: str


@dataclass
class ExportBundle:
    """Container for resolved exports."""

    exports: dict[str, str]


@dataclass
class ImportsBundle:
    """Container that unifies data with other imports."""

    data: Any
    imports: dict[str, Any]


class ExportHandle:
    """Callable handle that references a widget export."""

    __vibe_export__ = True

    def __init__(self, widget: Any, name: str):
        self.widget = widget
        self.name = name

    def __call__(self):
        getter = getattr(self.widget, "_get_export_value", None)
        return getter(self.name) if getter else None

    @property
    def value(self):
        return self()

    def __repr__(self) -> str:
        metadata = getattr(self.widget, "_widget_metadata", {}) or {}
        slug = metadata.get("slug") or getattr(self.widget, "description", None) or "widget"
        return f"<VibeExport {slug}.{self.name}>"


def export(description: str) -> ExportDefinition:
    """Declare a single export."""
    return ExportDefinition(description)


def exports(**kwargs: ExportDefinition | str) -> ExportBundle:
    """Bundle exports into the shape the core expects."""
    export_map: dict[str, str] = {}
    for name, definition in kwargs.items():
        if isinstance(definition, ExportDefinition):
            export_map[name] = definition.description
        elif isinstance(definition, str):
            export_map[name] = definition
        else:
            raise TypeError(f"Export '{name}' must be a string or vw.export(...)")
    return ExportBundle(export_map)


def imports(data: Any = None, /, **kwargs: Any) -> ImportsBundle:
    """Bundle data with imports for a unified API."""
    return ImportsBundle(data=data, imports=kwargs)
