"use client";

import { CheckCircleIcon, LockKeyIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { rememberLocalContribution, type ContributionCategory, type ContributionType } from "@/lib/catalog-contributions";

type FormState = {
  type: ContributionType;
  category: ContributionCategory;
  brandName: string;
  productName: string;
  variantLabel: string;
  productUrl: string;
  productIdentifier: string;
  observedNote: string;
  businessEmail: string;
  preferredUpdateMethod: "claim_portal" | "csv" | "contact";
  relationship: "i_own_or_wore_it" | "i_found_a_reference" | "i_represent_the_brand" | "i_represent_a_retailer";
  attestation: boolean;
  companySite: string;
};

const initialForm: FormState = {
  type: "missing_product", category: "bra", brandName: "", productName: "", variantLabel: "", productUrl: "", productIdentifier: "", observedNote: "", businessEmail: "", preferredUpdateMethod: "claim_portal", relationship: "i_own_or_wore_it", attestation: false, companySite: "",
};

const typeCopy: Record<ContributionType, { title: string; description: string }> = {
  missing_product: { title: "Add a missing product", description: "Tell us about a bra or pair of tights we do not yet list. A product link is enough; no receipt or photo is needed." },
  correction: { title: "Correct product facts", description: "Flag an incorrect size range, construction detail, material or product status. We verify every correction before it changes the library." },
  brand_claim: { title: "Claim a brand record", description: "For brand teams: confirm your details, nominate a contact and choose the low-friction way you would like to update information." },
};

export function CatalogContributionForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const copy = useMemo(() => typeCopy[form.type], [form.type]);
  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }));

  function chooseType(type: ContributionType) {
    setStatus("idle");
    setMessage("");
    setForm((current) => ({
      ...current,
      type,
      category: type === "brand_claim" ? "both" : current.category === "both" ? "bra" : current.category,
      relationship: type === "brand_claim" ? "i_represent_the_brand" : current.relationship === "i_represent_the_brand" ? "i_own_or_wore_it" : current.relationship,
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/catalog/contributions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data) throw new Error(body?.error ?? "Submission failed");
      rememberLocalContribution({
        id: body.data.id,
        type: form.type,
        brandName: form.brandName,
        productName: form.productName || undefined,
        receivedAt: body.data.receivedAt,
        status: body.data.persisted ? "received" : "staged_locally",
      });
      setMessage(body.message);
      setStatus("saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not submit that record. Please try again.");
      setStatus("error");
    }
  }

  if (status === "saved") {
    return <section className="contribution-success"><CheckCircleIcon size={28} weight="fill" /><div><p className="eyebrow">Received for review</p><h2>Thank you for improving the library.</h2><p>{message}</p><button className="outline-button" type="button" onClick={() => { setForm(initialForm); setStatus("idle"); setMessage(""); }}>Submit another record</button></div></section>;
  }

  return <section className="contribution-workspace">
    <div className="contribution-types" aria-label="Contribution type">
      {(Object.keys(typeCopy) as ContributionType[]).map((type) => <button type="button" key={type} className={form.type === type ? "active" : ""} onClick={() => chooseType(type)}><span>{type === "missing_product" ? "01" : type === "correction" ? "02" : "03"}</span>{typeCopy[type].title}</button>)}
    </div>
    <div className="contribution-heading"><div><p className="eyebrow">Contribution desk</p><h2>{copy.title}</h2><p>{copy.description}</p></div><div className="contribution-rules"><SparkleIcon size={18} weight="fill" /><span>Every report is deduplicated, checked and linked to evidence before it can become public product data.</span></div></div>
    <form className="contribution-form" onSubmit={submit}>
      <div className="fields three">
        <label>Category<select value={form.category} onChange={(event) => update("category", event.target.value as ContributionCategory)} disabled={form.type === "brand_claim"}><option value="bra">Bras</option><option value="tights">Tights</option>{form.type === "brand_claim" && <option value="both">Both categories</option>}</select></label>
        <label>Brand name<input required maxLength={120} value={form.brandName} onChange={(event) => update("brandName", event.target.value)} placeholder="e.g. Panache" /></label>
        <label>Product name{form.type === "brand_claim" ? <input maxLength={180} value={form.productName} onChange={(event) => update("productName", event.target.value)} placeholder="Optional: a product to update" /> : <input required={!form.productUrl} maxLength={180} value={form.productName} onChange={(event) => update("productName", event.target.value)} placeholder={form.productUrl ? "Optional when a link is included" : "e.g. Envy Balconette"} />}</label>
      </div>
      {form.type !== "brand_claim" && <div className="fields three">
        <label>Colour / size / variant <span>Optional, but helps separate versions.</span><input maxLength={100} value={form.variantLabel} onChange={(event) => update("variantLabel", event.target.value)} placeholder="e.g. Black / 34FF" /></label>
        <label>SKU, GTIN or barcode <span>Optional. Type it; do not upload a receipt.</span><input maxLength={100} value={form.productIdentifier} onChange={(event) => update("productIdentifier", event.target.value)} placeholder="If shown on the product" /></label>
        <label>Reference link <span>Official or authorised retailer page. A link is enough if the product name is unknown.</span><input type="url" value={form.productUrl} onChange={(event) => update("productUrl", event.target.value)} placeholder="https://…" /></label>
      </div>}
      {form.type === "brand_claim" && <div className="fields three"><label>Business email<input required type="email" maxLength={254} value={form.businessEmail} onChange={(event) => update("businessEmail", event.target.value)} placeholder="name@brand.com" /></label><label>Preferred update method<select value={form.preferredUpdateMethod} onChange={(event) => update("preferredUpdateMethod", event.target.value as FormState["preferredUpdateMethod"])}><option value="claim_portal">Review records in the claim portal</option><option value="csv">Send a CSV template</option><option value="contact">Contact us first</option></select></label><label>Category scope<select value={form.category} onChange={(event) => update("category", event.target.value as ContributionCategory)}><option value="both">Both categories</option><option value="bra">Bras</option><option value="tights">Tights</option></select></label></div>}
      <label className="contribution-note">What should we verify? <span>Use your own words. Do not paste long brand descriptions, review text or private information.</span><textarea maxLength={600} value={form.observedNote} onChange={(event) => update("observedNote", event.target.value)} placeholder={form.type === "correction" ? "Example: the current size chart includes 32–46 bands; the listed range appears incomplete." : "Example: this product is available in a size or construction we have not yet researched."} /></label>
      {form.type !== "brand_claim" && <label className="contribution-relationship">Your connection<select value={form.relationship} onChange={(event) => update("relationship", event.target.value as FormState["relationship"])}><option value="i_own_or_wore_it">I own or wore this product</option><option value="i_found_a_reference">I found a reference</option><option value="i_represent_a_retailer">I represent an authorised retailer</option></select></label>}
      <input className="honeypot" tabIndex={-1} aria-hidden="true" value={form.companySite} onChange={(event) => update("companySite", event.target.value)} />
      <label className="contribution-attestation"><input required type="checkbox" checked={form.attestation} onChange={(event) => update("attestation", event.target.checked)} /><span>I am submitting information I may share. I understand this report is private to the review queue and does not create a public product page automatically.</span></label>
      <div className="contribution-submit"><p><LockKeyIcon size={14} /> We do not ask for body photos, receipts, address details or private measurements here. Brand contact details are used only to verify a claim.</p><button className="button" type="submit" disabled={status === "saving"}>{status === "saving" ? "Sending…" : form.type === "brand_claim" ? "Send claim for verification" : "Send to the research queue"}</button></div>
      {status === "error" && <p className="review-error">{message}</p>}
    </form>
  </section>;
}
