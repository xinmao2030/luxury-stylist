"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ProfileForm from "@/components/ProfileForm";
import ResultsView from "@/components/ResultsView";
import ReportHistory from "@/components/ReportHistory";
import FavoritesView from "@/components/FavoritesView";
import CompareView from "@/components/CompareView";
import type { UserProfile, FullStylingPlan } from "@/lib/types";

export interface SavedReport {
  id: string;
  createdAt: string;
  profileName: string;
  profileSummary: string;
  profile: UserProfile;
  data: FullStylingPlan;
}

const STORAGE_KEY = "luxury-stylist-reports";

function loadReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReports(reports: SavedReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

type View = "home" | "form" | "loading" | "results" | "favorites" | "compare";

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [result, setResult] = useState<FullStylingPlan | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [streamText, setStreamText] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);
  const [compareReports, setCompareReports] = useState<[SavedReport, SavedReport] | null>(null);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  // Auto-scroll the streaming preview to the bottom
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamText]);

  const handleSubmit = useCallback(async (profile: UserProfile) => {
    setLoading(true);
    setError("");
    setStreamText("");
    setView("loading");
    setCurrentProfile(profile);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const evt = JSON.parse(jsonStr);

            if (evt.error) {
              throw new Error(evt.error);
            }

            if (evt.chunk) {
              setStreamText((prev) => prev + evt.chunk);
            }

            if (evt.done && evt.data) {
              if (evt.data.parseError) {
                throw new Error("AI 返回格式异常，请重试");
              }

              const report: SavedReport = {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                profileName: profile.name || "未命名",
                profileSummary: evt.data.profileSummary || "",
                profile,
                data: evt.data,
              };

              const updated = [report, ...loadReports()];
              saveReports(updated);
              setReports(updated);

              setResult(evt.data);
              setView("results");
              setStreamText("");
              return;
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "AI 返回格式异常，请重试") {
              // Could be a JSON parse error on the SSE line — check if it's a thrown error
              if (jsonStr.includes('"error"')) {
                throw parseErr;
              }
              // Otherwise skip malformed SSE line
            } else {
              throw parseErr;
            }
          }
        }
      }

      // If we exit the loop without a done event, something went wrong
      throw new Error("Stream ended without result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setView("form");
      setStreamText("");
    } finally {
      setLoading(false);
    }
  }, []);

  function viewReport(report: SavedReport) {
    setResult(report.data);
    setCurrentProfile(report.profile);
    setView("results");
  }

  function deleteReport(id: string) {
    const updated = reports.filter((r) => r.id !== id);
    saveReports(updated);
    setReports(updated);
  }

  function handleCompare(a: SavedReport, b: SavedReport) {
    setCompareReports([a, b]);
    setView("compare");
  }

  function goHome() {
    setView("home");
    setResult(null);
    setCurrentProfile(null);
    setCompareReports(null);
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="luxury-gradient text-white py-6 px-8 mb-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={goHome} className="text-left">
            <h1 className="text-2xl font-bold tracking-wider gold-text">
              LUXURY STYLIST
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              AI 奢侈品私人形象顾问
            </p>
          </button>
          <div className="flex items-center gap-4">
            {view !== "home" && (
              <button
                onClick={goHome}
                className="text-[var(--gold-light)] hover:text-white text-sm transition-colors"
              >
                ← 首页
              </button>
            )}
            {view === "home" && (
              <>
                <button
                  onClick={() => setView("favorites")}
                  className="text-[var(--gold-light)] hover:text-white text-sm transition-colors"
                >
                  收藏夹
                </button>
                <button
                  onClick={() => setView("form")}
                  className="btn-gold text-sm !py-2 !px-5"
                >
                  + 新建方案
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 pb-12">
        {/* Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
            <button
              onClick={() => setError("")}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Home — Report History */}
        {view === "home" && (
          <ReportHistory
            reports={reports}
            onView={viewReport}
            onDelete={deleteReport}
            onNew={() => setView("form")}
            onCompare={handleCompare}
          />
        )}

        {/* Form */}
        {view === "form" && (
          <ProfileForm onSubmit={handleSubmit} loading={loading} />
        )}

        {/* Loading */}
        {view === "loading" && (
          <div className="max-w-3xl mx-auto py-12">
            <div className="text-center mb-6">
              <div className="inline-block w-12 h-12 border-4 border-[var(--gold-light)] border-t-[var(--gold)] rounded-full animate-spin mb-4" />
              <h2 className="text-2xl font-bold mb-2">AI 形象顾问分析中</h2>
              <p className="text-gray-500 text-sm">
                正在根据您的个人特征和偏好生成专属方案...
              </p>
            </div>
            {streamText && (
              <div className="card-luxury p-5">
                <p className="section-title mb-3">实时生成预览</p>
                <div
                  ref={streamRef}
                  className="max-h-80 overflow-y-auto font-mono text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words bg-[var(--cream)] rounded-lg p-4"
                >
                  {streamText}
                  <span className="inline-block w-2 h-4 bg-[var(--gold)] animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {view === "results" && result && (
          <ResultsView
            data={result}
            onBack={goHome}
            profile={currentProfile || undefined}
          />
        )}

        {/* Favorites */}
        {view === "favorites" && (
          <FavoritesView onBack={goHome} />
        )}

        {/* Compare */}
        {view === "compare" && compareReports && (
          <CompareView
            reportA={compareReports[0]}
            reportB={compareReports[1]}
            onBack={goHome}
          />
        )}
      </div>
    </main>
  );
}
