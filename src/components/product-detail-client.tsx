"use client";

import Image from "next/image";
import Link from "next/link";
import { BookmarkSimpleIcon, InfoIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { matchProduct } from "@/lib/match";
import { matchTightsProduct } from "@/lib/tights-match";
import { useFitState } from "@/lib/fit-state";
import { WearCheckin } from "@/components/wear-checkin";
import { ReviewPanel } from "@/components/review-panel";
import type { BraProduct } from "@/lib/types";
import { isTightsProduct, type CatalogProduct, type TightsProduct } from "@/lib/tights";

function ProductImage({ product }: { product: CatalogProduct }) {
  const image = product.media?.[0];
  return <div className={`detail-product-image${image ? "" : " image-pending"}`}>{image ? <Image src={image.url} alt={image.alt} fill unoptimized sizes="208px" /> : <p>Product image awaiting display permission.</p>}</div>;
}

export function ProductDetailClient({ product }: { product: CatalogProduct }) {
  return isTightsProduct(product) ? <TightsProductDetail product={product} /> : <BraProductDetail product={product} />;
}

function BraProductDetail({ product }: { product: BraProduct }) {
  const { profile, context, passport, togglePassport } = useFitState();
  const match = matchProduct(product, profile, context);
  const saved = passport.some((item) => item.productId === product.id);
  const hasCommunityScore = product.score.reviewCount > 0;
  const measures: Array<[string, number]> = [["Comfort", product.score.comfort], ["Band comfort", product.score.bandComfort], ["Cup fit", product.score.cupFit], ["Wire comfort", product.score.wireComfort], ["Straps", product.score.strapComfort], ["Stays put", product.score.stayPut], ["Side support", product.score.sideSupport], ["Breathability", product.score.breathability], ["Durability", product.score.durability], ["Size accuracy", product.score.sizeAccuracy]];
  return <>
    <Link className="back-link" href="/discover?category=bra">← Back to research library</Link>
    <section className="product-hero"><ProductImage product={product} /><div><p className="eyebrow">Bras · {product.brand}{product.country ? ` · ${product.country}` : ""}</p><h1>{product.name}</h1><p className="product-lead">{product.style.replace("_", " ")} · {product.wire.replace("_", " ")} · {product.sizeRange}</p><div className="detail-badges"><span>{hasCommunityScore ? `Community score ★ ${product.score.overall}` : "Community score pending"}</span><span>{product.score.reviewCount ? `${product.score.reviewCount} structured reviews` : "No moderated reviews yet"}</span><span>Version {product.productVersion}</span><span>Updated {product.updatedAt.slice(0, 10)}</span></div></div><aside className="detail-match"><p className="eyebrow">Your fit today</p><strong>{match.score}%</strong><span>Personal match</span><p>{match.suggestedSize ? `${match.suggestedSize} is a starting point, not a fit guarantee.` : "Add your current size or optional measurements for a starting point."}</p></aside></section>
    <Scorecard measures={measures} reviewCount={product.score.reviewCount} label="RateMyBra" />
    <section className="detail-grid"><aside className="match-explanation"><p className="eyebrow">Why it may fit</p><h2>A transparent shortlist.</h2><ul>{match.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>{match.peopleLikeYouScore ? <p className="like-you"><strong>★ {match.peopleLikeYouScore} People Like You</strong><br />Based on {match.similarReviewerCount} anonymized, consented comparable profiles.</p> : <p className="like-you">Enable anonymous matching in My Fit Profile to see a People Like You signal when enough comparable reports exist.</p>}{match.cautions.length > 0 && <div className="caution"><strong>Worth knowing</strong>{match.cautions.map((caution) => <p key={caution}>{caution}</p>)}</div>}</aside><SourceLayers product={product} /></section>
    <ReviewPanel product={product} />
    <PassportAction saved={saved} product={product} toggle={togglePassport} />
    <WearCheckin product={product} />
  </>;
}

function TightsProductDetail({ product }: { product: TightsProduct }) {
  const { tightsProfile, passport, togglePassport } = useFitState();
  const match = matchTightsProduct(product, tightsProfile);
  const saved = passport.some((item) => item.productId === product.id);
  const hasCommunityScore = product.score.reviewCount > 0;
  const measures: Array<[string, number]> = [["Comfort", product.score.comfort], ["Waist feel", product.score.bandComfort], ["Stays put", product.score.stayPut], ["Breathability", product.score.breathability], ["Durability", product.score.durability], ["Size accuracy", product.score.sizeAccuracy], ["Value", product.score.value]];
  return <>
    <Link className="back-link" href="/discover?category=tights">← Back to research library</Link>
    <section className="product-hero"><ProductImage product={product} /><div><p className="eyebrow">Tights · {product.brand}{product.country ? ` · ${product.country}` : ""}</p><h1>{product.name}</h1><p className="product-lead">{product.denier} denier · {product.opacity.replace("_", " ")} · {product.sizeRange}</p><div className="detail-badges"><span>{hasCommunityScore ? `Community score ★ ${product.score.overall}` : "Community score pending"}</span><span>{product.score.reviewCount ? `${product.score.reviewCount} structured reviews` : "No moderated reviews yet"}</span><span>Version {product.productVersion}</span><span>Updated {product.updatedAt.slice(0, 10)}</span></div></div><aside className="detail-match"><p className="eyebrow">Your fit today</p><strong>{match.score}%</strong><span>Personal match</span><p>{match.suggestedSize ? `${match.suggestedSize} is a starting point, not a size guarantee.` : "Add a usual tights size or coverage preference for a more specific match."}</p></aside></section>
    <Scorecard measures={measures} reviewCount={product.score.reviewCount} label="RateMyTights" />
    <section className="detail-grid"><aside className="match-explanation"><p className="eyebrow">Why it may fit</p><h2>A transparent shortlist.</h2><ul>{match.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>{match.cautions.length > 0 && <div className="caution"><strong>Worth knowing</strong>{match.cautions.map((caution) => <p key={caution}>{caution}</p>)}</div>}<p className="like-you">A future “People Like You” signal will remain off until enough consented, anonymous hosiery reports are available.</p></aside><SourceLayers product={product} /></section>
    <ReviewPanel product={product} />
    <PassportAction saved={saved} product={product} toggle={togglePassport} />
  </>;
}

function Scorecard({ measures, reviewCount, label }: { measures: Array<[string, number]>; reviewCount: number; label: string }) {
  return <section className="scorecard unified-scorecard"><div className="section-heading"><div><p className="eyebrow">{label} · community data</p><h2>Structured experience</h2></div><span>{reviewCount ? `${reviewCount} moderated reviews` : "Awaiting first moderated review"}</span></div><p className="score-disclaimer"><InfoIcon size={15} /> Product scores describe reported experience. Personal Match and suggested size remain separate and private.</p>{reviewCount ? <div className="measure-grid">{measures.map(([label, value]) => <div key={label}><span>{label}</span><strong>★ {value}</strong><i><b style={{ width: `${value * 20}%` }} /></i></div>)}</div> : <p className="empty-score">This verified product record has no published community reviews yet. The first structured review will enter moderation before any score is shown.</p>}</section>;
}

function SourceLayers({ product }: { product: CatalogProduct }) {
  return <section className="fact-row source-layers"><article><p className="eyebrow">Manufacturer data</p><h3>What the maker publishes</h3><p>{product.features.join(" · ")}</p><span>Source retained per field</span></article><article><p className="eyebrow">Community data</p><h3>What wearers report</h3><p>Comfort, fit, stay-put performance, durability and value are structured, moderated fields—not a generic star review.</p><span>Confidence: {product.score.confidence}</span></article><article><p className="eyebrow">Editorial & Lab data</p><h3>Reserved for method-led testing</h3><p>Independent testing appears only with a public method and stays separate from manufacturer and community claims.</p><span>Product version history retained</span></article><article><p className="eyebrow">Image rights</p><h3>{product.media?.length ? "Approved product imagery" : "Image not yet licensed"}</h3><p>{product.media?.length ? "This image is tied to a reviewed source and display right. It can be withdrawn if that right expires or is revoked." : "A real product image will appear here only after we record a display permission, an authorised feed, or an original-photo licence."}</p><span>Last record check: {product.updatedAt.slice(0, 10)}</span></article></section>;
}

function PassportAction({ saved, product, toggle }: { saved: boolean; product: CatalogProduct; toggle: (productId: string) => void }) {
  return <section className="product-actions"><div><p className="eyebrow">My Passport</p><h2>{saved ? "Saved to your Passport" : "Keep this product in your research history"}</h2><p>{saved ? "Your saved list stays private. Future price or stock alerts only activate if you choose." : "Save it first; you can compare it later without turning your product history into a public feed."}</p></div><button className={saved ? "outline-button" : "button"} type="button" onClick={() => toggle(product.id)}>{saved ? <><BookmarkSimpleIcon size={16} weight="fill" /> Remove from Passport</> : <><PlusIcon size={16} /> Save to Passport</>}</button></section>;
}
