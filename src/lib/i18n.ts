export type Lang = "en" | "zh";
export const LANG_COOKIE = "pp-lang";

export type Translate = (en: string, zh: string) => string;

/** Every sentence is written in both languages side by side; this picks the one to show. */
export const translator = (lang: Lang): Translate => (en, zh) => (lang === "zh" ? zh : en);

export function langFrom(cookie: string | undefined, acceptLanguage: string | null): Lang {
  if (cookie === "en" || cookie === "zh") return cookie;
  return /^\s*zh\b/i.test(acceptLanguage ?? "") ? "zh" : "en";
}
