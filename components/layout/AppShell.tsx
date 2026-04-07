"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useDatasets } from "@/hooks/useDatasets";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Uploader } from "@/components/upload/Uploader";
import { TableViewer } from "@/components/datasets/TableViewer";

type Tab = "chat" | "datasets" | "upload";

export function AppShell() {
  const sessionId = useSession();
  const { datasets, fetchDatasets, uploadDataset, deleteDataset } = useDatasets(sessionId);
  const [tab, setTab] = useState<Tab>("chat");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) fetchDatasets();
  }, [sessionId, fetchDatasets]);

  useEffect(() => {
    if (datasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(datasets[0].id);
    }
  }, [datasets, selectedDatasetId]);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId) ?? null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "chat", label: "Chat" },
    { id: "datasets", label: "Datasets" },
    { id: "upload", label: "Upload" },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        datasets={datasets}
        selected={selectedDatasetId}
        onSelect={(id) => {
          setSelectedDatasetId(id);
          setTab("datasets");
        }}
        onDelete={async (blobUrl) => {
          await deleteDataset(blobUrl);
          if (selectedDataset?.blobUrl === blobUrl) {
            setSelectedDatasetId(null);
          }
        }}
      />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-700 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                tab === t.id
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Always keep ChatPanel mounted so conversation is preserved when switching tabs */}
          {sessionId && (
            <div className={`h-full ${tab !== "chat" ? "hidden" : ""}`}>
              <ChatPanel sessionId={sessionId} />
            </div>
          )}

          {tab === "datasets" && (
            selectedDataset ? (
              <TableViewer dataset={selectedDataset} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Select a dataset from the sidebar.
              </div>
            )
          )}

          {tab === "upload" && (
            <Uploader
              onUpload={async (file, description) => {
                const meta = await uploadDataset(file, description);
                if (meta) {
                  setSelectedDatasetId(meta.id);
                  setTab("datasets");
                }
                return meta;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
