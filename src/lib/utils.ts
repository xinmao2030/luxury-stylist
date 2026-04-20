import type { RecommendedItem } from "./types";

export function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export function buildSearchQuery(item: Pick<RecommendedItem, "brand" | "collection" | "itemName">) {
  return `${item.brand} ${item.collection} ${item.itemName}`.replace(/\s+/g, " ").trim();
}

export function buildGoogleShoppingUrl(item: Pick<RecommendedItem, "brand" | "collection" | "itemName">) {
  const q = buildSearchQuery(item);
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=shop`;
}

export function buildGoogleImageUrl(item: Pick<RecommendedItem, "brand" | "collection" | "itemName">) {
  const q = buildSearchQuery(item);
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`;
}

const PLATFORM_SEARCH_URLS: Record<string, (q: string) => string> = {
  "天猫奢品": (q) => `https://luxury.tmall.com/search?q=${encodeURIComponent(q)}`,
  "京东奢品": (q) => `https://search.jd.com/Search?keyword=${encodeURIComponent(q)}&psort=3`,
  "得物(POIZON)": (q) => `https://m.dewu.com/search/result?keyword=${encodeURIComponent(q)}`,
  "得物": (q) => `https://m.dewu.com/search/result?keyword=${encodeURIComponent(q)}`,
  "小红书商城": (q) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q)}`,
  "品牌官网": (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " official site buy")}`,
  "NET-A-PORTER": (q) => `https://www.net-a-porter.com/en-us/shop/search/${encodeURIComponent(q)}`,
  "FARFETCH": (q) => `https://www.farfetch.com/shopping/women/search/items.aspx?q=${encodeURIComponent(q)}`,
  "SSENSE": (q) => `https://www.ssense.com/en-us/search?q=${encodeURIComponent(q)}`,
  "Mytheresa": (q) => `https://www.mytheresa.com/int/en/search?q=${encodeURIComponent(q)}`,
  "MatchesFashion": (q) => `https://www.matchesfashion.com/us/search?q=${encodeURIComponent(q)}`,
};

export function buildPlatformUrl(platform: string, item: Pick<RecommendedItem, "brand" | "itemName">): string {
  const q = `${item.brand} ${item.itemName}`.trim();
  const builder = PLATFORM_SEARCH_URLS[platform];
  if (builder) return builder(q);
  return `https://www.google.com/search?q=${encodeURIComponent(q + " " + platform)}&tbm=shop`;
}

export function localStorageHelper<T>(key: string) {
  return {
    load(): T[] {
      if (typeof window === "undefined") return [];
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },
    save(data: T[]) {
      localStorage.setItem(key, JSON.stringify(data));
    },
  };
}
