export interface DatasetColumn {
  name: string;
  dtype: "number" | "string" | "boolean" | "date";
  nullCount: number;
  sample: (string | number | boolean | null)[];
  // Only for numeric columns
  min?: number;
  max?: number;
  mean?: number;
}

export interface DatasetMetadata {
  id: string;
  sessionId: string;
  filename: string;
  description: string;
  rows: number;
  cols: number;
  columns: DatasetColumn[];
  blobUrl: string;
  uploadedAt: string;
}

export interface DatasetBlob {
  metadata: DatasetMetadata;
  rows: Record<string, string | number | boolean | null>[];
}

export type ChartType = "bar" | "line" | "scatter" | "histogram" | "pie" | "box";
export type Aggregation = "none" | "sum" | "mean" | "count";

export interface GenerateChartInput {
  dataset_name: string;
  chart_type: ChartType;
  x_column: string;
  y_column?: string;
  color_column?: string;
  title?: string;
  aggregation?: Aggregation;
}

export interface PlotlySpec {
  data: Record<string, unknown>[];
  layout: Record<string, unknown>;
}
