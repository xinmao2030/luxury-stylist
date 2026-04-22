"use client";

import { useState, useMemo } from "react";
import type {
  FullStylingPlan,
  StyleRecommendation,
  RecommendedItem,
} from "@/lib/types";

/* ── Constants ────────────────────────────────────────────────── */

type Duration = 3 | 5 | 7 | 10;
type TripType = "business" | "vacation" | "city" | "beach" | "ski";

const DURATIONS: { value: Duration; label: string }[] = [
  { value: 3, label: "3天" },
  { value: 5, label: "5天" },
  { value: 7, label: "7天" },
  { value: 10, label: "10天" },
];

const TRIP_TYPES: { value: TripType; label: string }[] = [
  { value: "business", label: "商务出差" },
  { value: "vacation", label: "休闲度假" },
  { value: "city", label: "城市探索" },
  { value: "beach", label: "海滨度假" },
  { value: "ski", label: "滑雪旅行" },
];

const ITEM_RANGE: Record<Duration, [number, number]> = {
  3: [4, 6],
  5: [6, 9],
  7: [8, 12],
  10: [10, 15],
};

const CATEGORY_PRIORITY: Record<TripType, string[]> = {
  business: ["tops", "bottoms", "outerwear", "watches", "bags", "shoes"],
  vacation: ["dresses", "accessories", "fragrance", "shoes", "bags", "tops"],
  city: [
    "tops",
    "bottoms",
    "dresses",
    "shoes",
    "bags",
    "accessories",
    "outerwear",
  ],
  beach: [
    "dresses",
    "accessories",
    "shoes",
    "tops",
    "fragrance",
    "bags",
  ],
  ski: ["outerwear", "tops", "bottoms", "accessories", "shoes", "bags"],
};

const GROUP_MAP: Record<string, string> = {
  tops: "日装",
  bottoms: "日装",
  dresses: "日装",
  outerwear: "日装",
  shoes: "鞋包",
  bags: "鞋包",
  accessories: "配饰",
  watches: "配饰",
  fragrance: "配饰",
  hair: "配饰",
  makeup: "配饰",
};

const DISPLAY_GROUPS = ["日装", "晚装", "配饰", "鞋包"];

const PACKING_TIPS: Record<TripType, string> = {
  business:
    "商务出差建议：选择不易皱的面料，带一套可日夜切换的造型。深色系为主，配一条丝巾或口袋巾可迅速提升正式感。",
  vacation:
    "休闲度假建议：以轻薄透气面料为主，选择可叠穿的单品。一条连衣裙+一双舒适凉鞋即可应对大多数场合。",
  city:
    "城市探索建议：舒适的步行鞋是关键。选择百搭的基础色单品，通过配饰变换风格，背一个轻便但有格调的斜挎包。",
  beach:
    "海滨度假建议：带防晒面料的罩衫，首饰选防水材质。一个大容量草编包和一双时髦的凉拖是海滩标配。",
  ski:
    "滑雪旅行建议：内层排汗、中层保暖、外层防风防水。高品质羊绒衫比笨重毛衣更轻便保暖，après-ski 造型也同样重要。",
};

/* ── Helpers ──────────────────────────────────────────────────── */

function itemKey(item: RecommendedItem): string {
  return `${item.brand}|${item.itemName}`;
}

/** Pick a colour dot based on the item's color description */
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
  return "#b8860b"; // default gold-ish
}

interface CapsuleResult {
  items: { item: RecommendedItem; sourceCategory: string }[];
  outfits: { name: string; pieces: RecommendedItem[] }[];
}

function generateCapsule(
  data: FullStylingPlan,
  tripType: TripType,
  duration: Duration
): CapsuleResult {
  const recs = data.recommendations || ({} as FullStylingPlan["recommendations"]);
  const priority = CATEGORY_PRIORITY[tripType];
  const [min, max] = ITEM_RANGE[duration];
  const target = Math.round((min + max) / 2);

  // Collect items by category
  const pool: { item: RecommendedItem; sourceCategory: string }[] = [];
  const used = new Set<string>();

  for (const catKey of priority) {
    const cat = recs[catKey as keyof typeof recs] as StyleRecommendation | undefined;
    if (!cat?.items) continue;
    for (const item of cat.items) {
      const key = itemKey(item);
      if (!used.has(key)) {
        pool.push({ item, sourceCategory: catKey });
        used.add(key);
      }
    }
  }

  // If we still need more, pull from remaining categories
  const allCatKeys = Object.keys(recs) as (keyof typeof recs)[];
  for (const catKey of allCatKeys) {
    if (priority.includes(catKey)) continue;
    const cat = recs[catKey] as StyleRecommendation | undefined;
    if (!cat?.items) continue;
    for (const item of cat.items) {
      const key = itemKey(item);
      if (!used.has(key)) {
        pool.push({ item, sourceCategory: catKey });
        used.add(key);
      }
    }
  }

  const selected = pool.slice(0, Math.min(target, pool.length));

  // Generate outfit combos
  const outfits: { name: string; pieces: RecommendedItem[] }[] = [];
  const dayItems = selected.filter(
    (s) =>
      s.sourceCategory === "tops" ||
      s.sourceCategory === "bottoms" ||
      s.sourceCategory === "dresses" ||
      s.sourceCategory === "outerwear"
  );
  const accessoryItems = selected.filter(
    (s) =>
      s.sourceCategory === "accessories" ||
      s.sourceCategory === "watches" ||
      s.sourceCategory === "fragrance"
  );
  const shoeBagItems = selected.filter(
    (s) => s.sourceCategory === "shoes" || s.sourceCategory === "bags"
  );

  const outfitNames =
    tripType === "business"
      ? ["商务日间造型", "正式晚宴造型", "轻松周末造型"]
      : tripType === "vacation"
        ? ["海边漫步造型", "度假晚餐造型", "日间观光造型"]
        : tripType === "city"
          ? ["街头探索造型", "美术馆造型", "夜晚社交造型"]
          : tripType === "beach"
            ? ["海滩休闲造型", "海边晚餐造型", "日间逛街造型"]
            : ["滑雪装备造型", "après-ski 造型", "冬季漫步造型"];

  for (let i = 0; i < Math.min(3, Math.ceil(selected.length / 3)); i++) {
    const pieces: RecommendedItem[] = [];
    if (dayItems[i]) pieces.push(dayItems[i].item);
    if (dayItems[i + 3]) pieces.push(dayItems[i + 3].item);
    if (shoeBagItems[i]) pieces.push(shoeBagItems[i].item);
    if (accessoryItems[i]) pieces.push(accessoryItems[i].item);
    if (pieces.length >= 2) {
      outfits.push({ name: outfitNames[i] || `搭配 ${i + 1}`, pieces });
    }
  }

  return { items: selected, outfits };
}

/* ── Grouped display helper ──────────────────────────────────── */

function groupItems(
  items: { item: RecommendedItem; sourceCategory: string }[]
): Record<string, RecommendedItem[]> {
  const groups: Record<string, RecommendedItem[]> = {};
  for (const g of DISPLAY_GROUPS) groups[g] = [];

  for (const { item, sourceCategory } of items) {
    const group = GROUP_MAP[sourceCategory] || "配饰";
    groups[group].push(item);
  }

  // Distribute some "日装" items to "晚装" if we have enough
  if (groups["日装"].length > 3) {
    const moved = groups["日装"].splice(-Math.floor(groups["日装"].length / 3));
    groups["晚装"].push(...moved);
  }

  return groups;
}

/* ── Component ────────────────────────────────────────────────── */

interface Props {
  data: FullStylingPlan;
  onClose: () => void;
}

export default function TravelCapsule({ data, onClose }: Props) {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState<Duration>(5);
  const [tripType, setTripType] = useState<TripType>("city");
  const [generated, setGenerated] = useState(false);

  const capsule = useMemo(() => {
    if (!generated) return null;
    try {
      return generateCapsule(data, tripType, duration);
    } catch (e) {
      console.error("TravelCapsule generation error:", e);
      return null;
    }
  }, [generated, data, tripType, duration]);

  const grouped = useMemo(() => {
    if (!capsule) return null;
    return groupItems(capsule.items);
  }, [capsule]);

  const handleGenerate = () => {
    setGenerated(true);
  };

  const handleReset = () => {
    setGenerated(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--cream-dark)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-wide">
              旅行胶囊衣橱
            </h2>
            <p className="text-sm text-gray-500">
              基于您的风格方案，智能规划高效行李清单
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Form ─────────────────────────────────── */}
          {!generated && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Destination */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  目的地
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="例如：巴黎、东京、三亚..."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  行程天数
                </label>
                <div className="flex gap-3 flex-wrap">
                  {DURATIONS.map((d) => (
                    <label
                      key={d.value}
                      className={`px-5 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all ${
                        duration === d.value
                          ? "bg-[var(--gold)] text-white border-[var(--gold)] shadow-md"
                          : "border-[var(--cream-dark)] text-gray-600 hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="duration"
                        value={d.value}
                        checked={duration === d.value}
                        onChange={() => setDuration(d.value)}
                        className="sr-only"
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Trip Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  旅行类型
                </label>
                <div className="flex gap-3 flex-wrap">
                  {TRIP_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className={`px-5 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all ${
                        tripType === t.value
                          ? "bg-[var(--gold)] text-white border-[var(--gold)] shadow-md"
                          : "border-[var(--cream-dark)] text-gray-600 hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tripType"
                        value={t.value}
                        checked={tripType === t.value}
                        onChange={() => setTripType(t.value)}
                        className="sr-only"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  className="w-full py-3.5 rounded-xl bg-[var(--gold)] text-white font-semibold text-sm tracking-wide hover:bg-[var(--gold-dark)] transition-colors shadow-lg"
                >
                  生成行李方案
                </button>
              </div>
            </div>
          )}

          {/* ── Results ──────────────────────────────── */}
          {generated && capsule && grouped && (
            <div className="space-y-6">
              {/* Summary header */}
              <div className="text-center pb-4 border-b border-[var(--cream-dark)]">
                <h3 className="text-base font-bold tracking-wide">
                  行李清单
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                  {destination && (
                    <span className="inline-block px-3 py-1 bg-[var(--gold-light)] text-[var(--gold-dark)] rounded-full text-xs font-medium">
                      {destination}
                    </span>
                  )}
                  <span className="inline-block px-3 py-1 bg-[var(--gold-light)] text-[var(--gold-dark)] rounded-full text-xs font-medium">
                    {DURATIONS.find((d) => d.value === duration)?.label}
                  </span>
                  <span className="inline-block px-3 py-1 bg-[var(--gold-light)] text-[var(--gold-dark)] rounded-full text-xs font-medium">
                    {TRIP_TYPES.find((t) => t.value === tripType)?.label}
                  </span>
                  <span className="inline-block px-3 py-1 bg-[var(--cream-dark)] text-gray-600 rounded-full text-xs">
                    共 {capsule.items.length} 件单品
                  </span>
                </div>
              </div>

              {/* Grouped items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DISPLAY_GROUPS.map((groupName) => {
                  const items = grouped[groupName];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={groupName} className="card-luxury p-4">
                      <h4 className="text-sm font-bold text-[var(--gold-dark)] mb-3 flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]"
                          aria-hidden
                        />
                        {groupName}
                        <span className="text-xs font-normal text-gray-400 ml-auto">
                          {items.length} 件
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 py-2 border-b border-[var(--cream-dark)] last:border-b-0"
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-200"
                              style={{ backgroundColor: colorDot(item.color) }}
                              title={item.color}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-800 truncate">
                                {item.brand}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {item.itemName}
                              </p>
                            </div>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {item.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Outfit combos */}
              {capsule.outfits.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]"
                      aria-hidden
                    />
                    搭配组合
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {capsule.outfits.map((outfit, i) => (
                      <div
                        key={i}
                        className="card-luxury p-4 bg-[var(--cream)]/20"
                      >
                        <p className="text-xs font-bold text-[var(--gold-dark)] mb-2">
                          {outfit.name}
                        </p>
                        <div className="space-y-1.5">
                          {outfit.pieces.map((piece, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: colorDot(piece.color),
                                }}
                              />
                              <p className="text-xs text-gray-600 truncate">
                                <span className="font-medium text-gray-800">
                                  {piece.brand}
                                </span>{" "}
                                {piece.itemName}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Packing tip */}
              <div className="card-luxury p-4 bg-[var(--cream)]/30 border-l-4 border-[var(--gold)]">
                <p className="text-xs font-semibold text-[var(--gold-dark)] mb-1">
                  打包贴士
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {PACKING_TIPS[tripType]}
                </p>
              </div>

              {/* Reset button */}
              <div className="text-center pt-2 pb-1">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl border border-[var(--gold)] text-[var(--gold-dark)] text-sm font-medium hover:bg-[var(--gold-light)] transition-colors"
                >
                  重新规划
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {generated && !capsule && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                方案中暂无足够单品生成行李清单
              </p>
              <button
                onClick={handleReset}
                className="mt-4 text-[var(--gold-dark)] hover:underline text-sm"
              >
                返回
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
