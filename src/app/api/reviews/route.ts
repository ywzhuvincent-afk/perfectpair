import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const score = z.number().min(1).max(5);
const fitIssue = z.enum(["band_digs", "band_rides_up", "cup_spillage", "cup_gaping", "wire_pokes", "wire_on_tissue", "straps_slip", "straps_dig", "gore_floats", "side_spillage", "cups_shift", "none"]);
const reviewSchema = z.object({
  category: z.enum(["bra", "tights"]).default("bra"),
  productId: z.string().min(1),
  sizeBought: z.string().min(1).max(30),
  productVersion: z.string().min(1),
  scores: z.object({
    overall: score, comfort: score, bandComfort: score, cupFit: score, wireComfort: score,
    strapComfort: score, stayPut: score, sideSupport: score, breathability: score,
    durability: score, sizeAccuracy: score, value: score,
  }),
  fitSignals: z.object({
    sizing: z.enum(["runs_small", "true_to_size", "runs_large", "varies"]),
    band: z.enum(["too_tight", "secure", "too_loose"]),
    cup: z.enum(["too_small", "contained", "too_large", "shape_mismatch"]),
    wire: z.enum(["not_applicable", "comfortable", "too_narrow", "too_wide", "uncomfortable"]),
    straps: z.enum(["stayed_put", "slipped", "dug_in"]),
  }),
  issues: z.array(fitIssue).max(6).default([]),
  bodyProfileConsent: z.enum(["anonymous_matching", "private_only"]),
  profileSnapshotId: z.string().uuid().optional(),
});

const tightsReviewSchema = z.object({
  category: z.literal("tights"), productId: z.string().min(1), productVersion: z.string().min(1), sizeBought: z.string().min(1).max(30),
  scores: z.object({ overall: score, comfort: score, waistComfort: score, coverage: score, stayPut: score, toeComfort: score, breathability: score, durability: score, sizeAccuracy: score, value: score }),
  fitSignals: z.object({ sizing: z.enum(["runs_small", "true_to_size", "runs_large", "varies"]), waist: z.enum(["too_tight", "secure", "too_loose"]), coverage: z.enum(["too_sheer", "as_expected", "too_opaque"]), toe: z.enum(["comfortable", "noticeable", "uncomfortable"]) }),
  issues: z.array(z.enum(["waist_rolls", "waist_digs", "sags", "short_inseam", "toe_pressure", "snags", "too_warm", "not_warm_enough", "none"])).max(6).default([]),
  bodyProfileConsent: z.enum(["anonymous_matching", "private_only"]), profileSnapshotId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => null);
  const payload = typeof raw === "object" && raw !== null && "category" in raw && raw.category === "tights"
    ? tightsReviewSchema.safeParse(raw)
    : reviewSchema.safeParse(raw);
  if (!payload.success) return NextResponse.json({ error: "Invalid structured product review", details: payload.error.flatten() }, { status: 400 });
  const database = getSupabaseAdmin();
  if (!database) return NextResponse.json({ error: "Review storage is temporarily unavailable. Please try again later." }, { status: 503 });

  const review = payload.data;
  const productTable = review.category === "tights" ? "tights_products" : "products";
  const canonicalId = z.string().uuid().safeParse(review.productId);

  try {
    if (canonicalId.success) {
      const { data: product, error: productError } = await database.from(productTable).select("id").eq("id", canonicalId.data).maybeSingle();
      if (productError) throw productError;
      if (product) {
        if (review.category === "tights") {
          const tightsReview = tightsReviewSchema.parse(review);
          const { data, error } = await database.from("tights_reviews").insert({
            product_id: canonicalId.data,
            product_version: tightsReview.productVersion,
            size_bought: tightsReview.sizeBought,
            overall: tightsReview.scores.overall,
            comfort: tightsReview.scores.comfort,
            waist_comfort: tightsReview.scores.waistComfort,
            coverage: tightsReview.scores.coverage,
            stay_put: tightsReview.scores.stayPut,
            toe_comfort: tightsReview.scores.toeComfort,
            breathability: tightsReview.scores.breathability,
            durability: tightsReview.scores.durability,
            size_accuracy: tightsReview.scores.sizeAccuracy,
            value_score: tightsReview.scores.value,
            sizing: tightsReview.fitSignals.sizing,
            issues: tightsReview.issues,
            profile_visibility: tightsReview.bodyProfileConsent,
            moderation_state: "pending",
          }).select("id").single();
          if (error) throw error;
          return NextResponse.json({ data: { id: data.id, moderationState: "pending" }, message: "Review accepted for moderation; it is not public until reviewed." }, { status: 202 });
        }
        const braReview = reviewSchema.parse(review);
        const { data, error } = await database.from("reviews").insert({
          product_id: canonicalId.data,
          product_version: braReview.productVersion,
          size_bought: braReview.sizeBought,
          overall: braReview.scores.overall,
          comfort: braReview.scores.comfort,
          band_comfort: braReview.scores.bandComfort,
          cup_fit: braReview.scores.cupFit,
          wire_comfort: braReview.scores.wireComfort,
          strap_comfort: braReview.scores.strapComfort,
          stay_put: braReview.scores.stayPut,
          side_support: braReview.scores.sideSupport,
          breathability: braReview.scores.breathability,
          durability: braReview.scores.durability,
          size_accuracy: braReview.scores.sizeAccuracy,
          value_score: braReview.scores.value,
          sizing: braReview.fitSignals.sizing,
          band_fit: braReview.fitSignals.band,
          cup_fit_signal: braReview.fitSignals.cup,
          wire_fit: braReview.fitSignals.wire,
          straps_fit: braReview.fitSignals.straps,
          issues: braReview.issues,
          profile_visibility: braReview.bodyProfileConsent,
          moderation_state: "pending",
        }).select("id").single();
        if (error) throw error;
        return NextResponse.json({ data: { id: data.id, moderationState: "pending" }, message: "Review accepted for moderation; it is not public until reviewed." }, { status: 202 });
      }
    }

    // Development fixtures and user-reported missing products remain useful,
    // but they never affect a scorecard until an operator maps them exactly.
    const { data, error } = await database.from("review_intake").insert({
      category: review.category,
      product_reference: review.productId,
      product_version: review.productVersion,
      size_bought: review.sizeBought,
      scores: review.scores,
      fit_signals: review.fitSignals,
      issues: review.issues,
      profile_visibility: review.bodyProfileConsent,
    }).select("id, moderation_state").single();
    if (error) throw error;
    return NextResponse.json({ data: { id: data.id, moderationState: data.moderation_state }, message: "Review received. It needs an exact product match and moderation before it can be public." }, { status: 202 });
  } catch (error) {
    console.error("PerfectPair review intake failed", error);
    return NextResponse.json({ error: "We could not safely store that review. Please try again." }, { status: 503 });
  }
}
