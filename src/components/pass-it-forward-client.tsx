"use client";

import { ArrowSquareOutIcon, CheckCircleIcon, CopyIcon, LockKeyIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { useFitState } from "@/lib/fit-state";
import type { PassItForwardDraft } from "@/lib/types";

const conditionLabels: Record<PassItForwardDraft["condition"], string> = {
  new_with_tags: "New with tags",
  like_new: "Like new",
  gently_worn: "Gently worn",
};

const marketplaceLabels: Record<PassItForwardDraft["marketplace"], string> = {
  vinted: "Vinted",
  depop: "Depop",
  poshmark: "Poshmark",
  other: "Another permitted marketplace",
};

function listingCopy(draft: Pick<PassItForwardDraft, "category" | "productLabel" | "sizeLabel" | "condition">) {
  return `${draft.productLabel}\nCategory: ${draft.category === "leggings" ? "Leggings" : "Jeans"}\nSize: ${draft.sizeLabel}\nCondition: ${conditionLabels[draft.condition]}\n\nThis item did not suit my fit needs. Please check the platform's current eligibility, hygiene and buyer-protection rules before listing. Product details are supplied by the seller; PerfectPair does not process payment, messages, delivery or returns.`;
}

export function PassItForwardClient() {
  const { handoffDrafts, saveHandoffDraft, updateHandoffDraftStatus, removeHandoffDraft, hydrated } = useFitState();
  const [productLabel, setProductLabel] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [category, setCategory] = useState<PassItForwardDraft["category"]>("leggings");
  const [condition, setCondition] = useState<PassItForwardDraft["condition"]>("like_new");
  const [marketplace, setMarketplace] = useState<PassItForwardDraft["marketplace"]>("vinted");
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const openDrafts = useMemo(() => handoffDrafts.filter((draft) => draft.status !== "closed"), [handoffDrafts]);

  async function copyDraft(draft: PassItForwardDraft) {
    try {
      await navigator.clipboard.writeText(listingCopy(draft));
      setCopiedId(draft.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setNotice("Your browser could not copy the draft. Select the text manually instead.");
    }
  }

  return <main className="page-shell pass-it-forward-page">
    <section className="pass-forward-hero"><div><p className="eyebrow">Pass it forward · no in-app money</p><h1>Wrong fit should not mean wasted.</h1><p>Prepare a private, accurate resale draft for eligible outerwear, then list it on a marketplace that provides its own payment and buyer protection. PerfectPair never takes payment, holds funds, sends shipping labels, hosts messages or publishes your contact details.</p></div><aside><LockKeyIcon size={23} /><strong>Private preparation only</strong><span>No price, bank details, address, photos, messages or body information are collected here.</span></aside></section>

    <section className="pass-forward-rules"><article><span>01</span><h2>Eligible now</h2><p>Leggings and jeans only. They are easier to assess safely as regular outerwear.</p></article><article><span>02</span><h2>Not eligible here</h2><p>Bras, tights, underwear, socks and swimwear are excluded from this first flow because hygiene and marketplace rules vary sharply.</p></article><article><span>03</span><h2>External transaction</h2><p>Use a marketplace’s current country-specific rules for payment, shipping, buyer protection and disputes.</p></article></section>

    <section className="handoff-form-section"><div><p className="eyebrow">Private listing helper</p><h2>Make an honest draft.</h2><p>Describe the product and condition accurately. You will copy the result yourself into an external platform; it is not a live PerfectPair listing.</p></div><form className="handoff-form" onSubmit={(event) => { event.preventDefault(); saveHandoffDraft({ category, productLabel: productLabel.trim(), sizeLabel: sizeLabel.trim(), condition, marketplace, status: "draft" }); setNotice("Private draft saved. Copy it when you are ready to list elsewhere."); setProductLabel(""); setSizeLabel(""); }}>
      <label>Category<select value={category} onChange={(event) => setCategory(event.target.value as PassItForwardDraft["category"])}><option value="leggings">Leggings</option><option value="jeans">Jeans</option></select></label>
      <label>Brand and product name<input required maxLength={160} value={productLabel} onChange={(event) => setProductLabel(event.target.value)} placeholder="e.g. Brand · style / model" /></label>
      <label>Size on garment<input required maxLength={30} value={sizeLabel} onChange={(event) => setSizeLabel(event.target.value)} placeholder="e.g. M / 28 × 30" /></label>
      <label>Condition<select value={condition} onChange={(event) => setCondition(event.target.value as PassItForwardDraft["condition"])}>{Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Where you expect to list<select value={marketplace} onChange={(event) => setMarketplace(event.target.value as PassItForwardDraft["marketplace"])}>{Object.entries(marketplaceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className="handoff-submit"><p>By saving, you confirm this is an eligible outerwear item and that you will follow the selected marketplace’s current rules.</p><button className="button" type="submit">Save private draft</button></div>
    </form></section>
    {notice && <p className="handoff-notice"><CheckCircleIcon size={16} /> {notice}</p>}

    <section className="handoff-drafts"><div className="section-heading"><div><p className="eyebrow">My handoff drafts</p><h2>{hydrated ? `${openDrafts.length} private ${openDrafts.length === 1 ? "draft" : "drafts"}` : "Loading your private drafts"}</h2></div><p>These stay in your private browser data in this first release. They do not appear to other members.</p></div>{openDrafts.length ? <div className="handoff-draft-list">{openDrafts.map((draft) => <article key={draft.id}><div><p className="eyebrow">{draft.category} · {marketplaceLabels[draft.marketplace]}</p><h3>{draft.productLabel}</h3><p>{draft.sizeLabel} · {conditionLabels[draft.condition]} · {draft.status === "listed_elsewhere" ? "Listed elsewhere" : "Private draft"}</p></div><div className="handoff-draft-actions"><button className="outline-button" type="button" onClick={() => copyDraft(draft)}>{copiedId === draft.id ? <><CheckCircleIcon size={15} /> Copied</> : <><CopyIcon size={15} /> Copy draft</>}</button><button className="quiet-link" type="button" onClick={() => updateHandoffDraftStatus(draft.id, draft.status === "listed_elsewhere" ? "draft" : "listed_elsewhere")}><ArrowSquareOutIcon size={15} /> {draft.status === "listed_elsewhere" ? "Mark as draft" : "Listed elsewhere"}</button><button className="quiet-link danger-link" type="button" onClick={() => removeHandoffDraft(draft.id)}><TrashIcon size={15} /> Delete</button></div></article>)}</div> : <div className="handoff-empty"><p>No draft yet. A private draft helps you record the product and condition before creating an external marketplace listing.</p></div>}</section>

    <section className="method-note handoff-method"><span>Safety</span><div><strong>This is deliberately not a marketplace.</strong><p>Do not move payments or personal contact through PerfectPair. Once a marketplace has its own current safety, hygiene, payment and dispute protections, the buyer and seller complete the transaction there.</p></div></section>
  </main>;
}
