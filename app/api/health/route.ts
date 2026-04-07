import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    blob_token_set: !!process.env.BLOB_READ_WRITE_TOKEN,
    anthropic_key_set: !!process.env.ANTHROPIC_API_KEY,
    node_env: process.env.NODE_ENV,
  });
}
