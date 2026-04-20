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

export const OLLAMA_URL = "http://localhost:11434/api/chat";
export const OLLAMA_MODEL = "qwen3:8b";
