"use client";

import { useState, useEffect, useCallback } from "react";
import type { FullStylingPlan, RecommendedItem } from "@/lib/types";

interface WeatherData {
  city: string;
  current: { temp: number; code: number; wind: number };
  daily: { date: string; code: number; max: number; min: number }[];
}

const WX: Record<number, [string, string]> = {
  0: ["☀️", "晴"], 1: ["🌤️", "多云"], 2: ["🌤️", "多云"], 3: ["🌤️", "多云"],
  45: ["🌫️", "雾"], 48: ["🌫️", "雾"],
  51: ["🌦️", "小雨"], 53: ["🌦️", "小雨"], 55: ["🌦️", "小雨"], 56: ["🌦️", "小雨"], 57: ["🌦️", "小雨"],
  61: ["🌧️", "雨"], 63: ["🌧️", "雨"], 65: ["🌧️", "雨"], 67: ["🌧️", "雨"],
  71: ["❄️", "雪"], 73: ["❄️", "雪"], 75: ["❄️", "雪"], 77: ["❄️", "雪"],
  80: ["🌧️", "阵雨"], 81: ["🌧️", "阵雨"], 82: ["🌧️", "阵雨"],
  95: ["⛈️", "雷暴"], 96: ["⛈️", "雷暴"], 99: ["⛈️", "雷暴"],
};

function wxInfo(code: number): [string, string] {
  return WX[code] ?? ["🌤️", "多云"];
}

function isRainy(code: number) {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
}

function pickItems(temp: number, code: number, recs: FullStylingPlan["recommendations"]): RecommendedItem[] {
  const pick = (cat: keyof typeof recs) => recs[cat]?.items?.[0];
  const items: (RecommendedItem | undefined)[] = [];

  if (temp < 10) {
    items.push(pick("outerwear"), pick("tops"), pick("bottoms"), pick("accessories"));
  } else if (temp < 20) {
    items.push(pick("tops"), pick("bottoms"), pick("outerwear"), pick("shoes"));
  } else if (temp < 30) {
    items.push(pick("tops"), pick("dresses"), pick("shoes"), pick("accessories"), pick("fragrance"));
  } else {
    items.push(pick("dresses"), pick("tops"), pick("shoes"), pick("accessories"));
  }

  if (isRainy(code)) {
    const bag = pick("bags");
    if (bag) items.push({ ...bag, reason: bag.reason + " (建议防水款)" });
  }

  return items.filter((i): i is RecommendedItem => !!i).slice(0, 5);
}

function outfitNote(temp: number): string {
  if (temp < 10) return "厚外套+围巾";
  if (temp < 20) return "薄外套+长裤";
  if (temp < 30) return "轻便舒适";
  return "清凉透气";
}

export default function WeatherOutfit({ data, onClose }: { data: FullStylingPlan; onClose: () => void }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cityInput, setCityInput] = useState("");

  const fetchWeather = useCallback(async (lat: number, lon: number, city: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`
      );
      const d = await res.json();
      setWeather({
        city,
        current: { temp: d.current.temperature_2m, code: d.current.weather_code, wind: d.current.wind_speed_10m },
        daily: d.daily.time.map((t: string, i: number) => ({
          date: t, code: d.daily.weather_code[i], max: d.daily.temperature_2m_max[i], min: d.daily.temperature_2m_min[i],
        })),
      });
    } catch { setError("天气数据获取失败"); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); setError("请输入城市名称"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, "当前位置"),
      () => { setLoading(false); setError("定位被拒绝，请输入城市名称"); }
    );
  }, [fetchWeather]);

  const searchCity = async () => {
    if (!cityInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1`);
      const d = await res.json();
      if (!d.results?.length) { setError("未找到该城市"); setLoading(false); return; }
      const r = d.results[0];
      await fetchWeather(r.latitude, r.longitude, r.name);
    } catch { setError("城市搜索失败"); setLoading(false); }
  };

  const [emoji, label] = weather ? wxInfo(weather.current.code) : ["", ""];
  const items = weather ? pickItems(weather.current.temp, weather.current.code, data.recommendations) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card-luxury relative mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-2xl" style={{ color: "var(--gold)" }}>
          &times;
        </button>

        <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--gold)" }}>天气穿搭助手</h2>

        {/* City search fallback */}
        <div className="mb-4 flex gap-2">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchCity()}
            placeholder="输入城市名称..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--gold-light)", background: "var(--cream)", color: "var(--noir)" }}
          />
          <button
            onClick={searchCity}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--gold)" }}
          >
            搜索
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12" style={{ color: "var(--gold)" }}>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="ml-3">获取天气中...</span>
          </div>
        )}

        {!loading && error && !weather && (
          <p className="py-8 text-center text-sm" style={{ color: "var(--gold-dark)" }}>{error}</p>
        )}

        {weather && !loading && (
          <>
            {/* Current weather */}
            <div
              className="mb-4 rounded-xl p-4 text-center"
              style={{ background: "var(--cream-dark)" }}
            >
              <p className="text-sm opacity-70">{weather.city}</p>
              <p className="my-1 text-4xl">{emoji}</p>
              <p className="text-3xl font-bold" style={{ color: "var(--noir)" }}>
                {Math.round(weather.current.temp)}°C
              </p>
              <p className="text-sm" style={{ color: "var(--noir)" }}>
                {label} &middot; 风速 {weather.current.wind} km/h
              </p>
            </div>

            {/* Outfit recommendations */}
            <div className="mb-4">
              <h3 className="mb-3 font-semibold" style={{ color: "var(--gold)" }}>今日穿搭推荐</h3>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg p-3"
                    style={{ background: "var(--cream-dark)" }}
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "var(--gold)" }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--noir)" }}>
                        {item.brand} &middot; {item.itemName}
                      </p>
                      <p className="text-xs opacity-60">{item.color} &middot; {item.price}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--gold-dark)" }}>{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3-day forecast */}
            <div>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--gold)" }}>三日预报</h3>
              <div className="grid grid-cols-3 gap-2">
                {weather.daily.map((d) => {
                  const [de, dl] = wxInfo(d.code);
                  return (
                    <div
                      key={d.date}
                      className="rounded-lg p-2 text-center text-xs"
                      style={{ background: "var(--cream-dark)" }}
                    >
                      <p className="opacity-60">{d.date.slice(5)}</p>
                      <p className="my-1 text-lg">{de}</p>
                      <p style={{ color: "var(--noir)" }}>
                        {Math.round(d.max)}° / {Math.round(d.min)}°
                      </p>
                      <p className="mt-1 opacity-70">{dl} &middot; {outfitNote((d.max + d.min) / 2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
