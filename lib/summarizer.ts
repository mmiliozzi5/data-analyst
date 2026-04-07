import type { DatasetBlob } from "@/lib/types";

export function summarizeDataset(dataset: DatasetBlob): string {
  const { metadata, rows } = dataset;
  const lines: string[] = [];

  lines.push(
    `Dataset: ${metadata.filename}${metadata.description ? ` — "${metadata.description}"` : ""}`
  );
  lines.push(`Rows: ${metadata.rows} | Columns: ${metadata.cols}`);

  const colDescriptions = metadata.columns
    .map((c) => `${c.name} (${c.dtype})`)
    .join(", ");
  lines.push(`Columns: ${colDescriptions}`);

  // Full data rows (capped at 500 to stay within context limits)
  const ROW_CAP = 500;
  if (rows.length > 0) {
    const displayRows = rows.slice(0, ROW_CAP);
    const colNames = metadata.columns.map((c) => c.name);
    const header = colNames.join(" | ");
    const separator = colNames.map((c) => "-".repeat(c.length)).join("-|-");
    const dataLines = displayRows.map((row) =>
      colNames.map((c) => String(row[c] ?? "")).join(" | ")
    );
    const label =
      rows.length > ROW_CAP
        ? `Data (first ${ROW_CAP} of ${rows.length} rows):`
        : `Data (${rows.length} rows):`;
    lines.push(label);
    lines.push(`  ${header}`);
    lines.push(`  ${separator}`);
    for (const dl of dataLines) {
      lines.push(`  ${dl}`);
    }
  }

  // Numeric column stats
  const numericCols = metadata.columns.filter(
    (c) => c.dtype === "number" && c.min !== undefined
  );
  if (numericCols.length > 0) {
    const stats = numericCols
      .map(
        (c) =>
          `${c.name} → min: ${c.min?.toFixed(2)}, max: ${c.max?.toFixed(2)}, mean: ${c.mean?.toFixed(2)}`
      )
      .join("; ");
    lines.push(`Stats: ${stats}`);
  }

  return lines.join("\n");
}

export function buildSystemPrompt(datasets: DatasetBlob[]): string {
  if (datasets.length === 0) {
    return `You are a helpful data analyst assistant. No datasets have been loaded yet. Ask the user to upload a CSV or XLSX file first.`;
  }

  const summaries = datasets.map(summarizeDataset).join("\n\n");

  return `You are a helpful data analyst assistant. You have access to the following datasets:

${summaries}

You can answer questions about this data and perform analysis. Always answer data questions directly using the sample rows and statistics provided above — never refuse or deflect when the data is available to you.
Be concise and focus on insights that are relevant to the user's question.`;
}
