"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { CATEGORY_ICONS } from "@/lib/constants";
import { localStorageHelper } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface WardrobeItem {
  id: string;
  imageData: string; // base64 data URL from photo/upload
  category: string;
  brand: string;
  name: string;
  color: string;
  notes: string;
  addedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_ORDER = [
  "hair", "makeup", "tops", "bottoms", "dresses", "outerwear",
  "bags", "shoes", "accessories", "fragrance", "watches",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  hair: "发型", makeup: "妆容", tops: "上装", bottoms: "下装",
  dresses: "连衣裙/套装", outerwear: "外套", bags: "包袋",
  shoes: "鞋履", accessories: "配饰", fragrance: "香水", watches: "腕表",
};

const storage = localStorageHelper<WardrobeItem>("luxury-stylist-wardrobe");

const MAX_IMAGE_WIDTH = 400;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId(): string {
  return "w-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

/** Resize an image file to max width, return base64 data URL */
function resizeImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas unsupported")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  onClose: () => void;
}

export default function MyWardrobe({ onClose }: Props) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);

  // Upload form state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<string>("tops");
  const [formBrand, setFormBrand] = useState("");
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage
  useEffect(() => {
    setItems(storage.load());
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---- Image handling ---- */

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setToast("请选择图片文件");
      return;
    }
    try {
      const dataUrl = await resizeImage(file, MAX_IMAGE_WIDTH);
      setPreviewUrl(dataUrl);
    } catch {
      setToast("图片处理失败，请重试");
    }
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  }, [handleImageFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  }, [handleImageFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /* ---- Save item ---- */

  const handleSave = useCallback(() => {
    if (!previewUrl) { setToast("请先上传或拍摄一张照片"); return; }
    if (!formName.trim()) { setToast("请填写名称/描述"); return; }

    const newItem: WardrobeItem = {
      id: generateId(),
      imageData: previewUrl,
      category: formCategory,
      brand: formBrand.trim(),
      name: formName.trim(),
      color: formColor.trim(),
      notes: formNotes.trim(),
      addedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    try {
      storage.save(updated);
    } catch {
      setToast("存储空间不足，请删除一些旧衣物后重试");
      return;
    }
    setItems(updated);

    // Reset form
    setPreviewUrl(null);
    setFormCategory("tops");
    setFormBrand("");
    setFormName("");
    setFormColor("");
    setFormNotes("");
    setToast("已添加到衣橱");
  }, [previewUrl, formCategory, formBrand, formName, formColor, formNotes, items]);

  /* ---- Delete item ---- */

  const handleDelete = useCallback((id: string) => {
    const updated = items.filter((i) => i.id !== id);
    storage.save(updated);
    setItems(updated);
    setToast("已删除");
  }, [items]);

  /* ---- Filtered items ---- */

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((i) => i.category === activeFilter);
  }, [items, activeFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  const activeCats = useMemo(
    () => CATEGORY_ORDER.filter((c) => (categoryCounts[c] || 0) > 0),
    [categoryCounts],
  );

  /* ---- Render ---- */

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--cream)]">
      {/* ===== Header ===== */}
      <div
        className="flex-shrink-0 px-6 py-5"
        style={{
          background: "linear-gradient(135deg, var(--noir) 0%, var(--noir-light) 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--gold)]">
              我的衣橱
            </h1>
            <p className="text-xs text-[var(--gold-light)] opacity-70 mt-0.5">
              {items.length} 件单品
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center
                       text-[var(--gold-light)] hover:text-white hover:bg-white/10
                       transition-colors text-lg"
            aria-label="关闭"
          >
            &times;
          </button>
        </div>
      </div>

      {/* ===== Scrollable body ===== */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

          {/* ===== Upload Section ===== */}
          <section className="card-luxury p-5">
            <h2 className="text-base font-bold mb-4 text-[var(--noir)]">
              添加新衣物
            </h2>

            {!previewUrl ? (
              /* --- Drop zone --- */
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-colors
                  ${isDragging
                    ? "border-[var(--gold)] bg-[var(--gold-light)]/10"
                    : "border-gray-300 hover:border-[var(--gold-dark)]"}
                `}
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
              >
                <div className="text-4xl opacity-40 mb-3">📷</div>
                <p className="text-sm text-gray-500 mb-4">
                  拖拽照片到此处，或点击选择文件
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    className="btn-gold text-xs px-4 py-2"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    选择文件
                  </button>
                  <button
                    type="button"
                    className="btn-gold text-xs px-4 py-2"
                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                  >
                    拍照
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            ) : (
              /* --- Preview + form --- */
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Preview image */}
                <div className="flex-shrink-0 sm:w-40">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[var(--cream-dark)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="预览"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPreviewUrl(null)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white
                                 flex items-center justify-center text-xs hover:bg-black/70 transition-colors"
                      aria-label="移除照片"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                {/* Form */}
                <div className="flex-1 space-y-3">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">分类 *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                                 focus:outline-none focus:border-[var(--gold)] transition-colors"
                    >
                      {CATEGORY_ORDER.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">名称/描述 *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="例：经典风衣"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                                 focus:outline-none focus:border-[var(--gold)] transition-colors"
                    />
                  </div>

                  {/* Brand + Color row */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">品牌</label>
                      <input
                        type="text"
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        placeholder="例：Burberry"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                                   focus:outline-none focus:border-[var(--gold)] transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">颜色</label>
                      <input
                        type="text"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        placeholder="例：卡其色"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                                   focus:outline-none focus:border-[var(--gold)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">备注</label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="例：2024秋冬购入"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                                 focus:outline-none focus:border-[var(--gold)] transition-colors"
                    />
                  </div>

                  {/* Save button */}
                  <button onClick={handleSave} className="btn-gold text-sm px-5 py-2 mt-1">
                    添加到衣橱
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ===== Wardrobe Grid Section ===== */}
          <section>
            {/* Filter tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              <button
                onClick={() => setActiveFilter("all")}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${activeFilter === "all"
                    ? "bg-[var(--noir)] text-[var(--gold)]"
                    : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"}
                `}
              >
                全部 ({items.length})
              </button>
              {activeCats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`
                    flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                    ${activeFilter === cat
                      ? "bg-[var(--noir)] text-[var(--gold)]"
                      : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"}
                  `}
                >
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]} ({categoryCounts[cat]})
                </button>
              ))}
            </div>

            {/* Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl opacity-25 mb-4">👗</div>
                <p className="text-sm text-gray-400">
                  {items.length === 0
                    ? "衣橱还是空的，拍照或上传您的衣物开始吧"
                    : "该分类下暂无衣物"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="group card-luxury overflow-hidden transition-transform hover:scale-[1.02]"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-[var(--cream-dark)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageData}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Category badge */}
                      <span
                        className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full
                                   bg-[var(--noir)]/80 text-[var(--gold-light)] backdrop-blur-sm"
                      >
                        {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
                      </span>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
                                   bg-black/50 text-white text-sm
                                   opacity-0 group-hover:opacity-100 transition-opacity
                                   hover:bg-red-600"
                        aria-label="删除"
                      >
                        &times;
                      </button>
                    </div>
                    {/* Info */}
                    <div className="px-3 py-2.5">
                      {item.brand && (
                        <p className="text-[10px] text-[var(--gold-dark)] font-semibold uppercase tracking-wider truncate">
                          {item.brand}
                        </p>
                      )}
                      <p className="text-xs text-[var(--noir)] font-medium truncate mt-0.5">
                        {item.name}
                      </p>
                      {item.color && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          {item.color}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ===== Toast ===== */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]
                     bg-[var(--noir)] text-[var(--gold-light)] text-sm
                     px-5 py-2.5 rounded-full shadow-lg
                     animate-[fadeInUp_0.25s_ease-out]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
