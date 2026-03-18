"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { isValidLocale } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

const NotFoundMascot = dynamic(
  () =>
    import("@/components/mascot/NotFoundMascot").then((m) => ({
      default: m.NotFoundMascot,
    })),
  { ssr: false }
);

const DICT: Record<Locale, {
  title: string;
  message: string;
  submessage: string;
  button: string;
}> = {
  ko: {
    title: "404",
    message: "페이지를 찾을 수 없습니다",
    submessage: "이더봇도 길을 잃은 것 같아요...",
    button: "홈으로 돌아가기",
  },
  en: {
    title: "404",
    message: "Page not found",
    submessage: "Even EtherBot seems to be lost...",
    button: "Go back home",
  },
};

const NotFound = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const rawLocale = segments[0] ?? "ko";
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ko";
  const dict = DICT[locale];

  const prefix = locale === "ko" ? "" : `/${locale}`;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      {/* 404 gradient text */}
      <h1
        className="mb-4 text-[5rem] font-[800] leading-none sm:text-[8rem]"
        style={{
          background: "linear-gradient(135deg, var(--brand-primary), #8B5CF6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {dict.title}
      </h1>

      {/* Lost mascot */}
      <NotFoundMascot />

      {/* Messages */}
      <p className="mb-2 text-xl font-semibold text-text-primary">
        {dict.message}
      </p>
      <p className="mb-8 text-text-tertiary">
        {dict.submessage}
      </p>

      {/* Home button */}
      <Link
        href={`${prefix}/`}
        className="inline-block rounded-lg px-6 py-2.5 text-[0.9375rem] font-semibold text-white transition-opacity duration-200 hover:opacity-85"
        style={{ background: "var(--brand-primary)" }}
      >
        {dict.button}
      </Link>
    </div>
  );
};

export default NotFound;
