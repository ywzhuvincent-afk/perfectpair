"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowClockwiseIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { products } from "@/lib/mock-data";
import { tightsProducts, type CatalogProduct, isTightsProduct } from "@/lib/tights";
import { useFitState } from "@/lib/fit-state";
import { getMatches } from "@/lib/match";
import { getTightsMatches } from "@/lib/tights-match";

const braLabels = ["Match for today", "Community score", "Style", "Wire", "Cup construction", "Mapped size range", "Band comfort", "Cup fit", "Wire comfort", "Straps", "Side support", "Breathability", "Price", "Review confidence"];
const tightsLabels = ["Match for today", "Community score", "Coverage", "Denier", "Waist construction", "Toe construction", "Warmth", "Compression", "Comfort", "Stays put", "Breathability", "Durability", "Price", "Review confidence"];

export function CompareClient() {
  const { profile, tightsProfile, context } = useFitState();
  const [category, setCategory] = useState<"bra" | "tights">("bra");
  const [selected, setSelected] = useState(products.slice(0, 3).map((product) => product.id));
  const currentProducts = category === "bra" ? products : tightsProducts;
  const matched = useMemo(() => category === "bra" ? getMatches(profile, products, context) : getTightsMatches(tightsProfile, tightsProducts), [category, profile, tightsProfile, context]);
  const compared = selected.map((id) => currentProducts.find((product) => product.id === id)).filter((product): product is CatalogProduct => Boolean(product));
  const labels = category === "bra" ? braLabels : tightsLabels;
  const matchFor = (id: string) => matched.find((match) => match.product.id === id);
  const value = (label: string, product: CatalogProduct) => {
    const match = matchFor(product.id);
    if (isTightsProduct(product)) {
      const result: Record<string, string> = {
        "Match for today": `${match?.score ?? "—"}% personal${match?.suggestedSize ? ` · start ${match.suggestedSize}` : ""}`,
        "Community score": `★ ${product.score.overall} · ${product.score.reviewCount} reviews`, Coverage: product.opacity.replace("_", " "), Denier: `${product.denier} denier`, "Waist construction": product.waist.replace("_", " "), "Toe construction": product.toe.replace("_", " "), Warmth: `${product.warmth} / 5`, Compression: `${product.compression} / 5`, Comfort: `★ ${product.score.comfort}`, "Stays put": `★ ${product.score.stayPut}`, Breathability: `★ ${product.score.breathability}`, Durability: `★ ${product.score.durability}`, Price: `${product.price.currency} $${product.price.amount}`, "Review confidence": product.score.confidence,
      };
      return result[label];
    }
    const result: Record<string, string> = {
      "Match for today": `${match?.score ?? "—"}% personal${match?.suggestedSize ? ` · start ${match.suggestedSize}` : ""}`, "Community score": `★ ${product.score.overall} · ${product.score.reviewCount} reviews`, Style: product.style.replace("_", " "), Wire: product.wire.replace("_", " "), "Cup construction": product.cupConstruction.replace("_", " "), "Mapped size range": `${product.sizeSystem} · ${product.sizeRange}`, "Band comfort": `★ ${product.score.bandComfort}`, "Cup fit": `★ ${product.score.cupFit}`, "Wire comfort": `★ ${product.score.wireComfort}`, Straps: `★ ${product.score.strapComfort}`, "Side support": `★ ${product.score.sideSupport}`, Breathability: `★ ${product.score.breathability}`, Price: `${product.price.currency} $${product.price.amount}`, "Review confidence": product.score.confidence,
    };
    return result[label];
  };
  const selectCategory = (next: "bra" | "tights") => { setCategory(next); setSelected((next === "bra" ? products : tightsProducts).slice(0, 3).map((product) => product.id)); };
  const update = (position: number, productId: string) => setSelected((current) => current.map((id, index) => index === position ? productId : id));
  const categoryCopy = category === "bra" ? "Compare construction, mapped sizing and structured reports against your current Bra Profile." : "Compare denier, coverage, waist construction and structured wear signals against your Tights Profile.";

  return <>
    <div className="compare-picker"><div><p className="eyebrow">Choose up to three products</p><p>{categoryCopy}</p></div><button type="button" className="text-button" onClick={() => setSelected(matched.slice(0, 3).map((match) => match.product.id))}><ArrowClockwiseIcon size={15} /> Use my top matches</button></div>
    <div className="library-category-tabs compare-tabs"><button type="button" className={category === "bra" ? "active" : ""} onClick={() => selectCategory("bra")}>Bras</button><button type="button" className={category === "tights" ? "active" : ""} onClick={() => selectCategory("tights")}>Tights</button></div>
    <div className="compare-table"><div className="compare-header"><span>For your fit today</span>{compared.map((product, index) => <div key={product.id}><select aria-label={`Product ${index + 1}`} value={product.id} onChange={(event) => update(index, event.target.value)}>{currentProducts.map((option) => <option key={option.id} value={option.id}>{option.brand} — {option.name}</option>)}</select><p className="eyebrow">{product.brand}</p><h3>{product.name}</h3><span className="compare-image"><Image src={isTightsProduct(product) ? "/images/perfectpair-tights-category.png" : "/images/perfectpair-bra-category.png"} alt="" fill sizes="170px" /></span></div>)}</div>{labels.map((label) => <div className="compare-row" key={label}><strong>{label}</strong>{compared.map((product) => <span key={product.id}>{value(label, product)}</span>)}</div>)}</div>
    <section className="comparison-rule"><strong>What is being compared?</strong><p><b>Personal Match</b> changes with your private profile and practical need. <b>Community score</b> is moderated product-level evidence. Neither can be purchased, and manufacturer statements never become community experience.</p></section>
    <p className="add-comparison"><PlusIcon size={14} /> A suggested size is a starting point; always confirm each brand’s current size chart and return terms.</p>
  </>;
}
