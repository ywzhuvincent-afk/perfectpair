"use client";

import { MagnifyingGlassIcon, SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/lang-provider";
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
  const { t, term } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "bra" | "tights">(initialCategory);
  const [style, setStyle] = useState("all");
  const [wire, setWire] = useState("all");
  const [mode, setMode] = useState<"community" | "personal">("community");
  const { profile, tightsProfile, context } = useFitState();
  const styles = category === "tights" ? tightsStyles : braStyles;
  const filtered = useMemo(() => products.filter((product) => {
    const productCategory = isTightsProduct(product) ? "tights" : "bra";
    const facets = [product.style, isTightsProduct(product) ? product.opacity : product.wire, ...product.useCases];
    // Chinese searches match the Chinese names of styles and occasions as well as the English codes.
    const searchable = `${product.brand} ${product.name} ${product.style} ${isTightsProduct(product) ? product.denier : product.wire} ${product.useCases.join(" ")} ${facets.map(term).join(" ")}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (category === "all" || productCategory === category) && (style === "all" || product.style === style) && (wire === "all" || (!isTightsProduct(product) && product.wire === wire));
  }), [products, query, category, style, wire, term]);
  const braFiltered = useMemo(() => filtered.filter((product): product is BraProduct => !isTightsProduct(product)), [filtered]);
  const tightsFiltered = useMemo(() => filtered.filter(isTightsProduct), [filtered]);
  const personal = useMemo(() => getMatches(profile, braFiltered, context), [profile, braFiltered, context]);
  const tightsPersonal = useMemo(() => getPersonalTightsMatches(tightsProfile, tightsFiltered), [tightsProfile, tightsFiltered]);
  const combinedPersonal = [...personal, ...tightsPersonal].sort((a, b) => b.score - a.score);
  const selectCategory = (next: "all" | "bra" | "tights") => { setCategory(next); setStyle("all"); setWire("all"); setMode("community"); };
  const unavailable = catalogStatus === "unavailable";
  return <>
    <div className="library-category-tabs" aria-label={t("Product category", "品类")}><button type="button" className={category === "all" ? "active" : ""} onClick={() => selectCategory("all")}>{t("All research", "全部")}</button><button type="button" className={category === "bra" ? "active" : ""} onClick={() => selectCategory("bra")}>{t("Bras", "内衣")}</button><button type="button" className={category === "tights" ? "active" : ""} onClick={() => selectCategory("tights")}>{t("Tights", "丝袜")}</button></div>
    <div className="discover-controls"><label className="search"><MagnifyingGlassIcon size={18} /><input placeholder={t("Brand, style, construction, denier…", "品牌、款式、版型、D数…")} value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className="filter-group"><SlidersHorizontalIcon size={15} />{styles.map((value) => <button type="button" onClick={() => setStyle(value)} className={style === value ? "active" : ""} key={value}>{value === "all" ? t("All styles", "全部款式") : term(value)}</button>)}</div></div>
    <div className="catalog-mode"><div><button type="button" className={mode === "community" ? "active" : ""} onClick={() => setMode("community")}>{t("Community database", "大家的资料库")}</button><button type="button" className={mode === "personal" ? "active" : ""} onClick={() => setMode("personal")}>{t("My matches", "适合我的")}</button>{category !== "tights" && <button type="button" className={wire === "all" ? "" : "active"} onClick={() => setWire(wire === "all" ? "wireless" : "all")}>{wire === "all" ? t("Wire-free filter", "只看无钢圈") : t("Wire-free only", "已筛选无钢圈")}</button>}</div><p>{mode === "community" ? t("Community score is moderated product-level evidence, not a paid placement.", "用户评分是审核过的真实产品反馈，不是花钱买的排名。") : t("Personal Match uses your private profile and practical preference—not a sponsored ranking.", "个人匹配根据你的私人档案和实际偏好计算，不是赞助排名。")}</p></div>
    {catalogStatus === "ready" ? <p className="results-line">{t(`${filtered.length} reviewed product record${filtered.length === 1 ? "" : "s"} · only published canonical records appear in this library`, `${filtered.length} 条已审核的产品资料 · 这里只显示正式发布的资料`)}</p> : <section className="catalog-building-state"><p className="eyebrow">{t("Catalogue in progress", "产品库建设中")}</p><h2>{unavailable ? t("The research library is temporarily unavailable.", "产品库暂时打不开。") : t("The first reviewed products are being added.", "第一批审核过的产品正在上架。")}</h2><p>{unavailable ? t("Please try again shortly. No development fixtures are substituted for live product data.", "请稍后再试。我们不会拿测试数据冒充真实产品资料。") : t("No product is shown until its source facts are reviewed and published. You can help by submitting a missing product link.", "产品资料审核发布后才会显示。你可以提交缺少的产品链接来帮忙。")}</p><Link className="outline-button" href="/contribute">{t("Submit a product link", "提交产品链接")}</Link></section>}
    <aside className="catalog-gap-prompt"><div><strong>{t("Cannot find a product?", "找不到想要的产品？")}</strong><span>{t("Send a private research lead. It will be deduplicated, checked and never appears automatically.", "发一条私人线索给我们。会先去重、核实，不会自动公开。")}</span></div><Link className="outline-button" href="/contribute">{t("Add it to the queue", "加入待补清单")}</Link></aside>
    {catalogStatus === "ready" && <div className="catalog-grid">{mode === "community" ? filtered.map((product) => <ProductCard product={product} key={product.id} />) : (category === "bra" ? personal : category === "tights" ? tightsPersonal : combinedPersonal).map((match) => <ProductCard product={match.product} match={match} key={match.product.id} />)}</div>}
  </>;
}
