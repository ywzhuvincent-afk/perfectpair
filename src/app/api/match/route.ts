import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMatches } from "@/lib/match";
import { getTightsMatches } from "@/lib/tights-match";
import { tightsProducts } from "@/lib/tights";

const profileSchema = z.object({
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(25).max(300).optional(),
  underbustSnugCm: z.number().min(55).max(150).optional(),
  underbustLooseCm: z.number().min(55).max(160).optional(),
  bustStandingCm: z.number().min(60).max(200).optional(),
  bustLeaningCm: z.number().min(60).max(220).optional(),
  currentBandSize: z.number().int().min(24).max(54).optional(),
  currentCupSize: z.string().trim().max(4).optional(),
  sizeSystem: z.enum(["US_CA", "UK", "EU", "AU_NZ", "brand_specific", "unknown"]).optional(),
  knownWorkingBra: z.string().max(160).optional(),
  knownProblemBra: z.string().max(160).optional(),
  rootWidth: z.enum(["narrow", "average", "wide", "unknown"]).optional(),
  projection: z.enum(["shallow", "average", "projected", "unknown"]).optional(),
  preferredWire: z.enum(["any", "underwire", "wireless", "flex_wire"]).optional(),
  strapPlacementPreference: z.enum(["centered", "wide_set", "any"]).optional(),
  measurementConfidence: z.enum(["measured_recently", "estimated", "not_sure"]).optional(),
  fitChangedRecently: z.boolean().optional(),
  commonUseCases: z.array(z.enum(["everyday", "work", "lounge", "occasion", "travel", "exercise"])).default([]),
  fitPriorities: z.array(z.enum(["comfort", "support", "band", "cup", "wire", "straps", "breathability", "durability", "value"])).default([]),
  avoid: z.array(z.enum(["band_digs", "band_rides_up", "cup_spillage", "cup_gaping", "wire_pokes", "wire_on_tissue", "straps_slip", "straps_dig", "gore_floats", "side_spillage", "cups_shift", "none"])).default([]),
  profileMatchingConsent: z.boolean().default(false),
});

const contextSchema = z.object({
  occasion: z.enum(["everyday", "work", "lounge", "occasion", "travel", "exercise"]).default("everyday"),
  goal: z.enum(["all_day_comfort", "smooth_under_clothes", "lift_and_shape", "low_neckline", "wire_free"]).default("all_day_comfort"),
  outfitLabel: z.string().max(100).optional(),
  hoursExpected: z.number().int().min(1).max(24).optional(),
});

const tightsProfileSchema = z.object({
  usualSize: z.string().trim().max(8).optional(), sizeSystem: z.enum(["US_CA", "UK", "EU", "brand_specific", "unknown"]).optional(), heightCm: z.number().min(100).max(250).optional(), waistCm: z.number().min(40).max(180).optional(), hipCm: z.number().min(50).max(220).optional(), inseamCm: z.number().min(40).max(120).optional(),
  preferredDenier: z.enum(["sheer", "everyday", "opaque", "warm"]).optional(), preferredWaist: z.enum(["regular", "high_waist", "control_top", "any"]).optional(),
  compressionPreference: z.enum(["none", "light", "firm", "not_sure"]).optional(), measurementConfidence: z.enum(["measured_recently", "estimated", "not_sure"]).optional(), fitChangedRecently: z.boolean().optional(),
  priorities: z.array(z.enum(["comfort", "durability", "warmth", "sheerness", "control", "value"])).default([]), avoid: z.array(z.enum(["waist_rolls", "waist_digs", "sags", "short_inseam", "toe_pressure", "snags", "too_warm", "not_warm_enough", "none"])).default([]), profileMatchingConsent: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const raw = await request.json();
  if (raw.category === "tights") {
    const tights = z.object({ category: z.literal("tights"), profile: tightsProfileSchema }).safeParse(raw);
    if (!tights.success) return NextResponse.json({ error: "Invalid Tights Profile", details: tights.error.flatten() }, { status: 400 });
    return NextResponse.json({ data: getTightsMatches(tights.data.profile, tightsProducts), policy: "Money Never Changes Match", personalMatch: "Private tights preference + product construction + moderated community evidence; never affiliate rate, sponsorship, or brand payment.", sizeNotice: "A suggested size is a starting point only. Confirm the current brand chart and return policy before ordering." });
  }
  const result = z.object({ profile: profileSchema, context: contextSchema.optional() }).safeParse(raw);
  if (!result.success) return NextResponse.json({ error: "Invalid Bra Profile", details: result.error.flatten() }, { status: 400 });
  return NextResponse.json({
    data: getMatches(result.data.profile, undefined, result.data.context),
    policy: "Money Never Changes Match",
    personalMatch: "Profile + temporary wear need + consented community evidence; never affiliate rate, sponsorship, or brand payment.",
    sizeNotice: "A suggested size is a starting point only. Confirm the current brand chart and return policy before ordering.",
  });
}
