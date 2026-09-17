export type ContributionType = "missing_product" | "correction" | "brand_claim";
export type ContributionCategory = "bra" | "tights" | "leggings" | "jeans" | "all";

export interface CatalogContributionReceipt {
  id: string;
  type: ContributionType;
  brandName: string;
  productName?: string;
  receivedAt: string;
  status: "received" | "staged_locally";
}

export const contributionStoreKey = "perfectpair.catalog-contribution-receipts.v1";

export function getLocalContributionReceipts(): CatalogContributionReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(contributionStoreKey);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed as CatalogContributionReceipt[] : [];
  } catch {
    return [];
  }
}

export function rememberLocalContribution(receipt: CatalogContributionReceipt) {
  if (typeof window === "undefined") return;
  const current = getLocalContributionReceipts();
  window.localStorage.setItem(contributionStoreKey, JSON.stringify([receipt, ...current].slice(0, 20)));
}
