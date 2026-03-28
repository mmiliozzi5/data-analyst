import streamlit as st

from core.agent import chat_stream


def render_chat() -> None:
    """Render the chat interface: history display + input."""
    history: list[dict] = st.session_state.get("chat_history", [])
    datasets = st.session_state.get("datasets", {})

    # Display existing history
    for entry in history:
        with st.chat_message(entry["role"]):
            st.markdown(entry["content"])

    # Chat input
    user_input = st.chat_input(
        "Ask a question about your data…",
        disabled=not datasets,
    )

    if user_input:
        # Show user message immediately
        with st.chat_message("user"):
            st.markdown(user_input)

        # Stream assistant response
        with st.chat_message("assistant"):
            try:
                full_response = st.write_stream(
                    chat_stream(
                        user_message=user_input,
                        history=history,
                        datasets=datasets,
                    )
                )
            except ValueError as exc:
                st.error(str(exc))
                return

        # Persist to history
        st.session_state["chat_history"].append({"role": "user", "content": user_input})
        st.session_state["chat_history"].append({"role": "assistant", "content": full_response})

    # Hint when no datasets loaded
    if not datasets:
        st.info("Upload a dataset in the Upload tab to start asking questions.")
