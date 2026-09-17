import { Nav } from "@/components/nav";
import { PassportClient } from "@/components/passport-client";
import { getLiveCatalog } from "@/lib/live-catalog";

export const dynamic = "force-dynamic";

export default async function PassportPage() {
  const catalog = await getLiveCatalog();
  return <><Nav /><main className="page-shell passport-page"><PassportClient catalog={catalog.products} catalogStatus={catalog.status} /></main></>;
}
