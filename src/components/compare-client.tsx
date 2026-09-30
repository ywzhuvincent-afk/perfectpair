"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr";
import { useI18n } from "@/components/lang-provider";
import { useFitState } from "@/lib/fit-state";
import { getMatches } from "@/lib/match";
import { getTightsMatches } from "@/lib/tights-match";
import { isTightsProduct, type CatalogProduct, type TightsProduct } from "@/lib/tights";
import type { BraProduct } from "@/lib/types";

type Category = "bra" | "tights";
type CatalogStatus = "ready" | "empty" | "unavailable";

const labelZh: Record<string, string> = {
  "Match for today": "今天的匹配度", "Community score": "用户评分", Style: "款式", Wire: "钢圈", "Cup construction": "罩杯结构", "Mapped size range": "尺码范围", "Band comfort": "下围舒适", "Cup fit": "罩杯合身", "Wire comfort": "钢圈舒适", Straps: "肩带", "Side support": "侧边支撑", Breathability: "透气", Price: "价格", "Review confidence": "点评可信度",
  Coverage: "遮盖度", Denier: "D数", "Waist construction": "腰头设计", "Toe construction": "脚尖设计", Warmth: "保暖", Compression: "压力", Comfort: "舒适", "Stays put": "不下滑", Durability: "耐穿",
};

const braLabels = ["Match for today", "Community score", "Style", "Wire", "Cup construction", "Mapped size range", "Band comfort", "Cup fit", "Wire comfort", "Straps", "Side support", "Breathability", "Price", "Review confidence"];
const tightsLabels = ["Match for today", "Community score", "Coverage", "Denier", "Waist construction", "Toe construction", "Warmth", "Compression", "Comfort", "Stays put", "Breathability", "Durability", "Price", "Review confidence"];

function braProductsFor(products: CatalogProduct[]): BraProduct[] { return products.filter((product): product is BraProduct => !isTightsProduct(product)); }
function tightsProductsFor(products: CatalogProduct[]): TightsProduct[] { return products.filter(isTightsProduct); }

function firstIds(products: CatalogProduct[]) {
  return products.slice(0, 3).map((product) => product.id);
}

function CommunityScore({ product }: { product: CatalogProduct }) {
  const { t } = useI18n();
  return product.score.reviewCount ? <>★ {product.score.overall} · {t(`${product.score.reviewCount} reviews`, `${product.score.reviewCount} 条点评`)}</> : <>{t("No moderated reviews yet", "还没有审核通过的点评")}</>;
}

function CompareImage({ product }: { product: CatalogProduct }) {
  const { t } = useI18n();
  const image = product.media?.[0];
  return <span className={`compare-image${image ? "" : " image-pending"}`}>{image ? <Image src={image.url} alt={image.alt} fill unoptimized sizes="170px" /> : <small>{t("Image awaiting", "图片等待")}<br />{t("authorisation", "授权中")}</small>}</span>;
}

export function CompareClient({ products, catalogStatus }: { products: CatalogProduct[]; catalogStatus: CatalogStatus }) {
  const { t, term, lang } = useI18n();
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
  const awaiting = t("Awaiting reviews", "等待点评");
  const noPrice = t("Price not yet verified", "价格未核实");
  const pending = t("Evidence pending", "证据收集中");
  const value = (label: string, product: CatalogProduct) => {
    const match = matchFor(product.id);
    const today = t(`${match?.score ?? "—"}% personal${match?.suggestedSize ? ` · start ${match.suggestedSize}` : ""}`, `个人匹配 ${match?.score ?? "—"}%${match?.suggestedSize ? ` · 从 ${match.suggestedSize} 试起` : ""}`);
    if (isTightsProduct(product)) {
      const result: Record<string, React.ReactNode> = {
        "Match for today": today,
        "Community score": <CommunityScore product={product} />, Coverage: term(product.opacity), Denier: t(`${product.denier} denier`, `${product.denier}D`), "Waist construction": term(product.waist), "Toe construction": term(product.toe), Warmth: `${product.warmth} / 5`, Compression: `${product.compression} / 5`, Comfort: product.score.reviewCount ? `★ ${product.score.comfort}` : awaiting, "Stays put": product.score.reviewCount ? `★ ${product.score.stayPut}` : awaiting, Breathability: product.score.reviewCount ? `★ ${product.score.breathability}` : awaiting, Durability: product.score.reviewCount ? `★ ${product.score.durability}` : awaiting, Price: product.price.amount > 0 ? `${product.price.currency} $${product.price.amount}` : noPrice, "Review confidence": product.score.reviewCount ? term(product.score.confidence) : pending,
      };
      return result[label];
    }
    const result: Record<string, React.ReactNode> = {
      "Match for today": today, "Community score": <CommunityScore product={product} />, Style: term(product.style), Wire: term(product.wire), "Cup construction": term(product.cupConstruction), "Mapped size range": `${product.sizeSystem} · ${product.sizeRange}`, "Band comfort": product.score.reviewCount ? `★ ${product.score.bandComfort}` : awaiting, "Cup fit": product.score.reviewCount ? `★ ${product.score.cupFit}` : awaiting, "Wire comfort": product.score.reviewCount ? `★ ${product.score.wireComfort}` : awaiting, Straps: product.score.reviewCount ? `★ ${product.score.strapComfort}` : awaiting, "Side support": product.score.reviewCount ? `★ ${product.score.sideSupport}` : awaiting, Breathability: product.score.reviewCount ? `★ ${product.score.breathability}` : awaiting, Price: product.price.amount > 0 ? `${product.price.currency} $${product.price.amount}` : noPrice, "Review confidence": product.score.reviewCount ? term(product.score.confidence) : pending,
    };
    return result[label];
  };
  const selectCategory = (next: Category) => { setCategory(next); setSelected(firstIds(next === "bra" ? braProducts : tightsProducts)); };
  const update = (position: number, productId: string) => setSelected((current) => current.map((id, index) => index === position ? productId : id));
  const categoryCopy = category === "bra" ? t("Compare published construction, mapped sizing and any moderated reports against your current Bra Profile.", "拿公开的版型、尺码和审核过的反馈，对照你现在的内衣档案。") : t("Compare denier, coverage, waist construction and any structured wear signals against your Tights Profile.", "拿 D 数、遮盖度、腰头设计和穿着反馈，对照你的丝袜档案。");
  const showLabel = (label: string) => lang === "zh" ? labelZh[label] ?? label : label;

  if (catalogStatus !== "ready") {
    return <section className="catalog-building-state"><p className="eyebrow">{t("Comparison is waiting for reviewed data", "对比功能在等审核过的资料")}</p><h2>{catalogStatus === "unavailable" ? t("The research library is temporarily unavailable.", "产品库暂时打不开。") : t("The first reviewed products are being added.", "第一批审核过的产品正在上架。")}</h2><p>{catalogStatus === "unavailable" ? t("Please try again shortly. PerfectPair never compares development fixtures in place of its reviewed catalogue.", "请稍后再试。PerfectPair 不会拿测试数据来代替审核过的产品。") : t("No product is compared until its source facts are reviewed and published.", "产品资料审核发布后才能对比。")}</p><Link className="outline-button" href="/contribute">{t("Submit a product link", "提交产品链接")}</Link></section>;
  }

  return <>
    <div className="compare-picker"><div><p className="eyebrow">{t("Choose up to three reviewed products", "最多选三款审核过的产品")}</p><p>{categoryCopy}</p></div><button type="button" className="text-button" disabled={!currentProducts.length} onClick={() => setSelected(matched.slice(0, 3).map((match) => match.product.id))}><ArrowClockwiseIcon size={15} /> {t("Use my top matches", "用最适合我的三款")}</button></div>
    <div className="library-category-tabs compare-tabs"><button type="button" className={category === "bra" ? "active" : ""} onClick={() => selectCategory("bra")}>{t("Bras", "内衣")}</button><button type="button" className={category === "tights" ? "active" : ""} onClick={() => selectCategory("tights")}>{t("Tights", "丝袜")}</button></div>
    {!currentProducts.length ? <section className="catalog-building-state"><p className="eyebrow">{t("Category in progress", "品类建设中")}</p><h2>{category === "bra" ? t("There are no reviewed bra records to compare yet.", "还没有审核过的内衣可以对比。") : t("There are no reviewed tights records to compare yet.", "还没有审核过的丝袜可以对比。")}</h2><p>{t("PerfectPair will not substitute development fixtures or unreviewed submissions.", "PerfectPair 不会拿测试数据或未审核的提交来凑数。")}</p><Link className="outline-button" href="/contribute">{t("Submit a product link", "提交产品链接")}</Link></section> : <div className="compare-table"><div className="compare-header"><span>{t("For your fit today", "今天适合你的")}</span>{compared.map((product, index) => <div key={product.id}><select aria-label={t(`Product ${index + 1}`, `产品 ${index + 1}`)} value={product.id} onChange={(event) => update(index, event.target.value)}>{currentProducts.map((option) => <option key={option.id} value={option.id}>{option.brand} — {option.name}</option>)}</select><p className="eyebrow">{product.brand}</p><h3>{product.name}</h3><CompareImage product={product} /></div>)}</div>{labels.map((label) => <div className="compare-row" key={label}><strong>{showLabel(label)}</strong>{compared.map((product) => <span key={product.id}>{value(label, product)}</span>)}</div>)}</div>}
    <section className="comparison-rule"><strong>{t("What is being compared?", "对比的是什么？")}</strong>{lang === "zh" ? <p><b>个人匹配</b>会随你的私人档案和实际需要变化。<b>用户评分</b>只有在产品点评审核通过后才会出现。两者都不能花钱买，品牌的宣传也永远不会被当成用户体验。</p> : <p><b>Personal Match</b> changes with your private profile and practical need. <b>Community score</b> appears only after moderated product-level reviews. Neither can be purchased, and manufacturer statements never become community experience.</p>}</section>
    <p className="add-comparison">{t("A suggested size is a starting point; always confirm each brand’s current size chart and return terms.", "建议尺码只是起点；下单前请一定核对各品牌最新的尺码表和退换规则。")}</p>
  </>;
}
