import type { ImageResult } from "./types";

export async function fetchImages(
  query: string,
  signal?: AbortSignal
): Promise<ImageResult[]> {
  const res = await fetch(
    `/api/image-search?q=${encodeURIComponent(query)}`,
    signal ? { signal } : undefined
  );
  const data = await res.json();
  return data.images || [];
}
