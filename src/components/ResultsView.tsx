"use client";

import { useState } from "react";
import type { FullStylingPlan, StyleRecommendation, RecommendedItem } from "@/lib/types";

const CATEGORY_ICONS: Record<string, string> = {
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

function ItemCard({ item }: { item: RecommendedItem }) {
  return (
    <div className="card-luxury p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg">{item.brand}</p>
          <p className="text-sm text-gray-500">{item.collection}</p>
        </div>
        <span className="text-[var(--gold-dark)] font-semibold text-lg">
          {item.price}
        </span>
      </div>
      <p className="font-medium">{item.itemName}</p>
      {item.color && item.color !== "不适用" && (
        <p className="text-sm">
          <span className="text-gray-500">推荐色: </span>
          {item.color}
        </p>
      )}
      {item.size && item.size !== "不适用" && (
        <p className="text-sm">
          <span className="text-gray-500">建议尺码: </span>
          {item.size}
        </p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">{item.reason}</p>
      <p className="text-xs text-gray-400 italic">{item.imageDescription}</p>
      <div className="mt-auto pt-3 border-t border-[var(--cream-dark)]">
        <p className="text-xs text-gray-500">
          购买渠道: {item.purchaseChannel}
        </p>
      </div>
    </div>
  );
}

function CategorySection({
  catKey,
  rec,
}: {
  catKey: string;
  rec: StyleRecommendation;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left mb-4 group"
      >
        <span className="text-2xl">{CATEGORY_ICONS[catKey] || "✨"}</span>
        <h3 className="text-xl font-bold flex-1">{rec.category}</h3>
        <span className="text-gray-400 group-hover:text-[var(--gold)] transition-colors text-xl">
          {expanded ? "−" : "+"}
        </span>
      </button>
      {expanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
            {rec.items.map((item, i) => (
              <ItemCard key={`${item.brand}-${i}`} item={item} />
            ))}
          </div>
          {rec.stylingTips && (
            <div className="bg-[var(--cream)] border-l-4 border-[var(--gold)] p-4 rounded-r-lg">
              <p className="text-sm font-medium text-[var(--gold-dark)] mb-1">
                搭配建议
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {rec.stylingTips}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface Props {
  data: FullStylingPlan;
  onBack: () => void;
}

export default function ResultsView({ data, onBack }: Props) {
  const categories = Object.entries(data.recommendations || {}) as [
    string,
    StyleRecommendation
  ][];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="luxury-gradient text-white rounded-2xl p-8 mb-8">
        <h2 className="text-3xl font-bold mb-4 gold-text">您的专属形象方案</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[var(--gold-light)] text-xs uppercase tracking-widest mb-2">
              形象评估
            </p>
            <p className="text-gray-200 text-sm leading-relaxed">
              {data.profileSummary}
            </p>
          </div>
          <div>
            <p className="text-[var(--gold-light)] text-xs uppercase tracking-widest mb-2">
              色彩分析
            </p>
            <p className="text-gray-200 text-sm leading-relaxed">
              {data.colorAnalysis}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card-luxury p-5">
          <p className="section-title">体型分析</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.bodyAnalysis}
          </p>
        </div>
        <div className="card-luxury p-5">
          <p className="section-title">风格方向</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.styleDirection}
          </p>
        </div>
        <div className="card-luxury p-5">
          <p className="section-title">预算规划</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.totalBudgetEstimate}
          </p>
        </div>
      </div>

      {/* Seasonal Note */}
      {data.seasonalNotes && (
        <div className="bg-[var(--gold-light)] bg-opacity-30 border border-[var(--gold)] rounded-xl p-5 mb-8">
          <p className="font-medium text-[var(--gold-dark)] mb-1">
            当季趋势提示
          </p>
          <p className="text-sm text-gray-700">{data.seasonalNotes}</p>
        </div>
      )}

      {/* Recommendations */}
      <div>
        {categories.map(([key, rec]) =>
          rec && rec.items && rec.items.length > 0 ? (
            <CategorySection key={key} catKey={key} rec={rec} />
          ) : null
        )}
      </div>

      {/* Back Button */}
      <div className="text-center mt-12 mb-8">
        <button onClick={onBack} className="btn-gold">
          返回首页
        </button>
      </div>
    </div>
  );
}
