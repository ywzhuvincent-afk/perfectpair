import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { acceptContributionFrom } from "@/lib/contribution-rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalUrl = z.string().trim().url().max(2_000).optional().or(z.literal(""));
const optionalEmail = z.string().trim().email().max(254).optional().or(z.literal(""));

const contributionSchema = z.object({
  type: z.enum(["missing_product", "correction", "brand_claim"]),
  category: z.enum(["bra", "tights", "leggings", "jeans", "all"]),
  brandName: z.string().trim().min(1).max(120),
  productName: optionalText(180),
  variantLabel: optionalText(100),
  productUrl: optionalUrl,
  productIdentifier: optionalText(100),
  observedNote: optionalText(600),
  businessEmail: optionalEmail,
  preferredUpdateMethod: z.enum(["claim_portal", "csv", "contact"]),
  relationship: z.enum(["i_own_or_wore_it", "i_found_a_reference", "i_represent_the_brand", "i_represent_a_retailer"]),
  attestation: z.literal(true),
  companySite: z.literal("").optional(),
}).superRefine((value, context) => {
  if (value.type !== "brand_claim" && !value.productName && !value.productUrl) {
    context.addIssue({ code: "custom", path: ["productUrl"], message: "Please include a product name or a reference link." });
  }
  if (value.type === "brand_claim" && !value.businessEmail) {
    context.addIssue({ code: "custom", path: ["businessEmail"], message: "A business contact email is required for a brand claim." });
  }
  if (value.type === "brand_claim" && value.relationship !== "i_represent_the_brand") {
    context.addIssue({ code: "custom", path: ["relationship"], message: "Brand claims must be submitted by a brand representative." });
  }
  if (value.type !== "brand_claim" && value.category === "all") {
    context.addIssue({ code: "custom", path: ["category"], message: "Missing-product and correction reports need one category." });
  }
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid submission origin." }, { status: 403 });
  }
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (!acceptContributionFrom(address)) {
    return NextResponse.json({ error: "Too many reports from this connection. Please try again later." }, { status: 429 });
  }
  const parsed = contributionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid catalog contribution", details: parsed.error.flatten() }, { status: 400 });
  }

  const value = parsed.data;
  const contributionId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const database = getSupabaseAdmin();
  const linkLeadName = value.type !== "brand_claim" && !value.productName ? (() => {
    const link = new URL(value.productUrl!);
    return `Link lead: ${`${link.hostname}${link.pathname}`.slice(0, 166)}`;
  })() : value.productName;

  if (!database) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Catalog submissions are temporarily unavailable. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({
      data: { id: contributionId, persisted: false, receivedAt: submittedAt },
      message: "Development staging accepted. It is saved only in this browser until Supabase is configured.",
    }, { status: 202 });
  }

  const { error } = await database.from("catalog_contributions").insert({
    id: contributionId,
    submission_type: value.type,
    category: value.category,
    brand_name: value.brandName,
    product_name: value.type === "brand_claim" ? value.productName || null : linkLeadName,
    variant_label: value.variantLabel || null,
    product_url: value.productUrl || null,
    product_identifier: value.productIdentifier || null,
    observed_note: value.observedNote || null,
    relationship: value.relationship,
    business_email: value.businessEmail || null,
    preferred_update_method: value.type === "brand_claim" ? value.preferredUpdateMethod : null,
    attested: value.attestation,
  });

  if (error) {
    return NextResponse.json({ error: "Catalog submission could not be recorded." }, { status: 503 });
  }

  return NextResponse.json({
    data: { id: contributionId, persisted: true, receivedAt: submittedAt },
    message: "Received for source, privacy and product-review checks. It is not public yet.",
  }, { status: 202 });
}
