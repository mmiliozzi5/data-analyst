"use client";

import dynamic from "next/dynamic";
import type { PlotlySpec } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ChartBlockProps {
  spec: PlotlySpec;
}

export function ChartBlock({ spec }: ChartBlockProps) {
  function downloadHtml() {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body style="margin:0;background:#111827;">
  <div id="chart"></div>
  <script>
    Plotly.newPlot('chart', ${JSON.stringify(spec.data)}, ${JSON.stringify(spec.layout)}, {responsive: true});
  </script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="my-2">
      <Plot
        data={spec.data as Plotly.Data[]}
        layout={{
          ...spec.layout,
          autosize: true,
        } as Partial<Plotly.Layout>}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: "100%", minHeight: 380 }}
        useResizeHandler
      />
      <button
        onClick={downloadHtml}
        className="mt-1 text-xs text-gray-400 hover:text-blue-400 underline"
      >
        Download as HTML
      </button>
    </div>
  );
}
