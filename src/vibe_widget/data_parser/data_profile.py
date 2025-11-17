"""
Unified Data Profile Schema
Represents any dataset in a standardized format for LLM consumption
"""
from dataclasses import dataclass, field
from typing import Any, Literal
from datetime import datetime
import json


@dataclass
class ColumnProfile:
    """Profile for a single column/field/dimension"""
    name: str
    dtype: str  # Standardized: numeric, categorical, temporal, text, geospatial, binary
    
    # Statistical properties
    count: int | None = None
    missing_count: int | None = None
    unique_count: int | None = None
    
    # Numeric properties
    min: float | None = None
    max: float | None = None
    mean: float | None = None
    median: float | None = None
    std: float | None = None
    quartiles: list[float] | None = None
    
    # Categorical properties
    top_values: list[tuple[Any, int]] | None = None  # (value, count)
    cardinality: Literal["low", "medium", "high"] | None = None
    
    # Temporal properties
    temporal_range: tuple[str, str] | None = None  # (start, end) as ISO strings
    temporal_resolution: str | None = None  # "daily", "hourly", etc.
    
    # Text properties
    avg_length: float | None = None
    sample_values: list[str] | None = None
    
    # Geospatial properties
    coordinate_system: str | None = None  # "lat/lon", "UTM", etc.
    spatial_extent: dict | None = None  # {min_x, max_x, min_y, max_y}
    
    # Semantic meaning (LLM-inferred)
    inferred_meaning: str | None = None
    potential_uses: list[str] | None = None


@dataclass
class DataProfile:
    """Unified profile for any dataset"""
    # Core metadata (required fields first)
    source_type: str  # "dataframe", "netcdf", "geojson", "api", "pdf_table", etc.
    shape: tuple[int, ...]  # (rows,) or (rows, cols) or (depth, height, width, time)
    
    # Optional fields (with defaults)
    source_uri: str | None = None
    columns: list[ColumnProfile] = field(default_factory=list)
    
    # Relationships and structure
    hierarchical: bool = False
    dimensions: dict[str, int] | None = None  # For multi-dimensional data
    groups: list[str] | None = None  # For hierarchical formats (HDF5, netCDF)
    
    # Temporal characteristics
    is_timeseries: bool = False
    temporal_column: str | None = None
    temporal_frequency: str | None = None
    
    # Spatial characteristics
    is_geospatial: bool = False
    coordinate_columns: list[str] | None = None
    crs: str | None = None  # Coordinate reference system
    
    # Quality metrics
    completeness: float = 1.0  # 0-1, proportion non-missing
    consistency_issues: list[str] = field(default_factory=list)
    
    # Sample data (for LLM)
    sample_records: list[dict] | None = None
    
    # Domain context (LLM-augmented)
    inferred_domain: str | None = None  # "oceanography", "epidemiology", etc.
    dataset_purpose: str | None = None
    key_insights: list[str] = field(default_factory=list)
    suggested_visualizations: list[str] = field(default_factory=list)
    
    # Metadata
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_markdown(self) -> str:
        """Generate LLM-friendly markdown description"""
        md_parts = []
        
        # Header
        md_parts.append(f"# Dataset Profile: {self.source_type}")
        if self.source_uri:
            md_parts.append(f"**Source:** `{self.source_uri}`\n")
        
        # Overview
        md_parts.append("## Overview")
        shape_str = " × ".join(map(str, self.shape))
        md_parts.append(f"- **Shape:** {shape_str}")
        md_parts.append(f"- **Completeness:** {self.completeness:.1%}")
        
        if self.inferred_domain:
            md_parts.append(f"- **Domain:** {self.inferred_domain}")
        if self.dataset_purpose:
            md_parts.append(f"- **Purpose:** {self.dataset_purpose}")
        
        # Characteristics
        characteristics = []
        if self.is_timeseries:
            characteristics.append(f"Time series (frequency: {self.temporal_frequency})")
        if self.is_geospatial:
            characteristics.append(f"Geospatial (CRS: {self.crs})")
        if self.hierarchical:
            characteristics.append("Hierarchical structure")
        
        if characteristics:
            md_parts.append(f"- **Characteristics:** {', '.join(characteristics)}\n")
        else:
            md_parts.append("")
        
        # Columns/Fields
        md_parts.append("## Fields")
        for col in self.columns:
            md_parts.append(f"\n### `{col.name}` ({col.dtype})")
            
            if col.inferred_meaning:
                md_parts.append(f"*{col.inferred_meaning}*")
            
            details = []
            if col.count:
                details.append(f"Count: {col.count:,}")
            if col.missing_count and col.missing_count > 0:
                details.append(f"Missing: {col.missing_count:,}")
            
            # Numeric details
            if col.dtype == "numeric" and col.min is not None:
                details.append(f"Range: [{col.min:.2f}, {col.max:.2f}]")
                if col.mean:
                    details.append(f"Mean: {col.mean:.2f}")
            
            # Categorical details
            if col.dtype == "categorical" and col.top_values:
                top_3 = col.top_values[:3]
                values_str = ", ".join([f"{val} ({cnt})" for val, cnt in top_3])
                details.append(f"Top values: {values_str}")
                details.append(f"Unique: {col.unique_count}")
            
            # Temporal details
            if col.dtype == "temporal" and col.temporal_range:
                start, end = col.temporal_range
                details.append(f"Range: {start} to {end}")
            
            if details:
                md_parts.append("- " + " | ".join(details))
            
            if col.potential_uses:
                md_parts.append(f"- **Potential uses:** {', '.join(col.potential_uses)}")
        
        # Sample data
        if self.sample_records:
            md_parts.append("\n## Sample Data")
            md_parts.append("```json")
            md_parts.append(json.dumps(self.sample_records[:3], indent=2, default=str))
            md_parts.append("```")
        
        # Insights
        if self.key_insights:
            md_parts.append("\n## Key Insights")
            for insight in self.key_insights:
                md_parts.append(f"- {insight}")
        
        # Visualization suggestions
        if self.suggested_visualizations:
            md_parts.append("\n## Suggested Visualizations")
            for viz in self.suggested_visualizations:
                md_parts.append(f"- {viz}")
        
        # Quality issues
        if self.consistency_issues:
            md_parts.append("\n## Data Quality Issues")
            for issue in self.consistency_issues:
                md_parts.append(f"- ⚠️ {issue}")
        
        return "\n".join(md_parts)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "source_type": self.source_type,
            "source_uri": self.source_uri,
            "shape": self.shape,
            "columns": [
                {k: v for k, v in col.__dict__.items() if v is not None}
                for col in self.columns
            ],
            "hierarchical": self.hierarchical,
            "dimensions": self.dimensions,
            "is_timeseries": self.is_timeseries,
            "temporal_column": self.temporal_column,
            "temporal_frequency": self.temporal_frequency,
            "is_geospatial": self.is_geospatial,
            "coordinate_columns": self.coordinate_columns,
            "crs": self.crs,
            "completeness": self.completeness,
            "consistency_issues": self.consistency_issues,
            "sample_records": self.sample_records,
            "inferred_domain": self.inferred_domain,
            "dataset_purpose": self.dataset_purpose,
            "key_insights": self.key_insights,
            "suggested_visualizations": self.suggested_visualizations,
            "created_at": self.created_at,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "DataProfile":
        """Create DataProfile from dictionary (loaded from JSON)"""
        # Convert column dictionaries to ColumnProfile objects
        columns = []
        for col_data in data.get("columns", []):
            # Handle top_values which might be stored as lists of lists
            top_values = col_data.get("top_values")
            if top_values and isinstance(top_values, list) and len(top_values) > 0:
                # Convert list of lists to list of tuples
                if isinstance(top_values[0], list):
                    top_values = [tuple(v) for v in top_values]
                elif not isinstance(top_values[0], tuple):
                    # Handle case where it's stored differently
                    top_values = None
            
            # Handle temporal_range which should be a tuple
            temporal_range = col_data.get("temporal_range")
            if temporal_range and isinstance(temporal_range, list):
                temporal_range = tuple(temporal_range)
            
            col = ColumnProfile(
                name=col_data["name"],
                dtype=col_data["dtype"],
                count=col_data.get("count"),
                missing_count=col_data.get("missing_count"),
                unique_count=col_data.get("unique_count"),
                min=col_data.get("min"),
                max=col_data.get("max"),
                mean=col_data.get("mean"),
                median=col_data.get("median"),
                std=col_data.get("std"),
                quartiles=col_data.get("quartiles"),
                top_values=top_values,
                cardinality=col_data.get("cardinality"),
                temporal_range=temporal_range,
                temporal_resolution=col_data.get("temporal_resolution"),
                avg_length=col_data.get("avg_length"),
                sample_values=col_data.get("sample_values"),
                coordinate_system=col_data.get("coordinate_system"),
                spatial_extent=col_data.get("spatial_extent"),
                inferred_meaning=col_data.get("inferred_meaning"),
                potential_uses=col_data.get("potential_uses"),
            )
            columns.append(col)
        
        # Handle shape which should be a tuple
        shape = data.get("shape")
        if shape and isinstance(shape, list):
            shape = tuple(shape)
        
        return cls(
            source_type=data["source_type"],
            shape=shape,
            source_uri=data.get("source_uri"),
            columns=columns,
            hierarchical=data.get("hierarchical", False),
            dimensions=data.get("dimensions"),
            groups=data.get("groups"),
            is_timeseries=data.get("is_timeseries", False),
            temporal_column=data.get("temporal_column"),
            temporal_frequency=data.get("temporal_frequency"),
            is_geospatial=data.get("is_geospatial", False),
            coordinate_columns=data.get("coordinate_columns"),
            crs=data.get("crs"),
            completeness=data.get("completeness", 1.0),
            consistency_issues=data.get("consistency_issues", []),
            sample_records=data.get("sample_records"),
            inferred_domain=data.get("inferred_domain"),
            dataset_purpose=data.get("dataset_purpose"),
            key_insights=data.get("key_insights", []),
            suggested_visualizations=data.get("suggested_visualizations", []),
            created_at=data.get("created_at", datetime.now().isoformat()),
        )