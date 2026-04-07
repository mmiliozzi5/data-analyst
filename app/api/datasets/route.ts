import { NextRequest, NextResponse } from "next/server";
import { listDatasetBlobs, deleteDatasetBlob } from "@/lib/blob";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const datasets = await listDatasetBlobs(sessionId);
    return NextResponse.json(datasets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { blobUrl } = await req.json();
    if (!blobUrl) {
      return NextResponse.json({ error: "Missing blobUrl" }, { status: 400 });
    }
    await deleteDatasetBlob(blobUrl);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
