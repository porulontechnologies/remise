"use client";

import React, { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  CarFront,
  Trophy,
  Gift,
  Brain,
  Palette,
  Gamepad2,
  ArrowRight,
  Sparkles,
  Zap,
  Loader2,
  ShoppingBasket,
  Star,
  Shirt,
  Home,
  Smartphone,
  Heart,
  Apple,
  Carrot,
  Flower2,
  Pill,
  Dumbbell,
  Package,
} from "lucide-react";
import { API_URL, resolveProductImageUrl } from '@/app/utils/api';

const ICON_MAP: Record<string, React.ElementType> = {
  CarFront,
  Trophy,
  Gift,
  Brain,
  Palette,
  Gamepad2,
  Sparkles,
  Zap,
  ShoppingBasket,
  Star,
  Shirt,
  Home,
  Smartphone,
  Heart,
  Apple,
  Carrot,
  Flower2,
  Pill,
  Dumbbell,
  Package,
};

export interface CategoryItem {
  id: string;
  title: string;
  img: string;
  color: string;
  accent: string;
  icon: string;
  count: number;
  description: string;
  badge: string;
}

interface ShopByCategorySectionProps {
  theme?: "dark" | "light";
  isPreview?: boolean;
  previewData?: CategoryItem[];
}

const CATEGORY_ICON_RULES: [string, string][] = [
  ["grocery", "ShoppingBasket"],
  ["food", "ShoppingBasket"],
  ["beauty", "Heart"],
  ["toy", "Gamepad2"],
  ["fashion", "Shirt"],
  ["household", "Home"],
  ["home", "Home"],
  ["electronic", "Smartphone"],
  ["fruit", "Apple"],
  ["vegetable", "Carrot"],
  ["flower", "Flower2"],
  ["pharmacy", "Pill"],
  ["sport", "Dumbbell"],
];

const COLOR_PALETTE: { color: string; accent: string }[] = [
  { color: "from-green-400 to-emerald-600", accent: "text-green-600" },
  { color: "from-pink-400 to-rose-600", accent: "text-pink-500" },
  { color: "from-yellow-400 to-orange-500", accent: "text-orange-500" },
  { color: "from-purple-400 to-indigo-600", accent: "text-purple-500" },
  { color: "from-teal-400 to-cyan-600", accent: "text-teal-600" },
  { color: "from-blue-400 to-sky-600", accent: "text-blue-500" },
  { color: "from-red-400 to-rose-500", accent: "text-red-500" },
  { color: "from-amber-400 to-yellow-600", accent: "text-amber-600" },
  { color: "from-lime-400 to-green-600", accent: "text-lime-600" },
  { color: "from-fuchsia-400 to-purple-600", accent: "text-fuchsia-600" },
];

function iconForCategory(name: string): string {
  const lower = name.toLowerCase();
  const match = CATEGORY_ICON_RULES.find(([key]) => lower.includes(key));
  return match ? match[1] : "Package";
}

function badgeForCount(count: number): string {
  if (count === 0) return "Explore";
  if (count >= 50) return "Popular";
  if (count >= 15) return "Trending";
  return "In Stock";
}

const CategoryCard = memo(
  ({
    item,
    theme,
    index,
  }: {
    item: CategoryItem;
    theme: "dark" | "light";
    index: number;
  }) => {
    const router = useRouter();
    const isLight = theme === "light";
    const IconComp = ICON_MAP[item.icon] || Sparkles;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.06 }}
        whileHover={{ y: -4 }}
        onClick={() => router.push(`/category/${encodeURIComponent(item.id)}`)}
        className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 ${isLight ? "bg-white border-[#BBD5DA] hover:border-[#0FA3B1] hover:shadow-lg" : "bg-gray-900 border-white/10 hover:border-white/20 hover:shadow-xl"}`}
      >
        {/* Image */}
        <div
          className={`relative aspect-[4/3] overflow-hidden ${isLight ? "bg-[#F5F5F5]" : "bg-gray-800"}`}
        >
          {item.img ? (
            <img
              src={item.img}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${item.color}`}
            >
              <IconComp size={32} className="text-white/70" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Badge */}
          <span className="absolute top-3 right-3 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
            {item.badge}
          </span>

          {/* Icon */}
          <div
            className={`absolute bottom-3 left-3 p-2.5 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}
          >
            <IconComp size={16} />
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3
            className={`font-bold text-sm mb-0.5 truncate ${isLight ? "text-gray-900" : "text-white"}`}
          >
            {item.title}
          </h3>
          <p
            className={`text-xs mb-2 truncate ${isLight ? "text-gray-500" : "text-gray-400"}`}
          >
            {item.description}
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${item.accent}`}>
              {item.count} items
            </span>
            <span
              className={`flex items-center gap-1 text-xs font-semibold transition group-hover:gap-2 ${isLight ? "text-teal-600" : "text-[#D4AF37]"}`}
            >
              Explore <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </motion.div>
    );
  },
);
CategoryCard.displayName = "CategoryCard";

const ShopByCategory = memo(
  ({
    theme = "dark",
    isPreview = false,
    previewData = [],
  }: ShopByCategorySectionProps) => {
    const router = useRouter();
    const [items, setItems] = useState<CategoryItem[]>(previewData);
    const [loading, setLoading] = useState(!isPreview);
    const isLight = theme === "light";

    useEffect(() => {
      if (isPreview) {
        setItems(previewData);
        return;
      }
      (async () => {
        try {
          const endpoints = [
            API_URL,
            typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
              ? `${window.location.origin}/api`
              : null,
            "http://localhost:3003/api",
            "http://localhost:3000/api",
            "http://localhost:5000/api",
          ].filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);

          let products: any[] = [];
          let apiCategories: { _id: string; name: string }[] = [];

          for (const baseUrl of endpoints) {
            try {
              const [catRes, prodRes] = await Promise.all([
                fetch(`${baseUrl}/categories`, { cache: "no-store" })
                  .then((r) => (r.ok ? r.json() : null))
                  .catch(() => null),
                fetch(`${baseUrl}/products?limit=10000`, { cache: "no-store" })
                  .then((r) => (r.ok ? r.json() : null))
                  .catch(() => null),
              ]);

              const parsedProds = Array.isArray(prodRes?.data)
                ? prodRes.data
                : Array.isArray(prodRes?.products)
                ? prodRes.products
                : Array.isArray(prodRes)
                ? prodRes
                : [];

              const parsedCats =
                catRes?.success && Array.isArray(catRes.data)
                  ? catRes.data
                  : Array.isArray(catRes)
                  ? catRes
                  : [];

              if (parsedProds.length > 0 || parsedCats.length > 0) {
                products = parsedProds;
                apiCategories = parsedCats;
                break;
              }
            } catch {
              // Try next endpoint
            }
          }

          const seen = new Set<string>();
          const names: string[] = [];
          const addIfNew = (name: string) => {
            if (!name) return;
            const key = name.trim().toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            names.push(name.trim());
          };

          apiCategories.forEach((c) => addIfNew(c.name));
          products.forEach((p) => addIfNew(p.category));

          const built: CategoryItem[] = names.map((name, i) => {
            const catProducts = products.filter(
              (p) => (p.category || "").toLowerCase().trim() === name.toLowerCase().trim(),
            );
            // Use real photo from one of this category's own products from DB
            const withImage = catProducts.find(
              (p) => (p.images && p.images[0]) || p.imageUrl,
            );
            const rawImg = withImage
              ? withImage.images?.[0] || withImage.imageUrl
              : "";
            const img = rawImg ? resolveProductImageUrl(rawImg) : "";

            const palette = COLOR_PALETTE[i % COLOR_PALETTE.length];

            return {
              id: name,
              title: name,
              img,
              color: palette.color,
              accent: palette.accent,
              icon: iconForCategory(name),
              count: catProducts.length,
              description: `${catProducts.length} product${catProducts.length === 1 ? "" : "s"} available`,
              badge: badgeForCount(catProducts.length),
            };
          });

          // Show real database categories with inventory first
          const sorted = [...built].sort((a, b) => b.count - a.count);
          const withProducts = sorted.filter((item) => item.count > 0);
          setItems(withProducts.length > 0 ? withProducts.slice(0, 6) : sorted.slice(0, 6));
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      })();
    }, [isPreview, previewData]);

    if (loading)
      return (
        <div
          className={`py-20 flex justify-center ${isLight ? "bg-[#F5F5F5]" : "bg-gray-950"}`}
        >
          <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
        </div>
      );
    if (!items.length) return null;

    return (
      <section
        className={`py-12 md:py-16 ${isLight ? "bg-[#F5F5F5]" : "bg-gray-950"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-end justify-between mb-7">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-[#D4AF37]" />
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                  All Categories
                </span>
              </div>
              <h2
                className={`text-2xl md:text-3xl font-black ${isLight ? "text-gray-900" : "text-white"}`}
              >
                Shop by Category
              </h2>
            </div>
            <button
              onClick={() => router.push("/category/all")}
              className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold transition group ${isLight ? "text-teal-600 hover:text-teal-700" : "text-[#D4AF37] hover:text-yellow-300"}`}
            >
              View All{" "}
              <ArrowRight
                size={15}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {items.map((item, i) => (
              <CategoryCard key={item.id} item={item} theme={theme} index={i} />
            ))}
          </div>

          {/* Mobile view all */}
          <div className="mt-6 flex justify-center sm:hidden">
            <button
              onClick={() => router.push("/category/all")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border font-semibold text-sm transition ${isLight ? "border-[#BBD5DA] text-gray-700 hover:bg-white" : "border-white/10 text-white hover:bg-white/5"}`}
            >
              View All Categories <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    );
  },
);
ShopByCategory.displayName = "ShopByCategory";

export default function ShopByCategorySection({
  theme = "dark",
  isPreview,
  previewData,
}: ShopByCategorySectionProps) {
  return (
    <ShopByCategory
      theme={theme}
      isPreview={isPreview}
      previewData={previewData}
    />
  );
}
