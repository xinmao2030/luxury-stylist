"use client";

import { useState, useMemo } from "react";
import type {
  FullStylingPlan,
  StyleRecommendation,
  RecommendedItem,
} from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";

/* ── Types ───────────────────────────────────────────────────── */

type OccasionKey =
  | "wedding"
  | "blacktie"
  | "business"
  | "date"
  | "weekend"
  | "gallery"
  | "beach"
  | "holiday"
  | "athleisure"
  | "interview";

interface OccasionTemplate {
  key: OccasionKey;
  icon: string;
  label: string;
  subtitle: string;
  requiredCategories: (keyof FullStylingPlan["recommendations"])[];
  keywords: string[];
  palette: string[];
  tips: string[];
  dos: string[];
  donts: string[];
}

interface Props {
  data: FullStylingPlan;
  onClose: () => void;
}

/* ── Occasion Templates ──────────────────────────────────────── */

const OCCASIONS: OccasionTemplate[] = [
  {
    key: "wedding",
    icon: "💒",
    label: "婚礼宾客",
    subtitle: "Wedding Guest",
    requiredCategories: ["dresses", "tops", "bottoms", "shoes", "bags", "accessories"],
    keywords: ["elegant", "优雅", "礼服", "丝绸", "silk", "lace", "蕾丝", "婚礼", "正式", "formal", "chiffon"],
    palette: ["柔粉", "香槟金", "浅蓝", "薰衣草紫", "鼠尾草绿"],
    tips: [
      "选择面料有质感的连衣裙或套装，长度在膝盖附近最为得体",
      "搭配精致手拿包，容量刚好放下手机和补妆用品",
      "选择舒适但优雅的高跟鞋，考虑到可能需要长时间站立",
    ],
    dos: ["提前确认dress code", "选择不抢新娘风头的颜色", "佩戴精致珠宝点缀"],
    donts: ["避免全白色着装", "避免过于暴露的款式", "避免过于休闲的面料"],
  },
  {
    key: "blacktie",
    icon: "🎩",
    label: "正式晚宴",
    subtitle: "Black Tie / Gala",
    requiredCategories: ["dresses", "shoes", "bags", "accessories", "fragrance", "watches"],
    keywords: ["formal", "gala", "晚宴", "礼服", "黑色", "black", "luxury", "奢华", "丝绒", "velvet", "sequin"],
    palette: ["经典黑", "深红", "午夜蓝", "翡翠绿", "香槟金"],
    tips: [
      "长礼服或精致的鸡尾酒裙是首选，面料要有光泽感",
      "高级珠宝或腕表是提升整体质感的关键",
      "选择与礼服相衬的晚宴包，水晶或金属材质最佳",
    ],
    dos: ["选择有垂坠感的高级面料", "搭配statement珠宝", "提前试穿确保完美合身"],
    donts: ["避免过短的裙长", "避免过于花哨的印花", "避免运动鞋或休闲鞋"],
  },
  {
    key: "business",
    icon: "💼",
    label: "商务会议",
    subtitle: "Business Meeting",
    requiredCategories: ["tops", "bottoms", "outerwear", "shoes", "bags", "watches"],
    keywords: ["business", "商务", "professional", "职业", "西装", "blazer", "tailored", "正装", "简约"],
    palette: ["藏青", "炭灰", "驼色", "白色", "酒红"],
    tips: [
      "剪裁合身的西装外套是核心单品，注意肩线和袖长",
      "选择质感好的皮质公文包，展现专业形象",
      "腕表是商务场合最得体的配饰，选择经典款式",
    ],
    dos: ["注重面料质感和剪裁", "保持整体色调和谐统一", "选择低调但有质感的配饰"],
    donts: ["避免过多颜色混搭", "避免过于休闲的面料", "避免夸张的logo展示"],
  },
  {
    key: "date",
    icon: "🍷",
    label: "约会之夜",
    subtitle: "Date Night",
    requiredCategories: ["dresses", "tops", "shoes", "bags", "accessories", "fragrance"],
    keywords: ["romantic", "浪漫", "约会", "性感", "sexy", "feminine", "优美", "柔美", "date", "晚餐"],
    palette: ["红色", "玫瑰粉", "黑色", "酒红", "裸色"],
    tips: [
      "选择能展现个人魅力的单品，但不要过于暴露",
      "香水是约会的秘密武器，选择温暖的花香调或东方调",
      "精致的耳环或项链能为整体造型画龙点睛",
    ],
    dos: ["选择让自己自信的着装", "搭配适合夜晚的精致妆容", "喷一款迷人的香水"],
    donts: ["避免全新未穿过的高跟鞋", "避免过多品牌logo", "避免让自己不舒服的款式"],
  },
  {
    key: "weekend",
    icon: "✈️",
    label: "周末度假",
    subtitle: "Weekend Getaway",
    requiredCategories: ["tops", "bottoms", "dresses", "shoes", "bags", "accessories"],
    keywords: ["casual", "休闲", "度假", "舒适", "comfortable", "relaxed", "weekend", "轻松", "旅行"],
    palette: ["米白", "浅蓝", "橄榄绿", "焦糖色", "牛仔蓝"],
    tips: [
      "选择舒适但不失质感的单品，注重面料的亲肤性",
      "一个容量适中的时髦手袋既实用又美观",
      "平底鞋或舒适的低跟鞋是周末出行的最佳选择",
    ],
    dos: ["注重舒适度和实用性", "选择易于混搭的基础色", "带一件可叠穿的外套"],
    donts: ["避免过于正式的着装", "避免难以打理的面料", "避免携带过多行李"],
  },
  {
    key: "gallery",
    icon: "🎨",
    label: "艺术展览",
    subtitle: "Art Gallery / Exhibition",
    requiredCategories: ["tops", "bottoms", "dresses", "shoes", "bags", "accessories"],
    keywords: ["artistic", "艺术", "avant-garde", "前卫", "creative", "创意", "gallery", "展览", "文化", "minimal"],
    palette: ["黑白", "建筑灰", "奶油白", "深墨绿", "铁锈红"],
    tips: [
      "选择有设计感的单品，展现个人艺术品味",
      "黑白配色永远是艺术场合的安全选择",
      "建筑感的配饰或设计师款眼镜能成为亮点",
    ],
    dos: ["展现个人风格和审美", "选择有设计感的剪裁", "可以大胆尝试小众设计师品牌"],
    donts: ["避免过于花哨的装扮", "避免运动休闲风", "避免过度堆叠配饰"],
  },
  {
    key: "beach",
    icon: "🏖️",
    label: "海滨度假",
    subtitle: "Beach Vacation",
    requiredCategories: ["dresses", "tops", "accessories", "shoes", "bags", "fragrance"],
    keywords: ["beach", "海滨", "度假", "夏天", "summer", "tropical", "热带", "轻盈", "防晒", "resort"],
    palette: ["海洋蓝", "珊瑚色", "白色", "金色", "热带绿"],
    tips: [
      "轻薄透气的面料是关键，亚麻和棉质最为舒适",
      "一条多功能的连衣裙可以从海滩过渡到晚餐",
      "草编包和凉鞋是海滨度假的经典搭配",
    ],
    dos: ["选择轻薄透气的面料", "带防晒配件（帽子、墨镜）", "选择防水材质的首饰"],
    donts: ["避免厚重的面料和深色系", "避免精致但脆弱的配饰", "避免需要特殊打理的单品"],
  },
  {
    key: "holiday",
    icon: "🎄",
    label: "节日派对",
    subtitle: "Holiday Party",
    requiredCategories: ["dresses", "tops", "bottoms", "shoes", "accessories", "fragrance"],
    keywords: ["festive", "节日", "party", "派对", "闪亮", "sparkle", "glitter", "庆典", "圣诞", "新年"],
    palette: ["红色", "金色", "翡翠绿", "银色", "宝蓝"],
    tips: [
      "节日派对是展现闪亮元素的最佳时机",
      "亮片、金属面料或天鹅绒都是绝佳选择",
      "红色和金色是节日最经典的颜色组合",
    ],
    dos: ["大胆使用亮片或金属元素", "搭配节日感的配饰", "选择喜庆的颜色"],
    donts: ["避免过于素淡的颜色", "避免过于正式的商务装", "避免穿着过于随意"],
  },
  {
    key: "athleisure",
    icon: "🏃",
    label: "运动休闲",
    subtitle: "Athleisure",
    requiredCategories: ["tops", "bottoms", "outerwear", "shoes", "bags", "accessories"],
    keywords: ["sporty", "运动", "athleisure", "休闲", "casual", "comfortable", "active", "健身", "户外"],
    palette: ["黑色", "灰色", "白色", "军绿", "深蓝"],
    tips: [
      "选择高端运动品牌的设计师联名款，兼顾功能与时尚",
      "合身的运动外套可以轻松过渡到日常场合",
      "一双好看的运动鞋是整体造型的灵魂",
    ],
    dos: ["注重面料的功能性", "选择合身的剪裁", "混搭运动和日常单品"],
    donts: ["避免过于宽松的款式", "避免穿着旧旧的运动服", "避免全身同色运动套装"],
  },
  {
    key: "interview",
    icon: "📸",
    label: "重要面试",
    subtitle: "Job Interview",
    requiredCategories: ["tops", "bottoms", "outerwear", "shoes", "bags", "watches"],
    keywords: ["professional", "职业", "面试", "interview", "formal", "正式", "conservative", "干练", "稳重"],
    palette: ["藏青", "深灰", "白色", "米色", "淡蓝"],
    tips: [
      "选择剪裁精良的套装，展现专业和自信",
      "颜色以中性色为主，避免过于鲜艳的色彩",
      "一只好看的公文包或手提包能加分不少",
    ],
    dos: ["提前试穿确保舒适合身", "选择得体大方的颜色", "注意鞋子的干净整洁"],
    donts: ["避免过多首饰", "避免过于时尚前卫的款式", "避免浓烈的香水"],
  },
];

/* ── Helpers ──────────────────────────────────────────────────── */

function itemKey(item: RecommendedItem): string {
  return `${item.brand}|${item.itemName}`;
}

function colorDot(color: string): string {
  const c = color.toLowerCase();
  if (c.includes("黑") || c.includes("black") || c.includes("noir")) return "#1a1a1a";
  if (c.includes("白") || c.includes("white") || c.includes("blanc")) return "#f5f0eb";
  if (c.includes("红") || c.includes("red") || c.includes("rouge")) return "#b91c1c";
  if (c.includes("蓝") || c.includes("blue") || c.includes("bleu")) return "#1e40af";
  if (c.includes("绿") || c.includes("green") || c.includes("vert")) return "#15803d";
  if (c.includes("棕") || c.includes("brown") || c.includes("tan") || c.includes("驼")) return "#92400e";
  if (c.includes("灰") || c.includes("grey") || c.includes("gray")) return "#6b7280";
  if (c.includes("粉") || c.includes("pink") || c.includes("rose")) return "#db2777";
  if (c.includes("金") || c.includes("gold")) return "#ca8a04";
  if (c.includes("银") || c.includes("silver")) return "#9ca3af";
  if (c.includes("紫") || c.includes("purple")) return "#7c3aed";
  if (c.includes("橙") || c.includes("orange")) return "#ea580c";
  if (c.includes("米") || c.includes("beige") || c.includes("cream")) return "#d4c9a8";
  if (c.includes("藏青") || c.includes("navy")) return "#1e3a5f";
  return "#b8860b";
}

/** Score how well an item matches occasion keywords */
function matchScore(item: RecommendedItem, keywords: string[]): number {
  const haystack = `${item.itemName} ${item.reason} ${item.color} ${item.brand} ${item.collection}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw.toLowerCase())) score += 1;
  }
  return score;
}

/** For a given occasion, pick the best items from recommendations */
function buildCapsule(
  data: FullStylingPlan,
  occasion: OccasionTemplate
): Map<string, { selected: RecommendedItem; alternatives: RecommendedItem[] }> {
  const recs = data.recommendations || ({} as FullStylingPlan["recommendations"]);
  const result = new Map<string, { selected: RecommendedItem; alternatives: RecommendedItem[] }>();

  for (const catKey of occasion.requiredCategories) {
    const cat = recs[catKey] as StyleRecommendation | undefined;
    if (!cat?.items || cat.items.length === 0) continue;

    // Score and sort items by relevance to occasion
    const scored = cat.items.map((item) => ({
      item,
      score: matchScore(item, occasion.keywords),
    }));
    scored.sort((a, b) => b.score - a.score);

    result.set(catKey, {
      selected: scored[0].item,
      alternatives: scored.slice(1).map((s) => s.item),
    });
  }

  return result;
}

function formatPrice(price: string | number): string {
  if (typeof price === "number") return `$${price.toLocaleString()}`;
  return price;
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    hair: "发型",
    makeup: "妆容",
    tops: "上装",
    bottoms: "下装",
    dresses: "裙装",
    outerwear: "外套",
    bags: "包袋",
    shoes: "鞋履",
    accessories: "配饰",
    fragrance: "香水",
    watches: "腕表",
  };
  return labels[cat] || cat;
}

/* ── Component ───────────────────────────────────────────────── */

export default function OccasionCapsule({ data, onClose }: Props) {
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionKey | null>(null);
  const [swaps, setSwaps] = useState<Map<string, number>>(new Map());
  const [swapOpen, setSwapOpen] = useState<string | null>(null);

  const occasion = useMemo(
    () => OCCASIONS.find((o) => o.key === selectedOccasion) ?? null,
    [selectedOccasion]
  );

  const capsule = useMemo(() => {
    if (!occasion) return null;
    return buildCapsule(data, occasion);
  }, [data, occasion]);

  // Apply swaps
  const activeCapsule = useMemo(() => {
    if (!capsule) return null;
    const result = new Map(capsule);
    for (const [cat, altIndex] of swaps) {
      const entry = result.get(cat);
      if (!entry || altIndex >= entry.alternatives.length) continue;
      const newSelected = entry.alternatives[altIndex];
      const newAlternatives = [entry.selected, ...entry.alternatives.filter((_, i) => i !== altIndex)];
      result.set(cat, { selected: newSelected, alternatives: newAlternatives });
    }
    return result;
  }, [capsule, swaps]);

  const totalCost = useMemo(() => {
    if (!activeCapsule) return 0;
    let sum = 0;
    for (const [, entry] of activeCapsule) {
      sum += entry.selected.priceUSD || 0;
    }
    return sum;
  }, [activeCapsule]);

  function handleSwap(cat: string, altIndex: number) {
    setSwaps((prev) => {
      const next = new Map(prev);
      next.set(cat, altIndex);
      return next;
    });
    setSwapOpen(null);
  }

  function handleBack() {
    setSelectedOccasion(null);
    setSwaps(new Map());
    setSwapOpen(null);
  }

  /* ── Render: Occasion Selection Grid ───────────────────────── */

  if (!selectedOccasion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl mx-4"
          style={{
            background: "linear-gradient(145deg, var(--noir) 0%, var(--noir-light) 100%)",
            border: "1px solid var(--gold-dark)",
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-8 pt-8 pb-4" style={{ background: "var(--noir)" }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="section-title text-2xl" style={{ color: "var(--gold)" }}>
                场景胶囊衣橱
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: "var(--gold)" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="text-sm" style={{ color: "var(--cream-dark)" }}>
              选择您的场合，获取从您的专属推荐中精选的完美搭配方案
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-8 pt-4">
            {OCCASIONS.map((occ) => (
              <button
                key={occ.key}
                onClick={() => setSelectedOccasion(occ.key)}
                className="group relative flex flex-col items-center gap-3 p-5 rounded-xl transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(160deg, rgba(184,134,11,0.08) 0%, rgba(184,134,11,0.02) 100%)",
                  border: "1px solid rgba(184,134,11,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--gold)";
                  e.currentTarget.style.background =
                    "linear-gradient(160deg, rgba(184,134,11,0.15) 0%, rgba(184,134,11,0.05) 100%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(184,134,11,0.2)";
                  e.currentTarget.style.background =
                    "linear-gradient(160deg, rgba(184,134,11,0.08) 0%, rgba(184,134,11,0.02) 100%)";
                }}
              >
                <span className="text-3xl">{occ.icon}</span>
                <div className="text-center">
                  <div className="text-sm font-medium" style={{ color: "var(--cream)" }}>
                    {occ.label}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--cream-dark)" }}>
                    {occ.subtitle}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Render: Capsule View ──────────────────────────────────── */

  if (!occasion || !activeCapsule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl mx-4"
        style={{
          background: "linear-gradient(145deg, var(--noir) 0%, var(--noir-light) 100%)",
          border: "1px solid var(--gold-dark)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-8 pt-8 pb-4"
          style={{ background: "var(--noir)", borderBottom: "1px solid rgba(184,134,11,0.15)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: "var(--gold)", border: "1px solid rgba(184,134,11,0.3)" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div>
                <h2 className="section-title text-xl flex items-center gap-2" style={{ color: "var(--gold)" }}>
                  <span>{occasion.icon}</span>
                  {occasion.label}
                  <span className="text-xs font-normal" style={{ color: "var(--cream-dark)" }}>
                    {occasion.subtitle}
                  </span>
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "var(--gold)" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs" style={{ color: "var(--cream-dark)" }}>
              推荐色彩:
            </span>
            <div className="flex gap-2">
              {occasion.palette.map((c) => (
                <span
                  key={c}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(184,134,11,0.1)",
                    color: "var(--gold-light)",
                    border: "1px solid rgba(184,134,11,0.2)",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Total cost bar */}
          <div
            className="flex items-center justify-between px-6 py-4 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(184,134,11,0.12) 0%, rgba(184,134,11,0.04) 100%)",
              border: "1px solid rgba(184,134,11,0.2)",
            }}
          >
            <div>
              <div className="text-xs" style={{ color: "var(--cream-dark)" }}>
                胶囊衣橱预估总价
              </div>
              <div className="text-2xl font-light mt-1" style={{ color: "var(--gold)" }}>
                ${totalCost.toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-right" style={{ color: "var(--cream-dark)" }}>
              <div>{activeCapsule.size} 个品类</div>
              <div className="mt-1">
                {Array.from(activeCapsule.values()).reduce(
                  (n) => n + 1,
                  0
                )}{" "}
                件单品
              </div>
            </div>
          </div>

          {/* Items by category */}
          <div className="space-y-4">
            {Array.from(activeCapsule.entries()).map(([cat, entry]) => (
              <div
                key={cat}
                className="card-luxury rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(184,134,11,0.15)" }}
              >
                <div className="flex items-stretch">
                  {/* Item thumbnail / brand initial */}
                  <div
                    className="w-24 sm:w-32 flex-shrink-0 flex flex-col items-center justify-center gap-2 p-4"
                    style={{
                      background: "linear-gradient(180deg, rgba(184,134,11,0.1) 0%, rgba(184,134,11,0.03) 100%)",
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                      style={{
                        background: "linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)",
                        color: "var(--noir)",
                      }}
                    >
                      {entry.selected.brand.charAt(0)}
                    </div>
                    <span className="text-lg">{CATEGORY_ICONS[cat] || "🏷️"}</span>
                  </div>

                  {/* Item details */}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gold)" }}>
                          {categoryLabel(cat)}
                        </div>
                        <div className="text-sm font-medium truncate" style={{ color: "var(--cream)" }}>
                          {entry.selected.brand}
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: "var(--cream-dark)" }}>
                          {entry.selected.itemName}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{
                              backgroundColor: colorDot(entry.selected.color),
                              borderColor: "rgba(184,134,11,0.3)",
                            }}
                          />
                          <span className="text-[10px]" style={{ color: "var(--cream-dark)" }}>
                            {entry.selected.color}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium" style={{ color: "var(--gold)" }}>
                          {formatPrice(entry.selected.price)}
                        </div>
                        {/* Swap button */}
                        {entry.alternatives.length > 0 && (
                          <button
                            onClick={() => setSwapOpen(swapOpen === cat ? null : cat)}
                            className="text-[10px] mt-2 px-2 py-1 rounded transition-colors"
                            style={{
                              color: "var(--gold-light)",
                              border: "1px solid rgba(184,134,11,0.25)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(184,134,11,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {swapOpen === cat ? "收起" : `换一件 (${entry.alternatives.length})`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Match reason */}
                    <div
                      className="text-[11px] mt-2 line-clamp-2 leading-relaxed"
                      style={{ color: "var(--cream-dark)" }}
                    >
                      {entry.selected.reason}
                    </div>
                  </div>
                </div>

                {/* Swap panel */}
                {swapOpen === cat && entry.alternatives.length > 0 && (
                  <div
                    className="px-4 pb-4"
                    style={{ borderTop: "1px solid rgba(184,134,11,0.1)" }}
                  >
                    <div className="text-[10px] py-2" style={{ color: "var(--cream-dark)" }}>
                      可替换选项:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {entry.alternatives.map((alt, i) => (
                        <button
                          key={itemKey(alt)}
                          onClick={() => handleSwap(cat, i)}
                          className="flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                          style={{
                            background: "rgba(184,134,11,0.05)",
                            border: "1px solid rgba(184,134,11,0.12)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--gold)";
                            e.currentTarget.style.background = "rgba(184,134,11,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(184,134,11,0.12)";
                            e.currentTarget.style.background = "rgba(184,134,11,0.05)";
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{
                              background: "rgba(184,134,11,0.2)",
                              color: "var(--gold)",
                            }}
                          >
                            {alt.brand.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate" style={{ color: "var(--cream)" }}>
                              {alt.brand} - {alt.itemName}
                            </div>
                            <div className="text-[10px] flex items-center gap-2 mt-0.5" style={{ color: "var(--cream-dark)" }}>
                              <span>{alt.color}</span>
                              <span style={{ color: "var(--gold-light)" }}>{formatPrice(alt.price)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Styling Tips */}
          <div
            className="rounded-xl p-6"
            style={{
              background: "linear-gradient(135deg, rgba(184,134,11,0.08) 0%, rgba(184,134,11,0.02) 100%)",
              border: "1px solid rgba(184,134,11,0.15)",
            }}
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--gold)" }}>
              <span>✨</span> 搭配要点
            </h3>
            <div className="space-y-3">
              {occasion.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                    style={{ background: "rgba(184,134,11,0.2)", color: "var(--gold)" }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--cream-dark)" }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Do's and Don'ts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Do's */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "rgba(21,128,61,0.06)",
                border: "1px solid rgba(21,128,61,0.2)",
              }}
            >
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "#4ade80" }}>
                <span>✅</span> 推荐
              </h4>
              <ul className="space-y-2">
                {occasion.dos.map((d, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--cream-dark)" }}>
                    <span style={{ color: "#4ade80" }}>+</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Don'ts */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "rgba(185,28,28,0.06)",
                border: "1px solid rgba(185,28,28,0.2)",
              }}
            >
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "#f87171" }}>
                <span>❌</span> 注意事项
              </h4>
              <ul className="space-y-2">
                {occasion.donts.map((d, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--cream-dark)" }}>
                    <span style={{ color: "#f87171" }}>-</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
