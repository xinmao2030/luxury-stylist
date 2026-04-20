"use client";

import { useState, useEffect, useMemo } from "react";
import ProductImage from "@/components/ProductImage";
import { CATEGORY_ICONS } from "@/lib/constants";
import { buildSearchQuery, buildGoogleShoppingUrl, buildPlatformUrl, localStorageHelper } from "@/lib/utils";

export interface FavoriteItem {
  id: string;
  brand: string;
  collection: string;
  itemName: string;
  price: string;
  color: string;
  category: string;
  savedAt: string;
}

const storage = localStorageHelper<FavoriteItem>("luxury-stylist-favorites");

export const loadFavorites = storage.load;
export const saveFavorites = storage.save;

export function generateFavoriteId(brand: string, itemName: string): string {
  const str = `${brand}::${itemName}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return "fav-" + Math.abs(hash).toString(36);
}

export function toggleFavorite(item: FavoriteItem): boolean {
  const current = loadFavorites();
  const idx = current.findIndex((f) => f.id === item.id);
  if (idx >= 0) {
    current.splice(idx, 1);
    saveFavorites(current);
    return false;
  } else {
    current.push(item);
    saveFavorites(current);
    return true;
  }
}

interface Props {
  onBack: () => void;
}

export default function FavoritesView({ onBack }: Props) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  function removeFavorite(id: string) {
    const updated = favorites.filter((f) => f.id !== id);
    saveFavorites(updated);
    setFavorites(updated);
  }

  const grouped = useMemo(() => {
    const g: Record<string, FavoriteItem[]> = {};
    for (const fav of favorites) {
      const cat = fav.category || "other";
      (g[cat] ??= []).push(fav);
    }
    return g;
  }, [favorites]);

  if (favorites.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-6xl mb-6 opacity-30">&#x2661;</div>
        <h2 className="text-2xl font-bold mb-3">收藏夹是空的</h2>
        <p className="text-gray-500 mb-8">浏览方案推荐时，点击心形图标收藏喜欢的单品</p>
        <button onClick={onBack} className="btn-gold">返回首页</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          收藏夹
          <span className="text-sm font-normal text-gray-400 ml-2">共 {favorites.length} 件单品</span>
        </h2>
        <button onClick={onBack} className="text-[var(--gold-dark)] hover:text-[var(--gold)] text-sm transition-colors">
          返回首页
        </button>
      </div>

      {Object.entries(grouped).map(([catKey, items]) => (
        <div key={catKey} className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">{CATEGORY_ICONS[catKey] || "✨"}</span>
            {items[0]?.category || catKey}
            <span className="text-sm font-normal text-gray-400">({items.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((fav) => (
              <div key={fav.id} className="card-luxury overflow-hidden flex flex-col">
                <ProductImage
                  query={buildSearchQuery(fav)}
                  alt={`${fav.brand} ${fav.itemName}`}
                  brandInitial={fav.brand.charAt(0)}
                  heightClass="h-48"
                  showLightbox={false}
                />
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{fav.brand}</p>
                      <p className="text-sm text-gray-500">{fav.collection}</p>
                    </div>
                    <span className="text-[var(--gold-dark)] font-semibold whitespace-nowrap ml-2">{fav.price}</span>
                  </div>
                  <p className="font-medium">{fav.itemName}</p>
                  {fav.color && fav.color !== "不适用" && (
                    <p className="text-sm"><span className="text-gray-500">颜色: </span>{fav.color}</p>
                  )}
                  <p className="text-xs text-gray-400">收藏于 {new Date(fav.savedAt).toLocaleDateString("zh-CN")}</p>
                  <div className="mt-auto pt-3 border-t border-[var(--cream-dark)] flex gap-2">
                    <a
                      href={buildGoogleShoppingUrl(fav)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-3 py-2 bg-[var(--gold)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      去购买
                    </a>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100 transition-colors"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
