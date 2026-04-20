"use client";

import { useState } from "react";
import type { SavedReport } from "@/app/page";
import type { StyleRecommendation } from "@/lib/types";

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

function SectionCompare({
  label,
  leftText,
  rightText,
}: {
  label: string;
  leftText: string;
  rightText: string;
}) {
  const isDifferent = leftText !== rightText;
  return (
    <div className="mb-6">
      <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--gold-dark)] mb-3">
        {label}
        {isDifferent && (
          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-normal">
            有差异
          </span>
        )}
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg text-sm leading-relaxed ${isDifferent ? "bg-blue-50 border border-blue-100" : "bg-[var(--cream)]"}`}>
          {leftText || "-"}
        </div>
        <div className={`p-4 rounded-lg text-sm leading-relaxed ${isDifferent ? "bg-emerald-50 border border-emerald-100" : "bg-[var(--cream)]"}`}>
          {rightText || "-"}
        </div>
      </div>
    </div>
  );
}

function CategoryCompare({
  catKey,
  leftRec,
  rightRec,
}: {
  catKey: string;
  leftRec?: StyleRecommendation;
  rightRec?: StyleRecommendation;
}) {
  const [expanded, setExpanded] = useState(false);
  const categoryName = leftRec?.category || rightRec?.category || catKey;

  const leftItems = leftRec?.items || [];
  const rightItems = rightRec?.items || [];

  if (leftItems.length === 0 && rightItems.length === 0) return null;

  // Check if brands differ
  const leftBrands = new Set(leftItems.map((i) => i.brand));
  const rightBrands = new Set(rightItems.map((i) => i.brand));
  const hasBrandDiff = leftBrands.size !== rightBrands.size ||
    [...leftBrands].some((b) => !rightBrands.has(b));

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left mb-3 group"
      >
        <span className="text-xl">{CATEGORY_ICONS[catKey] || "✨"}</span>
        <h4 className="text-lg font-bold flex-1">{categoryName}</h4>
        {hasBrandDiff && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
            品牌差异
          </span>
        )}
        <span className="text-gray-400 group-hover:text-[var(--gold)] transition-colors">
          {expanded ? "−" : "+"}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-3">
            {leftItems.map((item, i) => (
              <div key={i} className="card-luxury p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold">{item.brand}</p>
                  <span className="text-[var(--gold-dark)] text-sm font-semibold whitespace-nowrap ml-2">
                    {item.price}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{item.collection}</p>
                <p className="text-sm font-medium mt-1">{item.itemName}</p>
                {item.color && item.color !== "不适用" && (
                  <p className="text-xs text-gray-500 mt-1">色: {item.color}</p>
                )}
              </div>
            ))}
            {leftItems.length === 0 && (
              <p className="text-sm text-gray-400 italic p-4">该方案无此类推荐</p>
            )}
          </div>
          {/* Right column */}
          <div className="space-y-3">
            {rightItems.map((item, i) => (
              <div key={i} className="card-luxury p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold">{item.brand}</p>
                  <span className="text-[var(--gold-dark)] text-sm font-semibold whitespace-nowrap ml-2">
                    {item.price}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{item.collection}</p>
                <p className="text-sm font-medium mt-1">{item.itemName}</p>
                {item.color && item.color !== "不适用" && (
                  <p className="text-xs text-gray-500 mt-1">色: {item.color}</p>
                )}
              </div>
            ))}
            {rightItems.length === 0 && (
              <p className="text-sm text-gray-400 italic p-4">该方案无此类推荐</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  reportA: SavedReport;
  reportB: SavedReport;
  onBack: () => void;
}

export default function CompareView({ reportA, reportB, onBack }: Props) {
  const a = reportA.data;
  const b = reportB.data;

  // Collect all recommendation category keys
  const allCatKeys = new Set([
    ...Object.keys(a.recommendations || {}),
    ...Object.keys(b.recommendations || {}),
  ]);

  const recsA = (a.recommendations || {}) as Record<string, StyleRecommendation>;
  const recsB = (b.recommendations || {}) as Record<string, StyleRecommendation>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="luxury-gradient text-white rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 gold-text">方案对比</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-white/10 rounded-xl">
            <p className="text-[var(--gold-light)] text-xs uppercase tracking-widest mb-1">方案 A</p>
            <p className="font-bold text-lg">{reportA.profileName}</p>
            <p className="text-gray-400 text-xs">
              {new Date(reportA.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-xl">
            <p className="text-[var(--gold-light)] text-xs uppercase tracking-widest mb-1">方案 B</p>
            <p className="font-bold text-lg">{reportB.profileName}</p>
            <p className="text-gray-400 text-xs">
              {new Date(reportB.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
        </div>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {reportA.profileName}
          </span>
        </div>
        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            {reportB.profileName}
          </span>
        </div>
      </div>

      {/* Analysis sections */}
      <div className="card-luxury p-6 mb-6">
        <SectionCompare label="形象评估" leftText={a.profileSummary} rightText={b.profileSummary} />
        <SectionCompare label="体型分析" leftText={a.bodyAnalysis} rightText={b.bodyAnalysis} />
        <SectionCompare label="色彩分析" leftText={a.colorAnalysis} rightText={b.colorAnalysis} />
        <SectionCompare label="风格方向" leftText={a.styleDirection} rightText={b.styleDirection} />
      </div>

      {/* Recommendation categories */}
      <div className="card-luxury p-6 mb-8">
        <h3 className="text-xl font-bold mb-6">推荐单品对比</h3>
        {[...allCatKeys].map((catKey) => (
          <CategoryCompare
            key={catKey}
            catKey={catKey}
            leftRec={recsA[catKey]}
            rightRec={recsB[catKey]}
          />
        ))}
      </div>

      {/* Budget comparison */}
      <SectionCompare
        label="预算规划"
        leftText={a.totalBudgetEstimate}
        rightText={b.totalBudgetEstimate}
      />

      <div className="text-center mt-12 mb-8">
        <button onClick={onBack} className="btn-gold">
          返回首页
        </button>
      </div>
    </div>
  );
}
