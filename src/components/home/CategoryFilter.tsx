"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";

export const CategoryFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") || "all";

  const handleFilter = (key: string) => {
    if (key === "all") {
      router.push("/", { scroll: false });
    } else {
      router.push(`/?category=${key}`, { scroll: false });
    }
  };

  return (
    <div className="mx-auto flex max-w-container flex-wrap gap-2 px-8 pt-5">
      {siteConfig.categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => handleFilter(cat.key)}
          className={`rounded-full border px-4 py-1.5 text-meta font-medium transition-all duration-base ${
            current === cat.key
              ? "border-text-primary bg-text-primary text-bg-primary"
              : "border-border bg-bg-primary text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};
