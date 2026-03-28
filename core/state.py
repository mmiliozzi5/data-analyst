from typing import TypedDict
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


def init_state() -> None:
    """Initialize all session_state keys if not already present."""
    if "datasets" not in st.session_state:
        st.session_state["datasets"]: dict[str, DatasetRecord] = {}
    if "chat_history" not in st.session_state:
        st.session_state["chat_history"]: list[dict] = []
    if "last_chart" not in st.session_state:
        st.session_state["last_chart"] = None
    if "api_key" not in st.session_state:
        st.session_state["api_key"]: str = ""
    if "active_file_ids" not in st.session_state:
        st.session_state["active_file_ids"]: list[str] = []
