"use client";

import { useState, useCallback } from "react";
import type { DatasetMetadata } from "@/lib/types";

export function useDatasets(sessionId: string) {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDatasets = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/datasets?sessionId=${sessionId}`);
      if (res.ok) {
        const data: DatasetMetadata[] = await res.json();
        setDatasets(data);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const uploadDataset = useCallback(
    async (file: File, description: string): Promise<DatasetMetadata | null> => {
      if (!sessionId) return null;
      const form = new FormData();
      form.append("file", file);
      form.append("description", description);
      form.append("sessionId", sessionId);

      const res = await fetch("/api/datasets/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      const metadata: DatasetMetadata = await res.json();
      setDatasets((prev) => [...prev, metadata]);
      return metadata;
    },
    [sessionId]
  );

  const deleteDataset = useCallback(async (blobUrl: string) => {
    const res = await fetch("/api/datasets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blobUrl }),
    });
    if (res.ok) {
      setDatasets((prev) => prev.filter((d) => d.blobUrl !== blobUrl));
    }
  }, []);

  return { datasets, loading, fetchDatasets, uploadDataset, deleteDataset };
}
