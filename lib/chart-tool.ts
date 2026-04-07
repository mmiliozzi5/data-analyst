import { z } from "zod";
import { getAllDatasetsForSession } from "@/lib/blob";
import type { PlotlySpec, ChartType, Aggregation, DatasetBlob } from "@/lib/types";

export const generateChartSchema = z.object({
  dataset_name: z.string().describe("The filename of the dataset to use (e.g. sales.csv)"),
  chart_type: z
    .enum(["bar", "line", "scatter", "histogram", "pie", "box"])
    .describe("The type of chart to generate"),
  x_column: z.string().describe("The column to use for the X axis"),
  y_column: z
    .string()
    .optional()
    .describe("The column to use for the Y axis (not required for histogram)"),
  color_column: z
    .string()
    .optional()
    .describe("Optional column to use for color grouping"),
  title: z.string().optional().describe("Chart title"),
  aggregation: z
    .enum(["none", "sum", "mean", "count"])
    .optional()
    .describe(
      "Aggregation to apply before plotting: group by x_column and aggregate y_column"
    ),
});

type GenerateChartParams = z.infer<typeof generateChartSchema>;

function findDataset(datasets: DatasetBlob[], name: string): DatasetBlob | null {
  const lower = name.toLowerCase();
  return (
    datasets.find((d) => d.metadata.filename.toLowerCase() === lower) ??
    datasets.find((d) => d.metadata.filename.toLowerCase().includes(lower)) ??
    null
  );
}

type Row = Record<string, string | number | boolean | null>;

function aggregate(
  rows: Row[],
  xCol: string,
  yCol: string,
  method: Aggregation
): Row[] {
  if (method === "none") return rows;

  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const key = String(row[xCol] ?? "");
    const val = Number(row[yCol] ?? 0);
    if (!isNaN(val)) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(val);
    }
  }

  return Array.from(groups.entries()).map(([key, vals]) => {
    let agg: number;
    if (method === "sum") agg = vals.reduce((a, b) => a + b, 0);
    else if (method === "mean") agg = vals.reduce((a, b) => a + b, 0) / vals.length;
    else agg = vals.length; // count
    return { [xCol]: key, [yCol]: agg };
  });
}

export function buildPlotlySpec(params: GenerateChartParams, rows: Row[]): PlotlySpec {
  const {
    chart_type,
    x_column,
    y_column,
    color_column,
    title,
    aggregation = "none",
  } = params;

  let data = rows;
  if (aggregation !== "none" && y_column) {
    data = aggregate(rows, x_column, y_column, aggregation);
  }

  const xVals = data.map((r) => r[x_column] ?? null);
  const yVals = y_column ? data.map((r) => r[y_column] ?? null) : undefined;
  const colorVals = color_column ? data.map((r) => String(r[color_column] ?? "")) : undefined;

  const chartTitle = title ?? `${chart_type} chart`;

  let traces: Record<string, unknown>[];

  if (chart_type === "pie") {
    traces = [
      {
        type: "pie",
        labels: xVals,
        values: yVals ?? xVals.map(() => 1),
        name: chartTitle,
      },
    ];
  } else if (chart_type === "histogram") {
    traces = [{ type: "histogram", x: xVals, name: x_column }];
  } else if (chart_type === "scatter") {
    if (colorVals) {
      const uniqueColors = [...new Set(colorVals)];
      traces = uniqueColors.map((c) => {
        const mask = colorVals.map((v) => v === c);
        return {
          type: "scatter",
          mode: "markers",
          name: c,
          x: xVals.filter((_, i) => mask[i]),
          y: yVals?.filter((_, i) => mask[i]),
        };
      });
    } else {
      traces = [{ type: "scatter", mode: "markers", x: xVals, y: yVals, name: y_column }];
    }
  } else if (chart_type === "box") {
    if (colorVals) {
      const uniqueColors = [...new Set(colorVals)];
      traces = uniqueColors.map((c) => {
        const mask = colorVals.map((v) => v === c);
        return {
          type: "box",
          name: c,
          y: yVals?.filter((_, i) => mask[i]) ?? xVals.filter((_, i) => mask[i]),
        };
      });
    } else {
      traces = [{ type: "box", y: yVals ?? xVals, name: y_column ?? x_column }];
    }
  } else {
    // bar or line
    if (colorVals) {
      const uniqueColors = [...new Set(colorVals)];
      traces = uniqueColors.map((c) => {
        const mask = colorVals.map((v) => v === c);
        return {
          type: chart_type,
          name: c,
          x: xVals.filter((_, i) => mask[i]),
          y: yVals?.filter((_, i) => mask[i]),
        };
      });
    } else {
      traces = [{ type: chart_type, x: xVals, y: yVals, name: y_column }];
    }
  }

  const layout: Record<string, unknown> = {
    title: chartTitle,
    autosize: true,
    margin: { l: 50, r: 20, t: 50, b: 50 },
    xaxis: { title: x_column },
    yaxis: y_column ? { title: y_column } : undefined,
    legend: { orientation: "h", y: -0.2 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e5e7eb" },
  };

  return { data: traces, layout };
}

export function makeChartTool(sessionId: string) {
  return {
    description:
      "Generate an interactive chart from one of the loaded datasets. Use this when the user asks for a visualization, graph, or chart.",
    parameters: generateChartSchema,
    execute: async (params: GenerateChartParams): Promise<PlotlySpec | { error: string }> => {
      try {
        const datasets = await getAllDatasetsForSession(sessionId);
        const dataset = findDataset(datasets, params.dataset_name);
        if (!dataset) {
          const available = datasets.map((d) => d.metadata.filename).join(", ");
          return {
            error: `Dataset "${params.dataset_name}" not found. Available: ${available || "none"}`,
          };
        }

        const cols = dataset.metadata.columns.map((c) => c.name);
        if (!cols.includes(params.x_column)) {
          return { error: `Column "${params.x_column}" not found. Available: ${cols.join(", ")}` };
        }
        if (params.y_column && !cols.includes(params.y_column)) {
          return { error: `Column "${params.y_column}" not found. Available: ${cols.join(", ")}` };
        }

        return buildPlotlySpec(params, dataset.rows as Row[]);
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Chart generation failed" };
      }
    },
  };
}
