"use client";

import { useState, useEffect, useRef } from "react";
import type { FullStylingPlan, RecommendedItem, ImageResult } from "@/lib/types";
import { fetchImages } from "@/lib/client-utils";

interface ShareCardProps {
  data: FullStylingPlan;
  title?: string;
  onClose: () => void;
}

function getAllItems(data: FullStylingPlan): RecommendedItem[] {
  return Object.values(data.recommendations).flatMap((r) => r.items);
}

function extractColors(colorAnalysis: string): string[] {
  const matches = colorAnalysis.match(/#[0-9A-Fa-f]{6}/g);
  if (matches) return matches.slice(0, 6);
  return ["#C9A96E", "#2C2C2C", "#F5F0EB", "#8B7355", "#D4C5B2", "#1A1A2E"];
}

export default function ShareCard({ data, title, onClose }: ShareCardProps) {
  const [images, setImages] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const topItems = getAllItems(data).slice(0, 6);
  const colors = extractColors(data.colorAnalysis);

  useEffect(() => {
    const controller = new AbortController();
    topItems.forEach((item, i) => {
      const q = `${item.brand} ${item.itemName}`;
      fetchImages(q, controller.signal).then((imgs: ImageResult[]) => {
        if (imgs[0]) setImages((p) => ({ ...p, [i]: imgs[0].thumb }));
      }).catch(() => {});
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyText = async () => {
    const lines = [
      `✨ ${title || "My Luxury Style"}`,
      "",
      data.profileSummary.slice(0, 120),
      `🎨 ${data.styleDirection}`,
      "",
      "— Top Picks —",
      ...topItems.map((it) => `• ${it.brand} ${it.itemName} (${it.price})`),
      "",
      `💰 ${data.totalBudgetEstimate}`,
      "Powered by Luxury Stylist AI",
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied("text");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyLink = async () => {
    const summary = [
      `🛍 ${title || "Luxury Style Card"}`,
      `Style: ${data.styleDirection}`,
      ...topItems.slice(0, 4).map((it) => `  ${it.brand} — ${it.itemName}`),
      `Budget: ${data.totalBudgetEstimate}`,
    ].join("\n");
    await navigator.clipboard.writeText(summary);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md flex flex-col gap-4 animate-fade-in">
        {/* The Card */}
        <div className="card-luxury rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-[var(--noir)] via-[#1a1a2e] to-[var(--noir)] p-6 text-center">
            <p className="text-[var(--gold)] font-serif text-2xl tracking-[0.3em] font-bold">
              LUXURY STYLIST
            </p>
            <p className="text-[var(--gold-light)] text-xs tracking-[0.2em] mt-1 opacity-70">
              {title || "PERSONAL STYLE CARD"}
            </p>
          </div>

          {/* Body */}
          <div className="bg-gradient-to-b from-[var(--cream)] to-[var(--cream-dark)] p-5 space-y-4">
            {/* Profile summary */}
            <p className="text-sm text-[var(--noir)] leading-relaxed line-clamp-2 opacity-80">
              {data.profileSummary}
            </p>

            {/* Style tag */}
            <div className="flex justify-center">
              <span className="px-4 py-1 rounded-full text-xs font-medium tracking-wider border border-[var(--gold)] text-[var(--gold-dark)] bg-[var(--gold-light)]/10">
                {data.styleDirection}
              </span>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-3 gap-3">
              {topItems.map((item, i) => (
                <div key={i} className="text-center space-y-1">
                  <div className="aspect-square rounded-lg bg-white/80 border border-[var(--gold-light)]/30 overflow-hidden flex items-center justify-center">
                    {images[i] ? (
                      <img src={images[i]} alt={item.itemName}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[var(--gold)] text-2xl opacity-30">✦</div>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-[var(--gold-dark)] truncate">
                    {item.brand}
                  </p>
                  <p className="text-[9px] text-[var(--noir)] opacity-60 truncate">
                    {item.itemName}
                  </p>
                </div>
              ))}
            </div>

            {/* Color palette */}
            <div className="flex gap-1 justify-center">
              {colors.map((c, i) => (
                <div key={i} className="w-8 h-4 rounded-full shadow-inner"
                  style={{ backgroundColor: c }} />
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[10px] text-[var(--noir)] opacity-40 pt-2 border-t border-[var(--gold-light)]/20">
              <span>{today}</span>
              <span>Powered by AI ✦</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleCopyText}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-[var(--gold)] text-[var(--noir)] hover:bg-[var(--gold-dark)] transition-colors">
            {copied === "text" ? "已复制 ✓" : "复制文字版"}
          </button>
          <button onClick={handleCopyLink}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors">
            {copied === "link" ? "已复制 ✓" : "分享链接"}
          </button>
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="text-white/60 hover:text-white text-sm text-center transition-colors">
          关闭
        </button>
      </div>
    </div>
  );
}
