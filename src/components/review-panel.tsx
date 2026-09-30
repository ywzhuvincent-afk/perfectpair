"use client";

import { CheckCircleIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { useI18n } from "@/components/lang-provider";
import type { CatalogProduct } from "@/lib/tights";
import { isTightsProduct } from "@/lib/tights";

type Scores = Record<string, number>;
const braMetrics = [["overall", "Overall", "总体"], ["comfort", "Comfort", "舒适"], ["bandComfort", "Band comfort", "下围舒适"], ["cupFit", "Cup fit", "罩杯合身"], ["wireComfort", "Wire comfort", "钢圈舒适"], ["strapComfort", "Straps", "肩带"], ["stayPut", "Stays put", "不移位"], ["sideSupport", "Side support", "侧边支撑"], ["breathability", "Breathability", "透气"], ["durability", "Durability", "耐穿"], ["sizeAccuracy", "Size accuracy", "尺码准确"], ["value", "Value", "性价比"]] as const;
const tightsMetrics = [["overall", "Overall", "总体"], ["comfort", "Comfort", "舒适"], ["waistComfort", "Waist comfort", "腰头舒适"], ["coverage", "Coverage", "遮盖度"], ["stayPut", "Stays put", "不下滑"], ["toeComfort", "Toe comfort", "脚尖舒适"], ["breathability", "Breathability", "透气"], ["durability", "Durability", "耐穿"], ["sizeAccuracy", "Size accuracy", "尺码准确"], ["value", "Value", "性价比"]] as const;

export function ReviewPanel({ product }: { product: CatalogProduct }) {
  const { t } = useI18n();
  const tights = isTightsProduct(product);
  const metrics = tights ? tightsMetrics : braMetrics;
  const [sizeBought, setSizeBought] = useState("");
  const [scores, setScores] = useState<Scores>(() => Object.fromEntries(metrics.map(([key]) => [key, 4])));
  const [companySite, setCompanySite] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const updateScore = (key: string, value: string) => setScores((current) => ({ ...current, [key]: Number(value) }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    const payload = tights ? { category: "tights", productId: product.id, productVersion: product.productVersion, sizeBought, scores, fitSignals: { sizing: "true_to_size", waist: "secure", coverage: "as_expected", toe: "comfortable" }, issues: [], bodyProfileConsent: "private_only", companySite } : { category: "bra", productId: product.id, productVersion: product.productVersion, sizeBought, scores, fitSignals: { sizing: "true_to_size", band: "secure", cup: "contained", wire: "comfortable", straps: "stayed_put" }, issues: [], bodyProfileConsent: "private_only", companySite };
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Review submission failed");
      setStatus("saved");
    } catch { setStatus("error"); }
  }

  return <section className="review-panel"><div><p className="eyebrow">{t("Community review", "用户点评")}</p><h2>{t("Rate the details you actually wore.", "给你真正穿过的细节打分。")}</h2><p>{t("Every score is structured by category and enters moderation before it can affect public community evidence.", "每一项评分都按类别记录，审核通过后才会计入公开的用户评分。")}</p></div>{status === "saved" ? <div className="review-success"><CheckCircleIcon size={24} weight="fill" /><div><strong>{t("Thank you—your review is pending moderation.", "谢谢！你的点评正在等待审核。")}</strong><p>{t("It remains private until reviewed. A later follow-up can ask about durability after real wear or washing.", "审核前只有你看得到。之后可能会再问问你穿过、洗过后的耐穿情况。")}</p></div></div> : <form onSubmit={submit}><div className="honeypot" aria-hidden="true"><label>Company website<input tabIndex={-1} autoComplete="off" value={companySite} onChange={(event) => setCompanySite(event.target.value)} /></label></div><label className="review-size">{t("Size you wore", "你穿的尺码")}<input required maxLength={30} value={sizeBought} onChange={(event) => setSizeBought(event.target.value)} placeholder={tights ? t("e.g. M / C", "例如 M / C") : t("e.g. 34D", "例如 34D")} /></label><div className="review-metrics">{metrics.map(([key, en, zh]) => <label key={key}><span>{t(en, zh)}</span><select value={scores[key]} onChange={(event) => updateScore(key, event.target.value)}>{[1, 2, 3, 4, 5].map((score) => <option value={score} key={score}>{score} / 5</option>)}</select></label>)}</div><div className="review-submit"><p><LockKeyIcon size={14} /> {t("Your profile is private. Anonymous matching requires separate, explicit consent.", "你的档案是私密的。匿名匹配需要你另外明确同意。")}</p><button className="button" disabled={status === "saving"} type="submit">{status === "saving" ? t("Saving…", "保存中…") : t("Send for moderation", "提交审核")}</button></div>{status === "error" && <p className="review-error">{t("We could not save that review. Please check the size field and try again.", "点评没保存成功。请检查尺码后再试一次。")}</p>}</form>}</section>;
}
