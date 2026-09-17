import Link from "next/link";
import Image from "next/image";
import { ArrowUpRightIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import type { MatchResult } from "@/lib/types";
import { isTightsProduct, type CatalogProduct, type TightsMatchResult } from "@/lib/tights";

export function ProductCard({ product, match }: { product: CatalogProduct; match?: MatchResult | TightsMatchResult }) {
  const tights = isTightsProduct(product);
  const detail = tights ? `${product.denier} denier · ${product.sizeRange}` : `${product.style.replace("_", " ")} · ${product.sizeRange}`;
  const hasCommunityScore = product.score.reviewCount > 0;
  const hasVerifiedPrice = product.price.amount > 0;
  return <article className="product-card">
    <div className="product-image"><Image src={tights ? "/images/perfectpair-tights-category.png" : "/images/perfectpair-bra-category.png"} alt="" fill sizes="(max-width: 680px) 100vw, (max-width: 920px) 50vw, 25vw" /><span>{tights ? `${product.denier} denier` : product.wire === "wireless" ? "Wire-free" : product.style.replace("_", " ")}</span></div>
    <div className="product-copy">
      <p className="eyebrow">{tights ? "Tights · " : "Bras · "}{product.brand}</p>
      <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
      <p className="product-meta">{detail}</p>
      {match ? <div className="personal-score"><strong>{match.score}%</strong><span>Personal match<br /><small>{match.suggestedSize ? `starting at ${match.suggestedSize}` : "complete your profile"}</small></span></div> : hasCommunityScore ? <div className="community-score"><StarIcon size={15} weight="fill" /><strong>{product.score.overall}</strong><span>Community score · {product.score.reviewCount} reviews</span></div> : <div className="community-score pending"><span>Community score · no moderated reviews yet</span></div>}
      {match && <p className="match-note">{match.reasons[0] ?? "Complete your profile for a more specific explanation."}</p>}
    </div>
    <div className="card-footer"><span>{hasVerifiedPrice ? `${product.price.currency} $${product.price.amount}` : "Price not yet verified"}</span><Link href={`/products/${product.slug}`}>Details <ArrowUpRightIcon size={13} /></Link></div>
  </article>;
}
