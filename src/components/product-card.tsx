"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRightIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import { useI18n } from "@/components/lang-provider";
import type { MatchResult } from "@/lib/types";
import { isTightsProduct, type CatalogProduct, type TightsMatchResult } from "@/lib/tights";

export function ProductCard({ product, match }: { product: CatalogProduct; match?: MatchResult | TightsMatchResult }) {
  const { t, term, loc } = useI18n();
  const tights = isTightsProduct(product);
  const image = product.media?.[0];
  const denier = tights ? t(`${product.denier} denier`, `${product.denier}D`) : "";
  const detail = tights ? `${denier} · ${product.sizeRange}` : `${term(product.style)} · ${product.sizeRange}`;
  const hasCommunityScore = product.score.reviewCount > 0;
  const hasVerifiedPrice = product.price.amount > 0;
  return <article className="product-card">
    <div className={`product-image${image ? "" : " image-pending"}`}>{image ? <Image src={image.url} alt={image.alt} fill unoptimized sizes="(max-width: 680px) 100vw, (max-width: 920px) 50vw, 25vw" /> : <p>{t("Image awaiting", "图片等待")}<br />{t("authorisation", "授权中")}</p>}<span>{tights ? denier : product.wire === "wireless" ? t("Wire-free", "无钢圈") : term(product.style)}</span></div>
    <div className="product-copy">
      <p className="eyebrow">{tights ? t("Tights · ", "丝袜 · ") : t("Bras · ", "内衣 · ")}{product.brand}</p>
      <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
      <p className="product-meta">{detail}</p>
      {match ? <div className="personal-score"><strong>{match.score}%</strong><span>{t("Personal match", "个人匹配")}<br /><small>{match.suggestedSize ? t(`starting at ${match.suggestedSize}`, `建议从 ${match.suggestedSize} 试起`) : t("complete your profile", "完善档案后更准")}</small></span></div> : hasCommunityScore ? <div className="community-score"><StarIcon size={15} weight="fill" /><strong>{product.score.overall}</strong><span>{t(`Community score · ${product.score.reviewCount} reviews`, `用户评分 · ${product.score.reviewCount} 条点评`)}</span></div> : <div className="community-score pending"><span>{t("Community score · no moderated reviews yet", "用户评分 · 还没有审核通过的点评")}</span></div>}
      {match && <p className="match-note">{match.reasons[0] ? loc(match.reasons[0]) : t("Complete your profile for a more specific explanation.", "完善档案后，解释会更具体。")}</p>}
    </div>
    <div className="card-footer"><span>{hasVerifiedPrice ? `${product.price.currency} $${product.price.amount}` : t("Price not yet verified", "价格未核实")}</span><Link href={`/products/${product.slug}`}>{t("Details", "详情")} <ArrowUpRightIcon size={13} /></Link></div>
  </article>;
}
