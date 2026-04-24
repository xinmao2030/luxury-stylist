"use client";

import { useState, useMemo } from "react";
import type { FullStylingPlan, RecommendedItem } from "@/lib/types";
import { localStorageHelper } from "@/lib/utils";

interface ChallengeRecord {
  date: string;
  challengeIndex: number;
  completed: boolean;
}

const CHALLENGES = [
  { emoji: "⚪", title: "全白挑战", desc: "选择全白色系搭配", keywords: ["白", "white", "ivory", "cream"] },
  { emoji: "🔀", title: "品牌混搭", desc: "选择3个不同品牌组合", keywords: ["brand"] },
  { emoji: "✂️", title: "极简主义", desc: "只用3件单品完成搭配", keywords: ["简", "minimal", "basic"] },
  { emoji: "🎨", title: "色彩对比", desc: "选择互补色搭配", keywords: ["contrast", "complementary"] },
  { emoji: "👔", title: "经典回归", desc: "只选择经典款单品", keywords: ["经典", "classic", "timeless"] },
  { emoji: "💎", title: "配饰为王", desc: "以配饰为核心搭配", keywords: ["accessory", "配饰", "jewelry", "watch"] },
  { emoji: "🌊", title: "单色渐变", desc: "选择同色系不同深浅", keywords: ["gradient", "tone", "渐变"] },
  { emoji: "🏃", title: "运动奢华", desc: "休闲与奢侈混搭", keywords: ["sport", "casual", "运动", "休闲"] },
  { emoji: "📻", title: "复古风潮", desc: "选择复古风格单品", keywords: ["vintage", "retro", "复古"] },
  { emoji: "🌈", title: "大胆撞色", desc: "选择3种以上颜色", keywords: ["color", "bold", "撞色"] },
  { emoji: "🖤", title: "黑金搭配", desc: "只用黑色和金色", keywords: ["黑", "金", "black", "gold"] },
  { emoji: "🏖️", title: "度假风情", desc: "假装明天去海滩", keywords: ["vacation", "beach", "度假", "resort"] },
  { emoji: "💼", title: "面试必杀", desc: "打造最专业的形象", keywords: ["professional", "formal", "商务"] },
  { emoji: "❤️", title: "约会穿搭", desc: "精心准备约会造型", keywords: ["date", "romantic", "约会", "浪漫"] },
  { emoji: "☕", title: "周末休闲", desc: "最舒适的周末穿搭", keywords: ["weekend", "casual", "舒适"] },
  { emoji: "🌙", title: "夜色魅力", desc: "适合夜晚派对的装扮", keywords: ["night", "party", "evening", "晚"] },
  { emoji: "🌿", title: "自然之选", desc: "选择大地色系单品", keywords: ["earth", "natural", "棕", "绿", "beige"] },
  { emoji: "👑", title: "全身奢牌", desc: "头到脚都是顶级品牌", keywords: ["luxury", "premium", "顶级"] },
  { emoji: "🧥", title: "层次大师", desc: "展示完美的叠穿技巧", keywords: ["layer", "coat", "外套", "叠"] },
  { emoji: "🎀", title: "粉色梦境", desc: "以粉色为主调搭配", keywords: ["pink", "粉", "rose"] },
  { emoji: "🕶️", title: "全黑酷感", desc: "全身黑色的帅气搭配", keywords: ["黑", "black", "noir", "dark"] },
  { emoji: "🌸", title: "春日花园", desc: "选择花卉元素单品", keywords: ["floral", "花", "spring", "print"] },
  { emoji: "🎩", title: "绅士之道", desc: "打造英伦绅士风格", keywords: ["gentleman", "british", "英伦", "绅士"] },
  { emoji: "✨", title: "闪耀之夜", desc: "选择带有亮片或光泽的单品", keywords: ["shine", "glitter", "metallic", "亮"] },
  { emoji: "🧣", title: "冬日温暖", desc: "打造温暖又时髦的冬装", keywords: ["winter", "warm", "cashmere", "冬"] },
  { emoji: "🏛️", title: "艺术策展人", desc: "穿得像要去美术馆", keywords: ["art", "gallery", "artistic", "艺术"] },
  { emoji: "🌅", title: "日落色调", desc: "选择橙红暖色系单品", keywords: ["sunset", "orange", "red", "橙", "红"] },
  { emoji: "💫", title: "混搭高手", desc: "正装与休闲完美融合", keywords: ["mix", "smart casual", "混搭"] },
  { emoji: "🦋", title: "蓝色诱惑", desc: "以蓝色为主调搭配", keywords: ["blue", "蓝", "navy", "azure"] },
  { emoji: "🍷", title: "红毯之夜", desc: "打造走红毯的惊艳造型", keywords: ["gala", "red carpet", "红毯", "晚宴"] },
];

const storage = localStorageHelper<ChallengeRecord>("luxury-stylist-challenges");

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getAllItems(data: FullStylingPlan): RecommendedItem[] {
  return Object.values(data.recommendations).flatMap((r) => r.items);
}

function calcScore(selected: RecommendedItem[], challenge: (typeof CHALLENGES)[number]): number {
  if (selected.length < 2) return 0;
  let score = Math.min(selected.length, 5) * 20;
  const joined = selected.map((i) => `${i.itemName} ${i.color} ${i.brand} ${i.reason}`).join(" ").toLowerCase();
  const bonus = challenge.keywords.some((k) => joined.includes(k.toLowerCase())) ? 10 : 0;
  return Math.min(score + bonus, 100);
}

const FUN_MESSAGES = [
  "完美搭配！你就是行走的时尚杂志 📸",
  "今日穿搭冠军就是你！🏆",
  "造型师看了都说好！👏",
  "时尚品味拉满！继续保持 🔥",
];

export default function DailyChallenge({ data, onClose }: { data: FullStylingPlan; onClose: () => void }) {
  const challengeIndex = getDayOfYear() % 30;
  const challenge = CHALLENGES[challengeIndex];
  const allItems = useMemo(() => getAllItems(data), [data]);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const records = storage.load();
  const todayDone = records.some((r) => r.date === todayStr() && r.completed);

  const streak = useMemo(() => {
    const sorted = records.filter((r) => r.completed).map((r) => r.date).sort().reverse();
    if (sorted.length === 0) return 0;
    let count = 0;
    const d = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(d);
      expected.setDate(expected.getDate() - i);
      if (sorted[i] === expected.toISOString().slice(0, 10)) count++;
      else break;
    }
    return count;
  }, [records]);

  const pastBadges = records.filter((r) => r.completed && r.date !== todayStr()).slice(-10);

  function toggle(idx: number) {
    if (submitted || todayDone) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function handleSubmit() {
    const items = [...selected].map((i) => allItems[i]);
    const s = calcScore(items, challenge);
    setScore(s);
    setSubmitted(true);
    const updated = [...records.filter((r) => r.date !== todayStr()), { date: todayStr(), challengeIndex, completed: true }];
    storage.save(updated);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card-luxury relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-2xl text-[var(--noir-light)] hover:text-[var(--noir)]">&times;</button>

        <h2 className="mb-1 text-center text-xl font-bold text-[var(--noir)]">每日穿搭挑战</h2>
        <p className="mb-4 text-center text-sm text-[var(--noir-light)]">连续挑战 <span className="font-bold text-[var(--gold-dark)]">{streak}</span> 天</p>

        {/* Today's challenge */}
        <div className="mb-4 rounded-xl border-2 border-[var(--gold)] bg-[var(--cream)] p-4 text-center">
          <span className="text-3xl">{challenge.emoji}</span>
          <h3 className="mt-1 text-lg font-bold text-[var(--gold-dark)]">{challenge.title}</h3>
          <p className="text-sm text-[var(--noir-light)]">{challenge.desc}</p>
        </div>

        {/* Result */}
        {(submitted || todayDone) && (
          <div className="mb-4 rounded-xl bg-[var(--gold-light)] p-4 text-center">
            <p className="text-3xl font-bold text-[var(--gold-dark)]">{todayDone && !submitted ? "已完成" : `${score}分`}</p>
            <p className="mt-1 text-sm text-[var(--noir)]">{FUN_MESSAGES[score > 80 ? 0 : score > 60 ? 1 : score > 40 ? 2 : 3]}</p>
          </div>
        )}

        {/* Item selection */}
        {!todayDone && !submitted && (
          <>
            <p className="mb-2 text-xs font-medium text-[var(--noir-light)]">从推荐单品中选择搭配 (至少2件):</p>
            <div className="mb-4 max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-[var(--cream-dark)] p-2">
              {allItems.map((item, i) => (
                <label key={i} className={`flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm transition ${selected.has(i) ? "bg-[var(--gold-light)]" : "hover:bg-[var(--cream)]"}`}>
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="accent-[var(--gold)]" />
                  <span className="flex-1 truncate text-[var(--noir)]">
                    <b>{item.brand}</b> {item.itemName}
                  </span>
                  <span className="text-xs text-[var(--noir-light)]">{item.color}</span>
                </label>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={selected.size < 2}
              className="w-full rounded-xl bg-[var(--gold)] py-3 text-sm font-bold text-white transition hover:bg-[var(--gold-dark)] disabled:cursor-not-allowed disabled:opacity-40">
              提交挑战
            </button>
          </>
        )}

        {/* Past badges */}
        {pastBadges.length > 0 && (
          <div className="mt-4 border-t border-[var(--cream-dark)] pt-3">
            <p className="mb-2 text-xs font-medium text-[var(--noir-light)]">历史挑战</p>
            <div className="flex flex-wrap gap-1.5">
              {pastBadges.map((r) => (
                <span key={r.date} className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-xs text-[var(--gold-dark)]" title={CHALLENGES[r.challengeIndex]?.title}>
                  {CHALLENGES[r.challengeIndex]?.emoji} {r.date.slice(5)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
