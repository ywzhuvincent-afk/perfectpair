import type { NormalizedCandidate, QualityReport } from "@/lib/types";
import type { SourceAdapter } from "./types";

const creativeFields = new Set(["description", "image", "imageUrl", "imageUrls", "gallery", "reviewBody", "marketingCopy", "editorialCopy"]);

export function assessCandidate(item: NormalizedCandidate, source: SourceAdapter): QualityReport {
  let score = 0;
  const reasons: string[] = [];
  const blockingIssues: string[] = [];
  const { candidate, product, fieldSources } = item;
  const category = candidate.category ?? "bra";
  const unapprovedFields = Object.keys(product).filter((field) => !source.rights.allowedFields.includes(field));
  const creativeFieldsPresent = Object.keys(product).filter((field) => creativeFields.has(field));
  if (candidate.legalBasis === "partner_authorized" || candidate.legalBasis === "manual_import" || candidate.legalBasis === "first_party_measurement" || candidate.legalBasis === "verified_contributor_evidence") { score += 30; reasons.push("Permitted or independently collected provenance is present."); }
  else { score += 15; reasons.push("Public source requires policy and robots review before activation."); }
  if (source.rights.contentHandling !== "licensed_full_content" && creativeFieldsPresent.length) blockingIssues.push(`Unlicensed creative content is not allowed: ${creativeFieldsPresent.join(", ")}.`);
  if (unapprovedFields.length) blockingIssues.push(`Source policy does not permit these normalized fields: ${unapprovedFields.join(", ")}.`);
  if (!source.rights.permitsAutomatedAccess || !source.rights.permitsPublication) blockingIssues.push("Source rights policy does not allow automated access and publication.");
  if (typeof product.brand === "string" && typeof product.name === "string") { score += 20; reasons.push("Brand and product name are present."); } else blockingIssues.push("Missing brand or product name.");
  if (category === "bra" && product.style && product.wire && product.cupConstruction) { score += 15; reasons.push("Core bra style, wire and cup construction are normalized."); }
  else if (category === "tights" && product.style && product.denier && product.waist) { score += 15; reasons.push("Core tights denier, coverage style and waist construction are normalized."); }
  else reasons.push(`Core ${category} construction needs mapping before publication.`);
  if (Array.isArray(product.material) && product.material.length) { score += 10; reasons.push("Material composition is populated."); }
  if (typeof product.sizeRange === "string" && product.sizeRange) { score += 10; reasons.push("Size range is populated."); }
  const price = product.price;
  if (typeof price === "object" && price !== null && "amount" in price && typeof price.amount === "number" && price.amount >= 0) { score += 10; reasons.push("Observed price is valid."); }
  if (Object.keys(fieldSources).length >= 6) { score += 10; reasons.push("Field-level provenance is attached."); }
  else reasons.push("Some fields lack provenance.");
  if (!candidate.canonicalUrl.startsWith("https://")) blockingIssues.push("Canonical URL must use HTTPS.");
  if (candidate.legalBasis === "public_product_page") blockingIssues.push("Public-page sources may not publish without a current terms, robots and rights approval.");
  const finalScore = Math.min(score, 100);
  if (blockingIssues.length) return { status: "needs_review", score: finalScore, reasons, blockingIssues };
  return { status: finalScore >= 80 ? "approved" : "needs_review", score: finalScore, reasons, blockingIssues };
}
