"use client";

import type { Message } from "@ai-sdk/react";
import { ChartBlock } from "./ChartBlock";
import type { PlotlySpec } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-100"
        }`}
      >
        {(message.parts ?? []).map((part, idx) => {
          if (part.type === "text") {
            return (
              <p key={idx} className="whitespace-pre-wrap leading-relaxed">
                {part.text}
              </p>
            );
          }

          if (part.type === "tool-invocation") {
            if (part.toolInvocation.state === "result") {
              const result = part.toolInvocation.result as PlotlySpec | { error: string };
              if ("error" in result) {
                return (
                  <p key={idx} className="text-red-400 text-xs">
                    Chart error: {result.error}
                  </p>
                );
              }
              return <ChartBlock key={idx} spec={result} />;
            }
            if (part.toolInvocation.state === "call") {
              return (
                <p key={idx} className="text-gray-400 text-xs italic">
                  Generating chart…
                </p>
              );
            }
          }

          return null;
        })}
      </div>
    </div>
  );
}
