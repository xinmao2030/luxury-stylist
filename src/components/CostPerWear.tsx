"use client";

import { useMemo } from "react";
import type { FullStylingPlan, RecommendedItem } from "@/lib/types";

type CategoryKey = keyof FullStylingPlan["recommendations"];

const WEARS_PER_YEAR: Record<CategoryKey, number> = {
  tops: 52,
  bottoms: 52,
  dresses: 24,
  outerwear: 40,
  bags: 200,
  shoes: 100,
  accessories: 150,
  watches: 300,
  fragrance: 180,
  hair: 12,
  makeup: 30,
};

const LIFESPAN_YEARS: Record<CategoryKey, number> = {
  tops: 3,
  bottoms: 3,
  dresses: 5,
  outerwear: 5,
  bags: 10,
  shoes: 3,
  accessories: 8,
  watches: 20,
  fragrance: 1,
  hair: 0.5,
  makeup: 0.5,
};

interface CpwItem {
  brand: string;
  itemName: string;
  priceUSD: number;
  category: CategoryKey;
  wearsPerYear: number;
  lifespanYears: number;
  totalWears: number;
  costPerWear: number;
}

function getCpwColor(cpw: number): string {
  if (cpw < 5) return "#2f855a";    // green
  if (cpw < 20) return "#b7961d";   // gold/yellow
  if (cpw < 50) return "#c05621";   // orange
  return "#c53030";                  // red
}

function getCpwLabel(cpw: number): string {
  if (cpw < 5) return "Excellent Value";
  if (cpw < 20) return "Good Value";
  if (cpw < 50) return "Moderate";
  return "Luxury Splurge";
}

function getCpwBg(cpw: number): string {
  if (cpw < 5) return "rgba(47, 133, 90, 0.08)";
  if (cpw < 20) return "rgba(183, 150, 29, 0.08)";
  if (cpw < 50) return "rgba(192, 86, 33, 0.08)";
  return "rgba(197, 48, 48, 0.08)";
}

export default function CostPerWear({ data }: { data: FullStylingPlan }) {
  const analysis = useMemo(() => {
    const items: CpwItem[] = [];

    for (const key of Object.keys(data.recommendations) as CategoryKey[]) {
      const rec = data.recommendations[key];
      if (!rec?.items) continue;

      for (const item of rec.items) {
        if (item.priceUSD > 0) {
          const wearsPerYear = WEARS_PER_YEAR[key];
          const lifespanYears = LIFESPAN_YEARS[key];
          const totalWears = wearsPerYear * lifespanYears;
          const costPerWear = item.priceUSD / totalWears;

          items.push({
            brand: item.brand,
            itemName: item.itemName,
            priceUSD: item.priceUSD,
            category: key,
            wearsPerYear,
            lifespanYears,
            totalWears,
            costPerWear,
          });
        }
      }
    }

    items.sort((a, b) => a.costPerWear - b.costPerWear);

    const totalInvestment = items.reduce((sum, i) => sum + i.priceUSD, 0);
    const avgCpw = items.length > 0
      ? items.reduce((sum, i) => sum + i.costPerWear, 0) / items.length
      : 0;
    const bestValue = items[0] ?? null;
    const maxCpw = items.length > 0 ? items[items.length - 1].costPerWear : 1;

    return { items, totalInvestment, avgCpw, bestValue, maxCpw };
  }, [data]);

  if (analysis.items.length === 0) {
    return (
      <div className="card-luxury p-8 text-center" style={{ color: "var(--noir)" }}>
        <p style={{ opacity: 0.5 }}>No priced items available for cost-per-wear analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div
        className="card-luxury p-6"
        style={{ background: "linear-gradient(135deg, var(--noir) 0%, var(--noir-light) 100%)" }}
      >
        <h3
          className="text-lg font-semibold mb-4 tracking-wide"
          style={{ color: "var(--gold)" }}
        >
          Cost-per-Wear Analysis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold-light)", opacity: 0.7 }}>
              Total Investment
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--cream)" }}>
              ${analysis.totalInvestment.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold-light)", opacity: 0.7 }}>
              Avg. Cost per Wear
            </p>
            <p className="text-2xl font-bold" style={{ color: getCpwColor(analysis.avgCpw) }}>
              ${analysis.avgCpw.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold-light)", opacity: 0.7 }}>
              Best Value
            </p>
            {analysis.bestValue && (
              <>
                <p className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
                  {analysis.bestValue.brand}
                </p>
                <p className="text-xs" style={{ color: "var(--gold-light)" }}>
                  {analysis.bestValue.itemName} &mdash; ${analysis.bestValue.costPerWear.toFixed(2)}/wear
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card-luxury p-6">
        <h4 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--gold-dark)" }}>
          Cost per Wear Comparison
        </h4>
        <div className="space-y-3">
          {analysis.items.map((item, idx) => {
            const pct = analysis.maxCpw > 0 ? (item.costPerWear / analysis.maxCpw) * 100 : 0;
            return (
              <div key={`${item.brand}-${item.itemName}-${idx}`} className="flex items-center gap-3">
                <div className="w-28 sm:w-36 text-right shrink-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--noir)" }}>
                    {item.brand}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "var(--noir)", opacity: 0.5 }}>
                    {item.itemName}
                  </p>
                </div>
                <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(pct, 8)}%`,
                      background: `linear-gradient(90deg, ${getCpwColor(item.costPerWear)}88, ${getCpwColor(item.costPerWear)})`,
                    }}
                  >
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">
                      ${item.costPerWear.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.items.map((item, idx) => (
          <div
            key={`card-${item.brand}-${item.itemName}-${idx}`}
            className="card-luxury p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: "var(--gold-dark)" }}>
                  {item.category}
                </p>
                <p className="font-semibold truncate" style={{ color: "var(--noir)" }}>
                  {item.brand}
                </p>
                <p className="text-sm truncate" style={{ color: "var(--noir)", opacity: 0.6 }}>
                  {item.itemName}
                </p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-lg font-bold" style={{ color: "var(--noir)" }}>
                  ${item.priceUSD.toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className="grid grid-cols-3 gap-2 text-center rounded-lg p-3"
              style={{ background: "var(--cream-dark)" }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ opacity: 0.5 }}>Wears/yr</p>
                <p className="text-sm font-semibold">{item.wearsPerYear}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ opacity: 0.5 }}>Lifespan</p>
                <p className="text-sm font-semibold">
                  {item.lifespanYears < 1 ? `${item.lifespanYears * 12}mo` : `${item.lifespanYears}yr`}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ opacity: 0.5 }}>Total Wears</p>
                <p className="text-sm font-semibold">{item.totalWears.toLocaleString()}</p>
              </div>
            </div>

            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{ background: getCpwBg(item.costPerWear) }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: getCpwColor(item.costPerWear) }}
                />
                <span className="text-xs font-medium" style={{ color: getCpwColor(item.costPerWear) }}>
                  {getCpwLabel(item.costPerWear)}
                </span>
              </div>
              <p className="text-lg font-bold" style={{ color: getCpwColor(item.costPerWear) }}>
                ${item.costPerWear.toFixed(2)}
                <span className="text-xs font-normal ml-0.5" style={{ opacity: 0.7 }}>/wear</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
