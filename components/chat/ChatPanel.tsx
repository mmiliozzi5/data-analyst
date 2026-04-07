"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  sessionId: string;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: { sessionId },
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Don't render until sessionId is ready
  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Upload a dataset and start asking questions.
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {/* Thinking indicator — only when no assistant text is streaming yet */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-start mb-3">
            <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-2 text-red-300 text-sm">
              {error.message}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput
        value={input}
        onChange={(v) =>
          handleInputChange({ target: { value: v } } as React.ChangeEvent<HTMLInputElement>)
        }
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </div>
  );
}
