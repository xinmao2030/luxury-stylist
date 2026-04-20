import { NextRequest } from "next/server";
import { OLLAMA_URL, OLLAMA_MODEL, SSE_HEADERS } from "@/lib/constants";
import { stripThinkTags } from "@/lib/utils";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "你是LUXURY STYLIST的私人造型顾问，基于已生成的方案回答客户追问。简洁专业。";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, planContext } = (await req.json()) as {
      messages: ChatMessage[];
      planContext: string;
    };

    const systemContent = planContext
      ? `${SYSTEM_PROMPT}\n\n以下是客户当前的造型方案摘要:\n${planContext}`
      : SYSTEM_PROMPT;

    const ollamaMessages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...messages.map((m, i) => {
        if (m.role === "user" && i === messages.length - 1) {
          return { ...m, content: m.content + " /no_think" };
        }
        return m;
      }),
    ];

    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: true,
        options: { num_predict: 2000, temperature: 0.7, num_ctx: 8192 },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: `Ollama error: ${res.status} ${text}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: "No response body" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.trim()) continue;
              try {
                const obj = JSON.parse(line);
                if (obj.message?.content) {
                  const content = stripThinkTags(obj.message.content);
                  if (content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
