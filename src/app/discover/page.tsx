import { DiscoverClient } from "@/components/discover-client";
import { Nav } from "@/components/nav";
import { getLiveCatalog } from "@/lib/live-catalog";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const initialCategory = category === "bra" || category === "tights" ? category : "all";
  const catalog = await getLiveCatalog();
  return <><Nav /><main className="page-shell"><div className="page-intro compact"><p className="eyebrow">The PerfectPair research library</p><h1>Make construction and coverage searchable.</h1><p>Browse bras and tights with source, confidence, product version and update history kept visible. Filters are category-specific; manufacturer facts, community evidence and private matching never become one opaque score.</p></div><DiscoverClient initialCategory={initialCategory} products={catalog.products} catalogStatus={catalog.status} /><section className="method-note"><span>01–03</span><div><strong>Three data layers, never blended into one opaque score</strong><p>Manufacturer facts describe the product. Community data describes lived fit and wear. Editorial/Lab data appears only with published methodology. Personal Match is a separate, private calculation. Facts stay linked to their source; images and long brand copy are not republished without permission.</p></div></section></main></>;
}
