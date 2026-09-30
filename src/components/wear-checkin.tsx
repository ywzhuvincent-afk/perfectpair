"use client";

import { useState } from "react";
import { CheckCircleIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { useI18n } from "@/components/lang-provider";
import { useFitState } from "@/lib/fit-state";
import type { Translate } from "@/lib/i18n";
import type { BraProduct, WearEvent } from "@/lib/types";

type ChoiceKey = "bandFeel" | "cupContainment" | "wireFeel" | "strapFeel" | "wouldWearAgain" | "issue";
const promptsFor = (t: Translate): Array<{ key: ChoiceKey; prompt: string; options: Array<{ value: WearEvent[ChoiceKey]; label: string }> }> => [
  { key: "bandFeel", prompt: t("How did the band feel?", "下围感觉怎么样？"), options: [{ value: "secure", label: t("Secure", "稳") }, { value: "noticeable", label: t("Noticeable", "有点感觉") }, { value: "uncomfortable", label: t("Uncomfortable", "不舒服") }] },
  { key: "cupContainment", prompt: t("How did the cups contain?", "罩杯包得住吗？"), options: [{ value: "contained", label: t("Contained", "包得住") }, { value: "minor_issue", label: t("Minor issue", "小问题") }, { value: "not_right", label: t("Not right", "不合适") }] },
  { key: "wireFeel", prompt: t("How did the wire feel?", "钢圈感觉怎么样？"), options: [{ value: "not_applicable", label: t("No wire", "没有钢圈") }, { value: "comfortable", label: t("Comfortable", "舒服") }, { value: "noticeable", label: t("Noticeable", "有点感觉") }, { value: "painful", label: t("Painful", "疼") }] },
  { key: "strapFeel", prompt: t("How did the straps behave?", "肩带表现如何？"), options: [{ value: "stayed_put", label: t("Stayed put", "不滑落") }, { value: "slipped", label: t("Slipped", "会滑") }, { value: "dug_in", label: t("Dug in", "勒肩") }] },
  { key: "wouldWearAgain", prompt: t("Would you wear it again?", "还会再穿吗？"), options: [{ value: "yes", label: t("Absolutely", "当然") }, { value: "maybe", label: t("Maybe", "也许") }, { value: "no", label: t("No", "不会") }] },
  { key: "issue", prompt: t("Main issue to track?", "主要想记录的问题？"), options: [{ value: "none", label: t("None", "没有") }, { value: "band_digs", label: t("Band", "下围") }, { value: "cup_spillage", label: t("Cup", "罩杯") }, { value: "wire_pokes", label: t("Wire", "钢圈") }, { value: "straps_slip", label: t("Straps", "肩带") }, { value: "cups_shift", label: t("Shifted", "移位") }] },
];

export function WearCheckin({ product }: { product: BraProduct }) {
  const { t } = useI18n();
  const { context, addWearEvent } = useFitState();
  const [open, setOpen] = useState(false);
  const [complete, setComplete] = useState(false);
  const [answers, setAnswers] = useState<Pick<WearEvent, ChoiceKey>>({ bandFeel: "secure", cupContainment: "contained", wireFeel: product.wire === "wireless" ? "not_applicable" : "comfortable", strapFeel: "stayed_put", wouldWearAgain: "yes", issue: "none" });
  const submit = () => { addWearEvent({ productId: product.id, productVersion: product.productVersion, context, ...answers }); setComplete(true); };
  if (!open) return <button className="button" type="button" onClick={() => setOpen(true)}>{t("Log a fit check", "记录一次试穿")}</button>;
  if (complete) return <div className="checkin-complete"><CheckCircleIcon size={22} weight="fill" /><div><strong>{t("Fit check saved.", "试穿记录已保存。")}</strong><p>{t("Your profile snapshot stays with this wear. A later follow-up can ask about durability after enough wears, not today.", "这次试穿会和你当时的档案一起保存。穿过几次之后，可能会再问你耐不耐穿。")}</p></div></div>;
  return <section className="wear-checkin"><div className="checkin-heading"><div><p className="eyebrow"><SparkleIcon size={13} /> {t("Fit Diary · about 45 seconds", "试穿日记 · 大约 45 秒")}</p><h3>{t("How did this bra behave for you?", "这件内衣穿起来怎么样？")}</h3></div><button type="button" className="text-button" onClick={() => setOpen(false)}>{t("Not now", "以后再说")}</button></div><p className="checkin-note">{t("This records product experience with your private snapshot and wear context. It is never a rating of your body or appearance.", "这里记录的是产品的穿着体验，和你的私人档案一起保存。绝不是对你身材或外貌的评价。")}</p>{promptsFor(t).map((prompt) => <div className="checkin-prompt" key={prompt.key}><span>{prompt.prompt}</span><div>{prompt.options.map((option) => <button className={answers[prompt.key] === option.value ? "selected" : ""} type="button" key={String(option.value)} onClick={() => setAnswers({ ...answers, [prompt.key]: option.value } as Pick<WearEvent, ChoiceKey>)}>{option.label}</button>)}</div></div>)}<button className="button" type="button" onClick={submit}>{t("Save my fit check", "保存试穿记录")}</button></section>;
}
