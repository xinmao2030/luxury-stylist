import { NextRequest } from "next/server";
import { buildAnalysisPrompt } from "@/lib/prompts";
import type { UserProfile } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qwen3:8b";

export async function POST(req: NextRequest) {
  try {
    const { profile, category } = (await req.json()) as {
      profile: UserProfile;
      category?: string;
    };

    const prompt = buildAnalysisPrompt(profile, category) + "\n\n/no_think";

    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        options: { num_predict: 6000, temperature: 0.7, num_ctx: 8192 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        `data: ${JSON.stringify({ error: `Ollama error: ${res.status} ${errText}` })}\n\n`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const ollamaReader = res.body?.getReader();
    if (!ollamaReader) {
      throw new Error("No response body from Ollama");
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let fullText = "";

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            const { done, value } = await ollamaReader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.trim()) continue;
              try {
                const obj = JSON.parse(line);
                if (obj.message?.content) {
                  const text = obj.message.content;
                  fullText += text;
                  // Send incremental chunk to client
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
                  );
                }
              } catch {
                // skip malformed lines
              }
            }
          }

          // All chunks received — parse the final result
          let parsed;
          try {
            const noThink = fullText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            const cleaned = noThink
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
            parsed = JSON.parse(cleaned);
          } catch {
            parsed = { raw: fullText, parseError: true };
          }

          // Send final done event with parsed data
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, data: parsed })}\n\n`)
          );
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      `data: ${JSON.stringify({ error: message })}\n\n`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }
}
