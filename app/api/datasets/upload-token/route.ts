import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;
  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? "unknown";

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          // Some browsers send these for CSV
          "text/plain",
          "application/octet-stream",
        ],
        maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
        pathname: `raw/${sessionId}/${pathname}`,
      }),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload token error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
