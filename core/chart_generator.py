"""
Chart generation from Claude tool-use input.

Receives the parsed tool input dict from the generate_chart tool call and
returns a Plotly figure built from the user's loaded datasets.
"""

from __future__ import annotations

import plotly.express as px
import plotly.graph_objects as go

from core.state import DatasetRecord

GENERATE_CHART_TOOL = {
    "name": "generate_chart",
    "description": (
        "Generate a Plotly chart from a loaded dataset. "
        "Use this whenever the user asks to visualize, plot, or chart data."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "dataset_name": {
                "type": "string",
                "description": "The filename of the dataset to use, exactly as shown in context.",
            },
            "chart_type": {
                "type": "string",
                "enum": ["bar", "line", "scatter", "histogram", "pie", "box"],
                "description": "Type of chart to generate.",
            },
            "x_column": {
                "type": "string",
                "description": (
                    "Column name for the x-axis. For pie charts this is the labels column."
                ),
            },
            "y_column": {
                "type": "string",
                "description": (
                    "Column name for the y-axis. For pie charts this is the values column. "
                    "Omit for histogram."
                ),
            },
            "color_column": {
                "type": "string",
                "description": "Optional column name to use for color grouping.",
            },
            "title": {
                "type": "string",
                "description": "Chart title.",
            },
            "aggregation": {
                "type": "string",
                "enum": ["none", "sum", "mean", "count"],
                "description": (
                    "Aggregation to apply to y_column grouped by x_column before plotting. "
                    "Use 'none' (default) when the data is already aggregated or for "
                    "scatter/histogram/box charts."
                ),
            },
        },
        "required": ["dataset_name", "chart_type", "x_column", "title"],
    },
}


def generate_chart(
    tool_input: dict,
    datasets: dict[str, DatasetRecord],
) -> go.Figure:
    """
    Build a Plotly figure from a generate_chart tool call.

    Raises ValueError with a descriptive message if inputs are invalid.
    """
    dataset_name: str = tool_input["dataset_name"]
    chart_type: str = tool_input["chart_type"]
    x_col: str = tool_input["x_column"]
    y_col: str | None = tool_input.get("y_column")
    color_col: str | None = tool_input.get("color_column")
    title: str = tool_input["title"]
    aggregation: str = tool_input.get("aggregation", "none")

    # Find dataset by filename (case-insensitive)
    record = _find_dataset(dataset_name, datasets)
    df = record["df"].copy()

    # Validate columns
    _check_column(x_col, df, "x_column")
    if y_col:
        _check_column(y_col, df, "y_column")
    if color_col:
        _check_column(color_col, df, "color_column")

    # Apply aggregation
    if aggregation != "none" and y_col:
        agg_func = {"sum": "sum", "mean": "mean", "count": "count"}[aggregation]
        group_cols = [x_col] + ([color_col] if color_col else [])
        df = df.groupby(group_cols)[y_col].agg(agg_func).reset_index()

    # Build figure
    fig = _build_figure(chart_type, df, x_col, y_col, color_col, title)
    fig.update_layout(margin={"t": 50, "b": 40, "l": 40, "r": 20})
    return fig


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _find_dataset(name: str, datasets: dict[str, DatasetRecord]) -> DatasetRecord:
    name_lower = name.lower()
    for record in datasets.values():
        if record["filename"].lower() == name_lower:
            return record
    # Fallback: substring match
    for record in datasets.values():
        if name_lower in record["filename"].lower():
            return record
    available = ", ".join(r["filename"] for r in datasets.values()) or "none"
    raise ValueError(
        f"Dataset '{name}' not found. Available datasets: {available}"
    )


def _check_column(col: str, df, param: str) -> None:
    if col not in df.columns:
        raise ValueError(
            f"Column '{col}' specified for {param} does not exist. "
            f"Available columns: {', '.join(df.columns)}"
        )


def _build_figure(
    chart_type: str,
    df,
    x_col: str,
    y_col: str | None,
    color_col: str | None,
    title: str,
) -> go.Figure:
    kwargs = {"title": title}
    if color_col:
        kwargs["color"] = color_col

    if chart_type == "bar":
        return px.bar(df, x=x_col, y=y_col, **kwargs)
    elif chart_type == "line":
        return px.line(df, x=x_col, y=y_col, **kwargs)
    elif chart_type == "scatter":
        return px.scatter(df, x=x_col, y=y_col, **kwargs)
    elif chart_type == "histogram":
        return px.histogram(df, x=x_col, **kwargs)
    elif chart_type == "pie":
        return px.pie(df, names=x_col, values=y_col, title=title)
    elif chart_type == "box":
        return px.box(df, x=x_col, y=y_col, **kwargs)
    else:
        raise ValueError(f"Unsupported chart type: {chart_type}")
