from typing import TypedDict, Union
import pandas as pd
import streamlit as st


class DatasetRecord(TypedDict):
    file_id: str        # uuid-suffixed slug, stable dict key
    filename: str
    description: str    # user-provided natural language description
    df: pd.DataFrame
    uploaded_at: str    # ISO timestamp
    row_count: int
    col_count: int


class TextChatEntry(TypedDict):
    role: str
    content: str


class ChartContent(TypedDict):
    type: str       # always "chart"
    text: str       # intro text before the chart (may be empty)
    figure: object  # plotly.graph_objects.Figure


class ChartChatEntry(TypedDict):
    role: str
    content: ChartContent


ChatEntry = Union[TextChatEntry, ChartChatEntry]


def init_state() -> None:
    """Initialize all session_state keys if not already present."""
    if "datasets" not in st.session_state:
        st.session_state["datasets"]: dict[str, DatasetRecord] = {}
    if "chat_history" not in st.session_state:
        st.session_state["chat_history"]: list[ChatEntry] = []
    if "last_chart" not in st.session_state:
        st.session_state["last_chart"] = None
    if "active_file_ids" not in st.session_state:
        st.session_state["active_file_ids"]: list[str] = []
