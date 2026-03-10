export const i18n = {
  defaultLocale: "ko" as const,
  locales: ["ko", "en"] as const,
};

export type Locale = (typeof i18n)["locales"][number];

export const localeNames: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
};

export const isValidLocale = (locale: string): locale is Locale => {
  return i18n.locales.includes(locale as Locale);
};
