import { NextRequest, NextResponse } from "next/server";
import { getLiveCatalog } from "@/lib/live-catalog";
import { isTightsProduct } from "@/lib/tights";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? undefined;
  const style = request.nextUrl.searchParams.get("style") ?? undefined;
  const useCase = request.nextUrl.searchParams.get("useCase") ?? undefined;
  const wire = request.nextUrl.searchParams.get("wire") ?? undefined;
  const categoryValue = request.nextUrl.searchParams.get("category");
  const category = categoryValue === "bra" || categoryValue === "tights" ? categoryValue : undefined;
  const catalog = await getLiveCatalog();
  const data = catalog.products.filter((product) => {
    const productCategory = isTightsProduct(product) ? "tights" : "bra";
    const searchable = `${product.brand} ${product.name} ${product.style} ${isTightsProduct(product) ? product.denier : product.wire} ${product.features.join(" ")} ${product.useCases.join(" ")}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase())) && (!category || productCategory === category) && (!style || product.style === style) && (!wire || (!isTightsProduct(product) && product.wire === wire)) && (!useCase || product.useCases.includes(useCase as never));
  });
  return NextResponse.json({ data, meta: { source: "self_owned_catalog", status: catalog.status, counts: catalog.counts, nextCursor: null, publication: "Published canonical records only" } });
}
