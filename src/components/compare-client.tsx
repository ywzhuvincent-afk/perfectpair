"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr";
import { useFitState } from "@/lib/fit-state";
import { getMatches } from "@/lib/match";
import { getTightsMatches } from "@/lib/tights-match";
import { isTightsProduct, type CatalogProduct, type TightsProduct } from "@/lib/tights";
import type { BraProduct } from "@/lib/types";

type Category = "bra" | "tights";
type CatalogStatus = "ready" | "empty" | "unavailable";

const braLabels = ["Match for today", "Community score", "Style", "Wire", "Cup construction", "Mapped size range", "Band comfort", "Cup fit", "Wire comfort", "Straps", "Side support", "Breathability", "Price", "Review confidence"];
const tightsLabels = ["Match for today", "Community score", "Coverage", "Denier", "Waist construction", "Toe construction", "Warmth", "Compression", "Comfort", "Stays put", "Breathability", "Durability", "Price", "Review confidence"];

function braProductsFor(products: CatalogProduct[]): BraProduct[] { return products.filter((product): product is BraProduct => !isTightsProduct(product)); }
function tightsProductsFor(products: CatalogProduct[]): TightsProduct[] { return products.filter(isTightsProduct); }

function firstIds(products: CatalogProduct[]) {
  return products.slice(0, 3).map((product) => product.id);
}

function CommunityScore({ product }: { product: CatalogProduct }) {
  return product.score.reviewCount ? <>★ {product.score.overall} · {product.score.reviewCount} reviews</> : <>No moderated reviews yet</>;
}

function CompareImage({ product }: { product: CatalogProduct }) {
  const image = product.media?.[0];
  return <span className={`compare-image${image ? "" : " image-pending"}`}>{image ? <Image src={image.url} alt={image.alt} fill unoptimized sizes="170px" /> : <small>Image awaiting<br />authorisation</small>}</span>;
}

export function CompareClient({ products, catalogStatus }: { products: CatalogProduct[]; catalogStatus: CatalogStatus }) {
  const { profile, tightsProfile, context } = useFitState();
  const braProducts = useMemo(() => braProductsFor(products), [products]);
  const tightsProducts = useMemo(() => tightsProductsFor(products), [products]);
  const [category, setCategory] = useState<Category>(() => braProducts.length ? "bra" : "tights");
  const [selected, setSelected] = useState<string[]>(() => firstIds(braProducts.length ? braProducts : tightsProducts));
  const currentProducts = category === "bra" ? braProducts : tightsProducts;
  const matched = useMemo(() => category === "bra" ? getMatches(profile, braProducts, context) : getTightsMatches(tightsProfile, tightsProducts), [category, profile, tightsProfile, context, braProducts, tightsProducts]);
  const compared = selected.map((id) => currentProducts.find((product) => product.id === id)).filter((product): product is CatalogProduct => Boolean(product));
  const labels = category === "bra" ? braLabels : tightsLabels;
  const matchFor = (id: string) => matched.find((match) => match.product.id === id);
  const value = (label: string, product: CatalogProduct) => {
    const match = matchFor(product.id);
    if (isTightsProduct(product)) {
      const result: Record<string, React.ReactNode> = {
        "Match for today": `${match?.score ?? "—"}% personal${match?.suggestedSize ? ` · start ${match.suggestedSize}` : ""}`,
        "Community score": <CommunityScore product={product} />, Coverage: product.opacity.replaceAll("_", " "), Denier: `${product.denier} denier`, "Waist construction": product.waist.replaceAll("_", " "), "Toe construction": product.toe.replaceAll("_", " "), Warmth: `${product.warmth} / 5`, Compression: `${product.compression} / 5`, Comfort: product.score.reviewCount ? `★ ${product.score.comfort}` : "Awaiting reviews", "Stays put": product.score.reviewCount ? `★ ${product.score.stayPut}` : "Awaiting reviews", Breathability: product.score.reviewCount ? `★ ${product.score.breathability}` : "Awaiting reviews", Durability: product.score.reviewCount ? `★ ${product.score.durability}` : "Awaiting reviews", Price: product.price.amount > 0 ? `${product.price.currency} $${product.price.amount}` : "Price not yet verified", "Review confidence": product.score.reviewCount ? product.score.confidence : "Evidence pending",
      };
      return result[label];
    }
    const result: Record<string, React.ReactNode> = {
      "Match for today": `${match?.score ?? "—"}% personal${match?.suggestedSize ? ` · start ${match.suggestedSize}` : ""}`, "Community score": <CommunityScore product={product} />, Style: product.style.replaceAll("_", " "), Wire: product.wire.replaceAll("_", " "), "Cup construction": product.cupConstruction.replaceAll("_", " "), "Mapped size range": `${product.sizeSystem} · ${product.sizeRange}`, "Band comfort": product.score.reviewCount ? `★ ${product.score.bandComfort}` : "Awaiting reviews", "Cup fit": product.score.reviewCount ? `★ ${product.score.cupFit}` : "Awaiting reviews", "Wire comfort": product.score.reviewCount ? `★ ${product.score.wireComfort}` : "Awaiting reviews", Straps: product.score.reviewCount ? `★ ${product.score.strapComfort}` : "Awaiting reviews", "Side support": product.score.reviewCount ? `★ ${product.score.sideSupport}` : "Awaiting reviews", Breathability: product.score.reviewCount ? `★ ${product.score.breathability}` : "Awaiting reviews", Price: product.price.amount > 0 ? `${product.price.currency} $${product.price.amount}` : "Price not yet verified", "Review confidence": product.score.reviewCount ? product.score.confidence : "Evidence pending",
    };
    return result[label];
  };
  const selectCategory = (next: Category) => { setCategory(next); setSelected(firstIds(next === "bra" ? braProducts : tightsProducts)); };
  const update = (position: number, productId: string) => setSelected((current) => current.map((id, index) => index === position ? productId : id));
  const categoryCopy = category === "bra" ? "Compare published construction, mapped sizing and any moderated reports against your current Bra Profile." : "Compare denier, coverage, waist construction and any structured wear signals against your Tights Profile.";

  if (catalogStatus !== "ready") {
    return <section className="catalog-building-state"><p className="eyebrow">Comparison is waiting for reviewed data</p><h2>{catalogStatus === "unavailable" ? "The research library is temporarily unavailable." : "The first reviewed products are being added."}</h2><p>{catalogStatus === "unavailable" ? "Please try again shortly. PerfectPair never compares development fixtures in place of its reviewed catalogue." : "No product is compared until its source facts are reviewed and published."}</p><Link className="outline-button" href="/contribute">Submit a product link</Link></section>;
  }

  return <>
    <div className="compare-picker"><div><p className="eyebrow">Choose up to three reviewed products</p><p>{categoryCopy}</p></div><button type="button" className="text-button" disabled={!currentProducts.length} onClick={() => setSelected(matched.slice(0, 3).map((match) => match.product.id))}><ArrowClockwiseIcon size={15} /> Use my top matches</button></div>
    <div className="library-category-tabs compare-tabs"><button type="button" className={category === "bra" ? "active" : ""} onClick={() => selectCategory("bra")}>Bras</button><button type="button" className={category === "tights" ? "active" : ""} onClick={() => selectCategory("tights")}>Tights</button></div>
    {!currentProducts.length ? <section className="catalog-building-state"><p className="eyebrow">Category in progress</p><h2>There are no reviewed {category === "bra" ? "bra" : "tights"} records to compare yet.</h2><p>PerfectPair will not substitute development fixtures or unreviewed submissions.</p><Link className="outline-button" href="/contribute">Submit a product link</Link></section> : <div className="compare-table"><div className="compare-header"><span>For your fit today</span>{compared.map((product, index) => <div key={product.id}><select aria-label={`Product ${index + 1}`} value={product.id} onChange={(event) => update(index, event.target.value)}>{currentProducts.map((option) => <option key={option.id} value={option.id}>{option.brand} — {option.name}</option>)}</select><p className="eyebrow">{product.brand}</p><h3>{product.name}</h3><CompareImage product={product} /></div>)}</div>{labels.map((label) => <div className="compare-row" key={label}><strong>{label}</strong>{compared.map((product) => <span key={product.id}>{value(label, product)}</span>)}</div>)}</div>}
    <section className="comparison-rule"><strong>What is being compared?</strong><p><b>Personal Match</b> changes with your private profile and practical need. <b>Community score</b> appears only after moderated product-level reviews. Neither can be purchased, and manufacturer statements never become community experience.</p></section>
    <p className="add-comparison">A suggested size is a starting point; always confirm each brand’s current size chart and return terms.</p>
  </>;
}
