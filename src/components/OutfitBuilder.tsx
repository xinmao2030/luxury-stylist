"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { FullStylingPlan, StyleRecommendation, RecommendedItem, ImageResult } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";
import { localStorageHelper } from "@/lib/utils";
import { fetchImages } from "@/lib/client-utils";
import type { WardrobeItem } from "./MyWardrobe";

const { load: loadWardrobe } = localStorageHelper<WardrobeItem>("luxury-stylist-wardrobe");

function wardrobeToRecommended(w: WardrobeItem): RecommendedItem {
  return {
    brand: w.brand || "我的衣橱",
    collection: "",
    itemName: w.name,
    price: "已拥有",
    priceUSD: 0,
    color: w.color,
    size: "",
    reason: w.notes || "来自我的衣橱",
    imageDescription: "",
    purchaseChannel: "",
    searchQuery: `${w.brand} ${w.name}`,
    _wardrobeImageData: w.imageData,
  } as RecommendedItem & { _wardrobeImageData?: string };
}

interface SelectedOutfit {
  [category: string]: RecommendedItem[];
}

const CATEGORY_ORDER = [
  "hair", "makeup", "tops", "bottoms", "dresses", "outerwear",
  "bags", "shoes", "accessories", "fragrance", "watches",
];

const CATEGORY_LABELS: Record<string, string> = {
  hair: "发型", makeup: "妆容", tops: "上装", bottoms: "下装",
  dresses: "连衣裙/套装", outerwear: "外套", bags: "包袋",
  shoes: "鞋履", accessories: "配饰", fragrance: "香水", watches: "腕表",
};

function itemKey(item: RecommendedItem): string {
  return `${item.brand}|${item.itemName}`;
}

function MiniThumb({ item }: { item: RecommendedItem }) {
  const wardrobeImg = (item as RecommendedItem & { _wardrobeImageData?: string })._wardrobeImageData;
  const [img, setImg] = useState<ImageResult | null>(null);

  useEffect(() => {
    if (wardrobeImg) return;
    const controller = new AbortController();
    fetchImages(`${item.brand} ${item.itemName} product`, controller.signal)
      .then((imgs) => { if (imgs.length > 0) setImg(imgs[0]); })
      .catch(() => {});
    return () => controller.abort();
  }, [item, wardrobeImg]);

  const src = wardrobeImg || (img ? (img.thumb || img.full) : null);

  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--cream-dark)] flex-shrink-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={item.itemName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--gold)] font-bold">
          {item.brand.charAt(0)}
        </div>
      )}
    </div>
  );
}

function OutfitPreview({ selected }: { selected: SelectedOutfit }) {
  const allItems = useMemo(
    () => CATEGORY_ORDER.flatMap((cat) => (selected[cat] || []).map((item) => ({ cat, item }))),
    [selected]
  );

  if (allItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-4xl mb-3 opacity-40">👗</p>
        <p className="text-sm">从左侧各分类中选择单品，构建您的整体搭配</p>
      </div>
    );
  }

  const totalUSD = allItems.reduce((sum, { item }) => sum + (item.priceUSD || 0), 0);

  const descParts: string[] = [];
  for (const { cat, item } of allItems) {
    descParts.push(`${CATEGORY_LABELS[cat] || cat}: ${item.brand} ${item.itemName} (${item.color})`);
  }

  const overallStyle = useMemo(() => {
    const brands = [...new Set(allItems.map(({ item }) => item.brand))];
    const colors = [...new Set(allItems.map(({ item }) => item.color).filter(Boolean))];
    const brandText = brands.length <= 3 ? brands.join(" × ") : `${brands.slice(0, 3).join(" × ")} 等${brands.length}个品牌`;
    const colorText = colors.length > 0 ? colors.slice(0, 4).join("、") : "";

    return `${brandText} 混搭风格${colorText ? `，以${colorText}为主色调` : ""}，整体造型${
      allItems.length >= 5 ? "完整度高，从头到脚统一协调" : "基础框架已成型，可继续添加单品完善"
    }`;
  }, [allItems]);

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
        {allItems.map(({ cat, item }) => (
          <div key={itemKey(item)} className="text-center">
            <MiniThumb item={item} />
            <p className="text-[10px] text-gray-500 mt-1 truncate">{CATEGORY_LABELS[cat]}</p>
            <p className="text-[10px] font-semibold truncate">{item.brand}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--cream)] rounded-xl p-4 mb-3">
        <p className="text-xs font-bold text-[var(--gold-dark)] mb-2">AI 整体效果评估</p>
        <p className="text-sm text-gray-700 leading-relaxed">{overallStyle}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">已选 {allItems.length} 件单品</span>
        {totalUSD > 0 && (
          <span className="font-bold text-[var(--gold-dark)]">
            总计约 ${totalUSD.toLocaleString()}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {descParts.map((desc, i) => (
          <p key={i} className="text-xs text-gray-600">• {desc}</p>
        ))}
      </div>
    </div>
  );
}

interface Props {
  data: FullStylingPlan;
  onClose: () => void;
}

export default function OutfitBuilder({ data, onClose }: Props) {
  const categories = useMemo(() => {
    const recs = data.recommendations || {};
    return CATEGORY_ORDER
      .filter((key) => {
        const r = recs[key as keyof typeof recs];
        return r && r.items && r.items.length > 0;
      })
      .map((key) => ({
        key,
        rec: recs[key as keyof typeof recs] as StyleRecommendation,
      }));
  }, [data]);

  const [selected, setSelected] = useState<SelectedOutfit>({});
  const [activeCat, setActiveCat] = useState(categories[0]?.key || "");
  const [source, setSource] = useState<"recommend" | "wardrobe">("recommend");

  const wardrobeItems = useMemo(() => {
    try { return loadWardrobe(); } catch { return []; }
  }, []);

  const wardrobeByCat = useMemo(() => {
    const map: Record<string, RecommendedItem[]> = {};
    for (const w of wardrobeItems) {
      if (!map[w.category]) map[w.category] = [];
      map[w.category].push(wardrobeToRecommended(w));
    }
    return map;
  }, [wardrobeItems]);

  const toggleItem = useCallback((cat: string, item: RecommendedItem) => {
    setSelected((prev) => {
      const current = prev[cat] || [];
      const key = itemKey(item);
      const exists = current.some((i) => itemKey(i) === key);
      if (exists) {
        const updated = current.filter((i) => itemKey(i) !== key);
        return { ...prev, [cat]: updated };
      }
      return { ...prev, [cat]: [...current, item] };
    });
  }, []);

  const isSelected = useCallback(
    (cat: string, item: RecommendedItem) =>
      (selected[cat] || []).some((i) => itemKey(i) === itemKey(item)),
    [selected]
  );

  const clearAll = useCallback(() => setSelected({}), []);

  const autoSelect = useCallback(() => {
    const auto: SelectedOutfit = {};
    for (const { key, rec } of categories) {
      if (rec.items.length > 0) {
        auto[key] = [rec.items[0]];
      }
    }
    setSelected(auto);
  }, [categories]);

  const activeRec = categories.find((c) => c.key === activeCat)?.rec;
  const activeItems = source === "wardrobe"
    ? (wardrobeByCat[activeCat] || [])
    : (activeRec?.items || []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--cream-dark)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">AI 穿搭模拟器</h2>
            <p className="text-sm text-gray-500">多选单品，构建整体搭配效果 · 支持混搭自有衣橱</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={autoSelect}
              className="px-4 py-1.5 bg-[var(--gold-light)] text-[var(--gold-dark)] rounded-lg text-sm font-medium hover:bg-[var(--gold)] hover:text-white transition-colors"
            >
              自动推荐
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              清空
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Category tabs + items */}
          <div className="flex-1 flex overflow-hidden">
            {/* Category sidebar */}
            <div className="w-28 border-r border-[var(--cream-dark)] overflow-y-auto flex-shrink-0">
              {categories.map(({ key, rec }) => {
                const count = (selected[key] || []).length;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCat(key)}
                    className={`w-full text-left px-3 py-3 text-sm border-b border-[var(--cream-dark)] transition-colors relative ${
                      activeCat === key
                        ? "bg-[var(--gold-light)]/30 text-[var(--gold-dark)] font-semibold"
                        : "hover:bg-[var(--cream)] text-gray-600"
                    }`}
                  >
                    <span className="text-base mr-1">{CATEGORY_ICONS[key] || "✨"}</span>
                    <span className="text-xs">{CATEGORY_LABELS[key]}</span>
                    {count > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--gold)] text-white text-[10px] flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Items grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Source toggle */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setSource("recommend")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    source === "recommend"
                      ? "bg-[var(--gold)] text-white"
                      : "bg-[var(--cream-dark)] text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  AI 推荐
                </button>
                <button
                  onClick={() => setSource("wardrobe")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    source === "wardrobe"
                      ? "bg-[var(--gold)] text-white"
                      : "bg-[var(--cream-dark)] text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  我的衣橱 {wardrobeItems.length > 0 && `(${wardrobeItems.length})`}
                </button>
                <span className="flex-1" />
                <p className="text-xs text-gray-400">
                  {CATEGORY_LABELS[activeCat]} · {activeItems.length} 件可选
                </p>
              </div>

              {activeItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2 opacity-40">{source === "wardrobe" ? "📷" : "✨"}</p>
                  <p className="text-sm">
                    {source === "wardrobe"
                      ? "该分类暂无衣橱单品，前往「我的衣橱」上传"
                      : "该分类暂无推荐"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeItems.map((item, i) => {
                      const sel = isSelected(activeCat, item);
                      return (
                        <div
                          key={`${item.brand}-${i}`}
                          onClick={() => toggleItem(activeCat, item)}
                          className={`card-luxury p-3 cursor-pointer transition-all ${
                            sel
                              ? "ring-2 ring-[var(--gold)] bg-[var(--gold-light)]/10"
                              : "hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <MiniThumb item={item} />
                              {sel && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--gold)] text-white text-xs flex items-center justify-center">
                                  ✓
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{item.brand}</p>
                              <p className="text-xs text-gray-600 truncate">{item.itemName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[var(--gold-dark)] font-medium">{item.price}</span>
                                {item.color && (
                                  <span className="text-[10px] text-gray-400">{item.color}</span>
                                )}
                              </div>
                              {item.reason && (
                                <p className="text-[10px] text-gray-500 mt-1 italic">{item.reason}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              )}
              {source === "recommend" && activeRec?.stylingTips && (
                <div className="mt-4 bg-[var(--cream)] border-l-4 border-[var(--gold)] p-3 rounded-r-lg">
                  <p className="text-xs text-gray-700">{activeRec.stylingTips}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Outfit preview */}
          <div className="w-80 border-l border-[var(--cream-dark)] overflow-y-auto p-5 bg-[var(--cream)]/50 flex-shrink-0">
            <h3 className="text-sm font-bold text-[var(--gold-dark)] uppercase tracking-widest mb-4">
              整体搭配预览
            </h3>
            <OutfitPreview selected={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
