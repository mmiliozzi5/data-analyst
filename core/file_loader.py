from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import streamlit as st

from core.state import DatasetRecord
from utils.formatting import safe_file_id


def load_uploaded_file(uploaded_file: st.runtime.uploaded_file_manager.UploadedFile, description: str) -> DatasetRecord:
    """
    Parse a Streamlit UploadedFile (CSV or XLSX) into a DatasetRecord.

    CSV: tries UTF-8 first, falls back to latin-1.
    XLSX: uses openpyxl engine.
    Raises ValueError for unsupported extensions.
    """
    filename = uploaded_file.name
    suffix = Path(filename).suffix.lower()

    if suffix == ".csv":
        df = _read_csv(uploaded_file)
    elif suffix in (".xlsx", ".xls"):
        df = _read_excel(uploaded_file)
    else:
        raise ValueError(f"Unsupported file type: {suffix}. Please upload a CSV or XLSX file.")

    file_id = safe_file_id(filename)
    return DatasetRecord(
        file_id=file_id,
        filename=filename,
        description=description,
        df=df,
        uploaded_at=datetime.now(timezone.utc).isoformat(),
        row_count=len(df),
        col_count=len(df.columns),
    )


def _read_csv(uploaded_file) -> pd.DataFrame:
    data = uploaded_file.read()
    for encoding in ("utf-8", "latin-1"):
        try:
            return pd.read_csv(
                pd.io.common.BytesIO(data),
                encoding=encoding,
            )
        except UnicodeDecodeError:
            continue
    raise ValueError("Could not decode CSV with UTF-8 or latin-1 encoding.")


def _read_excel(uploaded_file) -> pd.DataFrame:
    return pd.read_excel(uploaded_file, engine="openpyxl")
