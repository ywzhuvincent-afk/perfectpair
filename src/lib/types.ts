/** Shared domain model for the bra-first PerfectPair MVP. */
export type DataLayer = "manufacturer" | "community" | "editorial_lab";
export type ProductCategory = "bra" | "tights";
export type Confidence = "emerging" | "developing" | "established" | "verified";
export type FitLabel = "runs_small" | "true_to_size" | "runs_large" | "varies";
export type SourceKind = "official" | "affiliate_feed" | "partner_api" | "public_page" | "retailer_feed" | "physical_audit" | "contributor_evidence" | "community" | "lab";
export type Undertone = "cool" | "neutral" | "warm" | "olive" | "unknown";
export type BraStyle = "t_shirt" | "balconette" | "plunge" | "full_coverage" | "wireless" | "bralette" | "minimizer" | "strapless" | "sports" | "nursing";
export type WireType = "underwire" | "wireless" | "flex_wire";
export type CupConstruction = "moulded" | "seamed" | "unlined" | "padded" | "spacer" | "soft_cup";
export type Projection = "shallow" | "average" | "projected" | "unknown";
export type RootWidth = "narrow" | "average" | "wide" | "unknown";
export type FitIssue = "band_digs" | "band_rides_up" | "cup_spillage" | "cup_gaping" | "wire_pokes" | "wire_on_tissue" | "straps_slip" | "straps_dig" | "gore_floats" | "side_spillage" | "cups_shift" | "none";
export type BraSizeSystem = "US_CA" | "UK" | "EU" | "AU_NZ" | "brand_specific" | "unknown";
export type MeasurementConfidence = "measured_recently" | "estimated" | "not_sure";
export type StrapPlacementPreference = "centered" | "wide_set" | "any";

/** A self-entered profile. It deliberately does not collect photos or create an appearance score. */
export interface BraProfile {
  heightCm?: number;
  weightKg?: number;
  underbustSnugCm?: number;
  underbustLooseCm?: number;
  bustStandingCm?: number;
  bustLeaningCm?: number;
  currentBandSize?: number;
  currentCupSize?: string;
  sizeSystem?: BraSizeSystem;
  knownWorkingBra?: string;
  knownProblemBra?: string;
  rootWidth?: RootWidth;
  projection?: Projection;
  preferredWire?: "any" | WireType;
  strapPlacementPreference?: StrapPlacementPreference;
  measurementConfidence?: MeasurementConfidence;
  /** A user can signal that a prior fit reference may no longer be current,
   * without explaining why or supplying health information. */
  fitChangedRecently?: boolean;
  commonUseCases: BraOccasion[];
  fitPriorities: Array<"comfort" | "support" | "band" | "cup" | "wire" | "straps" | "breathability" | "durability" | "value">;
  avoid: FitIssue[];
  profileMatchingConsent: boolean;
}

/** Shared lower-body context for leggings and jeans. It is deliberately
 * separate from intimate-apparel data: members can begin with a familiar size
 * and only add measurements when an official size chart makes them useful. */
export interface LowerBodyProfile {
  usualLeggingsSize?: string;
  usualJeansWaist?: string;
  usualJeansInseam?: string;
  knownWorkingLeggings?: string;
  knownWorkingJeans?: string;
  heightCm?: number;
  waistCm?: number;
  hipCm?: number;
  inseamCm?: number;
  risePreference?: "low" | "mid" | "high" | "any";
  compressionPreference?: "none" | "light" | "firm" | "any";
  stretchPreference?: "rigid" | "some_stretch" | "stretch" | "any";
  measurementConfidence?: MeasurementConfidence;
  fitChangedRecently?: boolean;
  priorities: Array<"comfort" | "waist_stability" | "seat_fit" | "length" | "compression" | "mobility" | "durability" | "value">;
  avoid: Array<"waist_gapes" | "waist_rolls" | "thighs_tight" | "seat_bags" | "crotch_drops" | "too_short" | "too_long" | "see_through" | "none">;
  profileMatchingConsent: boolean;
}

export interface LowerBodySnapshot {
  id: string;
  profile: LowerBodyProfile;
  recordedAt: string;
  label?: string;
}

/** A private planning record, never a public marketplace listing. It contains
 * no price, address, payment information, messages, photos, or body data. */
export interface PassItForwardDraft {
  id: string;
  category: "leggings" | "jeans";
  productLabel: string;
  sizeLabel: string;
  condition: "new_with_tags" | "like_new" | "gently_worn";
  marketplace: "vinted" | "depop" | "poshmark" | "other";
  status: "draft" | "listed_elsewhere" | "closed";
  createdAt: string;
  updatedAt: string;
}

/** Privacy choices live beside—not inside—the fit facts so every purpose is
 * visible and reversible. All optional sharing starts off. */
export interface PrivacyPreferences {
  anonymousMatching: boolean;
  aggregatedProductInsights: boolean;
  noticeVersion: string;
  updatedAt: string;
}

export type PrivacyEventType = "anonymous_matching_enabled" | "anonymous_matching_disabled" | "insights_enabled" | "insights_disabled" | "exported" | "fit_data_erased";

/** Audit metadata intentionally contains no measurements, sizes or free text. */
export interface PrivacyEvent {
  id: string;
  type: PrivacyEventType;
  recordedAt: string;
}

/** Dated private data; a later change never rewrites a historic review or wear. */
export interface FitSnapshot {
  id: string;
  profile: BraProfile;
  recordedAt: string;
  source: "manual" | "wear_checkin";
  label?: string;
}

export type BraOccasion = "everyday" | "work" | "lounge" | "occasion" | "travel" | "exercise";
export type FitGoal = "all_day_comfort" | "smooth_under_clothes" | "lift_and_shape" | "low_neckline" | "wire_free";

/** Temporary need; it never changes the long-term profile. */
export interface FitContext {
  occasion: BraOccasion;
  goal: FitGoal;
  outfitLabel?: string;
  hoursExpected?: number;
}

export interface WearEvent {
  id: string;
  productId: string;
  productVersion: string;
  snapshotId: string;
  context: FitContext;
  bandFeel: "secure" | "noticeable" | "uncomfortable";
  cupContainment: "contained" | "minor_issue" | "not_right";
  wireFeel: "not_applicable" | "comfortable" | "noticeable" | "painful";
  strapFeel: "stayed_put" | "slipped" | "dug_in";
  wouldWearAgain: "yes" | "maybe" | "no";
  issue: FitIssue;
  createdAt: string;
}

export interface PassportItem {
  productId: string;
  state: "want_to_try" | "owned" | "repurchase" | "retired";
  addedAt: string;
  priceAlert?: { targetPrice?: number; stockAlert: boolean };
}

export interface SourceAttribution {
  layer: DataLayer;
  sourceKind: SourceKind;
  sourceName: string;
  sourceUrl?: string;
  capturedAt: string;
  confidence: Confidence;
  verifiedAt?: string;
}

export interface ProductScore {
  overall: number;
  comfort: number;
  bandComfort: number;
  cupFit: number;
  wireComfort: number;
  strapComfort: number;
  stayPut: number;
  sideSupport: number;
  breathability: number;
  durability: number;
  sizeAccuracy: number;
  value: number;
  reviewCount: number;
  confidence: Confidence;
}

/** A public product image exists only after an operator records and approves
 * its display right. It is never inferred from an ordinary product page. */
export interface ProductMediaAsset {
  id: string;
  url: string;
  alt: string;
  kind: "packshot" | "detail" | "on_body" | "editorial" | "owned_photo";
  attribution?: string;
}

export interface BraProduct {
  id: string;
  slug: string;
  brand: string;
  name: string;
  family?: string;
  country?: string;
  style: BraStyle;
  wire: WireType;
  cupConstruction: CupConstruction;
  supportLevel: 1 | 2 | 3 | 4 | 5;
  material: string[];
  features: string[];
  useCases: BraOccasion[];
  fit: FitLabel;
  fitNotes: string[];
  sizeSystem: "US_CA" | "UK" | "EU" | "AU_NZ" | "brand_specific";
  sizeRange: string;
  bandRange?: [number, number];
  cupRange?: [string, string];
  construction: {
    goreHeight?: "low" | "medium" | "high";
    wingHeight?: "low" | "medium" | "high";
    strapPlacement?: "centered" | "wide_set" | "racerback" | "convertible";
    closureRows?: number;
    bandStretch?: "low" | "medium" | "high";
    wireWidth?: RootWidth;
    cupDepth?: Projection;
  };
  price: { currency: string; amount: number; observedAt: string; priceType: "list" | "sale" };
  availability: "in_stock" | "low_stock" | "unknown" | "out_of_stock";
  score: ProductScore;
  media?: ProductMediaAsset[];
  data: SourceAttribution[];
  updatedAt: string;
  productVersion: string;
}

export interface StructuredReview {
  id: string;
  productId: string;
  productVersion: string;
  reviewerProfile: Pick<BraProfile, "underbustSnugCm" | "bustStandingCm" | "currentBandSize" | "currentCupSize" | "rootWidth" | "projection">;
  sizeBought: string;
  scores: Omit<ProductScore, "reviewCount" | "confidence">;
  fitSignals: {
    sizing: FitLabel;
    band: "too_tight" | "secure" | "too_loose";
    cup: "too_small" | "contained" | "too_large" | "shape_mismatch";
    wire: "not_applicable" | "comfortable" | "too_narrow" | "too_wide" | "uncomfortable";
    straps: "stayed_put" | "slipped" | "dug_in";
  };
  issues: FitIssue[];
  bodyProfileConsent: "anonymous_matching" | "private_only";
  source: SourceAttribution;
  createdAt: string;
}

export interface MatchResult {
  product: BraProduct;
  score: number;
  suggestedSize: string | null;
  peopleLikeYouScore: number | null;
  similarReviewerCount: number;
  confidence: Confidence;
  reasons: string[];
  cautions: string[];
  breakdown: Array<{ label: string; score: number; weight: number }>;
}

export interface IngestionCandidate {
  externalId: string;
  sourceId: string;
  sourceKind: SourceKind;
  legalBasis: "partner_authorized" | "public_product_page" | "manual_import" | "first_party_measurement" | "verified_contributor_evidence";
  canonicalUrl: string;
  observedAt: string;
  category?: ProductCategory;
  raw: Record<string, unknown>;
}

export interface NormalizedCandidate {
  candidate: IngestionCandidate;
  /** Category-specific normalized facts. Publication is always gated by source
   * policy and human review, so this broad staging shape never becomes a live
   * product record by itself. */
  product: Record<string, unknown>;
  fieldSources: Record<string, SourceAttribution>;
}

export interface QualityReport {
  status: "approved" | "needs_review" | "rejected";
  score: number;
  reasons: string[];
  blockingIssues: string[];
}
