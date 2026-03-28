import streamlit as st

from core.state import init_state
from ui.sidebar import render_sidebar
from ui.uploader import render_uploader
from ui.table_viewer import render_table_viewer
from ui.chat import render_chat

st.set_page_config(
    page_title="Data Analyst",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

init_state()

render_sidebar()

st.header("📊 Data Analyst")

render_uploader()

if st.session_state.get("datasets"):
    render_table_viewer()
    st.divider()

render_chat()
