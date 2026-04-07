import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parser";
import { uploadDatasetBlob } from "@/lib/blob";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const description = (formData.get("description") as string) ?? "";
    const sessionId = formData.get("sessionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: "No sessionId provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const dataset = await parseFile(buffer, file.name, description, sessionId);

    const blobUrl = await uploadDatasetBlob(sessionId, dataset);
    dataset.metadata.blobUrl = blobUrl;

    return NextResponse.json(dataset.metadata);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
