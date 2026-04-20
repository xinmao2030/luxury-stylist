"use client";

import { useState, useRef, useCallback } from "react";
import StyleQuiz from "@/components/StyleQuiz";
import type { UserProfile } from "@/lib/types";
import {
  STYLE_OPTIONS,
  OCCASION_OPTIONS,
  PERSONALITY_OPTIONS,
  LIFESTYLE_OPTIONS,
  BUDGET_TIERS,
} from "@/lib/types";

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: 30,
  gender: "female",
  nationality: "中国",
  city: "上海",
  height: 165,
  weight: 55,
  bodyType: "average",
  skinTone: "light",
  hairColor: "黑色",
  hairType: "straight",
  faceShape: "oval",
  occupation: "",
  industry: "",
  socialRole: "",
  budgetTier: "mid",
  monthlyBudget: 10000,
  currency: "USD",
  stylePreferences: [],
  favorBrands: [],
  avoidBrands: [],
  colorPreferences: [],
  occasions: [],
  personality: [],
  lifestyle: [],
  specialNeeds: "",
  existingItems: [],
};

interface Props {
  onSubmit: (profile: UserProfile) => void;
  loading: boolean;
}

function MultiSelect({
  options,
  selected,
  onChange,
  max = 5,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              if (active) onChange(selected.filter((s) => s !== opt));
              else if (selected.length < max) onChange([...selected, opt]);
            }}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              active
                ? "bg-[var(--gold)] text-white"
                : "bg-[var(--cream-dark)] text-[var(--noir)] hover:bg-[var(--gold-light)]"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 bg-[var(--gold-light)] text-[var(--noir)] rounded-full text-sm flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="text-[var(--gold-dark)] hover:text-red-500 font-bold"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        data-taginput="true"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && input.trim()) {
            e.preventDefault();
            e.stopPropagation();
            if (!value.includes(input.trim())) {
              onChange([...value, input.trim()]);
            }
            setInput("");
          }
        }}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );
}

export default function ProfileForm({ onSubmit, loading }: Props) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [step, setStep] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof UserProfile>(key: K, val: UserProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: val }));

  const handleFormKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      // TagInput: if typing text, let it add tag instead of navigating
      if (target.tagName === "INPUT" && target.getAttribute("data-taginput")) {
        if ((target as HTMLInputElement).value.trim()) return;
      }

      e.preventDefault();
      const container = formRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'input:not([type="radio"]):not([type="hidden"]), select, textarea'
        )
      );
      const idx = focusable.indexOf(target as HTMLElement);
      if (idx >= 0 && idx < focusable.length - 1) {
        focusable[idx + 1].focus();
      } else {
        // Last field in this step — advance to next step
        const isLast = step === steps.length - 1;
        if (!isLast) {
          setStep((s) => s + 1);
          setTimeout(() => {
            const next = formRef.current?.querySelector<HTMLElement>(
              'input:not([type="radio"]):not([type="hidden"]), select, textarea'
            );
            next?.focus();
          }, 50);
        }
      }
    },
    [step]
  );

  const steps = [
    {
      title: "基础信息",
      subtitle: "让我们先了解您",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">称呼</label>
            <input
              value={profile.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="您的称呼"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">年龄</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => update("age", +e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">性别</label>
            <select
              value={profile.gender}
              onChange={(e) => update("gender", e.target.value as UserProfile["gender"])}
              className="w-full"
            >
              <option value="female">女</option>
              <option value="male">男</option>
              <option value="non-binary">非二元</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">国籍</label>
            <input
              value={profile.nationality}
              onChange={(e) => update("nationality", e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">所在城市</label>
            <input
              value={profile.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "身体数据",
      subtitle: "精准推荐需要了解您的体型特征",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">身高 (cm)</label>
            <input
              type="number"
              value={profile.height}
              onChange={(e) => update("height", +e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">体重 (kg)</label>
            <input
              type="number"
              value={profile.weight}
              onChange={(e) => update("weight", +e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">体型</label>
            <select
              value={profile.bodyType}
              onChange={(e) => update("bodyType", e.target.value as UserProfile["bodyType"])}
              className="w-full"
            >
              <option value="slim">纤细</option>
              <option value="athletic">运动型</option>
              <option value="average">匀称</option>
              <option value="curvy">曲线型</option>
              <option value="plus">丰满</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">肤色</label>
            <select
              value={profile.skinTone}
              onChange={(e) => update("skinTone", e.target.value as UserProfile["skinTone"])}
              className="w-full"
            >
              <option value="fair">白皙</option>
              <option value="light">浅色</option>
              <option value="medium">中等</option>
              <option value="olive">橄榄色</option>
              <option value="tan">小麦色</option>
              <option value="dark">深色</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">发色</label>
            <input
              value={profile.hairColor}
              onChange={(e) => update("hairColor", e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">发质</label>
            <select
              value={profile.hairType}
              onChange={(e) => update("hairType", e.target.value as UserProfile["hairType"])}
              className="w-full"
            >
              <option value="straight">直发</option>
              <option value="wavy">微卷</option>
              <option value="curly">卷发</option>
              <option value="coily">螺旋卷</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">脸型</label>
            <select
              value={profile.faceShape}
              onChange={(e) => update("faceShape", e.target.value as UserProfile["faceShape"])}
              className="w-full"
            >
              <option value="oval">鹅蛋脸</option>
              <option value="round">圆脸</option>
              <option value="square">方脸</option>
              <option value="heart">心形脸</option>
              <option value="oblong">长脸</option>
              <option value="diamond">菱形脸</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      title: "职业与身份",
      subtitle: "您的社交场景决定穿搭方向",
      content: (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">职业</label>
            <input
              value={profile.occupation}
              onChange={(e) => update("occupation", e.target.value)}
              placeholder="例: 投资总监、律师、设计师"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">行业</label>
            <input
              value={profile.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="例: 金融、科技、时尚、医疗"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">社交角色定位</label>
            <input
              value={profile.socialRole}
              onChange={(e) => update("socialRole", e.target.value)}
              placeholder="例: 企业高管、创意总监、社交名媛、学术精英"
              className="w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "消费预算",
      subtitle: "合理的预算分配是好品味的基础",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">预算级别</label>
            <div className="space-y-2">
              {(Object.entries(BUDGET_TIERS) as [string, { label: string }][]).map(
                ([key, tier]) => (
                  <label
                    key={key}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                      profile.budgetTier === key
                        ? "bg-[var(--gold-light)] border-[var(--gold)]"
                        : "bg-white border-[var(--cream-dark)]"
                    } border`}
                  >
                    <input
                      type="radio"
                      name="budget"
                      checked={profile.budgetTier === key}
                      onChange={() => update("budgetTier", key as UserProfile["budgetTier"])}
                      className="mr-3"
                    />
                    {tier.label}
                  </label>
                )
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">月预算金额</label>
              <input
                type="number"
                value={profile.monthlyBudget}
                onChange={(e) => update("monthlyBudget", +e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">货币</label>
              <select
                value={profile.currency}
                onChange={(e) => update("currency", e.target.value as UserProfile["currency"])}
                className="w-full"
              >
                <option value="USD">USD 美元</option>
                <option value="CNY">CNY 人民币</option>
                <option value="EUR">EUR 欧元</option>
                <option value="GBP">GBP 英镑</option>
                <option value="JPY">JPY 日元</option>
                <option value="HKD">HKD 港币</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "风格偏好",
      subtitle: "选择最能代表您审美的关键词（最多5个）",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowQuiz(true)}
              className="btn-gold !text-sm !py-2.5 !px-6"
            >
              风格测试 — 用图片发现您的风格DNA
            </button>
            <p className="text-xs text-gray-400 mt-2">或在下方手动选择</p>
          </div>
          <div>
            <p className="section-title">风格方向</p>
            <MultiSelect
              options={STYLE_OPTIONS}
              selected={profile.stylePreferences}
              onChange={(v) => update("stylePreferences", v)}
            />
          </div>
          <div>
            <p className="section-title">常见场合</p>
            <MultiSelect
              options={OCCASION_OPTIONS}
              selected={profile.occasions}
              onChange={(v) => update("occasions", v)}
            />
          </div>
          <div>
            <p className="section-title">偏好品牌（回车添加）</p>
            <TagInput
              value={profile.favorBrands}
              onChange={(v) => update("favorBrands", v)}
              placeholder="输入品牌名按回车"
            />
          </div>
          <div>
            <p className="section-title">回避品牌（回车添加）</p>
            <TagInput
              value={profile.avoidBrands}
              onChange={(v) => update("avoidBrands", v)}
              placeholder="输入品牌名按回车"
            />
          </div>
          <div>
            <p className="section-title">偏好色彩（回车添加）</p>
            <TagInput
              value={profile.colorPreferences}
              onChange={(v) => update("colorPreferences", v)}
              placeholder="例: 黑色、驼色、酒红"
            />
          </div>
        </div>
      ),
    },
    {
      title: "性格与生活方式",
      subtitle: "内在气质决定外在表达",
      content: (
        <div className="space-y-6">
          <div>
            <p className="section-title">性格特征</p>
            <MultiSelect
              options={PERSONALITY_OPTIONS}
              selected={profile.personality}
              onChange={(v) => update("personality", v)}
            />
          </div>
          <div>
            <p className="section-title">生活方式</p>
            <MultiSelect
              options={LIFESTYLE_OPTIONS}
              selected={profile.lifestyle}
              onChange={(v) => update("lifestyle", v)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">特殊需求或备注</label>
            <textarea
              value={profile.specialNeeds}
              onChange={(e) => update("specialNeeds", e.target.value)}
              placeholder="例: 对某些面料过敏、需要遮盖某些部位、即将参加特定活动等"
              rows={3}
              className="w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "我的衣橱",
      subtitle: "告诉我们您已有的奢侈品单品（可选，方便推荐互补搭配）",
      content: (
        <div className="space-y-4">
          <div>
            <p className="section-title">已有单品（回车添加）</p>
            <TagInput
              value={profile.existingItems}
              onChange={(v) => update("existingItems", v)}
              placeholder="例: Hermes Birkin 30 黑色、Chanel 双C耳环"
            />
          </div>
          <p className="text-xs text-gray-400">
            添加您已拥有的奢侈品单品，AI 将推荐与之互补搭配的新品，避免重复购买。此步骤可跳过。
          </p>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                i <= step
                  ? "bg-[var(--gold)] text-white"
                  : "bg-[var(--cream-dark)] text-gray-400"
              }`}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  i < step ? "bg-[var(--gold)]" : "bg-[var(--cream-dark)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="card-luxury p-8" ref={formRef} onKeyDown={handleFormKeyDown}>
        <h2 className="text-2xl font-bold mb-1">{currentStep.title}</h2>
        <p className="text-gray-500 mb-6">{currentStep.subtitle}</p>
        {currentStep.content}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className={`px-6 py-2.5 rounded-lg text-sm ${
              step === 0 ? "invisible" : "bg-[var(--cream-dark)] hover:bg-gray-200"
            }`}
          >
            上一步
          </button>
          {isLast ? (
            <button
              className="btn-gold"
              disabled={loading || !profile.name}
              onClick={() => onSubmit(profile)}
            >
              {loading ? "AI 分析中..." : "生成专属方案"}
            </button>
          ) : (
            <button
              className="btn-gold"
              onClick={() => setStep((s) => s + 1)}
            >
              下一步
            </button>
          )}
        </div>
      </div>

      {/* Style Quiz Modal */}
      {showQuiz && (
        <StyleQuiz
          onComplete={(tags) => {
            update("stylePreferences", tags);
            setShowQuiz(false);
          }}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
}
