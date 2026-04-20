"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileForm from "@/components/ProfileForm";
import ResultsView from "@/components/ResultsView";
import ReportHistory from "@/components/ReportHistory";
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

type View = "home" | "form" | "loading" | "results";

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [result, setResult] = useState<FullStylingPlan | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const handleSubmit = useCallback(async (profile: UserProfile) => {
    setLoading(true);
    setError("");
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

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "分析失败");
      }

      if (json.data.parseError) {
        throw new Error("AI 返回格式异常，请重试");
      }

      const report: SavedReport = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        profileName: profile.name || "未命名",
        profileSummary: json.data.profileSummary || "",
        profile,
        data: json.data,
      };

      const updated = [report, ...loadReports()];
      saveReports(updated);
      setReports(updated);

      setResult(json.data);
      setView("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setView("form");
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

  function goHome() {
    setView("home");
    setResult(null);
    setCurrentProfile(null);
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
              <button
                onClick={() => setView("form")}
                className="btn-gold text-sm !py-2 !px-5"
              >
                + 新建方案
              </button>
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
          />
        )}

        {/* Form */}
        {view === "form" && (
          <ProfileForm onSubmit={handleSubmit} loading={loading} />
        )}

        {/* Loading */}
        {view === "loading" && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-[var(--gold-light)] border-t-[var(--gold)] rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-3">AI 形象顾问分析中</h2>
            <p className="text-gray-500">
              正在根据您的个人特征和偏好生成专属方案...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              预计需要 30-60 秒（本地模型）
            </p>
          </div>
        )}

        {/* Results */}
        {view === "results" && result && (
          <ResultsView
            data={result}
            onBack={goHome}
          />
        )}
      </div>
    </main>
  );
}
