import pandas as pd
import streamlit as st

from core.state import DatasetRecord
from utils.formatting import truncate


def render_table_viewer() -> None:
    """Render a tabbed DataFrame viewer with column statistics for each dataset."""
    datasets: dict[str, DatasetRecord] = st.session_state.get("datasets", {})
    if not datasets:
        return

    records = list(datasets.values())
    tab_labels = [truncate(r["filename"], 24) for r in records]
    tabs = st.tabs(tab_labels)

    for tab, record in zip(tabs, records):
        with tab:
            df: pd.DataFrame = record["df"]

            sub_tab_data, sub_tab_stats = st.tabs(["Data", "Column Stats"])

            with sub_tab_data:
                st.dataframe(df, use_container_width=True, height=380)
                st.caption(
                    f"{record['row_count']:,} rows × {record['col_count']} columns"
                    + (f" — {record['description']}" if record["description"] else "")
                )

            with sub_tab_stats:
                _render_column_stats(df)


def _render_column_stats(df: pd.DataFrame) -> None:
    stats_rows = []
    for col in df.columns:
        series = df[col]
        row = {
            "Column": col,
            "Type": str(series.dtype),
            "Non-null": int(series.notna().sum()),
            "Null": int(series.isna().sum()),
            "Unique": int(series.nunique()),
        }
        if pd.api.types.is_numeric_dtype(series):
            row["Min"] = series.min()
            row["Max"] = series.max()
            row["Mean"] = round(series.mean(), 4)
        else:
            row["Min"] = ""
            row["Max"] = ""
            row["Mean"] = ""
        stats_rows.append(row)

    st.dataframe(pd.DataFrame(stats_rows), use_container_width=True, hide_index=True)
