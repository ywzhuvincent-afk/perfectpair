import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { ProductDetailClient } from "@/components/product-detail-client";
import { getLiveProductBySlug } from "@/lib/live-catalog";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const { product } = await getLiveProductBySlug(slug); if (!product) notFound();
  return <><Nav /><main className="page-shell product-page"><ProductDetailClient product={product} /></main></>;
}
