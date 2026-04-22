"use client";

import { useState, useEffect, useMemo } from "react";
import type { RecommendedItem, PurchaseChannel } from "@/lib/types";
import { buildPlatformUrl, buildGoogleShoppingUrl, buildGoogleImageUrl } from "@/lib/utils";

type Region = "china" | "international";

interface SmartPurchaseProps {
  item: RecommendedItem;
  onClose: () => void;
}

const CHINA_TIMEZONES = new Set([
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Chongqing",
  "Asia/Urumqi",
  "Asia/Macau",
]);

const CHINA_PRIORITY_PLATFORMS = ["天猫奢品", "京东奢品", "得物(POIZON)", "得物", "小红书商城"];
const INTL_PRIORITY_PLATFORMS = ["品牌官网", "FARFETCH", "NET-A-PORTER", "SSENSE", "Mytheresa", "MatchesFashion"];

function detectRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return CHINA_TIMEZONES.has(tz) ? "china" : "international";
  } catch {
    return "international";
  }
}

function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function SmartPurchase({ item, onClose }: SmartPurchaseProps) {
  const [region, setRegion] = useState<Region>("international");

  useEffect(() => {
    setRegion(detectRegion());
  }, []);

  const channels: PurchaseChannel[] = useMemo(() => {
    if (item.purchaseChannels && item.purchaseChannels.length > 0) {
      return item.purchaseChannels;
    }
    // Fallback: generate default channels from the single purchaseChannel field
    return [
      {
        platform: item.purchaseChannel || "品牌官网",
        region: "international",
        estimatedPrice: item.price,
        advantage: "官方渠道",
      },
    ];
  }, [item]);

  const sortedChannels = useMemo(() => {
    const priorityList = region === "china" ? CHINA_PRIORITY_PLATFORMS : INTL_PRIORITY_PLATFORMS;

    return [...channels].sort((a, b) => {
      const priceA = parsePrice(a.estimatedPrice);
      const priceB = parsePrice(b.estimatedPrice);
      // Primary sort: priority platforms first for current region
      const aPriority = priorityList.includes(a.platform) ? 0 : 1;
      const bPriority = priorityList.includes(b.platform) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      // Secondary sort: lowest price first
      return priceA - priceB;
    });
  }, [channels, region]);

  const cheapestChannel = useMemo(() => {
    return channels.reduce((best, ch) => {
      const bestPrice = parsePrice(best.estimatedPrice);
      const chPrice = parsePrice(ch.estimatedPrice);
      return chPrice > 0 && chPrice < bestPrice ? ch : best;
    }, channels[0]);
  }, [channels]);

  const bestDeal = useMemo(() => {
    const priorityList = region === "china" ? CHINA_PRIORITY_PLATFORMS : INTL_PRIORITY_PLATFORMS;
    const regionChannels = channels.filter((ch) => priorityList.includes(ch.platform));
    if (regionChannels.length === 0) return cheapestChannel;
    return regionChannels.reduce((best, ch) => {
      const bestPrice = parsePrice(best.estimatedPrice);
      const chPrice = parsePrice(ch.estimatedPrice);
      return chPrice > 0 && chPrice < bestPrice ? ch : best;
    }, regionChannels[0]);
  }, [channels, region, cheapestChannel]);

  const retailPrice = item.priceUSD || parsePrice(item.price);
  const bestDealPrice = parsePrice(bestDeal.estimatedPrice);
  const savings = retailPrice - bestDealPrice;

  const maxPrice = useMemo(() => {
    return Math.max(...channels.map((ch) => parsePrice(ch.estimatedPrice)), retailPrice);
  }, [channels, retailPrice]);

  const xiaohongshuUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.brand + " " + item.itemName + " 评价")}`;
  const dewuUrl = `https://m.dewu.com/search/result?keyword=${encodeURIComponent(item.brand + " " + item.itemName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="card-luxury relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--cream)" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors"
          style={{ color: "var(--noir)", background: "var(--cream-dark)" }}
          aria-label="关闭"
        >
          &times;
        </button>

        {/* Region toggle */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          <button
            onClick={() => setRegion("china")}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: region === "china" ? "var(--gold)" : "var(--cream-dark)",
              color: region === "china" ? "var(--noir)" : "var(--noir)",
              boxShadow: region === "china" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
            }}
          >
            🇨🇳 国内优先
          </button>
          <button
            onClick={() => setRegion("international")}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: region === "international" ? "var(--gold)" : "var(--cream-dark)",
              color: region === "international" ? "var(--noir)" : "var(--noir)",
              boxShadow: region === "international" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
            }}
          >
            🌍 海淘优先
          </button>
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-3 text-center">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold-dark)" }}>
            智能购买顾问
          </p>
          <h2 className="text-xl font-bold" style={{ color: "var(--noir)" }}>
            {item.brand}
          </h2>
          <p className="text-base mt-1" style={{ color: "var(--noir)" }}>
            {item.itemName}
          </p>
          <p className="text-lg font-semibold mt-2" style={{ color: "var(--gold-dark)" }}>
            零售价 {item.price}
          </p>
        </div>

        {/* Best deal section */}
        <div
          className="mx-6 mb-4 p-4 rounded-xl border"
          style={{
            borderColor: "var(--gold)",
            background: "var(--gold-light)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-bold"
              style={{ background: "var(--gold)", color: "var(--noir)" }}
            >
              {region === "china" ? "国内最优" : "海淘最优"}
            </span>
            <span className="font-semibold" style={{ color: "var(--noir)" }}>
              {bestDeal.platform}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold" style={{ color: "var(--noir)" }}>
              {bestDeal.estimatedPrice}
            </span>
            {savings > 0 && (
              <span className="text-sm font-medium" style={{ color: "#16a34a" }}>
                预计节省 {formatPrice(savings)}
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--gold-dark)" }}>
            {bestDeal.advantage}
          </p>
          <a
            href={buildPlatformUrl(bestDeal.platform, item)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-full text-center py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "var(--gold)", color: "var(--noir)" }}
          >
            立即前往 {bestDeal.platform}
          </a>
        </div>

        {/* All channels table */}
        <div className="px-6 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--noir)" }}>
            全渠道比价
          </h3>
          <div className="space-y-2">
            {sortedChannels.map((ch, idx) => {
              const isCheapest = ch.platform === cheapestChannel.platform;
              const chPrice = parsePrice(ch.estimatedPrice);
              return (
                <div
                  key={`${ch.platform}-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-lg border transition-all"
                  style={{
                    borderColor: isCheapest ? "var(--gold)" : "var(--cream-dark)",
                    background: isCheapest ? "var(--gold-light)" : "var(--cream)",
                  }}
                >
                  {/* Region dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: ch.region === "domestic" ? "#ef4444" : "#3b82f6" }}
                    title={ch.region === "domestic" ? "国内" : "海淘"}
                  />

                  {/* Platform info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--noir)" }}>
                        {ch.platform}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: ch.region === "domestic" ? "#fef2f2" : "#eff6ff",
                          color: ch.region === "domestic" ? "#dc2626" : "#2563eb",
                        }}
                      >
                        {ch.region === "domestic" ? "国内" : "海淘"}
                      </span>
                      {isCheapest && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                          style={{ background: "var(--gold)", color: "var(--noir)" }}
                        >
                          最优价
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: "var(--gold-dark)" }}>
                        {ch.advantage}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <span
                    className="text-sm font-bold shrink-0"
                    style={{ color: isCheapest ? "var(--noir)" : "var(--gold-dark)" }}
                  >
                    {ch.estimatedPrice}
                  </span>

                  {/* Link button */}
                  <a
                    href={buildPlatformUrl(ch.platform, item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                    style={{
                      background: isCheapest ? "var(--gold)" : "var(--cream-dark)",
                      color: "var(--noir)",
                    }}
                  >
                    前往
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price comparison bar */}
        <div className="px-6 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--noir)" }}>
            价格对比
          </h3>
          <div className="space-y-2">
            {sortedChannels.map((ch, idx) => {
              const chPrice = parsePrice(ch.estimatedPrice);
              const widthPercent = maxPrice > 0 ? (chPrice / maxPrice) * 100 : 0;
              const isCheapest = ch.platform === cheapestChannel.platform;
              return (
                <div key={`bar-${ch.platform}-${idx}`} className="flex items-center gap-3">
                  <span
                    className="text-xs w-24 truncate text-right shrink-0"
                    style={{ color: "var(--noir)" }}
                  >
                    {ch.platform}
                  </span>
                  <div
                    className="flex-1 h-5 rounded-full overflow-hidden"
                    style={{ background: "var(--cream-dark)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(widthPercent, 4)}%`,
                        background: isCheapest ? "#16a34a" : "var(--gold-dark)",
                        opacity: isCheapest ? 1 : 0.5,
                      }}
                    />
                  </div>
                  <span className="text-xs w-20 shrink-0" style={{ color: "var(--gold-dark)" }}>
                    {ch.estimatedPrice}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart links */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--noir)" }}>
            更多工具
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={buildGoogleShoppingUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border text-sm transition-all hover:shadow-md"
              style={{ borderColor: "var(--cream-dark)", color: "var(--noir)" }}
            >
              <span className="text-base">🛒</span>
              <span>Google Shopping 全球比价</span>
            </a>
            <a
              href={buildGoogleImageUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border text-sm transition-all hover:shadow-md"
              style={{ borderColor: "var(--cream-dark)", color: "var(--noir)" }}
            >
              <span className="text-base">📷</span>
              <span>Google Images 查看实物图</span>
            </a>
            <a
              href={xiaohongshuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border text-sm transition-all hover:shadow-md"
              style={{ borderColor: "var(--cream-dark)", color: "var(--noir)" }}
            >
              <span className="text-base">📝</span>
              <span>小红书 查看用户评价</span>
            </a>
            <a
              href={dewuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border text-sm transition-all hover:shadow-md"
              style={{ borderColor: "var(--cream-dark)", color: "var(--noir)" }}
            >
              <span className="text-base">✅</span>
              <span>得物 验证正品</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
