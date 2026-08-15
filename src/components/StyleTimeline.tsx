"use client";

import { useState, useEffect, useMemo } from "react";
import type { SavedReport } from "@/app/page";
import type { UserProfile, FullStylingPlan } from "@/lib/types";
import { localStorageHelper } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

interface TimelineChange {
  budgetShift: "up" | "down" | null;
  newCategories: string[];
  droppedBrands: string[];
  newBrands: string[];
  colorChanges: { added: string[]; removed: string[] };
  styleChanges: { added: string[]; removed: string[] };
}

const BUDGET_ORDER: Record<string, number> = {
  entry: 0,
  mid: 1,
  high: 2,
  ultra: 3,
};

const BUDGET_LABELS: Record<string, string> = {
  entry: "入门奢侈",
  mid: "中端奢侈",
  high: "高端奢侈",
  ultra: "顶级定制",
};

const ALL_CATEGORIES = [
  "hair", "makeup", "tops", "bottoms", "dresses",
  "outerwear", "bags", "shoes", "accessories", "fragrance", "watches",
];

const CATEGORY_LABELS: Record<string, string> = {
  hair: "发型", makeup: "妆容", tops: "上装", bottoms: "下装",
  dresses: "连衣裙", outerwear: "外套", bags: "手袋", shoes: "鞋履",
  accessories: "配饰", fragrance: "香氛", watches: "腕表",
};

function extractBrands(data: FullStylingPlan): string[] {
  const brands = new Set<string>();
  const recs = data.recommendations;
  for (const key of Object.keys(recs) as (keyof typeof recs)[]) {
    const cat = recs[key];
    if (cat?.items) {
      for (const item of cat.items) {
        if (item.brand) brands.add(item.brand);
      }
    }
  }
  return Array.from(brands);
}

function extractActiveCategories(data: FullStylingPlan): string[] {
  const cats: string[] = [];
  const recs = data.recommendations;
  for (const key of Object.keys(recs) as (keyof typeof recs)[]) {
    if (recs[key]?.items?.length > 0) {
      cats.push(key);
    }
  }
  return cats;
}

function extractKeywords(summary: string): string[] {
  const keywords: string[] = [];
  const patterns = [
    /经典|优雅|简约|时尚|潮流|商务|休闲|浪漫|前卫|复古|极简|华丽|精致|低调|奢华|知性|干练|甜美|酷感|中性/g,
  ];
  for (const p of patterns) {
    const matches = summary.match(p);
    if (matches) keywords.push(...matches);
  }
  return [...new Set(keywords)].slice(0, 5);
}

function compareReports(prev: SavedReport, curr: SavedReport): TimelineChange {
  const prevBudget = BUDGET_ORDER[prev.profile.budgetTier] ?? 0;
  const currBudget = BUDGET_ORDER[curr.profile.budgetTier] ?? 0;

  const prevBrands = new Set(extractBrands(prev.data));
  const currBrands = new Set(extractBrands(curr.data));

  const prevCats = new Set(extractActiveCategories(prev.data));
  const currCats = new Set(extractActiveCategories(curr.data));

  const prevColors = new Set(prev.profile.colorPreferences);
  const currColors = new Set(curr.profile.colorPreferences);

  const prevStyles = new Set(prev.profile.stylePreferences);
  const currStyles = new Set(curr.profile.stylePreferences);

  return {
    budgetShift: currBudget > prevBudget ? "up" : currBudget < prevBudget ? "down" : null,
    newCategories: [...currCats].filter((c) => !prevCats.has(c)),
    newBrands: [...currBrands].filter((b) => !prevBrands.has(b)),
    droppedBrands: [...prevBrands].filter((b) => !currBrands.has(b)),
    colorChanges: {
      added: [...currColors].filter((c) => !prevColors.has(c)),
      removed: [...prevColors].filter((c) => !currColors.has(c)),
    },
    styleChanges: {
      added: [...currStyles].filter((s) => !prevStyles.has(s)),
      removed: [...prevStyles].filter((s) => !currStyles.has(s)),
    },
  };
}

export default function StyleTimeline({ onClose }: Props) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  useEffect(() => {
    const { load } = localStorageHelper<SavedReport>("luxury-stylist-reports");
    const loaded = load();
    loaded.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setReports(loaded);
  }, []);

  const changes = useMemo(() => {
    const map = new Map<string, TimelineChange>();
    for (let i = 1; i < reports.length; i++) {
      map.set(reports[i].id, compareReports(reports[i - 1], reports[i]));
    }
    return map;
  }, [reports]);

  const stats = useMemo(() => {
    if (reports.length === 0) return null;

    const brandCount = new Map<string, number>();
    const allCats = new Set<string>();
    for (const r of reports) {
      for (const b of extractBrands(r.data)) {
        brandCount.set(b, (brandCount.get(b) || 0) + 1);
      }
      for (const c of extractActiveCategories(r.data)) {
        allCats.add(c);
      }
    }

    let mostConsistentBrand = "-";
    let maxCount = 0;
    for (const [brand, count] of brandCount) {
      if (count > maxCount) {
        maxCount = count;
        mostConsistentBrand = brand;
      }
    }

    const allBrandsEver = new Set<string>();
    for (const r of reports) {
      for (const b of extractBrands(r.data)) allBrandsEver.add(b);
    }

    const catScore = Math.min(100, Math.round((allCats.size / ALL_CATEGORIES.length) * 50));
    const brandScore = Math.min(50, Math.round(Math.min(allBrandsEver.size / 20, 1) * 50));
    const growthScore = catScore + brandScore;

    const first = new Date(reports[0].createdAt);
    const last = new Date(reports[reports.length - 1].createdAt);

    return {
      total: reports.length,
      dateRange: `${first.toLocaleDateString("zh-CN")} - ${last.toLocaleDateString("zh-CN")}`,
      mostConsistentBrand,
      mostConsistentCount: maxCount,
      growthScore,
      allCats,
      allBrandsEver,
    };
  }, [reports]);

  const insights = useMemo(() => {
    if (reports.length < 2) return [];
    const result: { icon: string; text: string }[] = [];

    const first = reports[0];
    const last = reports[reports.length - 1];
    const firstStyles = first.profile.stylePreferences;
    const lastStyles = last.profile.stylePreferences;
    if (firstStyles.length > 0 && lastStyles.length > 0) {
      const from = firstStyles[0];
      const to = lastStyles.find((s) => !firstStyles.includes(s)) || lastStyles[0];
      if (from !== to) {
        result.push({ icon: "compass", text: `您的风格正在从 ${from} 向 ${to} 演变` });
      }
    }

    if (stats) {
      result.push({
        icon: "heart",
        text: `您最忠实的品牌: ${stats.mostConsistentBrand} (出现${stats.mostConsistentCount}次)`,
      });

      const unexplored = ALL_CATEGORIES.filter((c) => !stats.allCats.has(c));
      if (unexplored.length > 0) {
        const suggestions = unexplored.slice(0, 3).map((c) => CATEGORY_LABELS[c] || c);
        result.push({
          icon: "sparkles",
          text: `建议尝试: ${suggestions.join("、")}`,
        });
      }
    }

    return result;
  }, [reports, stats]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
  };

  const getTop3Brands = (data: FullStylingPlan): string[] => {
    const brandCount = new Map<string, number>();
    const recs = data.recommendations;
    for (const key of Object.keys(recs) as (keyof typeof recs)[]) {
      if (recs[key]?.items) {
        for (const item of recs[key].items) {
          if (item.brand) brandCount.set(item.brand, (brandCount.get(item.brand) || 0) + 1);
        }
      }
    }
    return [...brandCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([brand]) => brand);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: "linear-gradient(180deg, var(--noir) 0%, var(--noir-light) 100%)",
          border: "1px solid var(--gold-dark)",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--gold-dark) transparent",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-8 py-6 flex items-center justify-between"
          style={{
            background: "linear-gradient(180deg, var(--noir) 80%, transparent)",
            borderBottom: "1px solid rgba(201,169,110,0.2)",
          }}
        >
          <div>
            <h2
              className="text-2xl font-bold tracking-wide"
              style={{
                background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Style Evolution Timeline
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--gold-dark)" }}>
              追踪您的风格演变历程
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
            style={{ color: "var(--gold-light)", background: "rgba(201,169,110,0.1)" }}
          >
            &times;
          </button>
        </div>

        <div className="px-8 pb-8">
          {reports.length === 0 ? (
            <div className="text-center py-20" style={{ color: "var(--gold-dark)" }}>
              <div className="text-5xl mb-4">&#128302;</div>
              <p className="text-lg">尚无保存的风格报告</p>
              <p className="text-sm mt-2 opacity-60">创建您的第一份造型方案以开启时间线</p>
            </div>
          ) : (
            <>
              {/* Statistics Panel */}
              {stats && (
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                  {[
                    { label: "报告总数", value: String(stats.total), sub: "份风格方案" },
                    { label: "时间跨度", value: stats.dateRange, sub: "" },
                    { label: "最忠实品牌", value: stats.mostConsistentBrand, sub: `出现 ${stats.mostConsistentCount} 次` },
                    { label: "风格成长", value: String(stats.growthScore), sub: "/ 100 分" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-4 text-center"
                      style={{
                        background: "rgba(201,169,110,0.08)",
                        border: "1px solid rgba(201,169,110,0.15)",
                      }}
                    >
                      <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--gold-dark)" }}>
                        {s.label}
                      </div>
                      <div
                        className="text-lg font-bold truncate"
                        style={{ color: "var(--gold-light)" }}
                        title={s.value}
                      >
                        {s.value}
                      </div>
                      {s.sub && (
                        <div className="text-xs mt-1" style={{ color: "var(--gold-dark)", opacity: 0.7 }}>
                          {s.sub}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Growth Score Bar */}
              {stats && (
                <div className="mb-8">
                  <div className="flex items-center justify-between text-xs mb-2" style={{ color: "var(--gold-dark)" }}>
                    <span className="uppercase tracking-widest">风格成长指数</span>
                    <span style={{ color: "var(--gold-light)" }}>{stats.growthScore} / 100</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: "rgba(201,169,110,0.15)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${stats.growthScore}%`,
                        background: "linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light))",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="relative ml-4">
                {/* Vertical connecting line */}
                <div
                  className="absolute left-3 top-3 bottom-3 w-px"
                  style={{ background: "linear-gradient(to bottom, var(--gold), var(--gold-dark), transparent)" }}
                />

                {reports.map((report, idx) => {
                  const change = changes.get(report.id);
                  const isFirst = idx === 0;
                  const isExpanded = expandedNode === report.id;
                  const top3 = getTop3Brands(report.data);
                  const keywords = extractKeywords(report.profileSummary || report.data.profileSummary || "");
                  const budgetLabel = BUDGET_LABELS[report.profile.budgetTier] || report.profile.budgetTier;
                  const hasChanges = change && (
                    change.budgetShift ||
                    change.newCategories.length > 0 ||
                    change.newBrands.length > 0 ||
                    change.droppedBrands.length > 0 ||
                    change.styleChanges.added.length > 0 ||
                    change.colorChanges.added.length > 0
                  );

                  return (
                    <div key={report.id} className="relative pl-10 pb-8 last:pb-0">
                      {/* Timeline dot */}
                      <div
                        className="absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-[1]"
                        style={{
                          background: isFirst
                            ? "linear-gradient(135deg, var(--gold), var(--gold-light))"
                            : "var(--noir-light)",
                          border: "2px solid var(--gold)",
                          color: isFirst ? "var(--noir)" : "var(--gold-light)",
                        }}
                      >
                        {idx + 1}
                      </div>

                      {/* Node card */}
                      <div
                        className="rounded-xl p-5 cursor-pointer transition-all duration-300"
                        style={{
                          background: isExpanded ? "rgba(201,169,110,0.12)" : "rgba(201,169,110,0.05)",
                          border: isExpanded
                            ? "1px solid rgba(201,169,110,0.4)"
                            : "1px solid rgba(201,169,110,0.1)",
                        }}
                        onClick={() => setExpandedNode(isExpanded ? null : report.id)}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm font-semibold" style={{ color: "var(--gold-light)" }}>
                                {report.profileName || "未命名"}
                              </span>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(201,169,110,0.15)",
                                  color: "var(--gold)",
                                  border: "1px solid rgba(201,169,110,0.3)",
                                }}
                              >
                                {budgetLabel}
                              </span>
                              {change?.budgetShift === "up" && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-700/40">
                                  &#9650; 升级
                                </span>
                              )}
                              {change?.budgetShift === "down" && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-700/40">
                                  &#9660; 降级
                                </span>
                              )}
                            </div>
                            <div className="text-xs mt-1" style={{ color: "var(--gold-dark)", opacity: 0.7 }}>
                              {formatDate(report.createdAt)}
                            </div>
                          </div>
                          <div className="text-xs" style={{ color: "var(--gold-dark)" }}>
                            {isExpanded ? "&#9650;" : "&#9660;"}
                          </div>
                        </div>

                        {/* Keywords */}
                        {keywords.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {keywords.map((kw) => (
                              <span
                                key={kw}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(201,169,110,0.1)",
                                  color: "var(--gold)",
                                }}
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Top 3 brands */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {top3.map((brand) => {
                            const isNew = change?.newBrands.includes(brand);
                            return (
                              <span
                                key={brand}
                                className="text-xs px-2 py-1 rounded-md font-medium"
                                style={{
                                  background: isNew ? "rgba(201,169,110,0.2)" : "rgba(255,255,255,0.05)",
                                  color: isNew ? "var(--gold-light)" : "var(--gold-dark)",
                                  border: isNew ? "1px solid var(--gold)" : "1px solid rgba(201,169,110,0.1)",
                                }}
                              >
                                {brand}
                                {isNew && (
                                  <span className="ml-1 text-[10px] text-yellow-400">新增</span>
                                )}
                              </span>
                            );
                          })}
                        </div>

                        {/* Change indicators (non-expanded summary) */}
                        {!isExpanded && hasChanges && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {(change.newCategories.length > 0) && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-700/30">
                                +{change.newCategories.length} 新品类
                              </span>
                            )}
                            {change.newBrands.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-700/30">
                                +{change.newBrands.length} 新品牌
                              </span>
                            )}
                            {change.styleChanges.added.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 border border-purple-700/30">
                                +{change.styleChanges.added.length} 新风格
                              </span>
                            )}
                          </div>
                        )}

                        {/* Expanded detail */}
                        {isExpanded && change && (
                          <div
                            className="mt-4 pt-4 space-y-3"
                            style={{ borderTop: "1px solid rgba(201,169,110,0.15)" }}
                          >
                            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--gold-dark)" }}>
                              相较上次变化
                            </div>

                            {change.newCategories.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-emerald-400 text-sm mt-px">+</span>
                                <div>
                                  <span className="text-xs" style={{ color: "var(--gold-dark)" }}>新探索品类: </span>
                                  <span className="text-xs" style={{ color: "var(--gold-light)" }}>
                                    {change.newCategories.map((c) => CATEGORY_LABELS[c] || c).join("、")}
                                  </span>
                                </div>
                              </div>
                            )}

                            {change.newBrands.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-blue-400 text-sm mt-px">+</span>
                                <div>
                                  <span className="text-xs" style={{ color: "var(--gold-dark)" }}>新增品牌: </span>
                                  <span className="text-xs" style={{ color: "var(--gold-light)" }}>
                                    {change.newBrands.slice(0, 5).join("、")}
                                    {change.newBrands.length > 5 && ` 等${change.newBrands.length}个`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {change.droppedBrands.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-red-400 text-sm mt-px">-</span>
                                <div>
                                  <span className="text-xs" style={{ color: "var(--gold-dark)" }}>不再推荐: </span>
                                  <span className="text-xs" style={{ color: "rgba(248,113,113,0.7)" }}>
                                    {change.droppedBrands.slice(0, 5).join("、")}
                                    {change.droppedBrands.length > 5 && ` 等${change.droppedBrands.length}个`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {change.styleChanges.added.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-purple-400 text-sm mt-px">&#10148;</span>
                                <div>
                                  <span className="text-xs" style={{ color: "var(--gold-dark)" }}>新增风格: </span>
                                  <span className="text-xs" style={{ color: "var(--gold-light)" }}>
                                    {change.styleChanges.added.join("、")}
                                  </span>
                                </div>
                              </div>
                            )}

                            {change.styleChanges.removed.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-orange-400 text-sm mt-px">&#10148;</span>
                                <div>
                                  <span className="text-xs" style={{ color: "var(--gold-dark)" }}>告别风格: </span>
                                  <span className="text-xs" style={{ color: "rgba(251,191,36,0.6)" }}>
                                    {change.styleChanges.removed.join("、")}
                                  </span>
                                </div>
                              </div>
                            )}

                            {change.colorChanges.added.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-pink-400 text-sm mt-px">&#9679;</span>
                                <div>
                                  <span className="text-xs" style={{ color: "var(--gold-dark)" }}>新增色彩: </span>
                                  <span className="text-xs" style={{ color: "var(--gold-light)" }}>
                                    {change.colorChanges.added.join("、")}
                                  </span>
                                </div>
                              </div>
                            )}

                            {!change.budgetShift &&
                              change.newCategories.length === 0 &&
                              change.newBrands.length === 0 &&
                              change.droppedBrands.length === 0 &&
                              change.styleChanges.added.length === 0 &&
                              change.colorChanges.added.length === 0 && (
                                <div className="text-xs" style={{ color: "var(--gold-dark)", opacity: 0.5 }}>
                                  风格保持一致，无显著变化
                                </div>
                              )}
                          </div>
                        )}

                        {/* Expanded detail for first report (no change) */}
                        {isExpanded && isFirst && (
                          <div
                            className="mt-4 pt-4"
                            style={{ borderTop: "1px solid rgba(201,169,110,0.15)" }}
                          >
                            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--gold-dark)" }}>
                              起始风格档案
                            </div>
                            <div className="space-y-2">
                              <div className="text-xs" style={{ color: "var(--gold-light)" }}>
                                风格偏好: {report.profile.stylePreferences.join("、") || "-"}
                              </div>
                              <div className="text-xs" style={{ color: "var(--gold-light)" }}>
                                偏好色彩: {report.profile.colorPreferences.join("、") || "-"}
                              </div>
                              <div className="text-xs" style={{ color: "var(--gold-light)" }}>
                                心仪品牌: {report.profile.favorBrands.join("、") || "-"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insight Cards */}
              {insights.length > 0 && (
                <div className="mt-8 space-y-3">
                  <div
                    className="text-xs uppercase tracking-widest mb-3"
                    style={{ color: "var(--gold-dark)", letterSpacing: "3px" }}
                  >
                    风格洞察
                  </div>
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className="rounded-xl px-5 py-4 flex items-start gap-4"
                      style={{
                        background: "rgba(201,169,110,0.06)",
                        border: "1px solid rgba(201,169,110,0.12)",
                      }}
                    >
                      <span className="text-lg flex-shrink-0" style={{ color: "var(--gold)" }}>
                        {insight.icon === "compass" && "✸"}
                        {insight.icon === "heart" && "♥"}
                        {insight.icon === "sparkles" && "✨"}
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: "var(--gold-light)" }}>
                        {insight.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
