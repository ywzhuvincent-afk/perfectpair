"use client";

import { MagnifyingGlassIcon, SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFitState } from "@/lib/fit-state";
import { getMatches } from "@/lib/match";
import { isTightsProduct, type CatalogProduct } from "@/lib/tights";
import { getTightsMatches as getPersonalTightsMatches } from "@/lib/tights-match";
import type { BraProduct } from "@/lib/types";
import type { LiveCatalogStatus } from "@/lib/live-catalog";
import { ProductCard } from "./product-card";

const braStyles = ["all", "t_shirt", "plunge", "full_coverage", "balconette", "wireless", "bralette"];
const tightsStyles = ["all", "sheer", "semi_opaque", "opaque", "shaping", "thermal", "patterned"];

export function DiscoverClient({ initialCategory = "all", products, catalogStatus }: { initialCategory?: "all" | "bra" | "tights"; products: CatalogProduct[]; catalogStatus: LiveCatalogStatus }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "bra" | "tights">(initialCategory);
  const [style, setStyle] = useState("all");
  const [wire, setWire] = useState("all");
  const [mode, setMode] = useState<"community" | "personal">("community");
  const { profile, tightsProfile, context } = useFitState();
  const styles = category === "tights" ? tightsStyles : braStyles;
  const filtered = useMemo(() => products.filter((product) => {
    const productCategory = isTightsProduct(product) ? "tights" : "bra";
    const searchable = `${product.brand} ${product.name} ${product.style} ${isTightsProduct(product) ? product.denier : product.wire} ${product.useCases.join(" ")}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (category === "all" || productCategory === category) && (style === "all" || product.style === style) && (wire === "all" || (!isTightsProduct(product) && product.wire === wire));
  }), [products, query, category, style, wire]);
  const braFiltered = useMemo(() => filtered.filter((product): product is BraProduct => !isTightsProduct(product)), [filtered]);
  const tightsFiltered = useMemo(() => filtered.filter(isTightsProduct), [filtered]);
  const personal = useMemo(() => getMatches(profile, braFiltered, context), [profile, braFiltered, context]);
  const tightsPersonal = useMemo(() => getPersonalTightsMatches(tightsProfile, tightsFiltered), [tightsProfile, tightsFiltered]);
  const combinedPersonal = [...personal, ...tightsPersonal].sort((a, b) => b.score - a.score);
  const selectCategory = (next: "all" | "bra" | "tights") => { setCategory(next); setStyle("all"); setWire("all"); setMode("community"); };
  return <>
    <div className="library-category-tabs" aria-label="Product category"><button type="button" className={category === "all" ? "active" : ""} onClick={() => selectCategory("all")}>All research</button><button type="button" className={category === "bra" ? "active" : ""} onClick={() => selectCategory("bra")}>Bras</button><button type="button" className={category === "tights" ? "active" : ""} onClick={() => selectCategory("tights")}>Tights</button></div>
    <div className="discover-controls"><label className="search"><MagnifyingGlassIcon size={18} /><input placeholder="Brand, style, construction, denier…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className="filter-group"><SlidersHorizontalIcon size={15} />{styles.map((value) => <button type="button" onClick={() => setStyle(value)} className={style === value ? "active" : ""} key={value}>{value === "all" ? "All styles" : value.replaceAll("_", " ")}</button>)}</div></div>
    <div className="catalog-mode"><div><button type="button" className={mode === "community" ? "active" : ""} onClick={() => setMode("community")}>Community database</button><button type="button" className={mode === "personal" ? "active" : ""} onClick={() => setMode("personal")}>My matches</button>{category !== "tights" && <button type="button" className={wire === "all" ? "" : "active"} onClick={() => setWire(wire === "all" ? "wireless" : "all")}>{wire === "all" ? "Wire-free filter" : "Wire-free only"}</button>}</div><p>{mode === "community" ? "Community score is moderated product-level evidence, not a paid placement." : "Personal Match uses your private profile and practical preference—not a sponsored ranking."}</p></div>
    {catalogStatus === "ready" ? <p className="results-line">{filtered.length} reviewed product record{filtered.length === 1 ? "" : "s"} · only published canonical records appear in this library</p> : <section className="catalog-building-state"><p className="eyebrow">Catalogue in progress</p><h2>{catalogStatus === "unavailable" ? "The research library is temporarily unavailable." : "The first reviewed products are being added."}</h2><p>{catalogStatus === "unavailable" ? "Please try again shortly. No development fixtures are substituted for live product data." : "No product is shown until its source facts are reviewed and published. You can help by submitting a missing product link."}</p><Link className="outline-button" href="/contribute">Submit a product link</Link></section>}
    <aside className="catalog-gap-prompt"><div><strong>Cannot find a product?</strong><span>Send a private research lead. It will be deduplicated, checked and never appears automatically.</span></div><Link className="outline-button" href="/contribute">Add it to the queue</Link></aside>
    {catalogStatus === "ready" && <div className="catalog-grid">{mode === "community" ? filtered.map((product) => <ProductCard product={product} key={product.id} />) : (category === "bra" ? personal : category === "tights" ? tightsPersonal : combinedPersonal).map((match) => <ProductCard product={match.product} match={match} key={match.product.id} />)}</div>}
  </>;
}
