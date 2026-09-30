import { DiscoverClient } from "@/components/discover-client";
import { Nav } from "@/components/nav";
import { getT } from "@/lib/i18n-server";
import { getLiveCatalog } from "@/lib/live-catalog";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const initialCategory = category === "bra" || category === "tights" ? category : "all";
  const [catalog, t] = await Promise.all([getLiveCatalog(), getT()]);
  return <><Nav /><main className="page-shell"><div className="page-intro compact"><p className="eyebrow">{t("The PerfectPair research library", "PerfectPair 产品研究库")}</p><h1>{t("Make construction and coverage searchable.", "把版型结构和遮盖度，变成可以搜索的信息。")}</h1><p>{t("Browse bras and tights with source, confidence, product version and update history kept visible. Filters are category-specific; manufacturer facts, community evidence and private matching never become one opaque score.", "浏览内衣和丝袜时，资料来源、可信度、产品版本和更新记录都一目了然。筛选条件按品类区分；品牌资料、用户反馈和你的私人匹配，永远不会被揉成一个看不懂的总分。")}</p></div><DiscoverClient initialCategory={initialCategory} products={catalog.products} catalogStatus={catalog.status} /><section className="method-note"><span>01–03</span><div><strong>{t("Three data layers, never blended into one opaque score", "三层资料，绝不混成一个看不懂的分数")}</strong><p>{t("Manufacturer facts describe the product. Community data describes lived fit and wear. Editorial/Lab data appears only with published methodology. Personal Match is a separate, private calculation. Facts stay linked to their source; images and long brand copy are not republished without permission.", "品牌资料描述产品本身；用户资料记录真实的合身和穿着感受；编辑/实验室资料只有在公开测试方法后才会出现。个人匹配是单独、私密的计算。每条资料都连着来源；未经许可，不转载图片和大段品牌文案。")}</p></div></section></main></>;
}
