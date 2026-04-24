"use client";
import { useEffect, useState } from "react";
import { CATEGORY_ICONS } from "@/lib/constants";
import { localStorageHelper } from "@/lib/utils";
import type { WardrobeItem } from "@/components/MyWardrobe";

const COLOR_MAP: Record<string, string> = {
  黑: "#1a1a1a", 白: "#f5f5f5", 红: "#dc2626", 蓝: "#2563eb", 绿: "#16a34a",
  棕: "#92400e", 灰: "#6b7280", 米: "#f5f0e1", 粉: "#ec4899", 紫: "#7c3aed",
  金: "#c9a96e", 银: "#9ca3af",
};

const wardrobeStorage = localStorageHelper<WardrobeItem>("luxury-stylist-wardrobe");
const favoritesStorage = localStorageHelper<unknown>("luxury-stylist-favorites");
const reportsStorage = localStorageHelper<unknown>("luxury-stylist-reports");

export default function WardrobeAnalytics({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [favCount, setFavCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    setItems(wardrobeStorage.load() ?? []);
    setFavCount((favoritesStorage.load() as unknown[] ?? []).length);
    setReportCount((reportsStorage.load() as unknown[] ?? []).length);
  }, []);

  const brands = items.map((i) => i.brand).filter(Boolean);
  const uniqueBrands = [...new Set(brands)];
  const catCounts: Record<string, number> = {};
  for (const i of items) catCounts[i.category] = (catCounts[i.category] || 0) + 1;
  const maxCat = Math.max(...Object.values(catCounts), 1);
  const total = items.length;

  // brand distribution top 8
  const brandFreq: Record<string, number> = {};
  for (const b of brands) brandFreq[b] = (brandFreq[b] || 0) + 1;
  const topBrands = Object.entries(brandFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxBrand = topBrands[0]?.[1] ?? 1;

  // color distribution
  const colorCounts: Record<string, number> = {};
  for (const i of items) {
    for (const [key] of Object.entries(COLOR_MAP)) {
      if (i.color?.includes(key)) colorCounts[key] = (colorCounts[key] || 0) + 1;
    }
  }

  // advice
  const advice: string[] = [];
  if (total < 5) advice.push("衣橱刚起步，继续添加单品解锁更多分析");
  for (const [cat, name] of Object.entries(CATEGORY_ICONS)) {
    if (!catCounts[cat]) advice.push(`建议补充${name} ${cat}`);
  }
  for (const [cat, count] of Object.entries(catCounts)) {
    if (total > 0 && count / total > 0.4) {
      const icon = CATEGORY_ICONS[cat] ?? "";
      advice.push(`${icon}${cat}占比过高，建议丰富其他品类`);
    }
  }
  if (uniqueBrands.length > 0 && uniqueBrands.length < 3) advice.push("品牌较单一，可尝试不同风格品牌");

  const statCards = [
    { label: "衣橱总数", value: total },
    { label: "收藏总数", value: favCount },
    { label: "方案总数", value: reportCount },
    { label: "品牌数量", value: uniqueBrands.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card-luxury w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: "var(--gold)" }}>📊 衣橱分析</h2>
          <button onClick={onClose} className="text-2xl opacity-60 hover:opacity-100" style={{ color: "var(--gold)" }}>✕</button>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {statCards.map((s) => (
            <div key={s.label} className="text-center p-3 rounded-lg" style={{ background: "var(--noir)", border: "1px solid var(--gold-dark)" }}>
              <div className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "var(--cream-dark)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Category distribution */}
        <Section title="分类分布">
          {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => {
            const count = catCounts[cat] || 0;
            return (
              <div key={cat} className="flex items-center gap-2 mb-2">
                <span className="w-20 text-xs truncate" style={{ color: "var(--cream)" }}>{icon} {cat}</span>
                <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "var(--noir)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxCat) * 100}%`, background: "var(--gold)", minWidth: count ? "8px" : 0 }} />
                </div>
                <span className="w-6 text-xs text-right" style={{ color: "var(--gold-light)" }}>{count}</span>
              </div>
            );
          })}
        </Section>

        {/* Brand distribution */}
        {topBrands.length > 0 && (
          <Section title="品牌分布">
            {topBrands.map(([brand, count]) => (
              <div key={brand} className="flex items-center gap-2 mb-2">
                <span className="w-24 text-xs truncate" style={{ color: "var(--cream)" }}>{brand}</span>
                <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "var(--noir)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(count / maxBrand) * 100}%`, background: "var(--gold-dark)" }} />
                </div>
                <span className="w-6 text-xs text-right" style={{ color: "var(--gold-light)" }}>{count}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Color distribution */}
        {Object.keys(colorCounts).length > 0 && (
          <Section title="色彩分布">
            <div className="flex flex-wrap gap-4">
              {Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).map(([color, count]) => (
                <div key={color} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full border-2" style={{ background: COLOR_MAP[color], borderColor: "var(--gold-dark)" }} />
                  <span className="text-xs" style={{ color: "var(--cream-dark)" }}>{color} {count}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Advice */}
        {advice.length > 0 && (
          <Section title="衣橱建议">
            <ul className="space-y-1">
              {advice.slice(0, 5).map((a, i) => (
                <li key={i} className="text-sm" style={{ color: "var(--cream-dark)" }}>• {a}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--gold-light)" }}>{title}</h3>
      {children}
    </div>
  );
}
