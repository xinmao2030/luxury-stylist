export const CATEGORY_ICONS: Record<string, string> = {
  hair: "💇",
  makeup: "💄",
  tops: "👔",
  bottoms: "👖",
  dresses: "👗",
  outerwear: "🧥",
  bags: "👜",
  shoes: "👠",
  accessories: "💍",
  fragrance: "🌸",
  watches: "⌚",
};

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
export const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

export const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:32b";
