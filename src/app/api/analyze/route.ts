import { NextRequest, NextResponse } from "next/server";
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
      throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    }

    // Read streaming response and accumulate full text
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.message?.content) {
            fullText += obj.message.content;
          }
        } catch {
          // skip malformed lines
        }
      }
    }

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

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
