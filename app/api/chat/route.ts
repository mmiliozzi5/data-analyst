import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import { NextRequest } from "next/server";
import { getAllDatasetsForSession } from "@/lib/blob";
import { buildSystemPrompt } from "@/lib/summarizer";
import { makeChartTool } from "@/lib/chart-tool";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 20;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let datasets: Awaited<ReturnType<typeof getAllDatasetsForSession>> = [];
    try {
      datasets = await getAllDatasetsForSession(sessionId);
    } catch (blobErr) {
      console.error("Blob list error:", blobErr);
    }

    const systemPrompt = buildSystemPrompt(datasets);
    // Safety net: truncate server-side too in case client sends more
    const trimmedMessages = (messages as CoreMessage[]).slice(-MAX_MESSAGES);

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: systemPrompt,
      messages: trimmedMessages,
      maxSteps: 5,
      tools: {
        generate_chart: makeChartTool(sessionId),
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("Chat route error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
