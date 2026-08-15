"use client";

import { useMemo, useEffect, useRef } from "react";
import type { UserProfile } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────

interface Props {
  profile?: UserProfile;
  brand?: string;
  onClose: () => void;
}

interface SizeRow {
  label: string;
  cn: string;
  eu: string;
  us: string;
  uk: string;
  it: string;
  fr: string;
  jp: string;
}

interface ShoeRow {
  cm: string;
  cn: string;
  eu: string;
  usMen: string;
  usWomen: string;
  uk: string;
  jp: string;
}

// ── Brand-specific notes ───────────────────────────────────────────────

const BRAND_SIZE_NOTES: Record<string, { fit: string; advice: string }> = {
  Gucci: { fit: "偏小", advice: "建议选大一号，尤其是鞋履" },
  Prada: { fit: "偏小", advice: "上装建议+1码，裤装正常" },
  Chanel: { fit: "偏小", advice: "经典外套建议选大1-2号" },
  "Louis Vuitton": { fit: "正常偏大", advice: "按正常尺码选购" },
  Hermès: { fit: "法码偏小", advice: "参考法国尺码表，通常+1码" },
  Dior: { fit: "偏小", advice: "女装偏小明显，男装接近正常" },
  Burberry: { fit: "英码偏大", advice: "比其他欧洲品牌大半号" },
  Balenciaga: {
    fit: "Oversized设计",
    advice: "根据想要的廓形选择，日常可选小一号",
  },
  "Bottega Veneta": { fit: "意码标准", advice: "参考意大利尺码，鞋履正常" },
  "Saint Laurent": { fit: "修身偏小", advice: "修身剪裁，建议+1码" },
  Valentino: { fit: "意码标准", advice: "整体偏修身，宽松款按正常选" },
  Fendi: { fit: "正常", advice: "尺码相对标准，鞋履偏窄" },
  "Miu Miu": { fit: "偏小", advice: "与Prada同厂，建议+1码" },
  Loewe: { fit: "欧码标准", advice: "版型宽松系列可选小一号" },
  Celine: { fit: "法码偏小", advice: "Hedi时期极修身，建议试穿" },
};

// ── Clothing size conversion table ─────────────────────────────────────

const SIZE_TABLE: SizeRow[] = [
  { label: "XS", cn: "155/80A", eu: "32", us: "0-2", uk: "4-6", it: "36", fr: "32", jp: "5" },
  { label: "S", cn: "160/84A", eu: "34", us: "4", uk: "8", it: "38", fr: "34", jp: "7" },
  { label: "M", cn: "165/88A", eu: "36-38", us: "6-8", uk: "10-12", it: "40-42", fr: "36-38", jp: "9-11" },
  { label: "L", cn: "170/92A", eu: "40", us: "10", uk: "14", it: "44", fr: "40", jp: "13" },
  { label: "XL", cn: "175/96A", eu: "42", us: "12", uk: "16", it: "46", fr: "42", jp: "15" },
  { label: "XXL", cn: "180/100A", eu: "44", us: "14", uk: "18", it: "48", fr: "44", jp: "17" },
];

// ── Shoe size conversion table ─────────────────────────────────────────

const SHOE_TABLE: ShoeRow[] = [
  { cm: "22.5", cn: "35", eu: "35", usMen: "4", usWomen: "5", uk: "2.5", jp: "22.5" },
  { cm: "23", cn: "36", eu: "36", usMen: "4.5", usWomen: "5.5", uk: "3", jp: "23" },
  { cm: "23.5", cn: "37", eu: "37", usMen: "5", usWomen: "6.5", uk: "4", jp: "23.5" },
  { cm: "24", cn: "38", eu: "38", usMen: "5.5", usWomen: "7", uk: "4.5", jp: "24" },
  { cm: "24.5", cn: "39", eu: "39", usMen: "6.5", usWomen: "8", uk: "5.5", jp: "24.5" },
  { cm: "25", cn: "40", eu: "40", usMen: "7", usWomen: "8.5", uk: "6", jp: "25" },
  { cm: "25.5", cn: "41", eu: "41", usMen: "7.5", usWomen: "9", uk: "6.5", jp: "25.5" },
  { cm: "26", cn: "42", eu: "42", usMen: "8.5", usWomen: "10", uk: "7.5", jp: "26" },
  { cm: "26.5", cn: "43", eu: "43", usMen: "9", usWomen: "10.5", uk: "8", jp: "26.5" },
  { cm: "27", cn: "44", eu: "44", usMen: "10", usWomen: "11.5", uk: "9", jp: "27" },
  { cm: "27.5", cn: "45", eu: "45", usMen: "10.5", usWomen: "12", uk: "9.5", jp: "27.5" },
  { cm: "28", cn: "46", eu: "46", usMen: "11.5", usWomen: "13", uk: "10.5", jp: "28" },
];

// ── Size estimation helpers ────────────────────────────────────────────

function estimateSizeIndex(profile?: UserProfile): number {
  if (!profile) return 2; // default to M
  const { height, weight, bodyType } = profile;
  const bmi = weight / ((height / 100) ** 2);

  let idx: number;
  if (bmi < 17.5) idx = 0;       // XS
  else if (bmi < 19.5) idx = 1;  // S
  else if (bmi < 23) idx = 2;    // M
  else if (bmi < 26) idx = 3;    // L
  else if (bmi < 29) idx = 4;    // XL
  else idx = 5;                   // XXL

  // body type adjustments
  if (bodyType === "slim") idx = Math.max(0, idx - 1);
  if (bodyType === "athletic") idx = Math.min(5, idx);
  if (bodyType === "curvy" || bodyType === "plus") idx = Math.min(5, idx + 1);

  return idx;
}

function estimateFootLength(height: number): number {
  // rough approximation: foot length ~ height * 0.152
  return Math.round(height * 0.152 * 2) / 2;
}

function estimateShoeIndex(profile?: UserProfile): number {
  if (!profile) return 4; // default to ~39
  const foot = estimateFootLength(profile.height);
  const idx = SHOE_TABLE.findIndex((r) => parseFloat(r.cm) >= foot);
  return idx === -1 ? SHOE_TABLE.length - 1 : idx;
}

function computeBMI(profile?: UserProfile): string {
  if (!profile) return "--";
  return (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
}

const BODY_TYPE_LABELS: Record<string, string> = {
  slim: "纤细",
  athletic: "运动型",
  average: "匀称",
  curvy: "丰满",
  plus: "丰腴",
};

// ── Component ──────────────────────────────────────────────────────────

export default function SizeGuide({ profile, brand, onClose }: Props) {
  const brandRef = useRef<HTMLDivElement>(null);
  const sizeIdx = useMemo(() => estimateSizeIndex(profile), [profile]);
  const shoeIdx = useMemo(() => estimateShoeIndex(profile), [profile]);

  // auto-scroll to the focused brand section
  useEffect(() => {
    if (brand && brandRef.current) {
      setTimeout(() => {
        brandRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [brand]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: "linear-gradient(135deg, var(--noir) 0%, var(--noir-light) 100%)",
          border: "1px solid var(--gold)",
          boxShadow: "0 0 60px rgba(212,175,55,0.15)",
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{
            background: "linear-gradient(90deg, var(--noir) 0%, var(--noir-light) 100%)",
            borderBottom: "1px solid var(--gold)",
          }}
        >
          <h2
            className="section-title text-xl font-bold tracking-wide"
            style={{ color: "var(--gold)", margin: 0 }}
          >
            Smart Size Guide
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={{
              border: "1px solid var(--gold)",
              color: "var(--gold)",
              background: "transparent",
            }}
            aria-label="Close size guide"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* ── 1. Body Profile Summary ──────────────────── */}
          <section className="card-luxury rounded-xl p-5" style={{ background: "var(--noir-light)", border: "1px solid var(--gold-dark)" }}>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>
              身体档案 / Body Profile
            </h3>
            {profile ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <ProfileStat label="身高" value={`${profile.height} cm`} />
                <ProfileStat label="体重" value={`${profile.weight} kg`} />
                <ProfileStat label="体型" value={BODY_TYPE_LABELS[profile.bodyType] ?? profile.bodyType} />
                <ProfileStat label="BMI" value={computeBMI(profile)} />
                <ProfileStat label="估算尺码" value={SIZE_TABLE[sizeIdx].label} highlight />
                <ProfileStat label="估算鞋码" value={`CN ${SHOE_TABLE[shoeIdx].cn} / EU ${SHOE_TABLE[shoeIdx].eu}`} highlight />
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--cream-dark)" }}>
                暂无身体数据。请先完善个人档案以获取精准推荐。
              </p>
            )}
          </section>

          {/* ── 2. International Size Conversion ─────────── */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
              国际尺码对照 / International Size Chart
            </h3>
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--gold-dark)" }}>
              <table className="w-full text-sm" style={{ color: "var(--cream)" }}>
                <thead>
                  <tr style={{ background: "var(--noir-light)", borderBottom: "1px solid var(--gold-dark)" }}>
                    {["尺码", "中国/CN", "欧洲/EU", "美国/US", "英国/UK", "意大利/IT", "法国/FR", "日本/JP"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap" style={{ color: "var(--gold-light)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZE_TABLE.map((row, i) => {
                    const isHighlight = i === sizeIdx && !!profile;
                    return (
                      <tr
                        key={row.label}
                        style={{
                          background: isHighlight
                            ? "rgba(212,175,55,0.15)"
                            : i % 2 === 0
                            ? "var(--noir)"
                            : "var(--noir-light)",
                          borderBottom: "1px solid var(--gold-dark)",
                          ...(isHighlight ? { boxShadow: "inset 3px 0 0 var(--gold)" } : {}),
                        }}
                      >
                        <td className="px-3 py-2.5 font-semibold" style={{ color: isHighlight ? "var(--gold)" : "var(--cream)" }}>
                          {row.label}
                          {isHighlight && <span className="ml-1.5 text-xs" style={{ color: "var(--gold-light)" }}>推荐</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{row.cn}</td>
                        <td className="px-3 py-2.5">{row.eu}</td>
                        <td className="px-3 py-2.5">{row.us}</td>
                        <td className="px-3 py-2.5">{row.uk}</td>
                        <td className="px-3 py-2.5">{row.it}</td>
                        <td className="px-3 py-2.5">{row.fr}</td>
                        <td className="px-3 py-2.5">{row.jp}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 3. Brand-Specific Notes ──────────────────── */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
              品牌尺码指南 / Brand Sizing Notes
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(BRAND_SIZE_NOTES).map(([name, { fit, advice }]) => {
                const isFocused = brand?.toLowerCase() === name.toLowerCase();
                return (
                  <div
                    key={name}
                    ref={isFocused ? brandRef : undefined}
                    className="rounded-xl p-4 transition-all"
                    style={{
                      background: isFocused ? "rgba(212,175,55,0.12)" : "var(--noir-light)",
                      border: isFocused ? "1.5px solid var(--gold)" : "1px solid var(--gold-dark)",
                      boxShadow: isFocused ? "0 0 20px rgba(212,175,55,0.2)" : "none",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold" style={{ color: "var(--cream)" }}>
                        {name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "rgba(212,175,55,0.15)",
                          color: "var(--gold)",
                          border: "1px solid var(--gold-dark)",
                        }}
                      >
                        {fit}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--cream-dark)" }}>
                      {advice}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 4. Shoe Size Converter ───────────────────── */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
              鞋码对照 / Shoe Size Chart
            </h3>
            {profile && (
              <p className="text-xs mb-2" style={{ color: "var(--cream-dark)" }}>
                根据身高 {profile.height}cm 估算脚长约 {estimateFootLength(profile.height)} cm
              </p>
            )}
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--gold-dark)" }}>
              <table className="w-full text-sm" style={{ color: "var(--cream)" }}>
                <thead>
                  <tr style={{ background: "var(--noir-light)", borderBottom: "1px solid var(--gold-dark)" }}>
                    {["脚长(cm)", "中国/CN", "欧洲/EU", "美国男/US M", "美国女/US W", "英国/UK", "日本/JP"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap" style={{ color: "var(--gold-light)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SHOE_TABLE.map((row, i) => {
                    const isHighlight = i === shoeIdx && !!profile;
                    return (
                      <tr
                        key={row.cm}
                        style={{
                          background: isHighlight
                            ? "rgba(212,175,55,0.15)"
                            : i % 2 === 0
                            ? "var(--noir)"
                            : "var(--noir-light)",
                          borderBottom: "1px solid var(--gold-dark)",
                          ...(isHighlight ? { boxShadow: "inset 3px 0 0 var(--gold)" } : {}),
                        }}
                      >
                        <td className="px-3 py-2.5 font-semibold" style={{ color: isHighlight ? "var(--gold)" : "var(--cream)" }}>
                          {row.cm}
                          {isHighlight && <span className="ml-1.5 text-xs" style={{ color: "var(--gold-light)" }}>推荐</span>}
                        </td>
                        <td className="px-3 py-2.5">{row.cn}</td>
                        <td className="px-3 py-2.5">{row.eu}</td>
                        <td className="px-3 py-2.5">{row.usMen}</td>
                        <td className="px-3 py-2.5">{row.usWomen}</td>
                        <td className="px-3 py-2.5">{row.uk}</td>
                        <td className="px-3 py-2.5">{row.jp}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 5. Measurement Tips ──────────────────────── */}
          <section className="card-luxury rounded-xl p-5" style={{ background: "var(--noir-light)", border: "1px solid var(--gold-dark)" }}>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>
              量体指南 / How to Measure
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <MeasurementTip
                title="胸围 / Chest"
                desc="将软尺水平绕过胸部最丰满处一周，保持自然呼吸，软尺不要过紧或过松。"
              />
              <MeasurementTip
                title="腰围 / Waist"
                desc="在自然腰线（通常为肚脐上方最细处）水平环绕一周，保持放松站立姿态。"
              />
              <MeasurementTip
                title="臀围 / Hips"
                desc="双脚并拢站立，软尺水平绕过臀部最丰满处一周，确保软尺保持水平。"
              />
              <MeasurementTip
                title="肩宽 / Shoulders"
                desc="从一侧肩关节最外端量到另一侧肩关节最外端，软尺贴合后背自然弧度。"
              />
            </div>
            <p className="text-xs mt-4 leading-relaxed" style={{ color: "var(--cream-dark)" }}>
              建议穿着贴身衣物测量，使用软尺而非硬尺。每个部位测量2-3次取平均值以确保精准。不同品牌的版型差异较大，如有疑问建议前往精品店试穿。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function ProfileStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-center"
      style={{
        background: highlight ? "rgba(212,175,55,0.12)" : "var(--noir)",
        border: highlight ? "1px solid var(--gold)" : "1px solid var(--gold-dark)",
      }}
    >
      <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--gold-light)" }}>
        {label}
      </div>
      <div className="text-sm font-semibold" style={{ color: highlight ? "var(--gold)" : "var(--cream)" }}>
        {value}
      </div>
    </div>
  );
}

function MeasurementTip({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--noir)", border: "1px solid var(--gold-dark)" }}>
      <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--gold-light)" }}>
        {title}
      </h4>
      <p className="text-xs leading-relaxed" style={{ color: "var(--cream-dark)" }}>
        {desc}
      </p>
    </div>
  );
}
