"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

interface LocaleSwitchProps {
  currentLocale: string;
  slug: string;
  availableLocales: { locale: string; slug: string }[];
}

export const LocaleSwitch = ({ currentLocale, availableLocales }: LocaleSwitchProps) => {
  if (availableLocales.length <= 1) return null;

  const other = availableLocales.find((l) => l.locale !== currentLocale);
  if (!other) return null;

  const label = other.locale === "en" ? "English" : "한국어";

  return (
    <Link
      href={`/post/${other.slug}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-meta font-medium text-text-secondary transition-all duration-base hover:border-brand-primary hover:text-brand-primary"
    >
      <Globe size={14} />
      {label}
    </Link>
  );
};
