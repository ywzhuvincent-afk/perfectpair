import type { TightsMatchResult, TightsProduct, TightsProfile } from "@/lib/tights";

const coverage = {
  sheer: (denier: number) => denier <= 25,
  everyday: (denier: number) => denier >= 25 && denier <= 60,
  opaque: (denier: number) => denier >= 50,
  warm: (denier: number) => denier >= 70,
};

function compressionMatches(preference: TightsProfile["compressionPreference"], compression: number) {
  if (!preference || preference === "not_sure") return true;
  if (preference === "none") return compression <= 1;
  if (preference === "light") return compression >= 1 && compression <= 2;
  return compression >= 3;
}

export function matchTightsProduct(product: TightsProduct, profile: TightsProfile): TightsMatchResult {
  let score = 56;
  const reasons: string[] = [];
  const cautions: string[] = [];
  if (profile.preferredDenier && coverage[profile.preferredDenier](product.denier)) { score += 18; reasons.push(`${product.denier} denier matches your preferred coverage.`); }
  else if (profile.preferredDenier) cautions.push(`${product.denier} denier may not match your preferred coverage.`);
  if (profile.preferredWaist && profile.preferredWaist !== "any") {
    if (product.waist === profile.preferredWaist) { score += 13; reasons.push(`${product.waist.replace("_", " ")} construction matches your waist preference.`); }
    else cautions.push(`This pair has a ${product.waist.replace("_", " ")} waist instead of your preference.`);
  }
  if (profile.priorities.includes("durability") && product.score.durability >= 4.1) { score += 6; reasons.push("Structured reports indicate above-average durability."); }
  if (profile.priorities.includes("comfort") && product.score.comfort >= 4.1) { score += 6; reasons.push("Structured reports indicate above-average comfort."); }
  if (profile.priorities.includes("warmth") && product.warmth >= 4) { score += 5; reasons.push("Warmth level is aligned with your priority."); }
  if (profile.avoid.includes("waist_rolls") && product.waist === "high_waist") { score += 4; reasons.push("High waist construction may help with your no-roll preference."); }
  if (profile.avoid.includes("too_warm") && product.warmth >= 4) { score -= 8; cautions.push("High warmth may be more than you want."); }
  if (profile.compressionPreference && profile.compressionPreference !== "not_sure") {
    if (compressionMatches(profile.compressionPreference, product.compression)) { score += 7; reasons.push("Its mapped compression level matches your optional preference."); }
    else cautions.push("Its mapped compression level may not feel like your preference.");
  }
  if (profile.fitChangedRecently) cautions.push("You marked that your fit feels different lately, so use this size as a starting point and check the brand’s current chart.");
  return { product, score: Math.max(0, Math.min(99, score)), suggestedSize: profile.usualSize ?? null, confidence: profile.fitChangedRecently ? "emerging" : profile.usualSize || profile.preferredDenier ? "developing" : "emerging", reasons: reasons.length ? reasons : ["Add a usual tights size or coverage preference for a more specific explanation."], cautions };
}

export function getTightsMatches(profile: TightsProfile, products: TightsProduct[]) {
  return products.map((product) => matchTightsProduct(product, profile)).sort((a, b) => b.score - a.score);
}
