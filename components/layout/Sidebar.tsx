"use client";

import type { DatasetMetadata } from "@/lib/types";

interface SidebarProps {
  datasets: DatasetMetadata[];
  selected: string | null;
  onSelect: (id: string) => void;
  onDelete: (blobUrl: string) => void;
}

export function Sidebar({ datasets, selected, onSelect, onDelete }: SidebarProps) {
  return (
    <div className="w-64 shrink-0 border-r border-gray-700 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Datasets
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {datasets.length === 0 ? (
          <p className="px-4 py-3 text-xs text-gray-500">No datasets loaded.</p>
        ) : (
          datasets.map((d) => (
            <div
              key={d.id}
              className={`group flex items-start justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-800 transition-colors ${
                selected === d.id ? "bg-gray-800" : ""
              }`}
              onClick={() => onSelect(d.id)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{d.filename}</p>
                <p className="text-xs text-gray-500">
                  {d.rows.toLocaleString()} rows · {d.cols} cols
                </p>
                {d.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{d.description}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(d.blobUrl);
                }}
                className="ml-2 shrink-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs transition-opacity"
                title="Delete dataset"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
