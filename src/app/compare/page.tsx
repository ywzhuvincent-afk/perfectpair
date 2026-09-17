import { Nav } from "@/components/nav";
import { CompareClient } from "@/components/compare-client";
import { getLiveCatalog } from "@/lib/live-catalog";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const catalog = await getLiveCatalog();
  return <><Nav /><main className="page-shell compare-page"><div className="page-intro compact"><p className="eyebrow">Product comparison</p><h1>Compare the details that change the experience.</h1><p>Bras and tights each have their own comparable facts. Your Personal Match stays private, while community evidence stays product-level and explainable.</p></div><CompareClient products={catalog.products} catalogStatus={catalog.status} /></main></>;
}
