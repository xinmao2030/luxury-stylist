"use client";

import { useState } from "react";
import type { SavedReport } from "@/app/page";

interface Props {
  reports: SavedReport[];
  onView: (report: SavedReport) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onCompare?: (a: SavedReport, b: SavedReport) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function budgetLabel(tier: string) {
  const map: Record<string, string> = {
    entry: "入门奢侈",
    mid: "中端奢侈",
    high: "高端奢侈",
    ultra: "顶级定制",
  };
  return map[tier] || tier;
}

function genderLabel(g: string) {
  return g === "male" ? "男" : g === "female" ? "女" : "非二元";
}

export default function ReportHistory({ reports, onView, onDelete, onNew, onCompare }: Props) {
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function startCompare() {
    if (selected.length !== 2 || !onCompare) return;
    const a = reports.find((r) => r.id === selected[0]);
    const b = reports.find((r) => r.id === selected[1]);
    if (a && b) onCompare(a, b);
  }

  function exitCompareMode() {
    setCompareMode(false);
    setSelected([]);
  }

  if (reports.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-6xl mb-6 opacity-30">✨</div>
        <h2 className="text-2xl font-bold mb-3">还没有方案记录</h2>
        <p className="text-gray-500 mb-8">
          创建您的第一份专属奢侈品形象方案
        </p>
        <button onClick={onNew} className="btn-gold">
          + 新建方案
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          方案记录
          <span className="text-sm font-normal text-gray-400 ml-2">
            共 {reports.length} 份
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {compareMode && selected.length === 2 && (
            <button
              onClick={startCompare}
              className="btn-gold text-sm !py-2 !px-5"
            >
              开始对比
            </button>
          )}
          {compareMode && (
            <span className="text-xs text-gray-400">
              已选 {selected.length}/2
            </span>
          )}
          {reports.length >= 2 && (
            <button
              onClick={compareMode ? exitCompareMode : () => setCompareMode(true)}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                compareMode
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-[var(--cream-dark)] text-[var(--noir)] hover:bg-gray-200"
              }`}
            >
              {compareMode ? "取消对比" : "对比"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className={`card-luxury p-5 cursor-pointer group relative ${
              compareMode && selected.includes(report.id)
                ? "ring-2 ring-[var(--gold)] bg-[var(--gold-light)]/10"
                : ""
            }`}
            onClick={() => compareMode ? toggleSelect(report.id) : onView(report)}
          >
            {/* Compare checkbox */}
            {compareMode && (
              <div className="absolute top-3 left-3 w-6 h-6 rounded-full border-2 border-[var(--gold)] flex items-center justify-center bg-white">
                {selected.includes(report.id) && (
                  <div className="w-3.5 h-3.5 rounded-full bg-[var(--gold)]" />
                )}
              </div>
            )}

            {/* Delete button */}
            {!compareMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("确定删除这份方案？")) onDelete(report.id);
              }}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--gold-light)] flex items-center justify-center text-[var(--gold-dark)] font-bold text-lg flex-shrink-0">
                {report.profileName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">
                  {report.profileName}
                </h3>
                <p className="text-xs text-gray-400">
                  {formatDate(report.createdAt)}
                </p>
              </div>
            </div>

            {/* Profile tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-2 py-0.5 bg-[var(--cream-dark)] rounded text-xs text-gray-600">
                {genderLabel(report.profile.gender)} · {report.profile.age}岁
              </span>
              <span className="px-2 py-0.5 bg-[var(--cream-dark)] rounded text-xs text-gray-600">
                {report.profile.height}cm / {report.profile.weight}kg
              </span>
              <span className="px-2 py-0.5 bg-[var(--cream-dark)] rounded text-xs text-gray-600">
                {report.profile.city}
              </span>
              <span className="px-2 py-0.5 bg-[var(--gold-light)] rounded text-xs text-[var(--gold-dark)]">
                {budgetLabel(report.profile.budgetTier)}
              </span>
              {report.profile.occupation && (
                <span className="px-2 py-0.5 bg-[var(--cream-dark)] rounded text-xs text-gray-600">
                  {report.profile.occupation}
                </span>
              )}
            </div>

            {/* Summary */}
            {report.profileSummary && (
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {report.profileSummary}
              </p>
            )}

            {/* Style tags */}
            {report.profile.stylePreferences.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[var(--cream-dark)]">
                {report.profile.stylePreferences.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-[var(--noir)] text-white rounded-full text-xs"
                  >
                    {s}
                  </span>
                ))}
                {report.profile.stylePreferences.length > 4 && (
                  <span className="text-xs text-gray-400">
                    +{report.profile.stylePreferences.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* View hint */}
            <div className="mt-3 text-xs text-[var(--gold)] opacity-0 group-hover:opacity-100 transition-opacity">
              点击查看完整方案 →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
