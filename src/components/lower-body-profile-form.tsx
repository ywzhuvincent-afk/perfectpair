"use client";

import { CaretDownIcon, CheckCircleIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { useFitState } from "@/lib/fit-state";
import type { LowerBodyProfile } from "@/lib/types";

const priorities: Array<{ id: LowerBodyProfile["priorities"][number]; label: string }> = [
  { id: "comfort", label: "Comfort" }, { id: "waist_stability", label: "Waist stays put" }, { id: "seat_fit", label: "Seat fit" }, { id: "length", label: "Length" }, { id: "compression", label: "Compression" }, { id: "mobility", label: "Mobility" }, { id: "durability", label: "Durability" }, { id: "value", label: "Value" },
];
const issues: Array<{ id: LowerBodyProfile["avoid"][number]; label: string }> = [
  { id: "waist_gapes", label: "Waist gaps" }, { id: "waist_rolls", label: "Waist rolls" }, { id: "thighs_tight", label: "Tight at thighs" }, { id: "seat_bags", label: "Bags at seat" }, { id: "crotch_drops", label: "Crotch drops" }, { id: "too_short", label: "Too short" }, { id: "too_long", label: "Too long" }, { id: "see_through", label: "See-through" },
];

export function LowerBodyProfileForm() {
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

  return <div className="profile-layout lower-body-profile" id="lower-body-fit"><form className="profile-form" onSubmit={(event) => { event.preventDefault(); saveLowerBodyProfile({ ...profile, profileMatchingConsent: privacy.anonymousMatching }, "My leggings and jeans fit profile"); setSaved(true); }}>
    <section><div className="form-section-heading"><span className="step">07</span><div><h2>Leggings & jeans: start with a size you trust</h2><p>One known size or a pair that works is enough to begin. These details stay private and will never appear on a public profile.</p></div></div>
      <div className="fields three"><label>Usual leggings size<input value={profile.usualLeggingsSize ?? ""} onChange={(event) => update("usualLeggingsSize", event.target.value.toUpperCase())} placeholder="e.g. M / 8" /></label><label>Usual jeans waist<input value={profile.usualJeansWaist ?? ""} onChange={(event) => update("usualJeansWaist", event.target.value.toUpperCase())} placeholder="e.g. 28" /></label><label>Usual jeans inseam<input value={profile.usualJeansInseam ?? ""} onChange={(event) => update("usualJeansInseam", event.target.value)} placeholder="e.g. 30" /></label></div>
      <div className="fields three"><label>Leggings that work<input value={profile.knownWorkingLeggings ?? ""} onChange={(event) => update("knownWorkingLeggings", event.target.value)} placeholder="Optional brand / style / size" /></label><label>Jeans that work<input value={profile.knownWorkingJeans ?? ""} onChange={(event) => update("knownWorkingJeans", event.target.value)} placeholder="Optional brand / style / size" /></label><div className="profile-field-note"><LockKeyIcon size={15} /><span><b>Private by default</b><small>We use only the facts needed for a future size and construction match.</small></span></div></div>
    </section>
    <section><div className="form-section-heading"><span className="step">08</span><div><h2>What should the next pair do better?</h2><p>Choose only the signals that matter. A concise practical history is more useful than a long body questionnaire.</p></div></div>
      <p className="chip-label">Priority</p><div className="chips">{priorities.map((item) => <button className={`chip ${profile.priorities.includes(item.id) ? "selected" : ""}`} type="button" onClick={() => toggle("priorities", item.id)} key={item.id}>{item.label}</button>)}</div>
      <p className="chip-label">Avoid</p><div className="chips">{issues.map((item) => <button className={`chip ${profile.avoid.includes(item.id) ? "selected" : ""}`} type="button" onClick={() => toggle("avoid", item.id)} key={item.id}>{item.label}</button>)}</div>
    </section>
    <section className="optional-profile-section"><button type="button" className="optional-disclosure" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((open) => !open)}><span><span className="step">09</span><span><b>Use an official size chart later</b><small>Optional measurements only help when a brand’s chart explicitly uses them.</small></span></span><CaretDownIcon className={advancedOpen ? "turned" : ""} size={17} /></button>
      {advancedOpen && <div className="optional-profile-body"><p className="optional-profile-note">You never need to upload a photo, scan or health information. Add only measurements you already know; “not sure” remains a valid answer.</p>
        <div className="fields three"><label>Height <span>cm</span><input type="number" value={profile.heightCm ?? ""} onChange={number("heightCm")} /></label><label>Waist <span>cm</span><input type="number" value={profile.waistCm ?? ""} onChange={number("waistCm")} /></label><label>Hip <span>cm</span><input type="number" value={profile.hipCm ?? ""} onChange={number("hipCm")} /></label></div>
        <div className="fields three"><label>Inseam <span>cm</span><input type="number" value={profile.inseamCm ?? ""} onChange={number("inseamCm")} /></label><label>Rise preference<select value={profile.risePreference ?? "any"} onChange={(event) => update("risePreference", event.target.value as LowerBodyProfile["risePreference"])}><option value="any">No preference</option><option value="low">Low rise</option><option value="mid">Mid rise</option><option value="high">High rise</option></select></label><label>Stretch preference<select value={profile.stretchPreference ?? "any"} onChange={(event) => update("stretchPreference", event.target.value as LowerBodyProfile["stretchPreference"])}><option value="any">No preference</option><option value="rigid">Rigid / low stretch</option><option value="some_stretch">Some stretch</option><option value="stretch">High stretch</option></select></label></div>
        <div className="fields three"><label>Compression<select value={profile.compressionPreference ?? "any"} onChange={(event) => update("compressionPreference", event.target.value as LowerBodyProfile["compressionPreference"])}><option value="any">No preference</option><option value="none">Little / none</option><option value="light">Light</option><option value="firm">Firm</option></select></label><label>How certain is this?<select value={profile.measurementConfidence ?? "not_sure"} onChange={(event) => update("measurementConfidence", event.target.value as LowerBodyProfile["measurementConfidence"])}><option value="not_sure">Not sure</option><option value="measured_recently">Measured recently</option><option value="estimated">Estimated</option></select></label><label className="change-check"><input type="checkbox" checked={Boolean(profile.fitChangedRecently)} onChange={(event) => update("fitChangedRecently", event.target.checked)} /><span><b>My fit feels different lately</b><small>No explanation needed.</small></span></label></div>
      </div>}
    </section>
    <div className="form-actions"><p><LockKeyIcon size={14} /> No body photos, scans, appearance scores or public body profile. You can change or erase this at any time.</p><button className="button" type="submit">{saved ? <><CheckCircleIcon size={16} /> Saved to your timeline</> : "Save leggings & jeans profile"}</button></div>
  </form><aside className="timeline-card"><p className="eyebrow">Fit timeline</p><h3>{hydrated ? `${lowerBodySnapshots.length} saved lower-body ${lowerBodySnapshots.length === 1 ? "record" : "records"}` : "Loading your timeline"}</h3><p>When this profile changes, future leggings and jeans suggestions can adapt without rewriting older fit evidence.</p><div className="timeline-list">{lowerBodySnapshots.slice(0, 4).map((snapshot, index) => <div key={snapshot.id}><span className="timeline-dot"></span><strong>{index === 0 ? "Current lower-body fit" : snapshot.label || "Saved fit"}</strong><small>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(snapshot.recordedAt))} · leggings {snapshot.profile.usualLeggingsSize ?? "—"} · jeans {snapshot.profile.usualJeansWaist ?? "—"}</small></div>)}</div></aside>
  </div>;
}
