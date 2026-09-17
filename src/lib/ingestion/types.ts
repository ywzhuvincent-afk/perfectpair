import type { IngestionCandidate, NormalizedCandidate, ProductCategory, SourceKind } from "@/lib/types";

/** `gap_discovery` only runs sources that have explicit approval to provide
 * catalogue discovery data. It is never permission to crawl public pages. */
export type RefreshLane = "catalog" | "price_availability" | "gap_discovery";
export type ContentHandling = "licensed_full_content" | "facts_and_short_attribution_only" | "manual_facts_only";
export type RobotsPolicy = "honor" | "not_applicable";

/**
 * A source is not merely technical configuration. This record captures why we
 * may access it, exactly what we may retain, and when the approval expires.
 * A missing or expired policy must stop the source before any request is made.
 */
export interface SourceRightsPolicy {
  termsUrl?: string;
  robotsUrl?: string;
  reviewedAt: string;
  validUntil?: string;
  robotsPolicy: RobotsPolicy;
  allowedFields: string[];
  contentHandling: ContentHandling;
  permitsAutomatedAccess: boolean;
  permitsPublication: boolean;
  maxRequestsPerMinute: number;
  userAgent: string;
  evidenceReference: string;
}

/** Result of one permitted fetch. The response metadata is retained only for
 * conditional refreshes; it never contains source credentials. */
export interface SourceDiscoveryResult {
  candidates: IngestionCandidate[];
  requestCount: number;
  noChange: boolean;
  etag?: string;
  lastModified?: string;
}

/** Links a runtime adapter to its reviewable Supabase records. Fixtures omit
 * this binding and are never scheduled in production. */
export interface DatabaseSourceBinding {
  sourceRecordId: string;
  rightsReviewId: string;
  checkpointId?: string;
  cursor?: string | null;
  etag?: string | null;
  lastModified?: string | null;
  nextDueAt?: string | null;
  failureCount?: number;
}

export interface SourceAdapter {
  id: string;
  name: string;
  kind: Extract<SourceKind, "official" | "affiliate_feed" | "partner_api" | "public_page" | "retailer_feed" | "physical_audit" | "contributor_evidence">;
  legalBasis: "partner_authorized" | "public_product_page" | "manual_import" | "first_party_measurement" | "verified_contributor_evidence";
  enabled: boolean;
  allowedCategories: ProductCategory[];
  refreshIntervalHours: number;
  refreshLanes: RefreshLane[];
  accountableOwner: string;
  /** The internal brand targets that this source is authorised to cover. A
   * source without a target link is never evidence that a brand is approved. */
  brandTargetIds?: string[];
  rights: SourceRightsPolicy;
  requiresHumanReview: true;
  databaseBinding?: DatabaseSourceBinding;
  discover(): Promise<SourceDiscoveryResult>;
  normalize(candidate: IngestionCandidate): Promise<NormalizedCandidate>;
}

export interface IngestionRunResult {
  sourceId: string;
  dryRun: boolean;
  discovered: number;
  approved: number;
  needsReview: number;
  rejected: number;
  candidates: Array<{ externalId: string; status: string; score: number; reasons: string[] }>;
}

export interface ScheduledIngestionResult {
  lane: RefreshLane;
  triggeredAt: string;
  runs: IngestionRunResult[];
  skipped: Array<{ sourceId: string; reason: string }>;
}
