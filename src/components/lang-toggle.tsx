"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANG_COOKIE } from "@/lib/i18n";
import { useLang } from "@/components/lang-provider";

export function LangToggle() {
  const lang = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const choose = (next: "en" | "zh") => {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };
  return <div className="lang-toggle" role="group" aria-label="Language / 语言" aria-busy={pending}>
    <button type="button" className={lang === "en" ? "active" : ""} aria-pressed={lang === "en"} onClick={() => choose("en")}>EN</button>
    <button type="button" className={lang === "zh" ? "active" : ""} aria-pressed={lang === "zh"} onClick={() => choose("zh")}>中文</button>
  </div>;
}
