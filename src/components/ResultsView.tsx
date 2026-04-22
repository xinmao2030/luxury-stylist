"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import OutfitCalendar from "@/components/OutfitCalendar";
import ProductImageShared from "@/components/ProductImage";
import type { FullStylingPlan, StyleRecommendation, RecommendedItem, UserProfile, ImageResult } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";
import { buildSearchQuery, buildGoogleShoppingUrl, buildGoogleImageUrl, buildPlatformUrl } from "@/lib/utils";
import { fetchImages } from "@/lib/client-utils";
import {
  generateFavoriteId,
  loadFavorites,
  toggleFavorite,
  type FavoriteItem,
} from "@/components/FavoritesView";
import StylistChat from "./StylistChat";
import CostPerWear from "./CostPerWear";
import TravelCapsule from "./TravelCapsule";
import ColorScience from "./ColorScience";
import OutfitBuilder from "./OutfitBuilder";
import SmartPurchase from "./SmartPurchase";

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
  return `${CURRENCY_SYMBOLS[currency]}${converted.toLocaleString()}`;
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
    setFaved(toggleFavorite(favItem));
  }

  return (
    <button
      onClick={handleToggle}
      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
      title={faved ? "取消收藏" : "收藏"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={faved ? "#e53e3e" : "none"} stroke={faved ? "#e53e3e" : "#999"} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

function ItemCard({ item, category, convertedPrice }: { item: RecommendedItem; category: string; convertedPrice?: string }) {
  const query = useMemo(() => buildSearchQuery(item), [item]);
  const [showChannels, setShowChannels] = useState(false);
  const [showSmartPurchase, setShowSmartPurchase] = useState(false);
  const channels = item.purchaseChannels || [];
  const domesticChannels = channels.filter((c) => c.region === "domestic");
  const internationalChannels = channels.filter((c) => c.region === "international");

  return (
    <div className="card-luxury overflow-hidden flex flex-col">
      <div className="relative">
        <FavoriteButton item={item} category={category} />
        <ProductImageShared
          query={query}
          alt={`${item.brand} ${item.itemName}`}
          brandInitial={item.brand.charAt(0)}
        />
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

        <div className="mt-auto pt-3 border-t border-[var(--cream-dark)]">
          {channels.length > 0 ? (
            <>
              <button
                onClick={() => setShowChannels(!showChannels)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[var(--gold)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity mb-2"
              >
                <span>购买渠道 ({channels.length})</span>
                <span>{showChannels ? "−" : "+"}</span>
              </button>
              {showChannels && (
                <div className="space-y-2">
                  {domesticChannels.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--gold-dark)] uppercase tracking-wider mb-1">国内渠道</p>
                      {domesticChannels.map((ch, i) => (
                        <a
                          key={i}
                          href={buildPlatformUrl(ch.platform, item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-[var(--cream)] transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                            <span className="font-medium group-hover:text-[var(--gold-dark)]">{ch.platform}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{ch.advantage}</span>
                            <span className="font-semibold text-[var(--gold-dark)] whitespace-nowrap">{ch.estimatedPrice}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                  {internationalChannels.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--gold-dark)] uppercase tracking-wider mb-1">国际渠道</p>
                      {internationalChannels.map((ch, i) => (
                        <a
                          key={i}
                          href={buildPlatformUrl(ch.platform, item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-[var(--cream)] transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                            <span className="font-medium group-hover:text-[var(--gold-dark)]">{ch.platform}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{ch.advantage}</span>
                            <span className="font-semibold text-[var(--gold-dark)] whitespace-nowrap">{ch.estimatedPrice}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <a
                  href={buildGoogleShoppingUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-1.5 bg-[var(--cream-dark)] text-[var(--noir)] rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  比价搜索
                </a>
                <a
                  href={buildGoogleImageUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-1.5 bg-[var(--cream-dark)] text-[var(--noir)] rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  更多图片
                </a>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
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
          )}
          <button
            onClick={() => setShowSmartPurchase(true)}
            className="w-full mt-2 px-3 py-2 bg-[var(--noir)] text-[var(--gold-light)] rounded-lg text-sm font-medium hover:bg-[var(--noir-light)] transition-colors"
          >
            智能比价
          </button>
        </div>
      </div>
      {showSmartPurchase && (
        <SmartPurchase item={item} onClose={() => setShowSmartPurchase(false)} />
      )}
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
                if (rate) converted = formatConvertedPrice(item.priceUSD, rate, displayCurrency);
              }
              return (
                <ItemCard key={`${item.brand}-${i}`} item={item} category={catKey} convertedPrice={converted} />
              );
            })}
          </div>
          {rec.stylingTips && (
            <div className="bg-[var(--cream)] border-l-4 border-[var(--gold)] p-4 rounded-r-lg">
              <p className="text-sm font-medium text-[var(--gold-dark)] mb-1">搭配建议</p>
              <p className="text-sm text-gray-700 leading-relaxed">{rec.stylingTips}</p>
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
    const controller = new AbortController();
    const queries = buildMoodboardQueries(data);

    Promise.all(
      queries.map((q) =>
        fetchImages(q, controller.signal).catch(() => [] as ImageResult[])
      )
    ).then((results) => {
      if (controller.signal.aborted) return;
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

    return () => controller.abort();
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
        <span className="text-2xl">🎨</span> 推荐单品实拍参考
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        基于方案推荐的具体品牌和款式搜索的实拍图，共 {images.length} 张参考
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
  const recs = data.recommendations || {};
  const allCats = (Object.values(recs) as StyleRecommendation[]).filter(
    (c) => c && c.items && c.items.length > 0
  );

  // Use actual recommended items for specific lookbook images
  for (const cat of allCats) {
    for (const item of cat.items) {
      queries.push(`${item.brand} ${item.itemName} ${item.color || ""} lookbook`.trim());
      if (queries.length >= 12) break;
    }
    if (queries.length >= 12) break;
  }

  // Add a few combination outfit queries based on top brands
  const brands = [...new Set(allCats.flatMap((c) => c.items.map((i) => i.brand)))].slice(0, 3);
  if (brands.length >= 2) {
    queries.push(`${brands[0]} ${brands[1]} outfit combination`);
  }

  const style = data.styleDirection || "";
  if (style) {
    queries.push(`${style} complete outfit street style`);
  }

  return queries.slice(0, 12);
}

interface Props {
  data: FullStylingPlan;
  onBack: () => void;
  profile?: UserProfile;
}

const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: "$ USD 美元",
  CNY: "¥ CNY 人民币",
  EUR: "€ EUR 欧元",
  GBP: "£ GBP 英镑",
  JPY: "¥ JPY 日元",
  HKD: "HK$ HKD 港币",
};

const CURRENCY_OPTIONS: CurrencyCode[] = ["USD", "CNY", "EUR", "GBP", "JPY", "HKD"];

export default function ResultsView({ data, onBack, profile }: Props) {
  const categories = useMemo(
    () => Object.entries(data.recommendations || {}) as [string, StyleRecommendation][],
    [data]
  );

  const defaultCurrency = (profile?.currency as CurrencyCode) || "USD";
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTravelCapsule, setShowTravelCapsule] = useState(false);
  const [showColorScience, setShowColorScience] = useState(false);
  const [showOutfitBuilder, setShowOutfitBuilder] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/exchange-rate", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => { if (d.rates) setExchangeRates(d.rates); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const handleShare = useCallback(() => {
    const allItems = categories.flatMap(([, rec]) => rec?.items || []);
    const topItems = allItems.slice(0, 5);

    const lines = [
      "LUXURY STYLIST - AI 奢侈品私人形象方案",
      "━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      `形象评估: ${data.profileSummary || ""}`,
      `风格方向: ${data.styleDirection || ""}`,
      `色彩分析: ${data.colorAnalysis || ""}`,
      "",
      "推荐单品 TOP 5:",
      ...topItems.map((item, i) => `${i + 1}. ${item.brand} - ${item.itemName} (${item.price})`),
      "",
      `预算参考: ${data.totalBudgetEstimate || ""}`,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━",
      "由 LUXURY STYLIST AI 生成",
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  }, [data, categories]);

  return (
    <>
      {showCalendar && (
        <OutfitCalendar data={data} onClose={() => setShowCalendar(false)} />
      )}
    <div className="max-w-5xl mx-auto">
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--noir)] text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          已复制到剪贴板
        </div>
      )}

      <div className="luxury-gradient text-white rounded-2xl p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-3xl font-bold gold-text">您的专属形象方案</h2>
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
              className="border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--gold)] min-w-[140px]"
              style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c} className="text-black">{CURRENCY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[var(--gold-light)] text-xs uppercase tracking-widest mb-2">形象评估</p>
            <p className="text-gray-200 text-sm leading-relaxed">{data.profileSummary}</p>
          </div>
          <div
            className="cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => profile && setShowColorScience(true)}
          >
            <p className="text-[var(--gold-light)] text-xs uppercase tracking-widest mb-2">
              色彩分析 {profile && <span className="text-[var(--gold)] ml-1">· 点击查看色彩科学 →</span>}
            </p>
            <p className="text-gray-200 text-sm leading-relaxed">{data.colorAnalysis}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card-luxury p-5">
          <p className="section-title">体型分析</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.bodyAnalysis}</p>
        </div>
        <div className="card-luxury p-5">
          <p className="section-title">风格方向</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.styleDirection}</p>
        </div>
        <div className="card-luxury p-5">
          <p className="section-title">预算规划</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.totalBudgetEstimate}</p>
        </div>
      </div>

      {data.seasonalNotes && (
        <div className="bg-[var(--gold-light)] bg-opacity-30 border border-[var(--gold)] rounded-xl p-5 mb-8">
          <p className="font-medium text-[var(--gold-dark)] mb-1">当季趋势提示</p>
          <p className="text-sm text-gray-700">{data.seasonalNotes}</p>
        </div>
      )}

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

      <div className="mt-12 pt-8 border-t-2 border-[var(--gold-light)]">
        <CostPerWear data={data} />
      </div>

      <div className="mt-12 pt-8 border-t-2 border-[var(--gold-light)]">
        <StyleMoodboard data={data} />
      </div>

      <div className="flex justify-center gap-4 mt-12 mb-8 print:hidden flex-wrap">
        <button onClick={onBack} className="btn-gold">返回首页</button>
        <button
          onClick={() => setShowOutfitBuilder(true)}
          className="px-8 py-3 bg-[var(--noir)] text-[var(--gold-light)] rounded-lg font-semibold hover:bg-[var(--noir-light)] transition-all"
        >
          AI 穿搭模拟器
        </button>
        <button
          onClick={() => setShowCalendar(true)}
          className="px-8 py-3 border-2 border-[var(--gold)] text-[var(--gold-dark)] rounded-lg font-semibold hover:bg-[var(--gold)] hover:text-white transition-all"
        >
          穿搭日历
        </button>
        <button
          onClick={() => setShowTravelCapsule(true)}
          className="px-8 py-3 border-2 border-[var(--gold)] text-[var(--gold-dark)] rounded-lg font-semibold hover:bg-[var(--gold)] hover:text-white transition-all"
        >
          旅行胶囊衣橱
        </button>
        <button
          onClick={() => window.print()}
          className="px-8 py-3 border-2 border-[var(--gold)] text-[var(--gold-dark)] rounded-lg font-semibold hover:bg-[var(--gold)] hover:text-white transition-all"
        >
          导出PDF
        </button>
      </div>

      <StylistChat plan={data} />
    </div>

    {showOutfitBuilder && (
      <OutfitBuilder data={data} onClose={() => setShowOutfitBuilder(false)} />
    )}

    {showTravelCapsule && (
      <TravelCapsule data={data} onClose={() => setShowTravelCapsule(false)} />
    )}

    {showColorScience && profile && (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowColorScience(false)}>
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-[var(--cream-dark)]">
            <h2 className="text-lg font-bold">色彩科学分析</h2>
            <button onClick={() => setShowColorScience(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          <div className="p-5">
            <ColorScience profile={profile} colorAnalysis={data.colorAnalysis} />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
