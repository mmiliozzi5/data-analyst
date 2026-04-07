"use client";

import { useState, useCallback } from "react";
import { upload } from "@vercel/blob/client";
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

      // Step 1: upload file directly from browser to Vercel Blob (bypasses serverless size limit)
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `/api/datasets/upload-token?sessionId=${sessionId}`,
      });

      // Step 2: parse + save dataset JSON via API route
      const res = await fetch("/api/datasets/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawBlobUrl: blob.url,
          filename: file.name,
          description,
          sessionId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = "Upload failed";
        try { message = JSON.parse(text).error ?? message; } catch { message = text || message; }
        throw new Error(message);
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
