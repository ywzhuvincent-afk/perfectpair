"use client";

import { useState } from "react";
import { CheckCircleIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { useFitState } from "@/lib/fit-state";
import type { BraProduct, WearEvent } from "@/lib/types";

type ChoiceKey = "bandFeel" | "cupContainment" | "wireFeel" | "strapFeel" | "wouldWearAgain" | "issue";
const prompts: Array<{ key: ChoiceKey; prompt: string; options: Array<{ value: WearEvent[ChoiceKey]; label: string }> }> = [
  { key: "bandFeel", prompt: "How did the band feel?", options: [{ value: "secure", label: "Secure" }, { value: "noticeable", label: "Noticeable" }, { value: "uncomfortable", label: "Uncomfortable" }] },
  { key: "cupContainment", prompt: "How did the cups contain?", options: [{ value: "contained", label: "Contained" }, { value: "minor_issue", label: "Minor issue" }, { value: "not_right", label: "Not right" }] },
  { key: "wireFeel", prompt: "How did the wire feel?", options: [{ value: "not_applicable", label: "No wire" }, { value: "comfortable", label: "Comfortable" }, { value: "noticeable", label: "Noticeable" }, { value: "painful", label: "Painful" }] },
  { key: "strapFeel", prompt: "How did the straps behave?", options: [{ value: "stayed_put", label: "Stayed put" }, { value: "slipped", label: "Slipped" }, { value: "dug_in", label: "Dug in" }] },
  { key: "wouldWearAgain", prompt: "Would you wear it again?", options: [{ value: "yes", label: "Absolutely" }, { value: "maybe", label: "Maybe" }, { value: "no", label: "No" }] },
  { key: "issue", prompt: "Main issue to track?", options: [{ value: "none", label: "None" }, { value: "band_digs", label: "Band" }, { value: "cup_spillage", label: "Cup" }, { value: "wire_pokes", label: "Wire" }, { value: "straps_slip", label: "Straps" }, { value: "cups_shift", label: "Shifted" }] },
];

export function WearCheckin({ product }: { product: BraProduct }) {
  const { context, addWearEvent } = useFitState();
  const [open, setOpen] = useState(false);
  const [complete, setComplete] = useState(false);
  const [answers, setAnswers] = useState<Pick<WearEvent, ChoiceKey>>({ bandFeel: "secure", cupContainment: "contained", wireFeel: product.wire === "wireless" ? "not_applicable" : "comfortable", strapFeel: "stayed_put", wouldWearAgain: "yes", issue: "none" });
  const submit = () => { addWearEvent({ productId: product.id, productVersion: product.productVersion, context, ...answers }); setComplete(true); };
  if (!open) return <button className="button" type="button" onClick={() => setOpen(true)}>Log a fit check</button>;
  if (complete) return <div className="checkin-complete"><CheckCircleIcon size={22} weight="fill" /><div><strong>Fit check saved.</strong><p>Your profile snapshot stays with this wear. A later follow-up can ask about durability after enough wears, not today.</p></div></div>;
  return <section className="wear-checkin"><div className="checkin-heading"><div><p className="eyebrow"><SparkleIcon size={13} /> Fit Diary · about 45 seconds</p><h3>How did this bra behave for you?</h3></div><button type="button" className="text-button" onClick={() => setOpen(false)}>Not now</button></div><p className="checkin-note">This records product experience with your private snapshot and wear context. It is never a rating of your body or appearance.</p>{prompts.map((prompt) => <div className="checkin-prompt" key={prompt.key}><span>{prompt.prompt}</span><div>{prompt.options.map((option) => <button className={answers[prompt.key] === option.value ? "selected" : ""} type="button" key={String(option.value)} onClick={() => setAnswers({ ...answers, [prompt.key]: option.value } as Pick<WearEvent, ChoiceKey>)}>{option.label}</button>)}</div></div>)}<button className="button" type="button" onClick={submit}>Save my fit check</button></section>;
}
