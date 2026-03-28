import pandas as pd
from io import StringIO


def summarize_df(df: pd.DataFrame, filename: str, description: str) -> str:
    """
    Produce a Claude-readable text summary of a DataFrame.

    Includes: filename, user description, shape, column schema with dtypes,
    5 sample rows, and numeric describe() statistics.
    """
    lines: list[str] = []

    lines.append(f"=== Dataset: {filename} ===")
    if description:
        lines.append(f"Description: {description}")
    lines.append(f"Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
    lines.append("")

    # Column schema
    lines.append("Columns:")
    for col in df.columns:
        dtype = str(df[col].dtype)
        n_null = int(df[col].isna().sum())
        null_info = f", {n_null} nulls" if n_null > 0 else ""
        lines.append(f"  - {col} ({dtype}{null_info})")
    lines.append("")

    # Sample rows
    sample_size = min(5, len(df))
    lines.append(f"Sample ({sample_size} rows):")
    buf = StringIO()
    df.head(sample_size).to_csv(buf, index=False)
    lines.append(buf.getvalue().strip())
    lines.append("")

    # Numeric statistics
    numeric_cols = df.select_dtypes(include="number")
    if not numeric_cols.empty:
        lines.append("Numeric statistics:")
        buf2 = StringIO()
        numeric_cols.describe().to_csv(buf2)
        lines.append(buf2.getvalue().strip())

    return "\n".join(lines)
