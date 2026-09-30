"use client";

import { CaretDownIcon, CheckCircleIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/lang-provider";
import { useFitState } from "@/lib/fit-state";
import type { LowerBodyProfile } from "@/lib/types";

const priorities: Array<{ id: LowerBodyProfile["priorities"][number]; en: string; zh: string }> = [
  { id: "comfort", en: "Comfort", zh: "舒适" }, { id: "waist_stability", en: "Waist stays put", zh: "腰头不下滑" }, { id: "seat_fit", en: "Seat fit", zh: "臀部合身" }, { id: "length", en: "Length", zh: "长度" }, { id: "compression", en: "Compression", zh: "压力" }, { id: "mobility", en: "Mobility", zh: "活动自如" }, { id: "durability", en: "Durability", zh: "耐穿" }, { id: "value", en: "Value", zh: "性价比" },
];
const issues: Array<{ id: LowerBodyProfile["avoid"][number]; en: string; zh: string }> = [
  { id: "waist_gapes", en: "Waist gaps", zh: "腰后空" }, { id: "waist_rolls", en: "Waist rolls", zh: "腰头卷边" }, { id: "thighs_tight", en: "Tight at thighs", zh: "大腿紧" }, { id: "seat_bags", en: "Bags at seat", zh: "臀部松垮" }, { id: "crotch_drops", en: "Crotch drops", zh: "裆往下掉" }, { id: "too_short", en: "Too short", zh: "太短" }, { id: "too_long", en: "Too long", zh: "太长" }, { id: "see_through", en: "See-through", zh: "透光" },
];

export function LowerBodyProfileForm() {
  const { t, date } = useI18n();
  const { lowerBodyProfile: savedProfile, lowerBodySnapshots, saveLowerBodyProfile, privacy, hydrated } = useFitState();
  const [profile, setProfile] = useState<LowerBodyProfile>(savedProfile);
  const [saved, setSaved] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const receivedHydratedProfile = useRef(false);

  useEffect(() => {
    if (!hydrated || receivedHydratedProfile.current) return;
    const sync = window.setTimeout(() => { setProfile(savedProfile); receivedHydratedProfile.current = true; }, 0);
    return () => window.clearTimeout(sync);
  }, [hydrated, savedProfile]);

  const update = <K extends keyof LowerBodyProfile>(key: K, value: LowerBodyProfile[K]) => { setSaved(false); setProfile((previous) => ({ ...previous, [key]: value })); };
  const toggle = <K extends "priorities" | "avoid">(key: K, value: LowerBodyProfile[K][number]) => setProfile((current) => ({ ...current, [key]: current[key].includes(value as never) ? current[key].filter((item) => item !== value) : [...current[key], value] } as LowerBodyProfile));
  const number = (key: "heightCm" | "waistCm" | "hipCm" | "inseamCm") => (event: React.ChangeEvent<HTMLInputElement>) => update(key, event.target.value === "" ? undefined : Number(event.target.value));
  const noPreference = t("No preference", "没有偏好");
  const optionalStyle = t("Optional brand / style / size", "可选：品牌 / 款式 / 尺码");

  return <div className="profile-layout lower-body-profile" id="lower-body-fit"><form className="profile-form" onSubmit={(event) => { event.preventDefault(); saveLowerBodyProfile({ ...profile, profileMatchingConsent: privacy.anonymousMatching }, "My leggings and jeans fit profile"); setSaved(true); }}>
    <section><div className="form-section-heading"><span className="step">07</span><div><h2>{t("Leggings & jeans: start with a size you trust", "打底裤和牛仔裤：从你信得过的尺码开始")}</h2><p>{t("One known size or a pair that works is enough to begin. These details stay private and will never appear on a public profile.", "一个熟悉的尺码，或一条穿着合适的裤子就够了。这些信息是私密的，永远不会出现在公开页面。")}</p></div></div>
      <div className="fields three"><label>{t("Usual leggings size", "打底裤常穿尺码")}<input value={profile.usualLeggingsSize ?? ""} onChange={(event) => update("usualLeggingsSize", event.target.value.toUpperCase())} placeholder={t("e.g. M / 8", "例如 M / 8")} /></label><label>{t("Usual jeans waist", "牛仔裤常穿腰围")}<input value={profile.usualJeansWaist ?? ""} onChange={(event) => update("usualJeansWaist", event.target.value.toUpperCase())} placeholder={t("e.g. 28", "例如 28")} /></label><label>{t("Usual jeans inseam", "牛仔裤常穿内长")}<input value={profile.usualJeansInseam ?? ""} onChange={(event) => update("usualJeansInseam", event.target.value)} placeholder={t("e.g. 30", "例如 30")} /></label></div>
      <div className="fields three"><label>{t("Leggings that work", "穿着合适的打底裤")}<input value={profile.knownWorkingLeggings ?? ""} onChange={(event) => update("knownWorkingLeggings", event.target.value)} placeholder={optionalStyle} /></label><label>{t("Jeans that work", "穿着合适的牛仔裤")}<input value={profile.knownWorkingJeans ?? ""} onChange={(event) => update("knownWorkingJeans", event.target.value)} placeholder={optionalStyle} /></label><div className="profile-field-note"><LockKeyIcon size={15} /><span><b>{t("Private by default", "默认私密")}</b><small>{t("We use only the facts needed for a future size and construction match.", "我们只用以后做尺码和版型匹配所需要的信息。")}</small></span></div></div>
    </section>
    <section><div className="form-section-heading"><span className="step">08</span><div><h2>{t("What should the next pair do better?", "下一条希望哪里更好？")}</h2><p>{t("Choose only the signals that matter. A concise practical history is more useful than a long body questionnaire.", "只选你在意的。简单的实际经验，比一长串身材问卷更有用。")}</p></div></div>
      <p className="chip-label">{t("Priority", "优先考虑")}</p><div className="chips">{priorities.map((item) => <button className={`chip ${profile.priorities.includes(item.id) ? "selected" : ""}`} type="button" onClick={() => toggle("priorities", item.id)} key={item.id}>{t(item.en, item.zh)}</button>)}</div>
      <p className="chip-label">{t("Avoid", "想避免")}</p><div className="chips">{issues.map((item) => <button className={`chip ${profile.avoid.includes(item.id) ? "selected" : ""}`} type="button" onClick={() => toggle("avoid", item.id)} key={item.id}>{t(item.en, item.zh)}</button>)}</div>
    </section>
    <section className="optional-profile-section"><button type="button" className="optional-disclosure" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((open) => !open)}><span><span className="step">09</span><span><b>{t("Use an official size chart later", "以后对照官方尺码表")}</b><small>{t("Optional measurements only help when a brand’s chart explicitly uses them.", "只有品牌尺码表明确需要时，这些可选尺寸才有用。")}</small></span></span><CaretDownIcon className={advancedOpen ? "turned" : ""} size={17} /></button>
      {advancedOpen && <div className="optional-profile-body"><p className="optional-profile-note">{t("You never need to upload a photo, scan or health information. Add only measurements you already know; “not sure” remains a valid answer.", "不需要上传照片、扫描或健康信息。只填你已经知道的尺寸；“不确定”也完全可以。")}</p>
        <div className="fields three"><label>{t("Height", "身高")} <span>cm</span><input type="number" value={profile.heightCm ?? ""} onChange={number("heightCm")} /></label><label>{t("Waist", "腰围")} <span>cm</span><input type="number" value={profile.waistCm ?? ""} onChange={number("waistCm")} /></label><label>{t("Hip", "臀围")} <span>cm</span><input type="number" value={profile.hipCm ?? ""} onChange={number("hipCm")} /></label></div>
        <div className="fields three"><label>{t("Inseam", "内长")} <span>cm</span><input type="number" value={profile.inseamCm ?? ""} onChange={number("inseamCm")} /></label><label>{t("Rise preference", "腰高偏好")}<select value={profile.risePreference ?? "any"} onChange={(event) => update("risePreference", event.target.value as LowerBodyProfile["risePreference"])}><option value="any">{noPreference}</option><option value="low">{t("Low rise", "低腰")}</option><option value="mid">{t("Mid rise", "中腰")}</option><option value="high">{t("High rise", "高腰")}</option></select></label><label>{t("Stretch preference", "弹力偏好")}<select value={profile.stretchPreference ?? "any"} onChange={(event) => update("stretchPreference", event.target.value as LowerBodyProfile["stretchPreference"])}><option value="any">{noPreference}</option><option value="rigid">{t("Rigid / low stretch", "硬挺 / 弹力小")}</option><option value="some_stretch">{t("Some stretch", "有点弹力")}</option><option value="stretch">{t("High stretch", "高弹")}</option></select></label></div>
        <div className="fields three"><label>{t("Compression", "压力")}<select value={profile.compressionPreference ?? "any"} onChange={(event) => update("compressionPreference", event.target.value as LowerBodyProfile["compressionPreference"])}><option value="any">{noPreference}</option><option value="none">{t("Little / none", "很少 / 没有")}</option><option value="light">{t("Light", "轻度")}</option><option value="firm">{t("Firm", "紧实")}</option></select></label><label>{t("How certain is this?", "有多确定？")}<select value={profile.measurementConfidence ?? "not_sure"} onChange={(event) => update("measurementConfidence", event.target.value as LowerBodyProfile["measurementConfidence"])}><option value="not_sure">{t("Not sure", "不确定")}</option><option value="measured_recently">{t("Measured recently", "最近量过")}</option><option value="estimated">{t("Estimated", "估计的")}</option></select></label><label className="change-check"><input type="checkbox" checked={Boolean(profile.fitChangedRecently)} onChange={(event) => update("fitChangedRecently", event.target.checked)} /><span><b>{t("My fit feels different lately", "最近感觉尺码变了")}</b><small>{t("No explanation needed.", "不需要说明原因。")}</small></span></label></div>
      </div>}
    </section>
    <div className="form-actions"><p><LockKeyIcon size={14} /> {t("No body photos, scans, appearance scores or public body profile. You can change or erase this at any time.", "没有身材照片、扫描、外貌评分或公开的身材资料。你随时可以修改或删除。")}</p><button className="button" type="submit">{saved ? <><CheckCircleIcon size={16} /> {t("Saved to your timeline", "已存到你的时间线")}</> : t("Save leggings & jeans profile", "保存打底裤和牛仔裤档案")}</button></div>
  </form><aside className="timeline-card"><p className="eyebrow">{t("Fit timeline", "尺码时间线")}</p><h3>{hydrated ? t(`${lowerBodySnapshots.length} saved lower-body ${lowerBodySnapshots.length === 1 ? "record" : "records"}`, `已保存 ${lowerBodySnapshots.length} 条下装记录`) : t("Loading your timeline", "正在读取时间线")}</h3><p>{t("When this profile changes, future leggings and jeans suggestions can adapt without rewriting older fit evidence.", "档案更新后，之后的打底裤和牛仔裤推荐会跟着调整，过去的记录不会被改写。")}</p><div className="timeline-list">{lowerBodySnapshots.slice(0, 4).map((snapshot, index) => <div key={snapshot.id}><span className="timeline-dot"></span><strong>{index === 0 ? t("Current lower-body fit", "目前的下装尺码") : t(snapshot.label || "Saved fit", "已保存的尺码")}</strong><small>{date(snapshot.recordedAt)} · {t("leggings", "打底裤")} {snapshot.profile.usualLeggingsSize ?? "—"} · {t("jeans", "牛仔裤")} {snapshot.profile.usualJeansWaist ?? "—"}</small></div>)}</div></aside>
  </div>;
}
