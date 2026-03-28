from typing import Generator, Iterator

import anthropic

from core.state import DatasetRecord
from utils.df_summarizer import summarize_df

MODEL = "claude-sonnet-4-6"

SYSTEM_TEMPLATE = """\
You are a data analysis assistant. The user has uploaded one or more datasets described below.
Answer questions about the data accurately and concisely. When appropriate, suggest visualizations
or further analyses. If asked to generate a chart, describe what it would show and say it will be
rendered below.

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
    api_key: str,
) -> Generator[str, None, None]:
    """
    Stream a Claude response given the user message, chat history, and datasets.

    Yields text chunks as they arrive. Caller should accumulate them
    and append the full response to history.
    """
    client = anthropic.Anthropic(api_key=api_key)

    messages = _build_messages(history, user_message)
    system_prompt = SYSTEM_TEMPLATE.format(context=build_context(datasets))

    with client.messages.stream(
        model=MODEL,
        max_tokens=4096,
        system=system_prompt,
        messages=messages,
    ) as stream:
        for chunk in stream.text_stream:
            yield chunk


def _build_messages(history: list[dict], user_message: str) -> list[dict]:
    """Convert chat history + new user message into the Anthropic messages format."""
    messages = []
    for entry in history:
        messages.append({"role": entry["role"], "content": entry["content"]})
    messages.append({"role": "user", "content": user_message})
    return messages
