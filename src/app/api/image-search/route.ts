import { NextRequest, NextResponse } from "next/server";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function getVqd(query: string): Promise<string | null> {
  const res = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    { headers: { "User-Agent": UA } }
  );
  const html = await res.text();
  const match = html.match(/vqd=([^&"]+)/);
  return match ? match[1] : null;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ images: [] });
  }

  try {
    const vqd = await getVqd(query);
    if (!vqd) {
      return NextResponse.json({ images: [] });
    }

    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,&p=1`;
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": UA,
        Referer: "https://duckduckgo.com/",
        Accept: "application/json",
      },
    });

    const data = await res.json();
    const images = (data.results || [])
      .slice(0, 6)
      .map((r: { image?: string; thumbnail?: string }) => ({
        full: r.image || "",
        thumb: r.thumbnail || r.image || "",
      }))
      .filter((img: { full: string }) => img.full);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
