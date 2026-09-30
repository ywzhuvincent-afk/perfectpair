import { cookies, headers } from "next/headers";
import { LANG_COOKIE, langFrom, translator, type Lang } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return langFrom(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
}

export async function getT() {
  return translator(await getLang());
}
