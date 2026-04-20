"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FullStylingPlan } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildPlanContext(plan: FullStylingPlan): string {
  const lines: string[] = [];
  lines.push(`形象评估: ${plan.profileSummary}`);
  lines.push(`色彩分析: ${plan.colorAnalysis}`);
  lines.push(`风格方向: ${plan.styleDirection}`);
  lines.push(`体型分析: ${plan.bodyAnalysis}`);
  lines.push(`预算: ${plan.totalBudgetEstimate}`);

  const recs = plan.recommendations;
  if (recs) {
    for (const [key, cat] of Object.entries(recs)) {
      if (!cat?.items?.length) continue;
      const itemNames = cat.items
        .map((it) => `${it.brand} ${it.itemName} (${it.price})`)
        .join("; ");
      lines.push(`${cat.category}: ${itemNames}`);
    }
  }

  return lines.join("\n");
}

interface Props {
  plan: FullStylingPlan;
}

export default function StylistChat({ plan }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          planContext: buildPlanContext(plan),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";
      // Track and strip <think> blocks from streamed content
      let inThink = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const obj = JSON.parse(payload);
            if (obj.content) {
              accumulated += obj.content;
              // Strip any remaining think tags
              let display = accumulated;
              if (display.includes("<think>")) {
                inThink = true;
              }
              if (inThink) {
                const endIdx = display.indexOf("</think>");
                if (endIdx >= 0) {
                  display = display.replace(/<think>[\s\S]*?<\/think>/g, "");
                  inThink = false;
                } else {
                  display = display.replace(/<think>[\s\S]*$/, "");
                }
              }
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: display,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "抱歉，连接出现问题，请稍后重试。",
          };
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, plan, streaming]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full luxury-gradient text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        title="造型师对话"
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[400px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-[var(--cream-dark)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Panel header */}
          <div className="luxury-gradient text-white px-5 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="font-semibold text-sm gold-text">
                造型师对话
              </p>
              <p className="text-xs text-gray-400">
                基于您的方案追问细节
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                清空
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">
                  有任何关于方案的问题？
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  例: 这件外套怎么搭配？有更平价的替代吗？
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--gold)] text-white rounded-br-md"
                      : "bg-[var(--cream)] text-[var(--noir)] rounded-bl-md"
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[var(--cream-dark)] flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="输入您的问题..."
              className="flex-1 text-sm !py-2"
              disabled={streaming}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="px-4 py-2 bg-[var(--gold)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}
