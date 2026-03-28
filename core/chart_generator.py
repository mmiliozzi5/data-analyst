"""
Chart generation via Claude — stubbed for Milestone 1.

In a future milestone this module will:
  1. Ask Claude to produce a Plotly figure spec as JSON given a user request.
  2. Parse and render the figure in the Streamlit app.

For now it always returns None so the rest of the app can be built and tested.
"""

from core.state import DatasetRecord


def generate_chart(
    user_request: str,
    datasets: dict[str, DatasetRecord],
    api_key: str,
) -> None:
    """Stub: always returns None. Will return a plotly.graph_objects.Figure later."""
    return None
