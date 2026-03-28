import os
import streamlit as st
from dotenv import load_dotenv

from utils.formatting import truncate

load_dotenv()


def render_sidebar() -> None:
    """Render the sidebar: API key input and dataset management."""
    with st.sidebar:
        st.title("Data Analyst")

        # --- API Key ---
        st.subheader("Configuration")
        default_key = st.session_state.get("api_key") or os.getenv("ANTHROPIC_API_KEY", "")
        api_key = st.text_input(
            "Anthropic API Key",
            value=default_key,
            type="password",
            help="Your key is stored only in this browser session.",
        )
        st.session_state["api_key"] = api_key

        st.divider()

        # --- Dataset list ---
        datasets: dict = st.session_state.get("datasets", {})
        st.subheader(f"Datasets ({len(datasets)})")

        if not datasets:
            st.caption("No datasets loaded yet. Upload a file above.")
        else:
            for file_id, record in list(datasets.items()):
                col1, col2 = st.columns([4, 1])
                with col1:
                    st.markdown(
                        f"**{truncate(record['filename'], 30)}**  \n"
                        f"<small>{record['row_count']:,} rows × {record['col_count']} cols</small>",
                        unsafe_allow_html=True,
                    )
                with col2:
                    if st.button("✕", key=f"remove-{file_id}", help="Remove dataset"):
                        del st.session_state["datasets"][file_id]
                        active = st.session_state.get("active_file_ids", [])
                        if file_id in active:
                            active.remove(file_id)
                        st.rerun()
