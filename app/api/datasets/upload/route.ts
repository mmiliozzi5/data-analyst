import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parser";
import { uploadDatasetBlob } from "@/lib/blob";

export const runtime = "nodejs";

// Receives: { rawBlobUrl, filename, description, sessionId }
// The file was already uploaded directly to Vercel Blob by the client.
// This route fetches it, parses it, and saves the dataset JSON blob.
export async function POST(req: NextRequest) {
  try {
    const { rawBlobUrl, filename, description, sessionId } = await req.json();

    if (!rawBlobUrl || !filename || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fileRes = await fetch(rawBlobUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch uploaded file" }, { status: 500 });
    }
    const buffer = await fileRes.arrayBuffer();

    const dataset = await parseFile(buffer, filename, description ?? "", sessionId);
    const blobUrl = await uploadDatasetBlob(sessionId, dataset);
    dataset.metadata.blobUrl = blobUrl;

    return NextResponse.json(dataset.metadata);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
