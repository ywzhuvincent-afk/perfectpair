import { products } from "@/lib/mock-data";
import { tightsProducts, type CatalogProduct, isTightsProduct } from "@/lib/tights";

export const catalogProducts: CatalogProduct[] = [...products, ...tightsProducts];

export function getCatalog(filters?: { query?: string; style?: string; useCase?: string; wire?: string; category?: "bra" | "tights" }) {
  const query = filters?.query?.toLowerCase().trim();
  return catalogProducts.filter((product) => {
    const category = isTightsProduct(product) ? "tights" : "bra";
    const wire = isTightsProduct(product) ? "" : product.wire;
    const content = `${product.brand} ${product.name} ${product.style} ${wire} ${product.features.join(" ")} ${product.useCases.join(" ")}`.toLowerCase();
    return (!query || content.includes(query)) && (!filters?.category || category === filters.category) && (!filters?.style || product.style === filters.style) && (!filters?.wire || wire === filters.wire) && (!filters?.useCase || product.useCases.map(String).includes(filters.useCase));
  });
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return catalogProducts.find((product) => product.slug === slug);
}
