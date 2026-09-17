"use client";

import { CheckCircleIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import type { CatalogProduct } from "@/lib/tights";
import { isTightsProduct } from "@/lib/tights";

type Scores = Record<string, number>;
const braMetrics = [["overall", "Overall"], ["comfort", "Comfort"], ["bandComfort", "Band comfort"], ["cupFit", "Cup fit"], ["wireComfort", "Wire comfort"], ["strapComfort", "Straps"], ["stayPut", "Stays put"], ["sideSupport", "Side support"], ["breathability", "Breathability"], ["durability", "Durability"], ["sizeAccuracy", "Size accuracy"], ["value", "Value"]] as const;
const tightsMetrics = [["overall", "Overall"], ["comfort", "Comfort"], ["waistComfort", "Waist comfort"], ["coverage", "Coverage"], ["stayPut", "Stays put"], ["toeComfort", "Toe comfort"], ["breathability", "Breathability"], ["durability", "Durability"], ["sizeAccuracy", "Size accuracy"], ["value", "Value"]] as const;

export function ReviewPanel({ product }: { product: CatalogProduct }) {
  const tights = isTightsProduct(product);
  const metrics = tights ? tightsMetrics : braMetrics;
  const [sizeBought, setSizeBought] = useState("");
  const [scores, setScores] = useState<Scores>(() => Object.fromEntries(metrics.map(([key]) => [key, 4])));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const updateScore = (key: string, value: string) => setScores((current) => ({ ...current, [key]: Number(value) }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    const payload = tights ? { category: "tights", productId: product.id, productVersion: product.productVersion, sizeBought, scores, fitSignals: { sizing: "true_to_size", waist: "secure", coverage: "as_expected", toe: "comfortable" }, issues: [], bodyProfileConsent: "private_only" } : { category: "bra", productId: product.id, productVersion: product.productVersion, sizeBought, scores, fitSignals: { sizing: "true_to_size", band: "secure", cup: "contained", wire: "comfortable", straps: "stayed_put" }, issues: [], bodyProfileConsent: "private_only" };
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Review submission failed");
      setStatus("saved");
    } catch { setStatus("error"); }
  }

  return <section className="review-panel"><div><p className="eyebrow">Community review</p><h2>Rate the details you actually wore.</h2><p>Every score is structured by category and enters moderation before it can affect public community evidence.</p></div>{status === "saved" ? <div className="review-success"><CheckCircleIcon size={24} weight="fill" /><div><strong>Thank you—your review is pending moderation.</strong><p>It remains private until reviewed. A later follow-up can ask about durability after real wear or washing.</p></div></div> : <form onSubmit={submit}><label className="review-size">Size you wore<input required maxLength={30} value={sizeBought} onChange={(event) => setSizeBought(event.target.value)} placeholder={tights ? "e.g. M / C" : "e.g. 34D"} /></label><div className="review-metrics">{metrics.map(([key, label]) => <label key={key}><span>{label}</span><select value={scores[key]} onChange={(event) => updateScore(key, event.target.value)}>{[1, 2, 3, 4, 5].map((score) => <option value={score} key={score}>{score} / 5</option>)}</select></label>)}</div><div className="review-submit"><p><LockKeyIcon size={14} /> Your profile is private. Anonymous matching requires separate, explicit consent.</p><button className="button" disabled={status === "saving"} type="submit">{status === "saving" ? "Saving…" : "Send for moderation"}</button></div>{status === "error" && <p className="review-error">We could not save that review. Please check the size field and try again.</p>}</form>}</section>;
}
