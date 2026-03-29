import os
from typing import Generator

import anthropic
from dotenv import load_dotenv

from core.state import DatasetRecord
from core.chart_generator import GENERATE_CHART_TOOL, generate_chart
from utils.df_summarizer import summarize_df

load_dotenv()

MODEL = "claude-sonnet-4-6"

SYSTEM_TEMPLATE = """\
You are a data analysis assistant. The user has uploaded one or more datasets described below.
Answer questions about the data accurately and concisely. When appropriate, suggest visualizations
or further analyses. If the user asks you to generate a chart or visualization, use the
generate_chart tool to create it.

{context}
"""


def build_context(datasets: dict[str, DatasetRecord]) -> str:
    """Build a text context block from all loaded datasets."""
    if not datasets:
        return "No datasets have been loaded yet."
    summaries = [
        summarize_df(record["df"], record["filename"], record["description"])
        for record in datasets.values()
    ]
    return "\n\n".join(summaries)


def chat_stream(
    user_message: str,
    history: list[dict],
    datasets: dict[str, DatasetRecord],
    result_sink: dict,
) -> Generator[str, None, None]:
    """
    Stream a Claude response given the user message, chat history, and datasets.

    Yields text chunks as they arrive. If Claude calls the generate_chart tool,
    the resulting Plotly figure is stored in result_sink["figure"] and any
    preceding text in result_sink["intro_text"].

    Caller should accumulate yielded chunks and append the full response to history.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set. Add it to your .env file.")
    client = anthropic.Anthropic(api_key=api_key)

    messages = _build_messages(history, user_message)
    system_prompt = SYSTEM_TEMPLATE.format(context=build_context(datasets))

    with client.messages.stream(
        model=MODEL,
        max_tokens=4096,
        system=system_prompt,
        messages=messages,
        tools=[GENERATE_CHART_TOOL],
        tool_choice={"type": "auto"},
    ) as stream:
        for event in stream:
            if (
                hasattr(event, "type")
                and event.type == "content_block_delta"
                and hasattr(event.delta, "type")
                and event.delta.type == "text_delta"
            ):
                yield event.delta.text

        final_msg = stream.get_final_message()

    if final_msg.stop_reason == "tool_use":
        tool_block = next(
            (b for b in final_msg.content if b.type == "tool_use"), None
        )
        text_block = next(
            (b for b in final_msg.content if b.type == "text"), None
        )
        result_sink["intro_text"] = text_block.text if text_block else ""

        if tool_block and tool_block.name == "generate_chart":
            try:
                fig = generate_chart(tool_block.input, datasets)
                result_sink["figure"] = fig
            except ValueError as exc:
                yield f"\n\n_(Chart error: {exc})_"


def _build_messages(history: list[dict], user_message: str) -> list[dict]:
    """Convert chat history + new user message into the Anthropic messages format."""
    messages = []
    for entry in history:
        content = entry["content"]
        # Chart entries store a dict — only send the text portion to the API
        if isinstance(content, dict) and content.get("type") == "chart":
            api_content = content.get("text") or "(chart generated)"
        else:
            api_content = content
        messages.append({"role": entry["role"], "content": api_content})
    messages.append({"role": "user", "content": user_message})
    return messages
