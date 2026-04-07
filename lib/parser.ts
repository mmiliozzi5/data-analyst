import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { DatasetBlob, DatasetColumn, DatasetMetadata } from "@/lib/types";

type Row = Record<string, string | number | boolean | null>;

function detectDtype(values: (string | number | boolean | null)[]): DatasetColumn["dtype"] {
  const nonNull = values.filter((v) => v !== null && v !== "");
  if (nonNull.length === 0) return "string";

  const allNumbers = nonNull.every((v) => typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)) && v.trim() !== ""));
  if (allNumbers) return "number";

  const allBooleans = nonNull.every((v) => v === true || v === false || v === "true" || v === "false");
  if (allBooleans) return "boolean";

  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
  ];
  const sample = nonNull.slice(0, 10);
  const allDates = sample.every(
    (v) => typeof v === "string" && datePatterns.some((p) => p.test(v))
  );
  if (allDates) return "date";

  return "string";
}

function coerceRow(raw: Record<string, unknown>): Row {
  const result: Row = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined || v === "") {
      result[k] = null;
    } else if (typeof v === "number") {
      result[k] = v;
    } else if (typeof v === "boolean") {
      result[k] = v;
    } else {
      const asNum = Number(v);
      result[k] = isNaN(asNum) ? String(v) : asNum;
    }
  }
  return result;
}

function buildColumns(rows: Row[], headers: string[]): DatasetColumn[] {
  return headers.map((name) => {
    const values = rows.map((r) => r[name] ?? null);
    const dtype = detectDtype(values);
    const nonNull = values.filter((v) => v !== null) as (string | number | boolean)[];
    const nullCount = values.length - nonNull.length;
    const sample = values.slice(0, 5);

    const col: DatasetColumn = { name, dtype, nullCount, sample };

    if (dtype === "number") {
      const nums = nonNull.map(Number).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        let min = Infinity, max = -Infinity, sum = 0;
        for (const n of nums) {
          if (n < min) min = n;
          if (n > max) max = n;
          sum += n;
        }
        col.min = min;
        col.max = max;
        col.mean = sum / nums.length;
      }
    }

    return col;
  });
}

export async function parseFile(
  buffer: ArrayBuffer,
  filename: string,
  description: string,
  sessionId: string
): Promise<DatasetBlob> {
  const ext = filename.split(".").pop()?.toLowerCase();
  let rows: Row[];
  let headers: string[];

  if (ext === "csv") {
    const text = new TextDecoder("utf-8").decode(buffer);
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    rows = result.data.map(coerceRow);
    headers = result.meta.fields ?? [];
  } else if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    rows = raw.map(coerceRow);
    headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  } else {
    throw new Error(`Unsupported file type: .${ext}`);
  }

  const columns = buildColumns(rows, headers);

  const metadata: DatasetMetadata = {
    id: crypto.randomUUID(),
    sessionId,
    filename,
    description,
    rows: rows.length,
    cols: columns.length,
    columns,
    blobUrl: "", // filled after upload
    uploadedAt: new Date().toISOString(),
  };

  return { metadata, rows };
}
