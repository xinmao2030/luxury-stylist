"use client";
import { useState, useEffect } from "react";
import { localStorageHelper } from "@/lib/utils";

export interface Achievement {
  id: string; title: string; description: string; icon: string;
  unlocked: boolean; unlockedAt?: string;
  category: "explore" | "style" | "wardrobe" | "social";
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "first_plan", icon: "🎯", title: "首次方案", description: "生成第一份形象方案", category: "explore", unlocked: false },
  { id: "wardrobe_start", icon: "👗", title: "衣橱起步", description: "上传第一件衣物", category: "wardrobe", unlocked: false },
  { id: "wardrobe_10", icon: "📸", title: "衣橱达人", description: "衣橱拥有10件以上", category: "wardrobe", unlocked: false },
  { id: "all_categories", icon: "👔", title: "全品类覆盖", description: "衣橱每个分类至少1件", category: "wardrobe", unlocked: false },
  { id: "fav_5", icon: "💎", title: "品味鉴赏家", description: "收藏5件以上单品", category: "style", unlocked: false },
  { id: "color_science", icon: "🎨", title: "色彩大师", description: "查看色彩科学分析", category: "style", unlocked: false },
  { id: "cost_analysis", icon: "📊", title: "投资分析师", description: "查看成本效益分析", category: "explore", unlocked: false },
  { id: "travel_capsule", icon: "🧳", title: "旅行家", description: "使用旅行胶囊功能", category: "explore", unlocked: false },
  { id: "outfit_calendar", icon: "📅", title: "穿搭规划师", description: "打开穿搭日历", category: "explore", unlocked: false },
  { id: "chat_3", icon: "🤖", title: "AI对话者", description: "与AI造型师对话3次以上", category: "social", unlocked: false },
  { id: "compare", icon: "🔄", title: "方案对比师", description: "对比两份方案", category: "social", unlocked: false },
  { id: "style_quiz", icon: "⭐", title: "风格探索者", description: "完成风格测验", category: "style", unlocked: false },
  { id: "weather_outfit", icon: "🌤️", title: "天气穿搭", description: "使用天气穿搭推荐", category: "explore", unlocked: false },
  { id: "style_dna", icon: "🧬", title: "风格DNA", description: "查看个人风格DNA", category: "style", unlocked: false },
  { id: "plans_5", icon: "👑", title: "奢品专家", description: "生成5份以上方案", category: "explore", unlocked: false },
];

const storage = localStorageHelper<Achievement>("luxury-stylist-achievements");

export function getAchievements(): Achievement[] {
  const saved = storage.load();
  return DEFAULT_ACHIEVEMENTS.map((d) => {
    const s = saved.find((a) => a.id === d.id);
    return s ? { ...d, unlocked: s.unlocked, unlockedAt: s.unlockedAt } : d;
  });
}

export function checkAndUnlock(id: string): Achievement | null {
  const all = getAchievements();
  const a = all.find((x) => x.id === id);
  if (!a || a.unlocked) return null;
  a.unlocked = true;
  a.unlockedAt = new Date().toISOString();
  storage.save(all);
  return a;
}

const TABS = [
  { key: "all", label: "全部" },
  { key: "explore", label: "探索" },
  { key: "style", label: "风格" },
  { key: "wardrobe", label: "衣橱" },
  { key: "social", label: "社交" },
] as const;

export default function StyleAchievements({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<string>("all");
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => { setAchievements(getAchievements()); }, []);

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const filtered = tab === "all" ? achievements : achievements.filter((a) => a.category === tab);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-luxury max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--gold)" }}>🏆 成就系统</h2>
          <button onClick={onClose} className="text-2xl" style={{ color: "var(--gold)" }}>&times;</button>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: "var(--cream-dark)" }}>已解锁 {unlocked}/15</span>
            <span style={{ color: "var(--gold)" }}>{Math.round((unlocked / 15) * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: "var(--cream-dark)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(unlocked / 15) * 100}%`, background: "linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light))" }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3 py-1 rounded-full text-sm transition-colors"
              style={{ background: tab === t.key ? "var(--gold)" : "transparent", color: tab === t.key ? "var(--noir)" : "var(--cream-dark)", border: `1px solid ${tab === t.key ? "var(--gold)" : "var(--cream-dark)"}` }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-xl p-3 text-center transition-all" style={{
              border: `1.5px solid ${a.unlocked ? "var(--gold)" : "var(--cream-dark)"}`,
              background: a.unlocked ? "rgba(212,175,55,0.08)" : "rgba(128,128,128,0.05)",
              opacity: a.unlocked ? 1 : 0.55,
            }}>
              <div className="text-3xl mb-1">{a.unlocked ? a.icon : "🔒"}</div>
              <div className="text-sm font-semibold" style={{ color: a.unlocked ? "var(--gold)" : "var(--cream-dark)" }}>
                {a.title}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--cream-dark)" }}>
                {a.unlocked ? a.description : "???"}
              </div>
              {a.unlocked && a.unlockedAt && (
                <div className="text-xs mt-1" style={{ color: "var(--gold-dark)" }}>
                  {new Date(a.unlockedAt).toLocaleDateString("zh-CN")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AchievementToast({ achievement, onDismiss }: { achievement: Achievement; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-[slideInRight_0.4s_ease-out]"
      style={{ background: "linear-gradient(135deg, var(--gold-dark), var(--gold))", borderRadius: 12, padding: "14px 20px", color: "var(--noir)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
      <style>{`@keyframes slideInRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{achievement.icon}</span>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider">成就解锁！</div>
          <div className="font-semibold">{achievement.title}</div>
        </div>
      </div>
    </div>
  );
}

export function AchievementBadge({ onClick }: { onClick: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => { setCount(getAchievements().filter((a) => a.unlocked).length); }, []);

  return (
    <button onClick={onClick} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors"
      style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}>
      🏆 <span>{count}</span>
    </button>
  );
}
