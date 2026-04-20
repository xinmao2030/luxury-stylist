"use client";

import { useState, useEffect, useCallback } from "react";
import OutfitCalendar from "@/components/OutfitCalendar";
import type { FullStylingPlan, StyleRecommendation, RecommendedItem, UserProfile } from "@/lib/types";
import {
  generateFavoriteId,
  loadFavorites,
  toggleFavorite,
  type FavoriteItem,
} from "@/components/FavoritesView";
import StylistChat from "./StylistChat";

type CurrencyCode = "USD" | "CNY" | "EUR" | "GBP" | "JPY" | "HKD";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  CNY: "\u00a5",
  EUR: "\u20ac",
  GBP: "\u00a3",
  JPY: "\u00a5",
  HKD: "HK$",
};

function formatConvertedPrice(priceUSD: number, rate: number, currency: CurrencyCode): string {
  const converted = Math.round(priceUSD * rate);
  const symbol = CURRENCY_SYMBOLS[currency];
  if (currency === "JPY") {
    return `${symbol}${converted.toLocaleString()}`;
  }
  return `${symbol}${converted.toLocaleString()}`;
}

const CATEGORY_ICONS: Record<string, string> = {
  hair: "💇",
  makeup: "💄",
  tops: "👔",
  bottoms: "👖",
  dresses: "👗",
  outerwear: "🧥",
  bags: "👜",
  shoes: "👠",
  accessories: "💍",
  fragrance: "🌸",
  watches: "⌚",
};

function buildSearchQuery(item: RecommendedItem) {
  return `${item.brand} ${item.collection} ${item.itemName}`.replace(/\s+/g, " ").trim();
}

function buildGoogleShoppingUrl(item: RecommendedItem) {
  const q = buildSearchQuery(item);
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=shop`;
}

function buildGoogleImageUrl(item: RecommendedItem) {
  const q = buildSearchQuery(item);
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`;
}

interface ImageResult {
  full: string;
  thumb: string;
}

function ProductImage({ item }: { item: RecommendedItem }) {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const q = buildSearchQuery(item);
    fetch(`/api/image-search?q=${encodeURIComponent(q + " product official")}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0) {
          setImages(data.images);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [item]);

  if (error || images.length === 0) {
    return (
      <a
        href={buildGoogleImageUrl(item)}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-52 bg-gradient-to-br from-[var(--cream-dark)] to-[var(--cream)] flex items-center justify-center group"
      >
        <div className="text-center">
          <p className="text-4xl font-bold text-[var(--gold)] opacity-30 group-hover:opacity-60 transition-opacity">
            {item.brand.charAt(0)}
          </p>
          <p className="text-xs text-gray-400 mt-2 group-hover:text-[var(--gold)] transition-colors">
            点击查看产品图
          </p>
        </div>
      </a>
    );
  }

  const currentImg = images[activeIdx];

  return (
    <>
      <div
        className="relative w-full h-52 overflow-hidden bg-white cursor-pointer group"
        onClick={() => setShowFull(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImg.thumb || currentImg.full}
          alt={`${item.brand} ${item.itemName}`}
          className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (activeIdx < images.length - 1) {
              setActiveIdx((i) => i + 1);
              setLoaded(false);
            } else {
              setError(true);
            }
          }}
          referrerPolicy="no-referrer"
        />
        {!loaded && !error && (
          <div className="absolute inset-0 loading-shimmer" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full">
            点击放大
          </span>
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setLoaded(false); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeIdx ? "bg-[var(--gold)] scale-125" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen lightbox */}
      {showFull && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowFull(false)}
        >
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImg.full}
              alt={`${item.brand} ${item.itemName}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <div className="text-center mt-3">
              <p className="text-white text-sm font-medium">{item.brand} — {item.itemName}</p>
              <p className="text-gray-400 text-xs mt-1">{item.price}</p>
            </div>
            <button
              onClick={() => setShowFull(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-black shadow-lg"
            >
              ×
            </button>
            {images.length > 1 && (
              <div className="absolute top-1/2 -translate-y-1/2 -left-12 flex flex-col gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeIdx ? "border-[var(--gold)]" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.thumb || img.full}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function FavoriteButton({ item, category }: { item: RecommendedItem; category: string }) {
  const id = generateFavoriteId(item.brand, item.itemName);
  const [faved, setFaved] = useState(() => loadFavorites().some((f) => f.id === id));

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    const favItem: FavoriteItem = {
      id,
      brand: item.brand,
      collection: item.collection,
      itemName: item.itemName,
      price: item.price,
      color: item.color,
      category,
      savedAt: new Date().toISOString(),
    };
    const nowFaved = toggleFavorite(favItem);
    setFaved(nowFaved);
  }

  return (
    <button
      onClick={handleToggle}
      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
      title={faved ? "取消收藏" : "收藏"}
    >
      {faved ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#e53e3e" stroke="#e53e3e" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
    </button>
  );
}

function ItemCard({ item, category, convertedPrice }: { item: RecommendedItem; category: string; convertedPrice?: string }) {
  return (
    <div className="card-luxury overflow-hidden flex flex-col">
      {/* Product Image */}
      <div className="relative">
        <FavoriteButton item={item} category={category} />
        <ProductImage item={item} />
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-lg">{item.brand}</p>
            <p className="text-sm text-gray-500">{item.collection}</p>
          </div>
          <div className="text-right ml-2">
            <span className="text-[var(--gold-dark)] font-semibold text-lg whitespace-nowrap block">
              {item.price}
            </span>
            {convertedPrice && (
              <span className="text-gray-400 text-xs whitespace-nowrap block">
                (~{convertedPrice})
              </span>
            )}
          </div>
        </div>
        <p className="font-medium">{item.itemName}</p>
        {item.color && item.color !== "不适用" && (
          <p className="text-sm">
            <span className="text-gray-500">推荐色: </span>
            {item.color}
          </p>
        )}
        {item.size && item.size !== "不适用" && (
          <p className="text-sm">
            <span className="text-gray-500">建议尺码: </span>
            {item.size}
          </p>
        )}
        <p className="text-sm text-gray-600 leading-relaxed">{item.reason}</p>

        {/* Action buttons */}
        <div className="mt-auto pt-3 border-t border-[var(--cream-dark)] flex gap-2">
          <a
            href={buildGoogleShoppingUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-2 bg-[var(--gold)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            去购买
          </a>
          <a
            href={buildGoogleImageUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-2 bg-[var(--cream-dark)] text-[var(--noir)] rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            更多图片
          </a>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  catKey,
  rec,
  displayCurrency,
  exchangeRates,
}: {
  catKey: string;
  rec: StyleRecommendation;
  displayCurrency?: CurrencyCode;
  exchangeRates?: Record<string, number>;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left mb-4 group"
      >
        <span className="text-2xl">{CATEGORY_ICONS[catKey] || "✨"}</span>
        <h3 className="text-xl font-bold flex-1">{rec.category}</h3>
        <span className="text-gray-400 group-hover:text-[var(--gold)] transition-colors text-xl">
          {expanded ? "−" : "+"}
        </span>
      </button>
      {expanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
            {rec.items.map((item, i) => {
              let converted: string | undefined;
              if (displayCurrency && displayCurrency !== "USD" && exchangeRates && item.priceUSD > 0) {
                const rate = exchangeRates[displayCurrency];
                if (rate) {
                  converted = formatConvertedPrice(item.priceUSD, rate, displayCurrency);
                }
              }
              return (
                <ItemCard key={`${item.brand}-${i}`} item={item} category={catKey} convertedPrice={converted} />
              );
            })}
          </div>
          {rec.stylingTips && (
            <div className="bg-[var(--cream)] border-l-4 border-[var(--gold)] p-4 rounded-r-lg">
              <p className="text-sm font-medium text-[var(--gold-dark)] mb-1">
                搭配建议
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {rec.stylingTips}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StyleMoodboard({ data }: { data: FullStylingPlan }) {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewImg, setViewImg] = useState<ImageResult | null>(null);

  useEffect(() => {
    const queries = buildMoodboardQueries(data);
    setLoading(true);

    Promise.all(
      queries.map((q) =>
        fetch(`/api/image-search?q=${encodeURIComponent(q)}`)
          .then((r) => r.json())
          .then((d) => (d.images || []) as ImageResult[])
          .catch(() => [] as ImageResult[])
      )
    ).then((results) => {
      const all: ImageResult[] = [];
      const seen = new Set<string>();
      for (const group of results) {
        for (const img of group) {
          if (!seen.has(img.thumb) && all.length < 16) {
            seen.add(img.thumb);
            all.push(img);
          }
        }
      }
      setImages(all);
      setLoading(false);
    });
  }, [data]);

  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🎨</span> 整体形象参考
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-48 loading-shimmer rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
        <span className="text-2xl">🎨</span> 整体形象参考
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        基于您的风格方向和推荐单品搭配的整体造型灵感，共 {images.length} 张参考
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative h-52 rounded-lg overflow-hidden bg-white cursor-pointer group card-luxury"
            onClick={() => setViewImg(img)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumb || img.full}
              alt={`Style reference ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute bottom-2 right-2 text-white text-xs bg-black/40 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              #{i + 1}
            </span>
          </div>
        ))}
      </div>

      {viewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setViewImg(null)}
        >
          <div className="relative max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewImg.full}
              alt="Style reference"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setViewImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-black shadow-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildMoodboardQueries(data: FullStylingPlan): string[] {
  const queries: string[] = [];
  const style = data.styleDirection || "";

  queries.push(`${style} luxury outfit look`);
  queries.push(`${style} fashion editorial styling`);

  const recs = data.recommendations || {};
  const categories = Object.values(recs) as StyleRecommendation[];
  for (const cat of categories) {
    if (!cat?.items?.length) continue;
    for (const item of cat.items.slice(0, 1)) {
      queries.push(`${item.brand} ${item.collection} outfit styling`);
    }
    if (queries.length >= 8) break;
  }

  queries.push(`luxury fashion ${style} street style`);
  queries.push(`${style} total look runway`);

  return queries.slice(0, 10);
}

interface Props {
  data: FullStylingPlan;
  onBack: () => void;
  profile?: UserProfile;
}

const CURRENCY_OPTIONS: CurrencyCode[] = ["USD", "CNY", "EUR", "GBP", "JPY", "HKD"];

export default function ResultsView({ data, onBack, profile }: Props) {
  const categories = Object.entries(data.recommendations || {}) as [
    string,
    StyleRecommendation
  ][];

  const defaultCurrency = (profile?.currency as CurrencyCode) || "USD";
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => {
        if (d.rates) setExchangeRates(d.rates);
      })
      .catch(() => {});
  }, []);

  const handleShare = useCallback(() => {
    const allItems = categories.flatMap(([, rec]) => rec?.items || []);
    const topItems = allItems.slice(0, 5);

    const lines: string[] = [
      "LUXURY STYLIST - AI 奢侈品私人形象方案",
      "━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      `形象评估: ${data.profileSummary || ""}`,
      `风格方向: ${data.styleDirection || ""}`,
      `色彩分析: ${data.colorAnalysis || ""}`,
      "",
      "推荐单品 TOP 5:",
      ...topItems.map(
        (item, i) =>
          `${i + 1}. ${item.brand} - ${item.itemName} (${item.price})`
      ),
      "",
      `预算参考: ${data.totalBudgetEstimate || ""}`,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━",
      "由 LUXURY STYLIST AI 生成",
    ];

    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  }, [data, categories]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--noir)] text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          已复制到剪贴板
        </div>
      )}

      {/* Header */}
      <div className="luxury-gradient text-white rounded-2xl p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-3xl font-bold gold-text">您的专属形象方案</h2>
          {/* Header Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleShare}
              className="px-4 py-1.5 border border-[var(--gold-light)] text-[var(--gold-light)] rounded-lg text-sm hover:bg-[var(--gold-light)] hover:text-[var(--noir)] transition-all"
            >
              分享
            </button>
            <label className="text-xs text-gray-400">货币:</label>
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as CurrencyCode)}
              className="bg-white/10 text-white border border-white/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[var(--gold)]"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c} className="text-black">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[var(--gold-light)] text-xs uppercase tracking-widest mb-2">
              形象评估
            </p>
            <p className="text-gray-200 text-sm leading-relaxed">
              {data.profileSummary}
            </p>
          </div>
          <div>
            <p className="text-[var(--gold-light)] text-xs uppercase tracking-widest mb-2">
              色彩分析
            </p>
            <p className="text-gray-200 text-sm leading-relaxed">
              {data.colorAnalysis}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card-luxury p-5">
          <p className="section-title">体型分析</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.bodyAnalysis}
          </p>
        </div>
        <div className="card-luxury p-5">
          <p className="section-title">风格方向</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.styleDirection}
          </p>
        </div>
        <div className="card-luxury p-5">
          <p className="section-title">预算规划</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.totalBudgetEstimate}
          </p>
        </div>
      </div>

      {/* Seasonal Note */}
      {data.seasonalNotes && (
        <div className="bg-[var(--gold-light)] bg-opacity-30 border border-[var(--gold)] rounded-xl p-5 mb-8">
          <p className="font-medium text-[var(--gold-dark)] mb-1">
            当季趋势提示
          </p>
          <p className="text-sm text-gray-700">{data.seasonalNotes}</p>
        </div>
      )}

      {/* Recommendations */}
      <div>
        {categories.map(([key, rec]) =>
          rec && rec.items && rec.items.length > 0 ? (
            <CategorySection
              key={key}
              catKey={key}
              rec={rec}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates || undefined}
            />
          ) : null
        )}
      </div>

      {/* Style Moodboard */}
      <div className="mt-12 pt-8 border-t-2 border-[var(--gold-light)]">
        <StyleMoodboard data={data} />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-12 mb-8 print:hidden flex-wrap">
        <button onClick={onBack} className="btn-gold">
          返回首页
        </button>
        <button
          onClick={() => setShowCalendar(true)}
          className="px-8 py-3 border-2 border-[var(--gold)] text-[var(--gold-dark)] rounded-lg font-semibold hover:bg-[var(--gold)] hover:text-white transition-all"
        >
          穿搭日历
        </button>
        <button
          onClick={() => window.print()}
          className="px-8 py-3 border-2 border-[var(--gold)] text-[var(--gold-dark)] rounded-lg font-semibold hover:bg-[var(--gold)] hover:text-white transition-all"
        >
          导出PDF
        </button>
      </div>

      {/* Outfit Calendar Modal */}
      {showCalendar && (
        <OutfitCalendar data={data} onClose={() => setShowCalendar(false)} />
      )}

      {/* Stylist Chat */}
      <StylistChat plan={data} />
    </div>
  );
}
