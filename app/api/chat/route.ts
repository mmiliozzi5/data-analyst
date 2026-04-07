import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { getAllDatasetsForSession } from "@/lib/blob";
import { buildSystemPrompt } from "@/lib/summarizer";
import { makeChartTool } from "@/lib/chart-tool";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json();

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Missing sessionId" }), { status: 400 });
  }

  const datasets = await getAllDatasetsForSession(sessionId);
  const systemPrompt = buildSystemPrompt(datasets);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
    maxSteps: 5,
    tools: {
      generate_chart: makeChartTool(sessionId),
    },
  });

  return result.toDataStreamResponse();
}
