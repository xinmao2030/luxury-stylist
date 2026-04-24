"use client";

import { useState, useRef, useCallback } from "react";
import { OLLAMA_URL, OLLAMA_MODEL } from "@/lib/constants";

interface Suggestion { brand: string; itemName: string; searchQuery: string; thumb?: string }

const CATEGORIES = ["包", "鞋", "上装", "下装", "外套", "配饰", "连衣裙"] as const;

export default function VisualSearch({ onClose }: { onClose: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [color, setColor] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const search = async () => {
    setLoading(true); setResults([]);
    try {
      const prompt = `用户正在寻找一件${category}，颜色为${color || "不限"}，风格为${style || "经典"}。请推荐5个奢侈品牌的具体款式，格式为JSON数组：[{"brand":"品牌","itemName":"款式名","searchQuery":"英文搜索词"}]。只返回JSON，不要其他文字。`;
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: [{ role: "user", content: prompt }], stream: false }),
      });
      const data = await res.json();
      const text = data.message?.content || "";
      const match = text.match(/\[[\s\S]*\]/);
      const items: Suggestion[] = match ? JSON.parse(match[0]) : [];

      const withImages = await Promise.all(
        items.map(async (item) => {
          try {
            const r = await fetch(`/api/image-search?q=${encodeURIComponent(item.searchQuery)}`);
            const d = await r.json();
            return { ...item, thumb: d.images?.[0]?.thumb };
          } catch { return item; }
        })
      );
      setResults(withImages);
    } catch (e) { console.error("Visual search error:", e); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card-luxury w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--noir)]">以图搜款</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-[var(--noir)] transition-colors">&times;</button>
        </div>

        {/* Upload Area */}
        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-[var(--gold)] bg-[var(--gold-light)]/10" : "border-gray-300 hover:border-[var(--gold)]"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-4xl mb-3">📸</div>
            <p className="text-[var(--noir)] font-medium mb-1">拖放图片到此处，或点击上传</p>
            <p className="text-sm text-gray-500">支持 JPG / PNG / WebP</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        ) : (
          <>
            {/* Preview + Describe */}
            <div className="flex gap-4 mb-6">
              <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--gold-light)]">
                <img src={preview} alt="上传图片" className="w-full h-full object-cover" />
                <button onClick={() => { setPreview(null); setResults([]); }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70">&times;</button>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--gold)]">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="颜色（如：黑色）"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--gold)]" />
                </div>
                <input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="风格关键词（如：极简、复古、通勤）"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--gold)]" />
                <button onClick={search} disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--gold-dark), var(--gold))" }}>
                  {loading ? "搜索中..." : "搜索相似款"}
                </button>
              </div>
            </div>

            {/* Shimmer Loading */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden">
                    <div className="aspect-square bg-gray-200 animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results Grid */}
            {!loading && results.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[var(--gold-dark)] uppercase tracking-wider mb-3">相似推荐</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {results.map((item, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow bg-white">
                      <div className="aspect-square bg-[var(--cream)] flex items-center justify-center overflow-hidden">
                        {item.thumb
                          ? <img src={item.thumb} alt={item.itemName} className="w-full h-full object-cover" />
                          : <span className="text-4xl text-gray-300">👜</span>}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-[var(--gold-dark)] uppercase tracking-wide">{item.brand}</p>
                        <p className="text-sm text-[var(--noir)] mt-0.5 line-clamp-2">{item.itemName}</p>
                        <a href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.searchQuery)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs font-medium text-[var(--gold-dark)] hover:underline">
                          去搜索 &rarr;
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && results.length === 0 && preview && (
              <p className="text-center text-sm text-gray-400 py-4">选择品类并描述风格，点击搜索相似款</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
