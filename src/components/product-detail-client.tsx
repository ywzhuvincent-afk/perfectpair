"use client";

import Image from "next/image";
import Link from "next/link";
import { BookmarkSimpleIcon, InfoIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { matchProduct } from "@/lib/match";
import { matchTightsProduct } from "@/lib/tights-match";
import { useFitState } from "@/lib/fit-state";
import { useI18n } from "@/components/lang-provider";
import { WearCheckin } from "@/components/wear-checkin";
import { ReviewPanel } from "@/components/review-panel";
import type { BraProduct } from "@/lib/types";
import { isTightsProduct, type CatalogProduct, type TightsProduct } from "@/lib/tights";

function ProductImage({ product }: { product: CatalogProduct }) {
  const { t } = useI18n();
  const image = product.media?.[0];
  return <div className={`detail-product-image${image ? "" : " image-pending"}`}>{image ? <Image src={image.url} alt={image.alt} fill unoptimized sizes="208px" /> : <p>{t("Product image awaiting display permission.", "产品图片还在等展示授权。")}</p>}</div>;
}

export function ProductDetailClient({ product }: { product: CatalogProduct }) {
  return isTightsProduct(product) ? <TightsProductDetail product={product} /> : <BraProductDetail product={product} />;
}

function Badges({ product }: { product: CatalogProduct }) {
  const { t } = useI18n();
  const hasCommunityScore = product.score.reviewCount > 0;
  return <div className="detail-badges"><span>{hasCommunityScore ? t(`Community score ★ ${product.score.overall}`, `用户评分 ★ ${product.score.overall}`) : t("Community score pending", "用户评分待定")}</span><span>{product.score.reviewCount ? t(`${product.score.reviewCount} structured reviews`, `${product.score.reviewCount} 条结构化点评`) : t("No moderated reviews yet", "还没有审核通过的点评")}</span><span>{t("Version", "版本")} {product.productVersion}</span><span>{t("Updated", "更新于")} {product.updatedAt.slice(0, 10)}</span></div>;
}

function BraProductDetail({ product }: { product: BraProduct }) {
  const { t, term, loc } = useI18n();
  const { profile, context, passport, togglePassport } = useFitState();
  const match = matchProduct(product, profile, context);
  const saved = passport.some((item) => item.productId === product.id);
  const measures: Array<[string, number]> = [[t("Comfort", "舒适"), product.score.comfort], [t("Band comfort", "下围舒适"), product.score.bandComfort], [t("Cup fit", "罩杯合身"), product.score.cupFit], [t("Wire comfort", "钢圈舒适"), product.score.wireComfort], [t("Straps", "肩带"), product.score.strapComfort], [t("Stays put", "不移位"), product.score.stayPut], [t("Side support", "侧边支撑"), product.score.sideSupport], [t("Breathability", "透气"), product.score.breathability], [t("Durability", "耐穿"), product.score.durability], [t("Size accuracy", "尺码准确"), product.score.sizeAccuracy]];
  return <>
    <Link className="back-link" href="/discover?category=bra">← {t("Back to research library", "返回产品库")}</Link>
    <section className="product-hero"><ProductImage product={product} /><div><p className="eyebrow">{t("Bras", "内衣")} · {product.brand}{product.country ? ` · ${product.country}` : ""}</p><h1>{product.name}</h1><p className="product-lead">{term(product.style)} · {term(product.wire)} · {product.sizeRange}</p><Badges product={product} /></div><aside className="detail-match"><p className="eyebrow">{t("Your fit today", "今天适合你的程度")}</p><strong>{match.score}%</strong><span>{t("Personal match", "个人匹配")}</span><p>{match.suggestedSize ? t(`${match.suggestedSize} is a starting point, not a fit guarantee.`, `${match.suggestedSize} 只是起步尺码，不保证一定合身。`) : t("Add your current size or optional measurements for a starting point.", "填写目前的尺码或可选的测量数据，就能得到起步尺码。")}</p></aside></section>
    <Scorecard measures={measures} reviewCount={product.score.reviewCount} label="RateMyBra" />
    <section className="detail-grid"><aside className="match-explanation"><p className="eyebrow">{t("Why it may fit", "为什么可能适合你")}</p><h2>{t("A transparent shortlist.", "一份讲得清楚的候选清单。")}</h2><ul>{match.reasons.map((reason) => <li key={reason}>{loc(reason)}</li>)}</ul>{match.peopleLikeYouScore ? <p className="like-you"><strong>★ {match.peopleLikeYouScore} {t("People Like You", "和你相似的人")}</strong><br />{t(`Based on ${match.similarReviewerCount} anonymized, consented comparable profiles.`, `基于 ${match.similarReviewerCount} 位同意匿名分享、身形相近的用户。`)}</p> : <p className="like-you">{t("Enable anonymous matching in My Fit Profile to see a People Like You signal when enough comparable reports exist.", "在“我的尺码档案”里打开匿名匹配，等相似用户的反馈够多时，就能看到“和你相似的人”怎么评价。")}</p>}{match.cautions.length > 0 && <div className="caution"><strong>{t("Worth knowing", "值得注意")}</strong>{match.cautions.map((caution) => <p key={caution}>{loc(caution)}</p>)}</div>}</aside><SourceLayers product={product} /></section>
    <ReviewPanel product={product} />
    <PassportAction saved={saved} product={product} toggle={togglePassport} />
    <WearCheckin product={product} />
  </>;
}

function TightsProductDetail({ product }: { product: TightsProduct }) {
  const { t, term, loc } = useI18n();
  const { tightsProfile, passport, togglePassport } = useFitState();
  const match = matchTightsProduct(product, tightsProfile);
  const saved = passport.some((item) => item.productId === product.id);
  const measures: Array<[string, number]> = [[t("Comfort", "舒适"), product.score.comfort], [t("Waist feel", "腰头感受"), product.score.bandComfort], [t("Stays put", "不下滑"), product.score.stayPut], [t("Breathability", "透气"), product.score.breathability], [t("Durability", "耐穿"), product.score.durability], [t("Size accuracy", "尺码准确"), product.score.sizeAccuracy], [t("Value", "性价比"), product.score.value]];
  return <>
    <Link className="back-link" href="/discover?category=tights">← {t("Back to research library", "返回产品库")}</Link>
    <section className="product-hero"><ProductImage product={product} /><div><p className="eyebrow">{t("Tights", "丝袜")} · {product.brand}{product.country ? ` · ${product.country}` : ""}</p><h1>{product.name}</h1><p className="product-lead">{t(`${product.denier} denier`, `${product.denier}D`)} · {term(product.opacity)} · {product.sizeRange}</p><Badges product={product} /></div><aside className="detail-match"><p className="eyebrow">{t("Your fit today", "今天适合你的程度")}</p><strong>{match.score}%</strong><span>{t("Personal match", "个人匹配")}</span><p>{match.suggestedSize ? t(`${match.suggestedSize} is a starting point, not a size guarantee.`, `${match.suggestedSize} 只是起步尺码，不保证尺码一定对。`) : t("Add a usual tights size or coverage preference for a more specific match.", "填写常穿的丝袜尺码或遮盖偏好，匹配会更具体。")}</p></aside></section>
    <Scorecard measures={measures} reviewCount={product.score.reviewCount} label="RateMyTights" />
    <section className="detail-grid"><aside className="match-explanation"><p className="eyebrow">{t("Why it may fit", "为什么可能适合你")}</p><h2>{t("A transparent shortlist.", "一份讲得清楚的候选清单。")}</h2><ul>{match.reasons.map((reason) => <li key={reason}>{loc(reason)}</li>)}</ul>{match.cautions.length > 0 && <div className="caution"><strong>{t("Worth knowing", "值得注意")}</strong>{match.cautions.map((caution) => <p key={caution}>{loc(caution)}</p>)}</div>}<p className="like-you">{t("A future “People Like You” signal will remain off until enough consented, anonymous hosiery reports are available.", "等到有足够多同意匿名分享的丝袜反馈后，才会开放“和你相似的人”功能。")}</p></aside><SourceLayers product={product} /></section>
    <ReviewPanel product={product} />
    <PassportAction saved={saved} product={product} toggle={togglePassport} />
  </>;
}

function Scorecard({ measures, reviewCount, label }: { measures: Array<[string, number]>; reviewCount: number; label: string }) {
  const { t } = useI18n();
  return <section className="scorecard unified-scorecard"><div className="section-heading"><div><p className="eyebrow">{label} · {t("community data", "用户资料")}</p><h2>{t("Structured experience", "分项穿着体验")}</h2></div><span>{reviewCount ? t(`${reviewCount} moderated reviews`, `${reviewCount} 条审核过的点评`) : t("Awaiting first moderated review", "等待第一条审核通过的点评")}</span></div><p className="score-disclaimer"><InfoIcon size={15} /> {t("Product scores describe reported experience. Personal Match and suggested size remain separate and private.", "产品评分反映的是用户的穿着感受。个人匹配和建议尺码是分开计算的，只有你看得到。")}</p>{reviewCount ? <div className="measure-grid">{measures.map(([name, value]) => <div key={name}><span>{name}</span><strong>★ {value}</strong><i><b style={{ width: `${value * 20}%` }} /></i></div>)}</div> : <p className="empty-score">{t("This verified product record has no published community reviews yet. The first structured review will enter moderation before any score is shown.", "这款已核实的产品还没有公开的用户点评。第一条点评要先审核，之后才会显示评分。")}</p>}</section>;
}

function SourceLayers({ product }: { product: CatalogProduct }) {
  const { t, term } = useI18n();
  const manufacturerSource = product.data.find((entry) => entry.layer === "manufacturer" && entry.sourceUrl);
  const factSummary = product.features.length ? product.features.join(" · ") : t("Only reviewed facts are retained; details not established by a source remain unlisted.", "只保留核实过的资料；来源无法证实的细节不会列出。");
  const licensed = Boolean(product.media?.length);
  return <section className="fact-row source-layers"><article><p className="eyebrow">{t("Manufacturer data", "品牌资料")}</p><h3>{t("What the maker publishes", "品牌公开的信息")}</h3><p>{factSummary}</p>{manufacturerSource?.sourceUrl ? <a className="source-link" href={manufacturerSource.sourceUrl} target="_blank" rel="noreferrer">{t("Open official product source ↗", "打开官方产品页 ↗")}</a> : <span>{t("Source retained per field", "每个字段都保留了来源")}</span>}</article><article><p className="eyebrow">{t("Community data", "用户资料")}</p><h3>{t("What wearers report", "穿过的人怎么说")}</h3><p>{t("Comfort, fit, stay-put performance, durability and value are structured, moderated fields—not a generic star review.", "舒适、合身、是否移位、耐穿度和性价比都分项记录并经过审核，不是笼统的星级评价。")}</p><span>{t("Confidence: ", "可信度：")}{term(product.score.confidence)}</span></article><article><p className="eyebrow">{t("Editorial & Lab data", "编辑与实验室资料")}</p><h3>{t("Reserved for method-led testing", "留给有公开方法的测试")}</h3><p>{t("Independent testing appears only with a public method and stays separate from manufacturer and community claims.", "独立测试只有公开测试方法后才会出现，并且和品牌资料、用户反馈分开。")}</p><span>{t("Product version history retained", "保留产品版本记录")}</span></article><article><p className="eyebrow">{t("Image rights", "图片版权")}</p><h3>{licensed ? t("Approved product imagery", "已授权的产品图片") : t("Image not yet licensed", "图片尚未授权")}</h3><p>{licensed ? t("This image is tied to a reviewed source and display right. It can be withdrawn if that right expires or is revoked.", "这张图片对应已核实的来源和展示授权；授权到期或被撤回时会下架。") : t("A real product image will appear here only after we record a display permission, an authorised feed, or an original-photo licence.", "只有拿到展示授权、授权数据源或原创照片许可后，这里才会出现真实的产品图片。")}</p><span>{t("Last record check: ", "最近核对：")}{product.updatedAt.slice(0, 10)}</span></article></section>;
}

function PassportAction({ saved, product, toggle }: { saved: boolean; product: CatalogProduct; toggle: (productId: string) => void }) {
  const { t } = useI18n();
  return <section className="product-actions"><div><p className="eyebrow">{t("My Passport", "我的试穿册")}</p><h2>{saved ? t("Saved to your Passport", "已存进你的试穿册") : t("Keep this product in your research history", "把这款存进你的研究记录")}</h2><p>{saved ? t("Your saved list stays private. Future price or stock alerts only activate if you choose.", "你的收藏只有你看得到。以后的降价或到货提醒，只有你打开才会启用。") : t("Save it first; you can compare it later without turning your product history into a public feed.", "先存起来，之后再对比；你的购物记录不会变成公开动态。")}</p></div><button className={saved ? "outline-button" : "button"} type="button" onClick={() => toggle(product.id)}>{saved ? <><BookmarkSimpleIcon size={16} weight="fill" /> {t("Remove from Passport", "从试穿册移除")}</> : <><PlusIcon size={16} /> {t("Save to Passport", "存进试穿册")}</>}</button></section>;
}
