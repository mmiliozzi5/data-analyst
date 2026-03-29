import plotly.io as pio
import streamlit as st

from core.agent import chat_stream


def render_chat() -> None:
    """Render the chat interface: history display + input."""
    history: list[dict] = st.session_state.get("chat_history", [])
    datasets = st.session_state.get("datasets", {})

    # Display existing history
    for entry in history:
        with st.chat_message(entry["role"]):
            content = entry["content"]
            if isinstance(content, dict) and content.get("type") == "chart":
                if content.get("text"):
                    st.markdown(content["text"])
                _render_chart(content["figure"])
            else:
                st.markdown(content)

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
        result_sink: dict = {}
        with st.chat_message("assistant"):
            try:
                full_response = st.write_stream(
                    chat_stream(
                        user_message=user_input,
                        history=history,
                        datasets=datasets,
                        result_sink=result_sink,
                    )
                )
            except ValueError as exc:
                st.error(str(exc))
                return

            # Render chart if tool was called
            if result_sink.get("figure"):
                _render_chart(result_sink["figure"])

        # Persist to history
        st.session_state["chat_history"].append({"role": "user", "content": user_input})

        if result_sink.get("figure"):
            assistant_entry = {
                "role": "assistant",
                "content": {
                    "type": "chart",
                    "text": result_sink.get("intro_text") or full_response or "",
                    "figure": result_sink["figure"],
                },
            }
            st.session_state["last_chart"] = result_sink["figure"]
        else:
            assistant_entry = {"role": "assistant", "content": full_response}

        st.session_state["chat_history"].append(assistant_entry)

    # Hint when no datasets loaded
    if not datasets:
        st.info("Upload a dataset in the Upload tab to start asking questions.")


def _render_chart(fig) -> None:
    """Render a Plotly figure with a download button for the interactive HTML."""
    st.plotly_chart(fig, use_container_width=True)
    html_bytes = pio.to_html(
        fig, full_html=True, include_plotlyjs="cdn"
    ).encode("utf-8")
    st.download_button(
        label="Download as HTML",
        data=html_bytes,
        file_name="chart.html",
        mime="text/html",
        key=f"dl-chart-{id(fig)}",
    )
