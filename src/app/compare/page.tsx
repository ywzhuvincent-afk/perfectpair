import { Nav } from "@/components/nav";
import { CompareClient } from "@/components/compare-client";
import { getT } from "@/lib/i18n-server";
import { getLiveCatalog } from "@/lib/live-catalog";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const [catalog, t] = await Promise.all([getLiveCatalog(), getT()]);
  return <><Nav /><main className="page-shell compare-page"><div className="page-intro compact"><p className="eyebrow">{t("Product comparison", "产品对比")}</p><h1>{t("Compare the details that change the experience.", "对比那些真正影响穿着感受的细节。")}</h1><p>{t("Bras and tights each have their own comparable facts. Your Personal Match stays private, while community evidence stays product-level and explainable.", "内衣和丝袜各有自己的对比项。你的个人匹配只有你看得到；用户反馈只针对产品本身，并且每一项都讲得清楚。")}</p></div><CompareClient products={catalog.products} catalogStatus={catalog.status} /></main></>;
}
