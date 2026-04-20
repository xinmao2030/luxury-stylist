"use client";

import { useState, useEffect, useMemo } from "react";
import type { FullStylingPlan, StyleRecommendation, RecommendedItem, ImageResult } from "@/lib/types";
import { fetchImages } from "@/lib/client-utils";

const DAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const WORK_OCCASIONS = ["日常通勤", "商务会议", "办公室"];
const WEEKEND_OCCASIONS = ["休闲周末", "约会", "社交聚会", "艺术展览"];

interface OutfitDay {
  day: string;
  occasion: string;
  items: RecommendedItem[];
}

function pickItems(
  allItems: RecommendedItem[],
  usedSet: Set<string>,
  count: number
): RecommendedItem[] {
  const result: RecommendedItem[] = [];
  // Prefer items not yet used
  const unused = allItems.filter((it) => !usedSet.has(itemKey(it)));
  const pool = unused.length >= count ? unused : [...unused, ...allItems];

  for (const item of pool) {
    if (result.length >= count) break;
    const key = itemKey(item);
    if (!result.some((r) => itemKey(r) === key)) {
      result.push(item);
      usedSet.add(key);
    }
  }
  return result;
}

function itemKey(item: RecommendedItem): string {
  return `${item.brand}|${item.itemName}`;
}

function generateWeeklyOutfits(data: FullStylingPlan): OutfitDay[] {
  const recs = data.recommendations || {};
  const categories = (Object.values(recs) as StyleRecommendation[]).filter(
    (c) => c && c.items && c.items.length > 0
  );

  const byRole = (keywords: string[]) =>
    categories
      .filter((c) => keywords.some((k) => c.category?.includes(k)))
      .flatMap((c) => c.items);

  const tops = byRole(["上装", "Tops", "tops"]);
  const bottoms = byRole(["下装", "Bottoms", "bottoms"]);
  const outerwear = byRole(["外套", "Outerwear", "outerwear"]);
  const shoes = byRole(["鞋", "Shoes", "shoes"]);
  const bags = byRole(["包", "Bags", "bags"]);
  const accessories = byRole(["配饰", "Accessories", "accessories", "首饰", "手表"]);
  const dresses = byRole(["连衣裙", "Dresses", "dresses"]);

  const allItems = categories.flatMap((c) => c.items);
  if (allItems.length === 0) return [];

  const usedSet = new Set<string>();
  const days: OutfitDay[] = [];

  for (let i = 0; i < 7; i++) {
    const isWeekend = i >= 5;
    const occasions = isWeekend ? WEEKEND_OCCASIONS : WORK_OCCASIONS;
    const occasion = occasions[i % occasions.length];

    let dayItems: RecommendedItem[] = [];

    // For weekends, try to use dresses; for weekdays, top+bottom combos
    if (isWeekend && dresses.length > 0 && i % 2 === 1) {
      dayItems = pickItems(dresses, usedSet, 1);
      dayItems = [...dayItems, ...pickItems(shoes, usedSet, 1)];
      dayItems = [...dayItems, ...pickItems(bags.length > 0 ? bags : accessories, usedSet, 1)];
    } else {
      if (tops.length > 0) dayItems = [...dayItems, ...pickItems(tops, usedSet, 1)];
      if (bottoms.length > 0) dayItems = [...dayItems, ...pickItems(bottoms, usedSet, 1)];
      if (outerwear.length > 0 && !isWeekend) dayItems = [...dayItems, ...pickItems(outerwear, usedSet, 1)];
      if (shoes.length > 0) dayItems = [...dayItems, ...pickItems(shoes, usedSet, 1)];
    }

    // If we got too few items, supplement from all items
    if (dayItems.length < 3) {
      dayItems = [...dayItems, ...pickItems(allItems, usedSet, 3 - dayItems.length)];
    }

    days.push({ day: DAY_NAMES[i], occasion, items: dayItems.slice(0, 4) });
  }

  return days;
}

function SmallProductThumb({ item }: { item: RecommendedItem }) {
  const [img, setImg] = useState<ImageResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const q = `${item.brand} ${item.itemName} product`.trim();
    fetchImages(q, controller.signal)
      .then((imgs) => {
        if (imgs.length > 0) setImg(imgs[0]);
        else setError(true);
      })
      .catch((e) => { if (e.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [item]);

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--cream-dark)] flex-shrink-0">
        {img && !error ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.thumb || img.full}
            alt={item.itemName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--gold)] font-bold">
            {item.brand.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate">{item.brand}</p>
        <p className="text-xs text-gray-500 truncate">{item.itemName}</p>
      </div>
    </div>
  );
}

interface Props {
  data: FullStylingPlan;
  onClose: () => void;
}

export default function OutfitCalendar({ data, onClose }: Props) {
  const outfits = useMemo(() => generateWeeklyOutfits(data), [data]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--cream-dark)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">穿搭日历</h2>
            <p className="text-sm text-gray-500">基于您的方案生成的 7 天穿搭计划</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Calendar scroll */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-5">
          {outfits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">方案中暂无足够单品生成穿搭日历</p>
              <button onClick={onClose} className="mt-4 text-[var(--gold-dark)] hover:underline text-sm">关闭</button>
            </div>
          ) : (
            <div className="flex gap-4 min-w-max">
              {outfits.map((outfit, i) => (
                <div
                  key={i}
                  className={`card-luxury p-4 w-56 flex-shrink-0 ${
                    i >= 5 ? "bg-[var(--cream)]" : ""
                  }`}
                >
                  <div className="text-center mb-3">
                    <p className="text-lg font-bold">{outfit.day}</p>
                    <span className="inline-block px-2 py-0.5 bg-[var(--gold-light)] text-[var(--gold-dark)] rounded-full text-xs mt-1">
                      {outfit.occasion}
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--cream-dark)]">
                    {outfit.items.map((item, j) => (
                      <SmallProductThumb key={j} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
