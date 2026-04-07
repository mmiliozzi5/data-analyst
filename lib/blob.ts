import { list, del, put } from "@vercel/blob";
import type { DatasetBlob, DatasetMetadata } from "@/lib/types";

export async function uploadDatasetBlob(
  sessionId: string,
  dataset: DatasetBlob
): Promise<string> {
  const pathname = `${sessionId}/${dataset.metadata.id}.json`;
  const json = JSON.stringify(dataset);
  const blob = await put(pathname, json, {
    access: "public",
    contentType: "application/json",
  });
  return blob.url;
}

export async function listDatasetBlobs(sessionId: string): Promise<DatasetMetadata[]> {
  const { blobs } = await list({ prefix: `${sessionId}/` });

  const metadataList = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url);
        const data: DatasetBlob = await res.json();
        // Always use the authoritative URL from the blob listing
        data.metadata.blobUrl = blob.url;
        return data.metadata;
      } catch {
        return null;
      }
    })
  );

  return metadataList.filter((m): m is DatasetMetadata => m !== null);
}

export async function getDatasetBlob(blobUrl: string): Promise<DatasetBlob> {
  const res = await fetch(blobUrl);
  if (!res.ok) throw new Error(`Failed to fetch dataset: ${res.statusText}`);
  return res.json();
}

export async function deleteDatasetBlob(blobUrl: string): Promise<void> {
  await del(blobUrl);
}

export async function getAllDatasetsForSession(sessionId: string): Promise<DatasetBlob[]> {
  const { blobs } = await list({ prefix: `${sessionId}/` });

  const datasets = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url);
        return (await res.json()) as DatasetBlob;
      } catch {
        return null;
      }
    })
  );

  return datasets.filter((d): d is DatasetBlob => d !== null);
}
