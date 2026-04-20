"use client";

import { useState, useEffect, useCallback } from "react";
import type { ImageResult } from "@/lib/types";
import { fetchImages } from "@/lib/client-utils";

interface StyleDimension {
  label: string;
  optionA: { name: string; query: string; tags: string[] };
  optionB: { name: string; query: string; tags: string[] };
}

const STYLE_DIMENSIONS: StyleDimension[] = [
  {
    label: "风格基调",
    optionA: { name: "经典优雅", query: "classic elegant outfit luxury", tags: ["经典优雅"] },
    optionB: { name: "现代简约", query: "modern minimalist fashion outfit", tags: ["现代简约"] },
  },
  {
    label: "装饰程度",
    optionA: { name: "极简主义", query: "minimal clean outfit style", tags: ["日系极简"] },
    optionB: { name: "华丽装饰", query: "maximalist ornate fashion luxury", tags: ["华丽戏剧"] },
  },
  {
    label: "色彩倾向",
    optionA: { name: "暖色调", query: "warm tone outfit beige camel fashion", tags: ["自然清新"] },
    optionB: { name: "冷色调", query: "cool tone outfit black grey fashion", tags: ["暗黑哥特"] },
  },
  {
    label: "廓形偏好",
    optionA: { name: "结构廓形", query: "structured tailored outfit fashion", tags: ["商务精英"] },
    optionB: { name: "飘逸流畅", query: "flowing draped outfit fashion", tags: ["波西米亚"] },
  },
  {
    label: "表达风格",
    optionA: { name: "大胆张扬", query: "bold statement fashion outfit", tags: ["街头潮流"] },
    optionB: { name: "低调含蓄", query: "subtle understated luxury fashion", tags: ["法式慵懒"] },
  },
  {
    label: "场合取向",
    optionA: { name: "休闲随性", query: "casual chic relaxed fashion outfit", tags: ["运动休闲"] },
    optionB: { name: "正式精致", query: "formal refined fashion outfit", tags: ["意式风情"] },
  },
  {
    label: "色彩丰富度",
    optionA: { name: "单色系", query: "monochrome outfit fashion all black", tags: ["英伦绅士"] },
    optionB: { name: "多彩搭配", query: "colorful vibrant outfit fashion", tags: ["韩系甜美"] },
  },
  {
    label: "时代感",
    optionA: { name: "复古怀旧", query: "vintage retro fashion outfit style", tags: ["复古怀旧"] },
    optionB: { name: "当代前卫", query: "contemporary avant-garde fashion outfit", tags: ["街头潮流", "现代简约"] },
  },
];

function QuizRound({
  dimension,
  roundIndex,
  onSelect,
}: {
  dimension: StyleDimension;
  roundIndex: number;
  onSelect: (tags: string[]) => void;
}) {
  const [imagesA, setImagesA] = useState<ImageResult[]>([]);
  const [imagesB, setImagesB] = useState<ImageResult[]>([]);
  const [loadingA, setLoadingA] = useState(true);
  const [loadingB, setLoadingB] = useState(true);
  const [selected, setSelected] = useState<"A" | "B" | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingA(true);
    setLoadingB(true);
    setSelected(null);

    fetchImages(dimension.optionA.query, controller.signal)
      .then((imgs) => setImagesA(imgs.slice(0, 3)))
      .catch((e) => { if (e.name !== "AbortError") setImagesA([]); })
      .finally(() => setLoadingA(false));

    fetchImages(dimension.optionB.query, controller.signal)
      .then((imgs) => setImagesB(imgs.slice(0, 3)))
      .catch((e) => { if (e.name !== "AbortError") setImagesB([]); })
      .finally(() => setLoadingB(false));

    return () => controller.abort();
  }, [dimension]);

  const handleSelect = (side: "A" | "B") => {
    setSelected(side);
    const tags = side === "A" ? dimension.optionA.tags : dimension.optionB.tags;
    setTimeout(() => onSelect(tags), 400);
  };

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-xs text-[var(--gold-dark)] uppercase tracking-widest mb-1">
          第 {roundIndex + 1} / {STYLE_DIMENSIONS.length} 轮
        </p>
        <h3 className="text-xl font-bold">{dimension.label}</h3>
        <p className="text-sm text-gray-500 mt-1">选择更吸引您的风格</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Option A */}
        <button
          type="button"
          onClick={() => handleSelect("A")}
          className={`group rounded-xl overflow-hidden border-2 transition-all ${
            selected === "A"
              ? "border-[var(--gold)] shadow-lg scale-[1.02]"
              : selected === "B"
              ? "border-transparent opacity-50"
              : "border-transparent hover:border-[var(--gold-light)]"
          }`}
        >
          <div className="grid grid-cols-1 gap-1">
            {loadingA ? (
              <div className="h-40 loading-shimmer" />
            ) : imagesA.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5 h-40 overflow-hidden">
                {imagesA.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.thumb || img.full}
                    alt=""
                    className="w-full h-40 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            ) : (
              <div className="h-40 bg-[var(--cream-dark)] flex items-center justify-center">
                <span className="text-3xl opacity-30">A</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-white text-center">
            <p className="font-semibold text-sm">{dimension.optionA.name}</p>
          </div>
        </button>

        {/* Option B */}
        <button
          type="button"
          onClick={() => handleSelect("B")}
          className={`group rounded-xl overflow-hidden border-2 transition-all ${
            selected === "B"
              ? "border-[var(--gold)] shadow-lg scale-[1.02]"
              : selected === "A"
              ? "border-transparent opacity-50"
              : "border-transparent hover:border-[var(--gold-light)]"
          }`}
        >
          <div className="grid grid-cols-1 gap-1">
            {loadingB ? (
              <div className="h-40 loading-shimmer" />
            ) : imagesB.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5 h-40 overflow-hidden">
                {imagesB.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.thumb || img.full}
                    alt=""
                    className="w-full h-40 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            ) : (
              <div className="h-40 bg-[var(--cream-dark)] flex items-center justify-center">
                <span className="text-3xl opacity-30">B</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-white text-center">
            <p className="font-semibold text-sm">{dimension.optionB.name}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

interface Props {
  onComplete: (stylePreferences: string[]) => void;
  onClose: () => void;
}

export default function StyleQuiz({ onComplete, onClose }: Props) {
  const [round, setRound] = useState(0);
  const [collectedTags, setCollectedTags] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const handleSelect = useCallback(
    (tags: string[]) => {
      const next = [...collectedTags, ...tags];
      setCollectedTags(next);

      if (round + 1 >= STYLE_DIMENSIONS.length) {
        setFinished(true);
      } else {
        setRound((r) => r + 1);
      }
    },
    [collectedTags, round]
  );

  // Dedupe and rank tags by frequency, take top 5
  const computeResult = useCallback((): string[] => {
    const freq: Record<string, number> = {};
    for (const tag of collectedTags) {
      freq[tag] = (freq[tag] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [collectedTags]);

  const resultTags = finished ? computeResult() : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--cream-dark)]">
          <h2 className="text-lg font-bold">
            {finished ? "您的风格 DNA" : "风格测试"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
          >
            x
          </button>
        </div>

        {/* Progress bar */}
        {!finished && (
          <div className="px-5 pt-4">
            <div className="w-full bg-[var(--cream-dark)] rounded-full h-1.5">
              <div
                className="bg-[var(--gold)] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((round + 1) / STYLE_DIMENSIONS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {finished ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-4">
                基于您的选择，我们为您生成了专属风格档案
              </p>
              <div className="inline-block bg-[var(--cream)] rounded-xl p-6 mb-6">
                <p className="text-lg font-bold mb-3 gold-text">
                  您的风格DNA: {resultTags.join(" + ")}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {resultTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-[var(--gold)] text-white rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="btn-gold"
                onClick={() => onComplete(resultTags)}
              >
                应用到我的档案
              </button>
            </div>
          ) : (
            <QuizRound
              key={round}
              dimension={STYLE_DIMENSIONS[round]}
              roundIndex={round}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
