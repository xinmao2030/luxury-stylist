"use client";

import { useMemo } from "react";
import type { UserProfile } from "@/lib/types";

type Season = "spring" | "summer" | "autumn" | "winter";

interface ColorSwatch {
  hex: string;
  name: string;
}

interface SeasonProfile {
  label: string;
  icon: string;
  bg: string;
  textColor: string;
  best: ColorSwatch[];
  avoid: ColorSwatch[];
  combos: ColorSwatch[][];
}

const SEASON_DATA: Record<Season, SeasonProfile> = {
  spring: {
    label: "春季型",
    icon: "\u{1F338}",
    bg: "linear-gradient(135deg, #FFF8E1, #FFECB3)",
    textColor: "#8D6E00",
    best: [
      { hex: "#FFD700", name: "金盏花" },
      { hex: "#FF6B6B", name: "珊瑚红" },
      { hex: "#98D8C8", name: "薄荷绿" },
      { hex: "#F7DC6F", name: "柠檬黄" },
      { hex: "#FADBD8", name: "樱花粉" },
      { hex: "#ABEBC6", name: "嫩叶绿" },
      { hex: "#F5CBA7", name: "蜜桃橘" },
      { hex: "#D4E6F1", name: "天空蓝" },
      { hex: "#F9E79F", name: "奶油黄" },
      { hex: "#E59866", name: "暖杏色" },
    ],
    avoid: [
      { hex: "#000080", name: "深海军蓝" },
      { hex: "#4B0082", name: "靛紫色" },
      { hex: "#2F4F4F", name: "暗岩灰" },
      { hex: "#800020", name: "勃艮第" },
      { hex: "#1C1C1C", name: "纯黑色" },
    ],
    combos: [
      [
        { hex: "#FFD700", name: "金盏花" },
        { hex: "#FADBD8", name: "樱花粉" },
        { hex: "#98D8C8", name: "薄荷绿" },
      ],
      [
        { hex: "#F5CBA7", name: "蜜桃橘" },
        { hex: "#F7DC6F", name: "柠檬黄" },
        { hex: "#ABEBC6", name: "嫩叶绿" },
        { hex: "#FFFFFF", name: "纯白" },
      ],
      [
        { hex: "#E59866", name: "暖杏色" },
        { hex: "#D4E6F1", name: "天空蓝" },
        { hex: "#FF6B6B", name: "珊瑚红" },
      ],
    ],
  },
  summer: {
    label: "夏季型",
    icon: "☀️",
    bg: "linear-gradient(135deg, #E8EAF6, #E1BEE7)",
    textColor: "#4A148C",
    best: [
      { hex: "#B0C4DE", name: "雾霾蓝" },
      { hex: "#DDA0DD", name: "梅子紫" },
      { hex: "#E6E6FA", name: "薰衣草" },
      { hex: "#87CEEB", name: "晴空蓝" },
      { hex: "#FFC0CB", name: "玫瑰粉" },
      { hex: "#C8A2C8", name: "丁香紫" },
      { hex: "#98B4D4", name: "矢车菊" },
      { hex: "#AFEEEE", name: "冰蓝色" },
      { hex: "#D8BFD8", name: "蓟紫色" },
      { hex: "#ACE5EE", name: "水色蓝" },
    ],
    avoid: [
      { hex: "#FF4500", name: "橘红色" },
      { hex: "#DAA520", name: "暗金色" },
      { hex: "#8B4513", name: "棕褐色" },
      { hex: "#CD853F", name: "秘鲁棕" },
      { hex: "#FF8C00", name: "深橙色" },
    ],
    combos: [
      [
        { hex: "#B0C4DE", name: "雾霾蓝" },
        { hex: "#FFC0CB", name: "玫瑰粉" },
        { hex: "#E6E6FA", name: "薰衣草" },
      ],
      [
        { hex: "#87CEEB", name: "晴空蓝" },
        { hex: "#DDA0DD", name: "梅子紫" },
        { hex: "#AFEEEE", name: "冰蓝色" },
        { hex: "#FFFFFF", name: "纯白" },
      ],
      [
        { hex: "#C8A2C8", name: "丁香紫" },
        { hex: "#98B4D4", name: "矢车菊" },
        { hex: "#D8BFD8", name: "蓟紫色" },
      ],
    ],
  },
  autumn: {
    label: "秋季型",
    icon: "\u{1F342}",
    bg: "linear-gradient(135deg, #FFF3E0, #FFCCBC)",
    textColor: "#BF360C",
    best: [
      { hex: "#8B4513", name: "深棕色" },
      { hex: "#CD853F", name: "秘鲁棕" },
      { hex: "#B8860B", name: "暗金菊" },
      { hex: "#A0522D", name: "赭石色" },
      { hex: "#DAA520", name: "秋麦金" },
      { hex: "#BC8F8F", name: "玫瑰褐" },
      { hex: "#D2691E", name: "巧克力" },
      { hex: "#CC7722", name: "赤褐色" },
      { hex: "#556B2F", name: "橄榄绿" },
      { hex: "#8FBC8F", name: "暗海绿" },
    ],
    avoid: [
      { hex: "#FFC0CB", name: "粉红色" },
      { hex: "#E6E6FA", name: "薰衣草" },
      { hex: "#87CEEB", name: "天空蓝" },
      { hex: "#DDA0DD", name: "梅子紫" },
      { hex: "#AFEEEE", name: "冰蓝色" },
    ],
    combos: [
      [
        { hex: "#8B4513", name: "深棕色" },
        { hex: "#DAA520", name: "秋麦金" },
        { hex: "#556B2F", name: "橄榄绿" },
      ],
      [
        { hex: "#CD853F", name: "秘鲁棕" },
        { hex: "#CC7722", name: "赤褐色" },
        { hex: "#8FBC8F", name: "暗海绿" },
        { hex: "#FFF8DC", name: "玉米丝" },
      ],
      [
        { hex: "#A0522D", name: "赭石色" },
        { hex: "#B8860B", name: "暗金菊" },
        { hex: "#BC8F8F", name: "玫瑰褐" },
      ],
    ],
  },
  winter: {
    label: "冬季型",
    icon: "❄️",
    bg: "linear-gradient(135deg, #E3F2FD, #F3E5F5)",
    textColor: "#1A237E",
    best: [
      { hex: "#000080", name: "海军蓝" },
      { hex: "#800020", name: "勃艮第" },
      { hex: "#2F4F4F", name: "暗岩灰" },
      { hex: "#4B0082", name: "靛青紫" },
      { hex: "#DC143C", name: "绯红色" },
      { hex: "#008080", name: "水鸭蓝" },
      { hex: "#483D8B", name: "暗蓝紫" },
      { hex: "#C0C0C0", name: "银灰色" },
      { hex: "#191970", name: "午夜蓝" },
      { hex: "#FFFFFF", name: "纯白色" },
    ],
    avoid: [
      { hex: "#FFD700", name: "金黄色" },
      { hex: "#F5CBA7", name: "蜜桃色" },
      { hex: "#ABEBC6", name: "嫩叶绿" },
      { hex: "#F7DC6F", name: "柠檬黄" },
      { hex: "#E59866", name: "暖杏色" },
    ],
    combos: [
      [
        { hex: "#000080", name: "海军蓝" },
        { hex: "#FFFFFF", name: "纯白色" },
        { hex: "#DC143C", name: "绯红色" },
      ],
      [
        { hex: "#4B0082", name: "靛青紫" },
        { hex: "#C0C0C0", name: "银灰色" },
        { hex: "#008080", name: "水鸭蓝" },
        { hex: "#2F4F4F", name: "暗岩灰" },
      ],
      [
        { hex: "#800020", name: "勃艮第" },
        { hex: "#191970", name: "午夜蓝" },
        { hex: "#483D8B", name: "暗蓝紫" },
      ],
    ],
  },
};

function determineSeason(profile: UserProfile): Season {
  const { skinTone, hairColor, hairType } = profile;
  const hc = (hairColor || "").toLowerCase();

  const isWarmHair = /金|blonde|棕|brown|红|red|auburn|栗/.test(hc);
  const isCoolHair = /黑|black|深|dark|灰|grey|gray|银|silver/.test(hc);

  switch (skinTone) {
    case "fair":
      if (hairType === "straight" || hairType === "wavy") {
        return isWarmHair ? "spring" : "summer";
      }
      return isCoolHair ? "summer" : "spring";
    case "light":
      return isWarmHair ? "spring" : "summer";
    case "medium":
      return isCoolHair ? "spring" : "autumn";
    case "olive":
      return "autumn";
    case "tan":
      return isCoolHair ? "winter" : "autumn";
    case "dark":
      return "winter";
    default:
      return "autumn";
  }
}

function Swatch({ color, size = "normal" }: { color: ColorSwatch; size?: "normal" | "small" }) {
  const dim = size === "small" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "small" ? "text-[9px]" : "text-[10px]";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${dim} rounded-full shadow-md border border-white/50 transition-transform hover:scale-110`}
        style={{ backgroundColor: color.hex }}
        title={`${color.name} ${color.hex}`}
      />
      <span className={`${textSize} text-[var(--noir)] opacity-70 leading-tight text-center`}>
        {color.name}
      </span>
    </div>
  );
}

export default function ColorScience({
  profile,
  colorAnalysis,
}: {
  profile: UserProfile;
  colorAnalysis: string;
}) {
  const season = useMemo(() => determineSeason(profile), [profile]);
  const data = SEASON_DATA[season];

  return (
    <div className="card-luxury space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-xl font-bold text-[var(--noir)]">
          {"\u{1F3A8}"} 季节色彩科学分析
        </h2>
      </div>

      {/* Season Badge */}
      <div
        className="rounded-2xl px-6 py-4 text-center"
        style={{ background: data.bg }}
      >
        <span className="text-3xl">{data.icon}</span>
        <h3
          className="text-2xl font-bold mt-1"
          style={{ color: data.textColor }}
        >
          {data.label}
        </h3>
        <p className="text-sm mt-1 opacity-70" style={{ color: data.textColor }}>
          基于您的肤色({profile.skinTone})与发色({profile.hairColor || "未知"})综合判定
        </p>
      </div>

      {/* Best Colors */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--gold-dark)] uppercase tracking-wider mb-3">
          {"✨"} 最佳色彩
        </h4>
        <p className="text-xs text-[var(--noir)] opacity-60 mb-3">
          这些色彩能够提亮您的肤色，让您焕发光彩
        </p>
        <div className="flex flex-wrap gap-4">
          {data.best.map((c) => (
            <Swatch key={c.hex} color={c} />
          ))}
        </div>
      </div>

      {/* Colors to Avoid */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--noir)] opacity-70 uppercase tracking-wider mb-3">
          {"\u{1F6AB}"} 避免色彩
        </h4>
        <p className="text-xs text-[var(--noir)] opacity-60 mb-3">
          这些色彩可能让您的肤色显得暗沉或不协调
        </p>
        <div className="flex flex-wrap gap-4">
          {data.avoid.map((c) => (
            <Swatch key={c.hex} color={c} />
          ))}
        </div>
      </div>

      {/* Color Combinations */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--gold-dark)] uppercase tracking-wider mb-3">
          {"\u{1F484}"} 色彩搭配建议
        </h4>
        <p className="text-xs text-[var(--noir)] opacity-60 mb-3">
          推荐搭配方案，可直接应用于穿搭组合
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.combos.map((combo, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--gold-light)] bg-[var(--cream)] p-4 flex flex-col items-center gap-3"
            >
              <span className="text-xs font-medium text-[var(--gold-dark)]">
                方案 {i + 1}
              </span>
              <div className="flex gap-2">
                {combo.map((c) => (
                  <Swatch key={c.hex} color={c} size="small" />
                ))}
              </div>
              {/* Continuous preview strip */}
              <div className="flex w-full h-3 rounded-full overflow-hidden shadow-inner">
                {combo.map((c, j) => (
                  <div
                    key={j}
                    className="flex-1"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Color Analysis Text */}
      {colorAnalysis && (
        <div className="border-t border-[var(--gold-light)] pt-4">
          <h4 className="text-sm font-semibold text-[var(--gold-dark)] uppercase tracking-wider mb-2">
            {"\u{1F4AC}"} AI 色彩分析
          </h4>
          <p className="text-sm text-[var(--noir)] leading-relaxed whitespace-pre-line opacity-80">
            {colorAnalysis}
          </p>
        </div>
      )}
    </div>
  );
}
