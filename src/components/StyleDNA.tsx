"use client";

import { FullStylingPlan, UserProfile, StyleRecommendation } from "@/lib/types";

interface Props {
  data: FullStylingPlan;
  profile: UserProfile;
}

const CLASSIC = ["Hermès", "Chanel", "Dior", "Cartier", "Patek Philippe"];
const TRENDY = ["Balenciaga", "Off-White", "Vetements"];

function allItems(data: FullStylingPlan) {
  return Object.values(data.recommendations).flatMap((r: StyleRecommendation) => r.items);
}

function calcAxes(data: FullStylingPlan, profile: UserProfile) {
  const items = allItems(data);
  const brands = items.map((i) => i.brand);

  // 经典↔潮流
  const classicN = brands.filter((b) => CLASSIC.includes(b)).length;
  const trendyN = brands.filter((b) => TRENDY.includes(b)).length;
  const total = classicN + trendyN;
  const classicTrendy = total > 0 ? Math.round((trendyN / total) * 100) : 50;

  // 极简↔华丽
  const sp = profile.stylePreferences.join(" ");
  const minimal = /简约|极简/.test(sp);
  const maximal = /华丽|戏剧/.test(sp);
  const minMax = minimal && !maximal ? 20 : !minimal && maximal ? 80 : minimal && maximal ? 50 : 50;

  // 正式↔休闲
  const occ = profile.occasions.join(" ");
  const formal = (occ.match(/商务|会议|典礼/g) || []).length;
  const casual = (occ.match(/休闲|度假|运动/g) || []).length;
  const ft = formal + casual;
  const formalCasual = ft > 0 ? Math.round((casual / ft) * 100) : 50;

  // 暖色↔冷色
  const colorStr = [...profile.colorPreferences, data.colorAnalysis].join(" ");
  const warm = (colorStr.match(/暖|warm|金|红|橙/gi) || []).length;
  const cool = (colorStr.match(/冷|cool|蓝|紫|银/gi) || []).length;
  const ct = warm + cool;
  const warmCool = ct > 0 ? Math.round((cool / ct) * 100) : 50;

  // 大胆↔内敛
  const pers = profile.personality.join(" ");
  const bold = (pers.match(/外向|冒险|进取/g) || []).length;
  const subtle = (pers.match(/内敛|沉稳|温和/g) || []).length;
  const bt = bold + subtle;
  const boldSubtle = bt > 0 ? Math.round((subtle / bt) * 100) : 50;

  return [
    { label: "经典↔潮流", value: classicTrendy },
    { label: "极简↔华丽", value: minMax },
    { label: "正式↔休闲", value: formalCasual },
    { label: "暖色↔冷色", value: warmCool },
    { label: "大胆↔内敛", value: boldSubtle },
  ];
}

function pentagonPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as [number, number];
  });
}

function toPath(pts: [number, number][]) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
}

function getTags(axes: { label: string; value: number }[]) {
  const [ct, mm, fc, wc, bs] = axes.map((a) => a.value);
  const tags: string[] = [];
  if (ct < 40 && fc < 40) tags.push("经典绅士派");
  if (ct > 60 && bs < 40) tags.push("潮流先锋");
  if (mm < 40 && wc < 40) tags.push("极简暖调");
  if (mm > 60 && bs < 40) tags.push("华丽张扬");
  if (fc > 60) tags.push("休闲随性");
  if (fc < 40) tags.push("商务精英");
  if (wc > 60) tags.push("冷调高级");
  if (bs > 60) tags.push("内敛沉稳");
  if (ct >= 40 && ct <= 60) tags.push("新经典主义");
  return tags.slice(0, 4);
}

const LABEL_OFFSETS: [number, number][] = [[0, -14], [16, 0], [10, 12], [-10, 12], [-16, 0]];

export default function StyleDNA({ data, profile }: Props) {
  const axes = calcAxes(data, profile);
  const cx = 150, cy = 150, R = 120;
  const dataPts = pentagonPoints(cx, cy, R).map(([x, y], i) => {
    const r = (axes[i].value / 100) * R;
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as [number, number];
  });

  const items = allItems(data);
  const brandCount: Record<string, number> = {};
  items.forEach((it) => { brandCount[it.brand] = (brandCount[it.brand] || 0) + 1; });
  const topBrands = Object.entries(brandCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([b, c]) => ({ brand: b, pct: Math.round((c / items.length) * 100) }));

  const colors = [...new Set(items.map((i) => i.color).filter(Boolean))].slice(0, 8);
  const tags = getTags(axes);
  const gridPts = pentagonPoints(cx, cy, R);

  return (
    <div className="card-luxury space-y-6">
      <h2 className="text-xl font-bold" style={{ color: "var(--gold)" }}>Style DNA</h2>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 300" className="w-64 h-64">
          {[40, 80, 120].map((r) => (
            <polygon key={r} points={pentagonPoints(cx, cy, r).map((p) => p.join(",")).join(" ")}
              fill="none" stroke="#d1d5db" strokeWidth="0.5" />
          ))}
          {gridPts.map((p, i) => (
            <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#e5e7eb" strokeWidth="0.5" />
          ))}
          <polygon points={dataPts.map((p) => p.join(",")).join(" ")}
            fill="rgba(201,169,110,0.3)" stroke="var(--gold)" strokeWidth="2" />
          {dataPts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--gold)" />
          ))}
          {gridPts.map((p, i) => (
            <text key={i} x={p[0] + LABEL_OFFSETS[i][0]} y={p[1] + LABEL_OFFSETS[i][1]}
              textAnchor="middle" fontSize="9" fill="var(--gold-dark)">
              {axes[i].label}
            </text>
          ))}
        </svg>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--gold-dark)" }}>风格标签</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "var(--gold-light)", color: "var(--noir)" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Brand Match */}
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--gold-dark)" }}>品牌匹配</h3>
        <div className="space-y-1.5">
          {topBrands.map(({ brand, pct }) => (
            <div key={brand} className="flex items-center gap-2 text-xs">
              <span className="w-28 truncate" style={{ color: "var(--noir)" }}>{brand}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--cream-dark)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gold)" }} />
              </div>
              <span style={{ color: "var(--gold-dark)" }}>{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Color Gene */}
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--gold-dark)" }}>色彩基因</h3>
        <div className="flex gap-2 flex-wrap">
          {colors.map((c) => (
            <div key={c} className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full border" style={{ background: "var(--gold-light)", borderColor: "var(--gold)" }} />
              <span className="text-xs" style={{ color: "var(--noir)" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
