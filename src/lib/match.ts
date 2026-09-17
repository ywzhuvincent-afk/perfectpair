import { products } from "@/lib/mock-data";
import type { BraProduct, BraProfile, FitContext, FitIssue, MatchResult, WireType } from "@/lib/types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const cupOrder = ["AA", "A", "B", "C", "D", "DD", "DDD", "E", "F", "FF", "G", "GG", "H", "HH", "I", "J", "JJ", "K"];

function cupIndex(cup?: string) {
  if (!cup) return -1;
  const value = cup.trim().toUpperCase();
  return cupOrder.indexOf(value);
}

/** A transparent starting point, not a replacement for a professional fitting or brand size chart. */
export function estimateStartingSize(profile: BraProfile): string | null {
  const known = profile.currentBandSize && profile.currentCupSize ? `${profile.currentBandSize}${profile.currentCupSize.toUpperCase()}` : null;
  if (known) return known;
  if (!profile.underbustSnugCm || !profile.bustStandingCm) return null;
  const band = Math.max(26, Math.min(52, Math.round((profile.underbustSnugCm / 2.54) / 2) * 2));
  const difference = Math.max(0, Math.round((profile.bustStandingCm - profile.underbustSnugCm) / 2.54));
  return `${band}${cupOrder[Math.min(difference + 1, cupOrder.length - 1)]}`;
}

function sizeSystemIsCompatible(product: BraProduct, profile: BraProfile) {
  return !profile.sizeSystem || profile.sizeSystem === "unknown" || profile.sizeSystem === "brand_specific" || product.sizeSystem === "brand_specific" || product.sizeSystem === profile.sizeSystem;
}

function suggestedSizeIsCovered(product: BraProduct, size: string | null, profile: BraProfile) {
  if (!sizeSystemIsCompatible(product, profile)) return 72;
  if (!size || !product.bandRange || !product.cupRange) return 72;
  const match = /^(\d+)([A-Z]+)$/.exec(size);
  if (!match) return 72;
  const band = Number(match[1]);
  const cup = cupIndex(match[2]);
  const first = cupIndex(product.cupRange[0]);
  const last = cupIndex(product.cupRange[1]);
  if (band >= product.bandRange[0] && band <= product.bandRange[1] && cup >= first && cup <= last) return 100;
  return 18;
}

function priorityScore(product: BraProduct, profile: BraProfile) {
  const priorities = profile.fitPriorities.length ? profile.fitPriorities : ["comfort", "band", "cup"] as BraProfile["fitPriorities"];
  const map: Record<BraProfile["fitPriorities"][number], number> = {
    comfort: product.score.comfort,
    support: product.supportLevel,
    band: product.score.bandComfort,
    cup: product.score.cupFit,
    wire: product.score.wireComfort,
    straps: product.score.strapComfort,
    breathability: product.score.breathability,
    durability: product.score.durability,
    value: product.score.value,
  };
  return priorities.reduce((total, key) => total + map[key] * 20, 0) / priorities.length;
}

function issueScore(product: BraProduct, avoid: FitIssue[]) {
  if (!avoid.length || avoid.every((issue) => issue === "none")) return 78;
  const relevant: Record<Exclude<FitIssue, "none">, number> = {
    band_digs: product.score.bandComfort,
    band_rides_up: product.score.stayPut,
    cup_spillage: (product.score.cupFit + product.score.sideSupport) / 2,
    cup_gaping: product.score.cupFit,
    wire_pokes: product.score.wireComfort,
    wire_on_tissue: product.score.wireComfort,
    straps_slip: product.score.strapComfort,
    straps_dig: product.score.strapComfort,
    gore_floats: product.score.cupFit,
    side_spillage: product.score.sideSupport,
    cups_shift: product.score.stayPut,
  };
  const items = avoid.filter((issue): issue is Exclude<FitIssue, "none"> => issue !== "none");
  return items.reduce((total, issue) => total + relevant[issue] * 20, 0) / items.length;
}

function constructionScore(product: BraProduct, profile: BraProfile) {
  let total = product.fit === "true_to_size" ? 84 : product.fit === "varies" ? 70 : 58;
  if (profile.preferredWire && profile.preferredWire !== "any") total += product.wire === profile.preferredWire ? 12 : -28;
  if (profile.projection && profile.projection !== "unknown" && product.construction.cupDepth) total += product.construction.cupDepth === profile.projection ? 8 : -4;
  if (profile.rootWidth && profile.rootWidth !== "unknown" && product.construction.wireWidth) total += product.construction.wireWidth === profile.rootWidth ? 8 : -4;
  if (profile.strapPlacementPreference && profile.strapPlacementPreference !== "any" && product.construction.strapPlacement) total += product.construction.strapPlacement === profile.strapPlacementPreference ? 8 : -4;
  return clamp(total);
}

function contextScore(product: BraProduct, context?: FitContext) {
  if (!context) return 75;
  let score = product.useCases.includes(context.occasion) ? 90 : 45;
  const goals: Record<FitContext["goal"], boolean> = {
    all_day_comfort: product.score.comfort >= 4.2 && product.score.bandComfort >= 4.1,
    smooth_under_clothes: product.cupConstruction === "moulded" || product.cupConstruction === "spacer" || product.style === "wireless",
    lift_and_shape: product.supportLevel >= 4 && product.wire !== "wireless",
    low_neckline: product.style === "plunge" || product.construction.goreHeight === "low",
    wire_free: product.wire === "wireless",
  };
  if (goals[context.goal]) score += 10;
  if (typeof context.hoursExpected === "number" && context.hoursExpected >= 8 && product.score.comfort >= 4.3) score += 4;
  return clamp(score);
}

function noWireCaution(product: BraProduct, desired?: "any" | WireType) {
  return desired && desired !== "any" && desired !== product.wire;
}

export function matchProduct(product: BraProduct, profile: BraProfile, context?: FitContext): MatchResult {
  const suggestedSize = estimateStartingSize(profile);
  const components = [
    { label: "Size range coverage", score: suggestedSizeIsCovered(product, suggestedSize, profile), weight: 0.25 },
    { label: "Fit issues to avoid", score: issueScore(product, profile.avoid), weight: 0.22 },
    { label: "Your priorities", score: priorityScore(product, profile), weight: 0.18 },
    { label: "Construction compatibility", score: constructionScore(product, profile), weight: 0.15 },
    { label: "Today’s need", score: contextScore(product, context), weight: 0.12 },
    { label: "Community evidence", score: product.score.overall * 20, weight: 0.08 },
  ];
  const score = components.reduce((total, item) => total + item.score * item.weight, 0);
  const reasons: string[] = [];
  const cautions: string[] = [];
  if (suggestedSizeIsCovered(product, suggestedSize, profile) === 100) reasons.push(`${suggestedSize} is within this record’s mapped band and cup range.`);
  if (product.score.bandComfort >= 4.3 && profile.avoid.includes("band_digs")) reasons.push("Consented reviewers report strong band-comfort results, relevant to your no-dig priority.");
  if (product.score.strapComfort >= 4.2 && profile.avoid.includes("straps_slip")) reasons.push("Its structured ratings are strong for strap comfort and staying in place.");
  if (context && product.useCases.includes(context.occasion)) reasons.push(`Mapped for ${context.occasion} wear in the product catalogue.`);
  if (context?.goal === "wire_free" && product.wire === "wireless") reasons.push("This is a wire-free construction for the goal you selected.");
  if (profile.projection && profile.projection !== "unknown" && profile.projection === product.construction.cupDepth) reasons.push("Its mapped cup depth aligns with your optional self-description.");
  if (profile.strapPlacementPreference && profile.strapPlacementPreference !== "any" && profile.strapPlacementPreference === product.construction.strapPlacement) reasons.push("Its mapped strap placement aligns with your optional preference.");
  if (product.fit === "runs_small") cautions.push("Community fit reports may run small; verify the maker’s current chart before ordering.");
  if (product.fit === "varies") cautions.push("Fit evidence varies by size or construction; this is a shortlist, not a fit guarantee.");
  if (noWireCaution(product, profile.preferredWire)) cautions.push(`You asked for ${profile.preferredWire?.replace("_", " ")}; this model uses ${product.wire.replace("_", " ")} construction.`);
  if (!sizeSystemIsCompatible(product, profile)) cautions.push(`Your ${profile.sizeSystem?.replace("_", " / ")} size reference uses a different size system; check this brand’s current chart before ordering.`);
  if (suggestedSize && suggestedSizeIsCovered(product, suggestedSize, profile) < 50 && sizeSystemIsCompatible(product, profile)) cautions.push(`${suggestedSize} appears outside the seed size map. Check a sister size or a different model.`);
  if (!suggestedSize) cautions.push("Add a current size or two optional measurements to receive a size starting point.");
  if (profile.fitChangedRecently) cautions.push("You marked that your fit feels different lately, so treat an older size reference as a starting point and recheck the current chart.");
  const similarReviewerCount = profile.profileMatchingConsent && (profile.currentBandSize || profile.underbustSnugCm) ? Math.round(product.score.reviewCount * 0.24) : 0;
  const hasSimilarityData = similarReviewerCount >= 20;
  return {
    product,
    score: clamp(score),
    suggestedSize,
    peopleLikeYouScore: hasSimilarityData ? Math.min(5, Number((product.score.overall + (issueScore(product, profile.avoid) - 75) / 125).toFixed(1))) : null,
    similarReviewerCount,
    confidence: profile.fitChangedRecently ? "emerging" : product.score.confidence,
    reasons: reasons.slice(0, 3),
    cautions: cautions.slice(0, 3),
    breakdown: components,
  };
}

export function getMatches(profile: BraProfile, catalog: BraProduct[] = products, context?: FitContext) {
  return catalog.map((product) => matchProduct(product, profile, context)).sort((a, b) => b.score - a.score);
}
