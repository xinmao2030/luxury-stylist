"use client";

import { useEffect, useState } from "react";
import { OLLAMA_URL, OLLAMA_MODEL } from "@/lib/constants";
import { stripThinkTags } from "@/lib/utils";
import type { FullStylingPlan, UserProfile } from "@/lib/types";

interface Trend {
  name: string;
  description: string;
  hotLevel: number;
  matchScore: number;
  suggestedBrands: string[];
  color: string;
}

interface Props {
  data: FullStylingPlan;
  profile: UserProfile;
  onClose: () => void;
}

export default function TrendRadar({ data: _data, profile, onClose }: Props) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const prompt = `作为时尚趋势专家，列出2026年当季最重要的8个奢侈品时尚趋势。对于每个趋势，用JSON数组返回：[{name, description(15字以内), hotLevel(1-10), matchScore(0-100 基于此用户风格偏好:${profile.stylePreferences.join(",")}), suggestedBrands(3个品牌), color(代表色hex)}]。只返回JSON，不要其他文字。`;
        const res = await fetch(OLLAMA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
        });
        const data = await res.json();
        const raw = stripThinkTags(data.message?.content || "");
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("无法解析趋势数据");
        const parsed: Trend[] = JSON.parse(match[0]);
        parsed.sort((a, b) => b.matchScore - a.matchScore);
        setTrends(parsed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "获取趋势失败");
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [profile.stylePreferences]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card-luxury w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
              潮流雷达
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--cream-dark)" }}>
              与您风格匹配的趋势排在前面
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 transition-opacity"
            style={{ color: "var(--cream)" }}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 animate-pulse"
                style={{ background: "var(--noir-light)" }}
              >
                <div className="h-4 w-2/3 rounded mb-3" style={{ background: "var(--noir)" }} />
                <div className="h-3 w-full rounded mb-2" style={{ background: "var(--noir)" }} />
                <div className="h-3 w-1/2 rounded mb-4" style={{ background: "var(--noir)" }} />
                <div className="h-2 w-full rounded mb-2" style={{ background: "var(--noir)" }} />
                <div className="h-2 w-full rounded" style={{ background: "var(--noir)" }} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg mb-2">获取趋势失败</p>
            <p className="text-sm" style={{ color: "var(--cream-dark)" }}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trends.map((t, i) => (
              <div
                key={i}
                className="rounded-xl p-4 transition-transform hover:scale-[1.02]"
                style={{ background: "var(--noir-light)", border: "1px solid var(--gold-dark)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: t.color }}
                  />
                  <span className="font-bold" style={{ color: "var(--cream)" }}>
                    {t.name}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--cream-dark)" }}>
                  {t.description}
                </p>

                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--cream-dark)" }}>热度</span>
                    <span style={{ color: "var(--cream-dark)" }}>{t.hotLevel}/10</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--noir)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(t.hotLevel / 10) * 100}%`,
                        background: "linear-gradient(90deg, #ff6b6b, #ee2222)",
                      }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--cream-dark)" }}>匹配度</span>
                    <span style={{ color: "var(--cream-dark)" }}>{t.matchScore}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--noir)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${t.matchScore}%`,
                        background: "linear-gradient(90deg, var(--gold-dark), var(--gold-light))",
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {t.suggestedBrands.map((b) => (
                    <span
                      key={b}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "var(--noir)", color: "var(--gold)", border: "1px solid var(--gold-dark)" }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
