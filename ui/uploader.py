import streamlit as st

from core.file_loader import load_uploaded_file


def render_uploader() -> None:
    """Render the file upload widget."""
    uploaded_file = st.file_uploader(
        "Choose a CSV or XLSX file",
        type=["csv", "xlsx", "xls"],
        help="Files are processed locally in your browser session.",
    )
    description = st.text_input(
        "Dataset description (optional)",
        placeholder="e.g. Monthly sales data for 2024",
    )

    if uploaded_file is not None:
        # Avoid re-processing the same upload on every rerun
        upload_key = f"processed-{uploaded_file.file_id}"
        if upload_key not in st.session_state:
            with st.spinner("Loading dataset…"):
                try:
                    record = load_uploaded_file(uploaded_file, description)
                    st.session_state["datasets"][record["file_id"]] = record
                    st.session_state["active_file_ids"].append(record["file_id"])
                    st.session_state[upload_key] = True
                    st.success(
                        f"Loaded **{record['filename']}** — "
                        f"{record['row_count']:,} rows × {record['col_count']} columns"
                    )
                    st.rerun()
                except ValueError as exc:
                    st.error(str(exc))
