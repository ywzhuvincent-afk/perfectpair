"use client";

import { CheckCircleIcon, CaretDownIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/lang-provider";
import { ProfileReadiness } from "@/components/profile-readiness";
import { useFitState } from "@/lib/fit-state";
import type { TightsFitIssue, TightsProfile } from "@/lib/tights";

const priorities: TightsProfile["priorities"] = ["comfort", "durability", "warmth", "sheerness", "control", "value"];
const issues: Array<{ id: TightsFitIssue; en: string; zh: string }> = [
  { id: "waist_rolls", en: "Waist rolls", zh: "腰头卷边" }, { id: "waist_digs", en: "Waist digs", zh: "腰头勒" }, { id: "sags", en: "Sags", zh: "往下掉" }, { id: "short_inseam", en: "Too short", zh: "太短" }, { id: "toe_pressure", en: "Toe pressure", zh: "脚尖压脚" }, { id: "snags", en: "Snags", zh: "容易勾丝" }, { id: "too_warm", en: "Too warm", zh: "太热" }, { id: "not_warm_enough", en: "Not warm enough", zh: "不够暖" },
];

export function TightsProfileForm() {
  const { t, term } = useI18n();
  const { tightsProfile: savedProfile, tightsSnapshots, saveTightsProfile, privacy, hydrated } = useFitState();
  const [profile, setProfile] = useState<TightsProfile>(savedProfile);
  const [saved, setSaved] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const receivedHydratedProfile = useRef(false);

  useEffect(() => {
    if (!hydrated || receivedHydratedProfile.current) return;
    const sync = window.setTimeout(() => { setProfile(savedProfile); receivedHydratedProfile.current = true; }, 0);
    return () => window.clearTimeout(sync);
  }, [hydrated, savedProfile]);

  const update = <K extends keyof TightsProfile>(key: K, value: TightsProfile[K]) => { setSaved(false); setProfile((previous) => ({ ...previous, [key]: value })); };
  const number = (key: "heightCm" | "waistCm" | "hipCm" | "inseamCm") => (event: React.ChangeEvent<HTMLInputElement>) => update(key, event.target.value === "" ? undefined : Number(event.target.value));
  const togglePriority = (priority: TightsProfile["priorities"][number]) => update("priorities", profile.priorities.includes(priority) ? profile.priorities.filter((item) => item !== priority) : [...profile.priorities, priority]);
  const toggleIssue = (issue: TightsFitIssue) => update("avoid", profile.avoid.includes(issue) ? profile.avoid.filter((item) => item !== issue) : [...profile.avoid, issue]);
  const notSure = t("Not sure", "不确定");
  const noPreference = t("No preference", "没有偏好");

  return <form className="profile-form tights-profile-form" onSubmit={(event) => { event.preventDefault(); saveTightsProfile({ ...profile, profileMatchingConsent: privacy.anonymousMatching }, "My tights profile"); setSaved(true); }}>
    <ProfileReadiness category="tights" profile={profile} />
    <section><div className="form-section-heading"><span className="step">04</span><div><h2>{t("Start with a familiar pair", "从一双熟悉的丝袜开始")}</h2><p>{t("A usual size plus the kind of coverage you want is enough to start. The brand’s official chart is always the source for the final size check.", "填常穿的尺码和想要的遮盖度就能开始。最终尺码一律以品牌官方尺码表为准。")}</p></div></div>
      <div className="fields three"><label>{t("Usual tights size", "常穿的丝袜尺码")}<input value={profile.usualSize ?? ""} onChange={(event) => update("usualSize", event.target.value.toUpperCase())} placeholder={t("e.g. M or C", "例如 M 或 C")} /></label><label>{t("Size system", "尺码体系")}<select value={profile.sizeSystem ?? "unknown"} onChange={(event) => update("sizeSystem", event.target.value as TightsProfile["sizeSystem"])}><option value="unknown">{notSure}</option><option value="US_CA">{t("US / Canada", "美国 / 加拿大")}</option><option value="UK">{t("UK", "英国")}</option><option value="EU">{t("EU", "欧洲")}</option><option value="brand_specific">{t("Brand-specific", "品牌自有尺码")}</option></select></label><label>{t("Preferred coverage", "想要的遮盖度")}<select value={profile.preferredDenier ?? "everyday"} onChange={(event) => update("preferredDenier", event.target.value as TightsProfile["preferredDenier"])}><option value="sheer">{t("Sheer", "透肉")}</option><option value="everyday">{t("Everyday", "日常")}</option><option value="opaque">{t("Opaque", "不透")}</option><option value="warm">{t("Warm", "保暖")}</option></select></label></div>
      <div className="fields three"><label>{t("Waist preference", "腰头偏好")}<select value={profile.preferredWaist ?? "any"} onChange={(event) => update("preferredWaist", event.target.value as TightsProfile["preferredWaist"])}><option value="any">{noPreference}</option><option value="regular">{t("Regular waist", "普通腰")}</option><option value="high_waist">{t("High waist", "高腰")}</option><option value="control_top">{t("Control top", "收腹裆")}</option></select></label><div className="profile-field-note"><LockKeyIcon size={15} /><span><b>{t("Private by default", "默认私密")}</b><small>{t("Your dimensions are optional and only used when a selected official size chart supports them.", "尺寸是可选的，只有官方尺码表用得上时才会使用。")}</small></span></div></div>
    </section>
    <section><div className="form-section-heading"><span className="step">05</span><div><h2>{t("What should the next pair do better?", "下一双希望哪里更好？")}</h2><p>{t("Pick one or two practical signals. You can skip every chip and still browse.", "选一两个就好。全部跳过也照样可以逛。")}</p></div></div>
      <p className="chip-label">{t("What matters most", "最在意什么")}</p><div className="chips">{priorities.map((priority) => <button className={`chip ${profile.priorities.includes(priority) ? "selected" : ""}`} type="button" onClick={() => togglePriority(priority)} key={priority}>{term(priority)}</button>)}</div>
      <p className="chip-label">{t("Problems to avoid", "想避免的问题")}</p><div className="chips">{issues.map((issue) => <button className={`chip ${profile.avoid.includes(issue.id) ? "selected" : ""}`} type="button" onClick={() => toggleIssue(issue.id)} key={issue.id}>{t(issue.en, issue.zh)}</button>)}</div>
    </section>
    <section className="optional-profile-section"><button type="button" className="optional-disclosure" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((open) => !open)}><span><span className="step">06</span><span><b>{t("Use an official size chart", "对照官方尺码表")}</b><small>{t("Optional measurements are only useful when the brand’s published chart asks for them.", "只有品牌尺码表需要时，这些可选尺寸才有用。")}</small></span></span><CaretDownIcon className={advancedOpen ? "turned" : ""} size={17} /></button>
      {advancedOpen && <div className="optional-profile-body"><p className="optional-profile-note">{t("Choose the measurement you already know. Do not measure just to finish this form; we will request only a compatible field for a specific brand chart.", "只填你已经知道的尺寸，不用为了填表专门去量；需要时我们只会问某个品牌尺码表用得上的那一项。")}</p>
        <div className="fields three"><label>{t("Height", "身高")} <span>cm</span><input type="number" value={profile.heightCm ?? ""} onChange={number("heightCm")} /></label><label>{t("Waist", "腰围")} <span>cm</span><input type="number" value={profile.waistCm ?? ""} onChange={number("waistCm")} /></label><label>{t("Hip", "臀围")} <span>cm</span><input type="number" value={profile.hipCm ?? ""} onChange={number("hipCm")} /></label></div>
        <div className="fields three"><label>{t("Inseam", "内长")} <span>cm</span><input type="number" value={profile.inseamCm ?? ""} onChange={number("inseamCm")} /></label><label>{t("How certain is this?", "有多确定？")}<select value={profile.measurementConfidence ?? "not_sure"} onChange={(event) => update("measurementConfidence", event.target.value as TightsProfile["measurementConfidence"])}><option value="not_sure">{notSure}</option><option value="measured_recently">{t("Measured recently", "最近量过")}</option><option value="estimated">{t("Estimated", "估计的")}</option></select></label><label>{t("Compression preference", "压力偏好")}<select value={profile.compressionPreference ?? "not_sure"} onChange={(event) => update("compressionPreference", event.target.value as TightsProfile["compressionPreference"])}><option value="not_sure">{noPreference}</option><option value="none">{t("Little / none", "很少 / 没有")}</option><option value="light">{t("Light", "轻度")}</option><option value="firm">{t("Firm", "紧实")}</option></select></label></div>
        <label className="change-check"><input type="checkbox" checked={Boolean(profile.fitChangedRecently)} onChange={(event) => update("fitChangedRecently", event.target.checked)} /><span><b>{t("My fit feels different lately", "最近感觉尺码变了")}</b><small>{t("We will treat older size references more cautiously. You never need to say why.", "我们会更谨慎地参考旧尺码。你不需要说明原因。")}</small></span></label>
      </div>}
    </section>
    <div className="form-actions"><p><LockKeyIcon size={14} /> {t("No photo upload, body scan, appearance score, health reason or public profile.", "不上传照片、不做身体扫描、不评价外貌、不问健康原因、没有公开主页。")} {hydrated ? t(`${tightsSnapshots.length} dated tights profile records are saved privately.`, `已私密保存 ${tightsSnapshots.length} 条带日期的丝袜档案记录。`) : t("Loading your private tights profile…", "正在读取你的丝袜档案…")}</p><button className="button" type="submit">{saved ? <><CheckCircleIcon size={16} /> {t("Saved to your timeline", "已存到你的时间线")}</> : t("Save My Tights Profile", "保存我的丝袜档案")}</button></div>
  </form>;
}
