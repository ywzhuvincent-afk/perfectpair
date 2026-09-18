import type { ProductCategory } from "@/lib/types";

export type CatalogLaunchWave = 1 | 2;

/**
 * A coverage target is not a publication claim. It is a finite, auditable
 * backlog for the catalogue steward: one suitable product and its source
 * record must be verified before a brand counts as covered.
 */
export type CatalogCoverageTarget = {
  brand: string;
  category: ProductCategory;
  launchWave: CatalogLaunchWave;
};

export const CATALOG_BRAND_GOAL = 100;
export const DAILY_TARGET_BATCH_SIZE = 5;

export const catalogCoverageTargets: readonly CatalogCoverageTarget[] = [
  { brand: "Aerie", category: "bra", launchWave: 1 },
  { brand: "Anita", category: "bra", launchWave: 1 },
  { brand: "Bravissimo", category: "bra", launchWave: 2 },
  { brand: "Chantelle", category: "bra", launchWave: 1 },
  { brand: "Curvy Kate", category: "bra", launchWave: 2 },
  { brand: "Elomi", category: "bra", launchWave: 1 },
  { brand: "Empreinte", category: "bra", launchWave: 2 },
  { brand: "Fantasie", category: "bra", launchWave: 2 },
  { brand: "Felina", category: "bra", launchWave: 1 },
  { brand: "Freya", category: "bra", launchWave: 1 },
  { brand: "Glamorise", category: "bra", launchWave: 2 },
  { brand: "Harper Wilde", category: "bra", launchWave: 1 },
  { brand: "Knix", category: "bra", launchWave: 1 },
  { brand: "Le Mystère", category: "bra", launchWave: 2 },
  { brand: "Natori", category: "bra", launchWave: 1 },
  { brand: "Panache", category: "bra", launchWave: 1 },
  { brand: "Parfait", category: "bra", launchWave: 2 },
  { brand: "PrimaDonna", category: "bra", launchWave: 2 },
  { brand: "Savage X Fenty", category: "bra", launchWave: 2 },
  { brand: "Soma", category: "bra", launchWave: 2 },
  { brand: "ThirdLove", category: "bra", launchWave: 1 },
  { brand: "Understance", category: "bra", launchWave: 1 },
  { brand: "Victoria's Secret", category: "bra", launchWave: 2 },
  { brand: "Wacoal", category: "bra", launchWave: 1 },
  { brand: "Warner's", category: "bra", launchWave: 2 },

  { brand: "Berkshire", category: "tights", launchWave: 2 },
  { brand: "Calzedonia", category: "tights", launchWave: 1 },
  { brand: "Capezio", category: "tights", launchWave: 2 },
  { brand: "Cecilia de Rafael", category: "tights", launchWave: 2 },
  { brand: "Commando", category: "tights", launchWave: 1 },
  { brand: "DIM", category: "tights", launchWave: 2 },
  { brand: "Falke", category: "tights", launchWave: 1 },
  { brand: "Fiore", category: "tights", launchWave: 2 },
  { brand: "Gabriella", category: "tights", launchWave: 2 },
  { brand: "Gatta", category: "tights", launchWave: 2 },
  { brand: "Heist", category: "tights", launchWave: 1 },
  { brand: "Hue", category: "tights", launchWave: 2 },
  { brand: "Kunert", category: "tights", launchWave: 2 },
  { brand: "Levante", category: "tights", launchWave: 2 },
  { brand: "Oroblù", category: "tights", launchWave: 2 },
  { brand: "Pamela Mann", category: "tights", launchWave: 2 },
  { brand: "Pierre Mantoux", category: "tights", launchWave: 2 },
  { brand: "Pretty Polly", category: "tights", launchWave: 2 },
  { brand: "Sheertex", category: "tights", launchWave: 1 },
  { brand: "Solidea", category: "tights", launchWave: 2 },
  { brand: "Swedish Stockings", category: "tights", launchWave: 1 },
  { brand: "Trasparenze", category: "tights", launchWave: 2 },
  { brand: "VienneMilano", category: "tights", launchWave: 2 },
  { brand: "Wolford", category: "tights", launchWave: 1 },
  { brand: "Zokki", category: "tights", launchWave: 2 },

  { brand: "90 Degree by Reflex", category: "leggings", launchWave: 2 },
  { brand: "Adidas", category: "leggings", launchWave: 1 },
  { brand: "Alo Yoga", category: "leggings", launchWave: 1 },
  { brand: "Athleta", category: "leggings", launchWave: 1 },
  { brand: "Beyond Yoga", category: "leggings", launchWave: 1 },
  { brand: "Colorfulkoala", category: "leggings", launchWave: 2 },
  { brand: "CRZ Yoga", category: "leggings", launchWave: 2 },
  { brand: "Fabletics", category: "leggings", launchWave: 1 },
  { brand: "GapFit", category: "leggings", launchWave: 2 },
  { brand: "Girlfriend Collective", category: "leggings", launchWave: 1 },
  { brand: "Gymshark", category: "leggings", launchWave: 1 },
  { brand: "Halara", category: "leggings", launchWave: 2 },
  { brand: "Koral", category: "leggings", launchWave: 2 },
  { brand: "Lorna Jane", category: "leggings", launchWave: 2 },
  { brand: "Lululemon", category: "leggings", launchWave: 1 },
  { brand: "Nike", category: "leggings", launchWave: 1 },
  { brand: "Niyama Sol", category: "leggings", launchWave: 2 },
  { brand: "Outdoor Voices", category: "leggings", launchWave: 1 },
  { brand: "P.E Nation", category: "leggings", launchWave: 2 },
  { brand: "Peloton Apparel", category: "leggings", launchWave: 2 },
  { brand: "Sweaty Betty", category: "leggings", launchWave: 1 },
  { brand: "TALA", category: "leggings", launchWave: 2 },
  { brand: "Varley", category: "leggings", launchWave: 2 },
  { brand: "Vuori", category: "leggings", launchWave: 1 },
  { brand: "Zella", category: "leggings", launchWave: 2 },

  { brand: "7 For All Mankind", category: "jeans", launchWave: 2 },
  { brand: "Abercrombie", category: "jeans", launchWave: 1 },
  { brand: "AG Jeans", category: "jeans", launchWave: 2 },
  { brand: "American Eagle", category: "jeans", launchWave: 1 },
  { brand: "Citizens of Humanity", category: "jeans", launchWave: 2 },
  { brand: "Democracy Clothing", category: "jeans", launchWave: 2 },
  { brand: "DL1961", category: "jeans", launchWave: 2 },
  { brand: "Everlane", category: "jeans", launchWave: 1 },
  { brand: "Frame", category: "jeans", launchWave: 2 },
  { brand: "Good American", category: "jeans", launchWave: 1 },
  { brand: "Hudson Jeans", category: "jeans", launchWave: 2 },
  { brand: "JAG Jeans", category: "jeans", launchWave: 2 },
  { brand: "Joe's Jeans", category: "jeans", launchWave: 2 },
  { brand: "KUT from the Kloth", category: "jeans", launchWave: 2 },
  { brand: "Lee", category: "jeans", launchWave: 1 },
  { brand: "Levi's", category: "jeans", launchWave: 1 },
  { brand: "Madewell", category: "jeans", launchWave: 1 },
  { brand: "MOTHER", category: "jeans", launchWave: 2 },
  { brand: "NYDJ", category: "jeans", launchWave: 1 },
  { brand: "Paige", category: "jeans", launchWave: 2 },
  { brand: "Re/Done", category: "jeans", launchWave: 2 },
  { brand: "Silver Jeans", category: "jeans", launchWave: 2 },
  { brand: "Uniqlo", category: "jeans", launchWave: 1 },
  { brand: "Wrangler", category: "jeans", launchWave: 1 },
  { brand: "Zara", category: "jeans", launchWave: 2 },
] as const;

if (catalogCoverageTargets.length !== CATALOG_BRAND_GOAL) {
  throw new Error(`The catalogue target queue must contain exactly ${CATALOG_BRAND_GOAL} brands.`);
}

export function targetCountByCategory(category: ProductCategory) {
  return catalogCoverageTargets.filter((target) => target.category === category).length;
}
