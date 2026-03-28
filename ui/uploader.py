from datetime import datetime, timezone

import streamlit as st

from core.file_loader import load_uploaded_file


def render_uploader() -> None:
    """Render the upload section and the loaded-datasets list."""

    # ------------------------------------------------------------------ #
    # Section 1 – Upload a new dataset                                     #
    # ------------------------------------------------------------------ #
    st.subheader("Upload a new dataset")

    uploaded_file = st.file_uploader(
        "Choose a CSV or XLSX file",
        type=["csv", "xlsx", "xls"],
        help="Files are processed locally in your browser session.",
    )

    if uploaded_file is not None:
        upload_key = f"processed-{uploaded_file.file_id}"
        if upload_key not in st.session_state:
            # Description input appears only when a specific file is selected,
            # so it is visually and functionally tied to that file.
            description = st.text_input(
                f"Description for **{uploaded_file.name}** (optional)",
                placeholder="e.g. Monthly sales data for 2024",
                key=f"desc-input-{uploaded_file.file_id}",
            )
            if st.button("Load dataset", type="primary"):
                with st.spinner("Loading…"):
                    try:
                        record = load_uploaded_file(uploaded_file, description)
                        st.session_state["datasets"][record["file_id"]] = record
                        st.session_state["active_file_ids"].append(record["file_id"])
                        st.session_state[upload_key] = True
                        st.rerun()
                    except ValueError as exc:
                        st.error(str(exc))

    # ------------------------------------------------------------------ #
    # Section 2 – Loaded datasets                                          #
    # ------------------------------------------------------------------ #
    st.divider()

    datasets: dict = st.session_state.get("datasets", {})
    st.subheader(f"Loaded datasets ({len(datasets)})")

    if not datasets:
        st.caption("No datasets loaded yet. Upload a file above.")
        return

    for file_id, record in list(datasets.items()):
        _render_dataset_card(file_id, record)


def _render_dataset_card(file_id: str, record: dict) -> None:
    """Render a single dataset card with metadata and an editable description."""
    # Initialise widget state from the stored description on first render only,
    # so subsequent reruns don't clobber edits the user is making.
    desc_key = f"desc-edit-{file_id}"
    if desc_key not in st.session_state:
        st.session_state[desc_key] = record["description"]

    with st.container(border=True):
        col_info, col_remove = st.columns([6, 1])

        with col_info:
            st.markdown(f"**{record['filename']}**")
            st.caption(
                f"{record['row_count']:,} rows × {record['col_count']} cols"
                f" · Uploaded {_fmt_ts(record['uploaded_at'])}"
            )
            new_desc = st.text_input(
                "Description",
                key=desc_key,
                placeholder="Add a description…",
                label_visibility="collapsed",
            )
            # Sync edits back to the record immediately
            if new_desc != record["description"]:
                st.session_state["datasets"][file_id]["description"] = new_desc

        with col_remove:
            st.write("")  # vertical alignment nudge
            if st.button("Remove", key=f"list-remove-{file_id}"):
                del st.session_state["datasets"][file_id]
                active = st.session_state.get("active_file_ids", [])
                if file_id in active:
                    active.remove(file_id)
                st.rerun()


def _fmt_ts(iso_str: str) -> str:
    """Format an ISO UTC timestamp as a readable string."""
    dt = datetime.fromisoformat(iso_str)
    return dt.strftime("%b %d, %Y · %H:%M UTC")
