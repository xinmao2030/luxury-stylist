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

function DetailProductCard({ item }: { item: RecommendedItem }) {
  const [img, setImg] = useState<ImageResult | null>(null);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState(false);

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

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    item.searchQuery || `${item.brand} ${item.itemName} ${item.color}`
  )}`;
  const shopUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(
    `${item.brand} ${item.itemName}`
  )}`;

  return (
    <>
      <div className="card-luxury p-4">
        <div className="flex gap-4">
          <div
            className="w-24 h-24 rounded-xl overflow-hidden bg-[var(--cream-dark)] flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[var(--gold)] transition-all"
            onClick={() => img && !error && setZoomed(true)}
          >
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
              <div className="w-full h-full flex items-center justify-center text-lg text-[var(--gold)] font-bold">
                {item.brand.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{item.brand}</p>
            <p className="text-sm text-gray-700 truncate">{item.itemName}</p>
            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">系列:</span> {item.collection}</p>
              <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">颜色:</span> {item.color}</p>
              <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">价格:</span> {item.price}</p>
            </div>
            {item.reason && <p className="text-xs text-gray-500 italic mt-2">{item.reason}</p>}
            <div className="flex gap-2 mt-3">
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-[var(--cream-dark)] text-[var(--gold-dark)] rounded-lg text-xs font-medium hover:bg-[var(--gold-light)] transition-colors"
              >
                搜索详情
              </a>
              <a
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-[var(--gold)] text-white rounded-lg text-xs font-medium hover:bg-[var(--gold-dark)] transition-colors"
              >
                查找购买
              </a>
            </div>
          </div>
        </div>
      </div>

      {zoomed && img && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-6" onClick={() => setZoomed(false)}>
          <div className="relative max-w-2xl max-h-[85vh]">
            <button
              onClick={() => setZoomed(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-lg hover:bg-gray-100 text-lg z-10"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.full || img.thumb}
              alt={item.itemName}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <p className="text-white text-center text-sm mt-3">{item.brand} · {item.itemName}</p>
          </div>
        </div>
      )}
    </>
  );
}

function DayDetail({ outfit, onClose }: { outfit: OutfitDay; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">{outfit.day}</h3>
              <span className="inline-block px-3 py-1 bg-[var(--gold-light)] text-[var(--gold-dark)] rounded-full text-xs mt-1">
                {outfit.occasion}
              </span>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          <div className="space-y-4">
            {outfit.items.map((item, j) => (
              <DetailProductCard key={j} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OutfitCalendar({ data, onClose }: Props) {
  const outfits = useMemo(() => {
    try {
      return generateWeeklyOutfits(data);
    } catch (e) {
      console.error("OutfitCalendar generateWeeklyOutfits error:", e);
      return [];
    }
  }, [data]);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--cream-dark)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">穿搭日历</h2>
            <p className="text-sm text-gray-500">基于您的方案生成的 7 天穿搭计划 · 点击查看详情</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {outfits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">方案中暂无足够单品生成穿搭日历</p>
              <button onClick={onClose} className="mt-4 text-[var(--gold-dark)] hover:underline text-sm">关闭</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {outfits.map((outfit, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`card-luxury p-3 cursor-pointer hover:ring-2 hover:ring-[var(--gold)] transition-all ${
                    i >= 5 ? "bg-[var(--cream)]" : ""
                  }`}
                >
                  <div className="text-center mb-2">
                    <p className="text-base font-bold">{outfit.day}</p>
                    <span className="inline-block px-2 py-0.5 bg-[var(--gold-light)] text-[var(--gold-dark)] rounded-full text-[10px] mt-1">
                      {outfit.occasion}
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--cream-dark)]">
                    {outfit.items.map((item, j) => (
                      <SmallProductThumb key={j} item={item} />
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--gold)] text-center mt-2">点击查看详情 →</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    {selectedDay !== null && outfits[selectedDay] && (
      <DayDetail outfit={outfits[selectedDay]} onClose={() => setSelectedDay(null)} />
    )}
    </>
  );
}
