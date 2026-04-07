"use client";

import { useState, useEffect } from "react";
import type { DatasetBlob, DatasetMetadata } from "@/lib/types";

interface TableViewerProps {
  dataset: DatasetMetadata;
}

const PAGE_SIZE = 50;

export function TableViewer({ dataset }: TableViewerProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<"table" | "stats">("table");

  useEffect(() => {
    setLoading(true);
    setPage(0);
    fetch(dataset.blobUrl)
      .then((r) => r.json())
      .then((data: DatasetBlob) => setRows(data.rows))
      .finally(() => setLoading(false));
  }, [dataset.blobUrl]);

  const colNames = dataset.columns.map((c) => c.name);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        {(["table", "stats"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "table" ? "Table" : "Statistics"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
          Loading…
        </div>
      ) : tab === "table" ? (
        <>
          <div className="flex-1 overflow-auto p-4">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  {colNames.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-gray-400 font-medium whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-800 hover:bg-gray-800/50"
                  >
                    {colNames.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-1.5 text-gray-300 whitespace-nowrap max-w-xs truncate"
                      >
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of{" "}
                {rows.length} rows
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40 hover:bg-gray-600"
                >
                  ←
                </button>
                <button
                  disabled={page === totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40 hover:bg-gray-600"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-700">
                {["Column", "Type", "Nulls", "Min", "Max", "Mean"].map((h) => (
                  <th key={h} className="px-3 py-2 text-gray-400 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.columns.map((col) => (
                <tr key={col.name} className="border-b border-gray-800">
                  <td className="px-3 py-1.5 text-white font-medium">{col.name}</td>
                  <td className="px-3 py-1.5 text-gray-400">{col.dtype}</td>
                  <td className="px-3 py-1.5 text-gray-400">{col.nullCount}</td>
                  <td className="px-3 py-1.5 text-gray-300">
                    {col.min !== undefined ? col.min.toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-gray-300">
                    {col.max !== undefined ? col.max.toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-gray-300">
                    {col.mean !== undefined ? col.mean.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
