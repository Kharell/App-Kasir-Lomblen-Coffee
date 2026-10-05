"use client";

import { CATEGORY_ICON, cn, formatIDR } from "@/lib/utils";
import { CATEGORY_LABEL, type MenuCategory } from "@/types";

const CATEGORIES: (MenuCategory | "all")[] = [
  "all",
  "kopi",
  "non-kopi",
  "ringan",
  "berat",
];

/** Filter kategori horizontal, target sentuh min 44px. */
export function CategoryTabs({
  active,
  onChange,
  counts,
}: {
  active: MenuCategory | "all";
  onChange: (c: MenuCategory | "all") => void;
  counts: Record<string, number>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Kategori menu"
      className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
    >
      {CATEGORIES.map((c) => {
        const isActive = active === c;
        const label = c === "all" ? "Semua" : CATEGORY_LABEL[c];
        const count = c === "all" ? counts.all : counts[c];
        return (
          <button
            key={c}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "flex h-touch shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-semibold",
              "transition-colors duration-100",
              isActive
                ? "border-espresso-800 bg-espresso-800 text-white"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
            )}
          >
            {c !== "all" && (
              <span aria-hidden="true">{CATEGORY_ICON[c as MenuCategory]}</span>
            )}
            {label}
            {count > 0 && (
              <span
                className={cn(
                  "money rounded px-1.5 py-0.5 text-[11px]",
                  isActive ? "bg-white/20" : "bg-zinc-100 text-zinc-600"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { formatIDR };