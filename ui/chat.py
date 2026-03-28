import streamlit as st

from core.agent import chat_stream


def render_chat() -> None:
    """Render the chat interface: history display + input."""
    history: list[dict] = st.session_state.get("chat_history", [])
    datasets = st.session_state.get("datasets", {})
    api_key: str = st.session_state.get("api_key", "")

    # Display existing history
    for entry in history:
        with st.chat_message(entry["role"]):
            st.markdown(entry["content"])

    # Chat input
    user_input = st.chat_input(
        "Ask a question about your data…",
        disabled=not api_key or not datasets,
    )

    if user_input:
        # Show user message immediately
        with st.chat_message("user"):
            st.markdown(user_input)

        # Stream assistant response
        with st.chat_message("assistant"):
            full_response = st.write_stream(
                chat_stream(
                    user_message=user_input,
                    history=history,
                    datasets=datasets,
                    api_key=api_key,
                )
            )

        # Persist to history
        st.session_state["chat_history"].append({"role": "user", "content": user_input})
        st.session_state["chat_history"].append({"role": "assistant", "content": full_response})

    # Hints when chat is disabled
    if not api_key:
        st.info("Enter your Anthropic API key in the sidebar to start chatting.")
    elif not datasets:
        st.info("Upload a dataset above to start asking questions.")
