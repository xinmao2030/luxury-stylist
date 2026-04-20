"use client";

import { useState, useEffect } from "react";
import type { ImageResult } from "@/lib/types";
import { fetchImages } from "@/lib/client-utils";
import { buildSearchQuery, buildGoogleImageUrl } from "@/lib/utils";
import type { RecommendedItem } from "@/lib/types";

interface Props {
  query: string;
  alt: string;
  brandInitial?: string;
  heightClass?: string;
  onClickImage?: () => void;
  showLightbox?: boolean;
}

export default function ProductImage({
  query,
  alt,
  brandInitial = "?",
  heightClass = "h-52",
  showLightbox = true,
}: Props) {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchImages(query + " product official", controller.signal)
      .then((imgs) => {
        if (imgs.length > 0) setImages(imgs);
        else setError(true);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => controller.abort();
  }, [query]);

  if (error || images.length === 0) {
    return (
      <div className={`w-full ${heightClass} bg-gradient-to-br from-[var(--cream-dark)] to-[var(--cream)] flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-4xl font-bold text-[var(--gold)] opacity-30">
            {brandInitial}
          </p>
          <p className="text-xs text-gray-400 mt-2">暂无图片</p>
        </div>
      </div>
    );
  }

  const currentImg = images[activeIdx];

  return (
    <>
      <div
        className={`relative w-full ${heightClass} overflow-hidden bg-white cursor-pointer group`}
        onClick={() => showLightbox && setShowFull(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImg.thumb || currentImg.full}
          alt={alt}
          className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (activeIdx < images.length - 1) {
              setActiveIdx((i) => i + 1);
              setLoaded(false);
            } else {
              setError(true);
            }
          }}
          referrerPolicy="no-referrer"
        />
        {!loaded && !error && (
          <div className="absolute inset-0 loading-shimmer" />
        )}
        {showLightbox && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full">
              点击放大
            </span>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setLoaded(false); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeIdx ? "bg-[var(--gold)] scale-125" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {showFull && showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowFull(false)}
        >
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImg.full}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setShowFull(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-black shadow-lg"
            >
              ×
            </button>
            {images.length > 1 && (
              <div className="absolute top-1/2 -translate-y-1/2 -left-12 flex flex-col gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveIdx(i); setLoaded(false); }}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeIdx ? "border-[var(--gold)]" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.thumb || img.full}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function ProductImageFromItem({ item }: { item: RecommendedItem }) {
  return (
    <ProductImage
      query={buildSearchQuery(item)}
      alt={`${item.brand} ${item.itemName}`}
      brandInitial={item.brand.charAt(0)}
    />
  );
}

export function SmallProductThumb({ query, alt }: { query: string; alt: string }) {
  return (
    <ProductImage
      query={query}
      alt={alt}
      heightClass="h-16"
      showLightbox={false}
      brandInitial="?"
    />
  );
}
