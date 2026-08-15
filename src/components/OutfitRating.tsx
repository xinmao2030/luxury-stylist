"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { FullStylingPlan, RecommendedItem } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";
import { localStorageHelper } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface OutfitRating {
  reportId: string;
  overallRating: number;
  itemRatings: Record<string, number>; // itemKey -> rating
  feedbackTags: string[];
  comment: string;
  createdAt: string;
}

interface Props {
  data: FullStylingPlan;
  reportId: string;
  onClose: () => void;
  onRated?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "luxury-stylist-ratings";
const storage = localStorageHelper<OutfitRating>(STORAGE_KEY);

const EMOJI_LABELS: { emoji: string; label: string }[] = [
  { emoji: "\u{1F61E}", label: "完全不行" },
  { emoji: "\u{1F615}", label: "不太合适" },
  { emoji: "\u{1F610}", label: "一般" },
  { emoji: "\u{1F60A}", label: "不错" },
  { emoji: "\u{1F60D}", label: "完美" },
];

const FEEDBACK_TAGS = [
  "太贵了",
  "不适合我的风格",
  "颜色不喜欢",
  "太正式",
  "太休闲",
  "尺码担忧",
  "品牌不了解",
  "搭配不协调",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function itemKey(category: string, item: RecommendedItem): string {
  return `${category}::${item.brand}::${item.itemName}`;
}

function getAllItems(data: FullStylingPlan): { category: string; item: RecommendedItem }[] {
  const result: { category: string; item: RecommendedItem }[] = [];
  for (const [cat, rec] of Object.entries(data.recommendations)) {
    for (const it of rec.items) {
      result.push({ category: cat, item: it });
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Star component                                                     */
/* ------------------------------------------------------------------ */

function Stars({
  value,
  onChange,
  size = "text-xl",
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <span className="inline-flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            className={`${size} transition-all duration-150 ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-125"
            } ${filled ? "text-[var(--gold)]" : "text-[var(--cream-dark)]"}`}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readonly && setHover(n)}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main OutfitRating modal                                            */
/* ------------------------------------------------------------------ */

export default function OutfitRating({ data, reportId, onClose, onRated }: Props) {
  const allItems = useMemo(() => getAllItems(data), [data]);

  // --- state ---
  const [overallRating, setOverallRating] = useState(0);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [existingRating, setExistingRating] = useState<OutfitRating | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Load existing rating for this report on mount
  useEffect(() => {
    const ratings = storage.load();
    const existing = ratings.find((r) => r.reportId === reportId);
    if (existing) {
      setOverallRating(existing.overallRating);
      setItemRatings(existing.itemRatings);
      setFeedbackTags(existing.feedbackTags);
      setComment(existing.comment);
      setExistingRating(existing);
    }
  }, [reportId]);

  // --- handlers ---
  const toggleTag = useCallback((tag: string) => {
    setFeedbackTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const setItemRating = useCallback((key: string, rating: number) => {
    setItemRatings((prev) => ({ ...prev, [key]: rating }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (overallRating === 0) return;

    const rating: OutfitRating = {
      reportId,
      overallRating,
      itemRatings,
      feedbackTags,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    const ratings = storage.load();
    const idx = ratings.findIndex((r) => r.reportId === reportId);
    if (idx >= 0) {
      ratings[idx] = rating;
    } else {
      ratings.push(rating);
    }
    storage.save(ratings);

    setSubmitted(true);
    setExistingRating(rating);
    onRated?.();
  }, [overallRating, itemRatings, feedbackTags, comment, reportId, onRated]);

  // --- current emoji ---
  const currentEmoji = overallRating > 0 ? EMOJI_LABELS[overallRating - 1] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card-luxury w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title flex items-center gap-2 !mb-0">
            <span className="text-2xl">{"⭐"}</span>
            {submitted ? "谢谢反馈！" : existingRating ? "修改评价" : "评价本次搭配"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors"
            >
              {showHistory ? "返回评价" : "历史统计"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--cream-dark)] transition-colors text-lg"
            >
              {"×"}
            </button>
          </div>
        </div>

        {showHistory ? (
          <RatingSummary />
        ) : submitted ? (
          /* --- Success state --- */
          <div className="text-center py-8">
            <div className="text-6xl mb-4 animate-bounce">{currentEmoji?.emoji}</div>
            <p className="text-lg font-semibold mb-2 text-[var(--noir)]">
              {currentEmoji?.label}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {"您的反馈将帮助AI更好地理解您的品味"}
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setSubmitted(false)} className="btn-gold text-sm">
                {"继续修改"}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm rounded-lg border border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors"
              >
                {"关闭"}
              </button>
            </div>
          </div>
        ) : (
          /* --- Rating form --- */
          <div className="space-y-6">
            {/* Overall rating */}
            <div className="text-center p-5 rounded-xl bg-gradient-to-b from-[var(--gold)]/5 to-transparent border border-[var(--gold)]/10">
              <p className="text-sm font-medium text-gray-500 mb-3">{"整体评分"}</p>
              <Stars value={overallRating} onChange={setOverallRating} size="text-3xl" />
              {currentEmoji && (
                <div className="mt-3 flex items-center justify-center gap-2 text-lg transition-all duration-300">
                  <span className="text-2xl">{currentEmoji.emoji}</span>
                  <span className="font-medium text-[var(--gold-dark)]">{currentEmoji.label}</span>
                </div>
              )}
            </div>

            {/* Per-item ratings */}
            <div>
              <p className="text-sm font-semibold text-[var(--noir)] mb-3">{"单品评分"}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {allItems.map(({ category, item }) => {
                  const key = itemKey(category, item);
                  const icon = CATEGORY_ICONS[category] || "\u{1F3AF}";
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--cream)]/60 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm flex-shrink-0">{icon}</span>
                        <span className="text-sm truncate text-[var(--noir)]">
                          {item.brand} {item.itemName}
                        </span>
                      </div>
                      <Stars
                        value={itemRatings[key] || 0}
                        onChange={(v) => setItemRating(key, v)}
                        size="text-base"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feedback tags */}
            <div>
              <p className="text-sm font-semibold text-[var(--noir)] mb-3">{"快速反馈"}</p>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TAGS.map((tag) => {
                  const active = feedbackTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 ${
                        active
                          ? "bg-[var(--gold)] text-white border-[var(--gold)] shadow-md shadow-[var(--gold)]/20"
                          : "border-[var(--gold)]/20 text-gray-600 hover:border-[var(--gold)]/50 hover:text-[var(--gold)]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <p className="text-sm font-semibold text-[var(--noir)] mb-2">{"补充意见"}</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={"分享您对这套搭配的想法…"}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[var(--gold)]/15 bg-[var(--cream)]/40 text-sm text-[var(--noir)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--gold)]/50 focus:ring-2 focus:ring-[var(--gold)]/10 transition-all resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={overallRating === 0}
              className={`btn-gold w-full text-sm ${
                overallRating === 0 ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              {existingRating ? "更新评价" : "提交评价"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RatingSummary (exported, can be used on home page)                  */
/* ------------------------------------------------------------------ */

export function RatingSummary() {
  const [ratings, setRatings] = useState<OutfitRating[]>([]);

  useEffect(() => {
    setRatings(storage.load());
  }, []);

  const stats = useMemo(() => {
    if (ratings.length === 0) return null;

    const totalRated = ratings.length;
    const avgScore = ratings.reduce((s, r) => s + r.overallRating, 0) / totalRated;

    // Top feedback tags
    const tagCounts: Record<string, number> = {};
    for (const r of ratings) {
      for (const tag of r.feedbackTags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));

    // Favorite brands (from item ratings >= 4)
    const brandScores: Record<string, { total: number; count: number }> = {};
    for (const r of ratings) {
      for (const [key, score] of Object.entries(r.itemRatings)) {
        if (score >= 4) {
          const brand = key.split("::")[1];
          if (brand) {
            const entry = (brandScores[brand] ??= { total: 0, count: 0 });
            entry.total += score;
            entry.count += 1;
          }
        }
      }
    }
    const topBrands = Object.entries(brandScores)
      .sort((a, b) => b[1].count - a[1].count || b[1].total - a[1].total)
      .slice(0, 3)
      .map(([brand, { count }]) => ({ brand, count }));

    return { totalRated, avgScore, topTags, topBrands };
  }, [ratings]);

  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3 opacity-30">{"⭐"}</div>
        <p className="text-sm text-gray-500">{"还没有评价记录"}</p>
        <p className="text-xs text-gray-400 mt-1">{"对AI搭配方案进行评价后将在这里看到统计"}</p>
      </div>
    );
  }

  const emojiForAvg = EMOJI_LABELS[Math.round(stats.avgScore) - 1] || EMOJI_LABELS[2];

  return (
    <div className="space-y-5">
      {/* Score overview */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-xl bg-gradient-to-b from-[var(--gold)]/8 to-transparent border border-[var(--gold)]/10">
          <div className="text-2xl font-bold text-[var(--gold)]">{stats.totalRated}</div>
          <div className="text-xs text-gray-500 mt-1">{"已评价"}</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-b from-[var(--gold)]/8 to-transparent border border-[var(--gold)]/10">
          <div className="text-2xl font-bold text-[var(--gold)]">{stats.avgScore.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">{"平均分"}</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-b from-[var(--gold)]/8 to-transparent border border-[var(--gold)]/10">
          <div className="text-2xl">{emojiForAvg.emoji}</div>
          <div className="text-xs text-gray-500 mt-1">{emojiForAvg.label}</div>
        </div>
      </div>

      {/* Top feedback tags */}
      {stats.topTags.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[var(--noir)] mb-2">{"常见反馈"}</p>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(({ tag, count }) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[var(--gold)]/10 text-[var(--gold-dark)] border border-[var(--gold)]/15"
              >
                {tag}
                <span className="bg-[var(--gold)]/20 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Favorite brands */}
      {stats.topBrands.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[var(--noir)] mb-2">{"偶爱品牌"}</p>
          <div className="flex flex-wrap gap-2">
            {stats.topBrands.map(({ brand, count }) => (
              <span
                key={brand}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[var(--noir)]/5 text-[var(--noir)] border border-[var(--noir)]/10"
              >
                {"\u{1F451}"} {brand}
                <span className="bg-[var(--gold)]/20 text-[var(--gold-dark)] px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
