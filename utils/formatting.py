import re
import uuid


def safe_file_id(filename: str) -> str:
    """Convert a filename to a stable, URL-safe ID with a short UUID suffix."""
    stem = re.sub(r"[^a-z0-9]+", "-", filename.lower().rsplit(".", 1)[0]).strip("-")
    short = uuid.uuid4().hex[:8]
    return f"{stem}-{short}"


def format_bytes(n: int) -> str:
    """Return a human-readable file size string."""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def truncate(text: str, max_chars: int = 120) -> str:
    """Truncate text to max_chars, appending ellipsis if needed."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "…"
