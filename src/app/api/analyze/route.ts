import { NextRequest } from "next/server";
import { buildAnalysisPrompt } from "@/lib/prompts";
import type { UserProfile } from "@/lib/types";
import { OLLAMA_URL, OLLAMA_MODEL, SSE_HEADERS } from "@/lib/constants";
import { stripThinkTags } from "@/lib/utils";

function validateAIResponse(data: Record<string, unknown>): Record<string, unknown> {
  const safeString = (val: unknown, fallback = "暂无分析"): string =>
    typeof val === "string" && val.trim() ? val : fallback;

  const result: Record<string, unknown> = { ...data };

  result.profileSummary = safeString(data.profileSummary);
  result.bodyAnalysis = safeString(data.bodyAnalysis);
  result.colorAnalysis = safeString(data.colorAnalysis);
  result.styleDirection = safeString(data.styleDirection);

  const recs = typeof data.recommendations === "object" && data.recommendations !== null
    ? (data.recommendations as Record<string, unknown>)
    : {};

  const validatedRecs: Record<string, unknown> = {};
  for (const [key, cat] of Object.entries(recs)) {
    const catObj = typeof cat === "object" && cat !== null ? (cat as Record<string, unknown>) : {};
    const rawItems = Array.isArray(catObj.items) ? catObj.items : [];
    const validatedItems = rawItems.map((item: unknown) => {
      const it = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
      return {
        ...it,
        brand: safeString(it.brand, "未知"),
        itemName: safeString(it.itemName, "未知"),
        price: safeString(it.price, "未知"),
        priceUSD: typeof it.priceUSD === "number" ? it.priceUSD : 0,
      };
    });
    validatedRecs[key] = { ...catObj, items: validatedItems };
  }
  result.recommendations = validatedRecs;

  return result;
}

export const maxDuration = 300;
export const dynamic = "force-dynamic";

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
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        options: { num_predict: 6000, temperature: 0.7, num_ctx: 8192 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        `data: ${JSON.stringify({ error: `Ollama error: ${res.status} ${errText}` })}\n\n`,
        { status: 200, headers: SSE_HEADERS }
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
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
                  );
                }
              } catch {
                // skip malformed lines
              }
            }
          }

          let parsed;
          try {
            const cleaned = stripThinkTags(fullText)
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
            parsed = validateAIResponse(JSON.parse(cleaned));
          } catch {
            parsed = { raw: fullText, parseError: true };
          }

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

    return new Response(stream, { headers: SSE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      `data: ${JSON.stringify({ error: message })}\n\n`,
      { status: 200, headers: SSE_HEADERS }
    );
  }
}
