"use client";

import { CheckCircleIcon, CaretDownIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { ProfileReadiness } from "@/components/profile-readiness";
import { useFitState } from "@/lib/fit-state";
import type { TightsFitIssue, TightsProfile } from "@/lib/tights";

const priorities: TightsProfile["priorities"] = ["comfort", "durability", "warmth", "sheerness", "control", "value"];
const issues: Array<{ id: TightsFitIssue; label: string }> = [
  { id: "waist_rolls", label: "Waist rolls" }, { id: "waist_digs", label: "Waist digs" }, { id: "sags", label: "Sags" }, { id: "short_inseam", label: "Too short" }, { id: "toe_pressure", label: "Toe pressure" }, { id: "snags", label: "Snags" }, { id: "too_warm", label: "Too warm" }, { id: "not_warm_enough", label: "Not warm enough" },
];

export function TightsProfileForm() {
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

  return <form className="profile-form tights-profile-form" onSubmit={(event) => { event.preventDefault(); saveTightsProfile({ ...profile, profileMatchingConsent: privacy.anonymousMatching }, "My tights profile"); setSaved(true); }}>
    <ProfileReadiness category="tights" profile={profile} />
    <section><div className="form-section-heading"><span className="step">04</span><div><h2>Start with a familiar pair</h2><p>A usual size plus the kind of coverage you want is enough to start. The brand’s official chart is always the source for the final size check.</p></div></div>
      <div className="fields three"><label>Usual tights size<input value={profile.usualSize ?? ""} onChange={(event) => update("usualSize", event.target.value.toUpperCase())} placeholder="e.g. M or C" /></label><label>Size system<select value={profile.sizeSystem ?? "unknown"} onChange={(event) => update("sizeSystem", event.target.value as TightsProfile["sizeSystem"])}><option value="unknown">Not sure</option><option value="US_CA">US / Canada</option><option value="UK">UK</option><option value="EU">EU</option><option value="brand_specific">Brand-specific</option></select></label><label>Preferred coverage<select value={profile.preferredDenier ?? "everyday"} onChange={(event) => update("preferredDenier", event.target.value as TightsProfile["preferredDenier"])}><option value="sheer">Sheer</option><option value="everyday">Everyday</option><option value="opaque">Opaque</option><option value="warm">Warm</option></select></label></div>
      <div className="fields three"><label>Waist preference<select value={profile.preferredWaist ?? "any"} onChange={(event) => update("preferredWaist", event.target.value as TightsProfile["preferredWaist"])}><option value="any">No preference</option><option value="regular">Regular waist</option><option value="high_waist">High waist</option><option value="control_top">Control top</option></select></label><div className="profile-field-note"><LockKeyIcon size={15} /><span><b>Private by default</b><small>Your dimensions are optional and only used when a selected official size chart supports them.</small></span></div></div>
    </section>
    <section><div className="form-section-heading"><span className="step">05</span><div><h2>What should the next pair do better?</h2><p>Pick one or two practical signals. You can skip every chip and still browse.</p></div></div>
      <p className="chip-label">What matters most</p><div className="chips">{priorities.map((priority) => <button className={`chip ${profile.priorities.includes(priority) ? "selected" : ""}`} type="button" onClick={() => togglePriority(priority)} key={priority}>{priority}</button>)}</div>
      <p className="chip-label">Problems to avoid</p><div className="chips">{issues.map((issue) => <button className={`chip ${profile.avoid.includes(issue.id) ? "selected" : ""}`} type="button" onClick={() => toggleIssue(issue.id)} key={issue.id}>{issue.label}</button>)}</div>
    </section>
    <section className="optional-profile-section"><button type="button" className="optional-disclosure" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((open) => !open)}><span><span className="step">06</span><span><b>Use an official size chart</b><small>Optional measurements are only useful when the brand’s published chart asks for them.</small></span></span><CaretDownIcon className={advancedOpen ? "turned" : ""} size={17} /></button>
      {advancedOpen && <div className="optional-profile-body"><p className="optional-profile-note">Choose the measurement you already know. Do not measure just to finish this form; we will request only a compatible field for a specific brand chart.</p>
        <div className="fields three"><label>Height <span>cm</span><input type="number" value={profile.heightCm ?? ""} onChange={number("heightCm")} /></label><label>Waist <span>cm</span><input type="number" value={profile.waistCm ?? ""} onChange={number("waistCm")} /></label><label>Hip <span>cm</span><input type="number" value={profile.hipCm ?? ""} onChange={number("hipCm")} /></label></div>
        <div className="fields three"><label>Inseam <span>cm</span><input type="number" value={profile.inseamCm ?? ""} onChange={number("inseamCm")} /></label><label>How certain is this?<select value={profile.measurementConfidence ?? "not_sure"} onChange={(event) => update("measurementConfidence", event.target.value as TightsProfile["measurementConfidence"])}><option value="not_sure">Not sure</option><option value="measured_recently">Measured recently</option><option value="estimated">Estimated</option></select></label><label>Compression preference<select value={profile.compressionPreference ?? "not_sure"} onChange={(event) => update("compressionPreference", event.target.value as TightsProfile["compressionPreference"])}><option value="not_sure">No preference</option><option value="none">Little / none</option><option value="light">Light</option><option value="firm">Firm</option></select></label></div>
        <label className="change-check"><input type="checkbox" checked={Boolean(profile.fitChangedRecently)} onChange={(event) => update("fitChangedRecently", event.target.checked)} /><span><b>My fit feels different lately</b><small>We will treat older size references more cautiously. You never need to say why.</small></span></label>
      </div>}
    </section>
    <div className="form-actions"><p><LockKeyIcon size={14} /> No photo upload, body scan, appearance score, health reason or public profile. {hydrated ? `${tightsSnapshots.length} dated tights profile records are saved privately.` : "Loading your private tights profile…"}</p><button className="button" type="submit">{saved ? <><CheckCircleIcon size={16} /> Saved to your timeline</> : "Save My Tights Profile"}</button></div>
  </form>;
}
