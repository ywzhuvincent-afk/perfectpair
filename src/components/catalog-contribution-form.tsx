"use client";

import { CheckCircleIcon, LockKeyIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { useI18n } from "@/components/lang-provider";
import { rememberLocalContribution, type ContributionCategory, type ContributionType } from "@/lib/catalog-contributions";
import type { Translate } from "@/lib/i18n";

type FormState = {
  type: ContributionType;
  category: ContributionCategory;
  brandName: string;
  productName: string;
  variantLabel: string;
  productUrl: string;
  productIdentifier: string;
  observedNote: string;
  businessEmail: string;
  preferredUpdateMethod: "claim_portal" | "csv" | "contact";
  relationship: "i_own_or_wore_it" | "i_found_a_reference" | "i_represent_the_brand" | "i_represent_a_retailer";
  attestation: boolean;
  companySite: string;
};

const initialForm: FormState = {
  type: "missing_product", category: "bra", brandName: "", productName: "", variantLabel: "", productUrl: "", productIdentifier: "", observedNote: "", businessEmail: "", preferredUpdateMethod: "claim_portal", relationship: "i_own_or_wore_it", attestation: false, companySite: "",
};

const typeOrder: ContributionType[] = ["missing_product", "correction", "brand_claim"];

const typeCopy = (t: Translate): Record<ContributionType, { title: string; description: string }> => ({
  missing_product: { title: t("Add a missing product", "补充缺少的产品"), description: t("Tell us about a bra, tights, leggings or jeans we do not yet list. A product link is enough; no receipt or photo is needed.", "告诉我们还没收录的内衣、丝袜、打底裤或牛仔裤。给个产品链接就够了，不需要收据或照片。") },
  correction: { title: t("Correct product facts", "纠正产品资料"), description: t("Flag an incorrect size range, construction detail, material or product status. We verify every correction before it changes the library.", "指出尺码范围、版型细节、面料或产品状态的错误。每条纠正都要核实后才会改动产品库。") },
  brand_claim: { title: t("Claim a brand record", "认领品牌资料"), description: t("For brand teams: confirm your details, nominate a contact and choose the low-friction way you would like to update information.", "给品牌方：确认你的信息，指定联系人，选一种最方便的方式来更新资料。") },
});

export function CatalogContributionForm() {
  const { t, loc } = useI18n();
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const types = typeCopy(t);
  const copy = types[form.type];
  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }));

  function chooseType(type: ContributionType) {
    setStatus("idle");
    setMessage("");
    setForm((current) => ({
      ...current,
      type,
      category: type === "brand_claim" ? "all" : current.category === "all" ? "bra" : current.category,
      relationship: type === "brand_claim" ? "i_represent_the_brand" : current.relationship === "i_represent_the_brand" ? "i_own_or_wore_it" : current.relationship,
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/catalog/contributions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data) throw new Error(body?.error ?? "Submission failed");
      rememberLocalContribution({
        id: body.data.id,
        type: form.type,
        brandName: form.brandName,
        productName: form.productName || undefined,
        receivedAt: body.data.receivedAt,
        status: body.data.persisted ? "received" : "staged_locally",
      });
      setMessage(loc(body.message));
      setStatus("saved");
    } catch (error) {
      setMessage(error instanceof Error ? loc(error.message) : t("We could not submit that record. Please try again.", "没能提交，请再试一次。"));
      setStatus("error");
    }
  }

  if (status === "saved") {
    return <section className="contribution-success"><CheckCircleIcon size={28} weight="fill" /><div><p className="eyebrow">{t("Received for review", "已收到，等待审核")}</p><h2>{t("Thank you for improving the library.", "谢谢你帮产品库变得更完整。")}</h2><p>{message}</p><button className="outline-button" type="button" onClick={() => { setForm(initialForm); setStatus("idle"); setMessage(""); }}>{t("Submit another record", "再提交一条")}</button></div></section>;
  }

  const categoryOptions = <><option value="bra">{t("Bras", "内衣")}</option><option value="tights">{t("Tights", "丝袜")}</option><option value="leggings">{t("Leggings", "打底裤")}</option><option value="jeans">{t("Jeans", "牛仔裤")}</option></>;
  const allCategories = <option value="all">{t("All four categories", "全部四个品类")}</option>;

  return <section className="contribution-workspace">
    <div className="contribution-types" aria-label={t("Contribution type", "提交类型")}>
      {typeOrder.map((type, index) => <button type="button" key={type} className={form.type === type ? "active" : ""} onClick={() => chooseType(type)}><span>0{index + 1}</span>{types[type].title}</button>)}
    </div>
    <div className="contribution-heading"><div><p className="eyebrow">{t("Contribution desk", "资料提交台")}</p><h2>{copy.title}</h2><p>{copy.description}</p></div><div className="contribution-rules"><SparkleIcon size={18} weight="fill" /><span>{t("Every report is deduplicated, checked and linked to evidence before it can become public product data.", "每条提交都会先去重、核实，并附上证据，之后才可能成为公开的产品资料。")}</span></div></div>
    <form className="contribution-form" onSubmit={submit}>
      <div className="fields three">
        <label>{t("Category", "品类")}<select value={form.category} onChange={(event) => update("category", event.target.value as ContributionCategory)} disabled={form.type === "brand_claim"}>{categoryOptions}{form.type === "brand_claim" && allCategories}</select></label>
        <label>{t("Brand name", "品牌名")}<input required maxLength={120} value={form.brandName} onChange={(event) => update("brandName", event.target.value)} placeholder={t("e.g. Panache", "例如 Panache")} /></label>
        <label>{t("Product name", "产品名")}{form.type === "brand_claim" ? <input maxLength={180} value={form.productName} onChange={(event) => update("productName", event.target.value)} placeholder={t("Optional: a product to update", "可选：要更新的产品")} /> : <input required={!form.productUrl} maxLength={180} value={form.productName} onChange={(event) => update("productName", event.target.value)} placeholder={form.productUrl ? t("Optional when a link is included", "有链接时可不填") : t("e.g. Envy Balconette", "例如 Envy Balconette")} />}</label>
      </div>
      {form.type !== "brand_claim" && <div className="fields three">
        <label>{t("Colour / size / variant", "颜色 / 尺码 / 款式")} <span>{t("Optional, but helps separate versions.", "可选，但有助于区分不同版本。")}</span><input maxLength={100} value={form.variantLabel} onChange={(event) => update("variantLabel", event.target.value)} placeholder={t("e.g. Black / 34FF", "例如 黑色 / 34FF")} /></label>
        <label>{t("SKU, GTIN or barcode", "SKU、GTIN 或条形码")} <span>{t("Optional. Type it; do not upload a receipt.", "可选。直接输入，不要上传收据。")}</span><input maxLength={100} value={form.productIdentifier} onChange={(event) => update("productIdentifier", event.target.value)} placeholder={t("If shown on the product", "产品上有的话")} /></label>
        <label>{t("Reference link", "参考链接")} <span>{t("Official or authorised retailer page. A link is enough if the product name is unknown.", "官网或授权零售商的页面。不知道产品名的话，给链接就够了。")}</span><input type="url" value={form.productUrl} onChange={(event) => update("productUrl", event.target.value)} placeholder="https://…" /></label>
      </div>}
      {form.type === "brand_claim" && <div className="fields three"><label>{t("Business email", "工作邮箱")}<input required type="email" maxLength={254} value={form.businessEmail} onChange={(event) => update("businessEmail", event.target.value)} placeholder="name@brand.com" /></label><label>{t("Preferred update method", "希望的更新方式")}<select value={form.preferredUpdateMethod} onChange={(event) => update("preferredUpdateMethod", event.target.value as FormState["preferredUpdateMethod"])}><option value="claim_portal">{t("Review records in the claim portal", "在认领后台查看资料")}</option><option value="csv">{t("Send a CSV template", "发一份 CSV 模板")}</option><option value="contact">{t("Contact us first", "先联系我们")}</option></select></label><label>{t("Category scope", "品类范围")}<select value={form.category} onChange={(event) => update("category", event.target.value as ContributionCategory)}>{allCategories}{categoryOptions}</select></label></div>}
      <label className="contribution-note">{t("What should we verify?", "需要我们核实什么？")} <span>{t("Use your own words. Do not paste long brand descriptions, review text or private information.", "用你自己的话写。不要粘贴大段品牌介绍、点评原文或个人隐私。")}</span><textarea maxLength={600} value={form.observedNote} onChange={(event) => update("observedNote", event.target.value)} placeholder={form.type === "correction" ? t("Example: the current size chart includes 32–46 bands; the listed range appears incomplete.", "例如：目前的尺码表包含 32–46 下围，这里列的范围好像不全。") : t("Example: this product is available in a size or construction we have not yet researched.", "例如：这款有一个我们还没研究过的尺码或版型。")} /></label>
      {form.type !== "brand_claim" && <label className="contribution-relationship">{t("Your connection", "你和这款产品的关系")}<select value={form.relationship} onChange={(event) => update("relationship", event.target.value as FormState["relationship"])}><option value="i_own_or_wore_it">{t("I own or wore this product", "我有或穿过这款")}</option><option value="i_found_a_reference">{t("I found a reference", "我找到了参考资料")}</option><option value="i_represent_a_retailer">{t("I represent an authorised retailer", "我代表授权零售商")}</option></select></label>}
      <input className="honeypot" tabIndex={-1} aria-hidden="true" value={form.companySite} onChange={(event) => update("companySite", event.target.value)} />
      <label className="contribution-attestation"><input required type="checkbox" checked={form.attestation} onChange={(event) => update("attestation", event.target.checked)} /><span>{t("I am submitting information I may share. I understand this report is private to the review queue and does not create a public product page automatically.", "我提交的是我可以分享的信息。我明白这份提交只进入内部审核，不会自动生成公开的产品页。")}</span></label>
      <div className="contribution-submit"><p><LockKeyIcon size={14} /> {t("We do not ask for body photos, receipts, address details or private measurements here. Brand contact details are used only to verify a claim.", "这里不需要身材照片、收据、地址或私人尺寸。品牌联系方式只用来核实认领。")}</p><button className="button" type="submit" disabled={status === "saving"}>{status === "saving" ? t("Sending…", "发送中…") : form.type === "brand_claim" ? t("Send claim for verification", "提交认领，等待核实") : t("Send to the research queue", "提交到研究队列")}</button></div>
      {status === "error" && <p className="review-error">{message}</p>}
    </form>
  </section>;
}
