"use client";

import { createContext, useContext, useMemo } from "react";
import { translator, type Lang, type Translate } from "@/lib/i18n";
import { localize, term } from "@/lib/i18n-text";

const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/**
 * `t(en, zh)` picks a hand-written pair; `term` names a style, fabric or occasion code;
 * `loc` translates a sentence the matching code wrote; `date` formats a day for the reader.
 */
export function useI18n() {
  const lang = useLang();
  return useMemo(() => {
    const t: Translate = translator(lang);
    const dateFormat = new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en", { month: "short", day: "numeric", year: "numeric" });
    return {
      lang,
      t,
      term: (value: string | undefined | null) => term(lang, value),
      loc: (text: string) => localize(lang, text),
      date: (value: string) => dateFormat.format(new Date(value)),
    };
  }, [lang]);
}
