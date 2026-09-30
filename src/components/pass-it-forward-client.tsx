"use client";

import { ArrowSquareOutIcon, CheckCircleIcon, CopyIcon, LockKeyIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/lang-provider";
import { useFitState } from "@/lib/fit-state";
import type { Lang } from "@/lib/i18n";
import type { PassItForwardDraft } from "@/lib/types";

const conditionLabels: Record<PassItForwardDraft["condition"], [string, string]> = {
  new_with_tags: ["New with tags", "全新带吊牌"],
  like_new: ["Like new", "几乎全新"],
  gently_worn: ["Gently worn", "轻微穿过"],
};

const marketplaceLabels: Record<PassItForwardDraft["marketplace"], [string, string]> = {
  vinted: ["Vinted", "Vinted"],
  depop: ["Depop", "Depop"],
  poshmark: ["Poshmark", "Poshmark"],
  other: ["Another permitted marketplace", "其他允许的二手平台"],
};

/** The draft is written in the language the reader is using, since that is what they will paste. */
function listingCopy(draft: Pick<PassItForwardDraft, "category" | "productLabel" | "sizeLabel" | "condition">, lang: Lang) {
  if (lang === "zh") {
    return `${draft.productLabel}\n品类：${draft.category === "leggings" ? "打底裤" : "牛仔裤"}\n尺码：${draft.sizeLabel}\n成色：${conditionLabels[draft.condition][1]}\n\n这件不太适合我的尺码需要。上架前请确认平台最新的可售范围、卫生和买家保障规则。商品信息由卖家提供；PerfectPair 不处理付款、消息、寄送或退货。`;
  }
  return `${draft.productLabel}\nCategory: ${draft.category === "leggings" ? "Leggings" : "Jeans"}\nSize: ${draft.sizeLabel}\nCondition: ${conditionLabels[draft.condition][0]}\n\nThis item did not suit my fit needs. Please check the platform's current eligibility, hygiene and buyer-protection rules before listing. Product details are supplied by the seller; PerfectPair does not process payment, messages, delivery or returns.`;
}

export function PassItForwardClient() {
  const { t, lang } = useI18n();
  const { handoffDrafts, saveHandoffDraft, updateHandoffDraftStatus, removeHandoffDraft, hydrated } = useFitState();
  const [productLabel, setProductLabel] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [category, setCategory] = useState<PassItForwardDraft["category"]>("leggings");
  const [condition, setCondition] = useState<PassItForwardDraft["condition"]>("like_new");
  const [marketplace, setMarketplace] = useState<PassItForwardDraft["marketplace"]>("vinted");
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const openDrafts = useMemo(() => handoffDrafts.filter((draft) => draft.status !== "closed"), [handoffDrafts]);
  const label = (pair: [string, string]) => t(pair[0], pair[1]);

  async function copyDraft(draft: PassItForwardDraft) {
    try {
      await navigator.clipboard.writeText(listingCopy(draft, lang));
      setCopiedId(draft.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setNotice(t("Your browser could not copy the draft. Select the text manually instead.", "浏览器没能复制草稿，请手动选中文字复制。"));
    }
  }

  return <main className="page-shell pass-it-forward-page">
    <section className="pass-forward-hero"><div><p className="eyebrow">{t("Pass it forward · no in-app money", "转给下一位 · 站内不经手钱款")}</p><h1>{t("Wrong fit should not mean wasted.", "不合身，不等于浪费。")}</h1><p>{t("Prepare a private, accurate resale draft for eligible outerwear, then list it on a marketplace that provides its own payment and buyer protection. PerfectPair never takes payment, holds funds, sends shipping labels, hosts messages or publishes your contact details.", "给符合条件的外穿衣物准备一份准确的私人转卖草稿，再拿到有自己付款和买家保障的二手平台上架。PerfectPair 从不收款、不代管资金、不发运单、不传消息，也不公开你的联系方式。")}</p></div><aside><LockKeyIcon size={23} /><strong>{t("Private preparation only", "只做私人准备")}</strong><span>{t("No price, bank details, address, photos, messages or body information are collected here.", "这里不收集价格、银行信息、地址、照片、消息或身材信息。")}</span></aside></section>

    <section className="pass-forward-rules"><article><span>01</span><h2>{t("Eligible now", "目前可以转")}</h2><p>{t("Leggings and jeans only. They are easier to assess safely as regular outerwear.", "只限打底裤和牛仔裤。它们是普通外穿衣物，比较容易安全评估。")}</p></article><article><span>02</span><h2>{t("Not eligible here", "这里不能转")}</h2><p>{t("Bras, tights, underwear, socks and swimwear are excluded from this first flow because hygiene and marketplace rules vary sharply.", "内衣、丝袜、内裤、袜子和泳衣暂不支持，因为卫生要求和各平台规则差别很大。")}</p></article><article><span>03</span><h2>{t("External transaction", "在外部平台交易")}</h2><p>{t("Use a marketplace’s current country-specific rules for payment, shipping, buyer protection and disputes.", "付款、寄送、买家保障和纠纷，都按二手平台在你所在国家的最新规则来。")}</p></article></section>

    <section className="handoff-form-section"><div><p className="eyebrow">{t("Private listing helper", "私人上架助手")}</p><h2>{t("Make an honest draft.", "写一份如实的草稿。")}</h2><p>{t("Describe the product and condition accurately. You will copy the result yourself into an external platform; it is not a live PerfectPair listing.", "如实描述产品和成色。结果由你自己复制到外部平台；这不是 PerfectPair 上的公开商品。")}</p></div><form className="handoff-form" onSubmit={(event) => { event.preventDefault(); saveHandoffDraft({ category, productLabel: productLabel.trim(), sizeLabel: sizeLabel.trim(), condition, marketplace, status: "draft" }); setNotice(t("Private draft saved. Copy it when you are ready to list elsewhere.", "私人草稿已保存。准备好上架时再复制。")); setProductLabel(""); setSizeLabel(""); }}>
      <label>{t("Category", "品类")}<select value={category} onChange={(event) => setCategory(event.target.value as PassItForwardDraft["category"])}><option value="leggings">{t("Leggings", "打底裤")}</option><option value="jeans">{t("Jeans", "牛仔裤")}</option></select></label>
      <label>{t("Brand and product name", "品牌和产品名")}<input required maxLength={160} value={productLabel} onChange={(event) => setProductLabel(event.target.value)} placeholder={t("e.g. Brand · style / model", "例如 品牌 · 款式 / 型号")} /></label>
      <label>{t("Size on garment", "衣服上标的尺码")}<input required maxLength={30} value={sizeLabel} onChange={(event) => setSizeLabel(event.target.value)} placeholder={t("e.g. M / 28 × 30", "例如 M / 28 × 30")} /></label>
      <label>{t("Condition", "成色")}<select value={condition} onChange={(event) => setCondition(event.target.value as PassItForwardDraft["condition"])}>{Object.entries(conditionLabels).map(([value, pair]) => <option key={value} value={value}>{label(pair)}</option>)}</select></label>
      <label>{t("Where you expect to list", "打算在哪里上架")}<select value={marketplace} onChange={(event) => setMarketplace(event.target.value as PassItForwardDraft["marketplace"])}>{Object.entries(marketplaceLabels).map(([value, pair]) => <option key={value} value={value}>{label(pair)}</option>)}</select></label>
      <div className="handoff-submit"><p>{t("By saving, you confirm this is an eligible outerwear item and that you will follow the selected marketplace’s current rules.", "保存即表示你确认这是符合条件的外穿衣物，并会遵守所选平台的最新规则。")}</p><button className="button" type="submit">{t("Save private draft", "保存私人草稿")}</button></div>
    </form></section>
    {notice && <p className="handoff-notice"><CheckCircleIcon size={16} /> {notice}</p>}

    <section className="handoff-drafts"><div className="section-heading"><div><p className="eyebrow">{t("My handoff drafts", "我的转让草稿")}</p><h2>{hydrated ? t(`${openDrafts.length} private ${openDrafts.length === 1 ? "draft" : "drafts"}`, `${openDrafts.length} 份私人草稿`) : t("Loading your private drafts", "正在读取你的草稿")}</h2></div><p>{t("These stay in your private browser data in this first release. They do not appear to other members.", "目前这些草稿只保存在你的浏览器里，其他用户看不到。")}</p></div>{openDrafts.length ? <div className="handoff-draft-list">{openDrafts.map((draft) => <article key={draft.id}><div><p className="eyebrow">{draft.category === "leggings" ? t("leggings", "打底裤") : t("jeans", "牛仔裤")} · {label(marketplaceLabels[draft.marketplace])}</p><h3>{draft.productLabel}</h3><p>{draft.sizeLabel} · {label(conditionLabels[draft.condition])} · {draft.status === "listed_elsewhere" ? t("Listed elsewhere", "已在别处上架") : t("Private draft", "私人草稿")}</p></div><div className="handoff-draft-actions"><button className="outline-button" type="button" onClick={() => copyDraft(draft)}>{copiedId === draft.id ? <><CheckCircleIcon size={15} /> {t("Copied", "已复制")}</> : <><CopyIcon size={15} /> {t("Copy draft", "复制草稿")}</>}</button><button className="quiet-link" type="button" onClick={() => updateHandoffDraftStatus(draft.id, draft.status === "listed_elsewhere" ? "draft" : "listed_elsewhere")}><ArrowSquareOutIcon size={15} /> {draft.status === "listed_elsewhere" ? t("Mark as draft", "改回草稿") : t("Listed elsewhere", "已在别处上架")}</button><button className="quiet-link danger-link" type="button" onClick={() => removeHandoffDraft(draft.id)}><TrashIcon size={15} /> {t("Delete", "删除")}</button></div></article>)}</div> : <div className="handoff-empty"><p>{t("No draft yet. A private draft helps you record the product and condition before creating an external marketplace listing.", "还没有草稿。先写一份私人草稿，把产品和成色记下来，再去外部平台上架。")}</p></div>}</section>

    <section className="method-note handoff-method"><span>{t("Safety", "安全")}</span><div><strong>{t("This is deliberately not a marketplace.", "这里刻意不做交易平台。")}</strong><p>{t("Do not move payments or personal contact through PerfectPair. Once a marketplace has its own current safety, hygiene, payment and dispute protections, the buyer and seller complete the transaction there.", "请不要通过 PerfectPair 付款或交换联系方式。买卖双方应在有安全、卫生、付款和纠纷保障的二手平台上完成交易。")}</p></div></section>
  </main>;
}
