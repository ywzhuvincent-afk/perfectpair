"use client";

import { CheckCircleIcon, ClockCounterClockwiseIcon, CaretDownIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { ProfileReadiness } from "@/components/profile-readiness";
import { useFitState } from "@/lib/fit-state";
import type { BraOccasion, BraProfile, FitIssue } from "@/lib/types";

const priorities: BraProfile["fitPriorities"] = ["comfort", "support", "band", "cup", "wire", "straps", "breathability", "durability", "value"];
const occasions: Array<{ id: BraOccasion; label: string }> = [
  { id: "everyday", label: "Everyday" }, { id: "work", label: "Work" }, { id: "lounge", label: "Lounge" }, { id: "occasion", label: "Occasion" }, { id: "travel", label: "Travel" }, { id: "exercise", label: "Exercise" },
];
const issues: Array<{ id: FitIssue; label: string }> = [
  { id: "band_digs", label: "Band digs" }, { id: "band_rides_up", label: "Band rides up" }, { id: "cup_spillage", label: "Cup spillage" }, { id: "cup_gaping", label: "Cup gaping" }, { id: "wire_pokes", label: "Wire pokes" }, { id: "wire_on_tissue", label: "Wire sits on tissue" }, { id: "straps_slip", label: "Straps slip" }, { id: "straps_dig", label: "Straps dig" }, { id: "gore_floats", label: "Center doesn’t sit flat" }, { id: "side_spillage", label: "Side spillage" }, { id: "cups_shift", label: "Cups shift" },
];

export function ProfileForm() {
  const { profile: savedProfile, snapshots, saveProfile, privacy, hydrated } = useFitState();
  const [profile, setProfile] = useState<BraProfile>(savedProfile);
  const [saved, setSaved] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const receivedHydratedProfile = useRef(false);
  useEffect(() => {
    if (!hydrated || receivedHydratedProfile.current) return;
    const sync = window.setTimeout(() => { setProfile(savedProfile); receivedHydratedProfile.current = true; }, 0);
    return () => window.clearTimeout(sync);
  }, [hydrated, savedProfile]);
  const update = <K extends keyof BraProfile>(key: K, value: BraProfile[K]) => { setSaved(false); setProfile((previous) => ({ ...previous, [key]: value })); };
  const togglePriority = (priority: BraProfile["fitPriorities"][number]) => setProfile((current) => ({ ...current, fitPriorities: current.fitPriorities.includes(priority) ? current.fitPriorities.filter((item) => item !== priority) : [...current.fitPriorities, priority] }));
  const toggleIssue = (issue: FitIssue) => setProfile((current) => ({ ...current, avoid: current.avoid.includes(issue) ? current.avoid.filter((item) => item !== issue) : [...current.avoid, issue] }));
  const toggleOccasion = (occasion: BraOccasion) => setProfile((current) => ({ ...current, commonUseCases: current.commonUseCases.includes(occasion) ? current.commonUseCases.filter((item) => item !== occasion) : [...current.commonUseCases, occasion] }));
  const formatDate = (date: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
  const number = (key: "currentBandSize" | "underbustSnugCm" | "underbustLooseCm" | "bustStandingCm" | "bustLeaningCm") => (event: React.ChangeEvent<HTMLInputElement>) => update(key, event.target.value === "" ? undefined : Number(event.target.value));

  return <div className="profile-layout"><form className="profile-form" onSubmit={(event) => { event.preventDefault(); saveProfile({ ...profile, profileMatchingConsent: privacy.anonymousMatching }, "My bra fit profile"); setSaved(true); }}>
    <ProfileReadiness category="bra" profile={profile} />
    <section><div className="form-section-heading"><span className="step">01</span><div><h2>Start with what you know</h2><p>Choose one route: a familiar size or a bra that works. Nothing is required, and you can refine only when a recommendation needs it.</p></div></div>
      <div className="fields three"><label>Size system<select value={profile.sizeSystem ?? "unknown"} onChange={(event) => update("sizeSystem", event.target.value as BraProfile["sizeSystem"])}><option value="unknown">Not sure</option><option value="US_CA">US / Canada</option><option value="UK">UK</option><option value="EU">EU</option><option value="AU_NZ">Australia / NZ</option><option value="brand_specific">Brand-specific</option></select></label><label>Current band size<input type="number" min="24" max="54" value={profile.currentBandSize ?? ""} onChange={number("currentBandSize")} placeholder="e.g. 34" /></label><label>Current cup size<input value={profile.currentCupSize ?? ""} onChange={(event) => update("currentCupSize", event.target.value.toUpperCase())} placeholder="e.g. D" /></label></div>
      <div className="fields three"><label>A bra that works<input value={profile.knownWorkingBra ?? ""} onChange={(event) => update("knownWorkingBra", event.target.value)} placeholder="Optional brand / model / size" /></label><label>Wire preference<select value={profile.preferredWire ?? "any"} onChange={(event) => update("preferredWire", event.target.value as BraProfile["preferredWire"])}><option value="any">No preference</option><option value="underwire">Underwire</option><option value="flex_wire">Flex wire</option><option value="wireless">Wire-free</option></select></label><div className="profile-field-note"><LockKeyIcon size={15} /><span><b>Private by default</b><small>These details are used only for your own match unless you separately enable anonymous contribution.</small></span></div></div>
    </section>
    <section><div className="form-section-heading"><span className="step">02</span><div><h2>What should improve?</h2><p>Pick only one or two. Practical experience is more useful than a long questionnaire.</p></div></div>
      <p className="chip-label">Where will you wear it?</p><div className="chips">{occasions.map((occasion) => <button className={`chip ${profile.commonUseCases.includes(occasion.id) ? "selected" : ""}`} type="button" onClick={() => toggleOccasion(occasion.id)} key={occasion.id}>{occasion.label}</button>)}</div>
      <p className="chip-label">What matters most</p><div className="chips">{priorities.map((priority) => <button className={`chip ${profile.fitPriorities.includes(priority) ? "selected" : ""}`} type="button" onClick={() => togglePriority(priority)} key={priority}>{priority}</button>)}</div>
      <p className="chip-label">Problems to avoid</p><div className="chips">{issues.map((issue) => <button className={`chip ${profile.avoid.includes(issue.id) ? "selected" : ""}`} type="button" onClick={() => toggleIssue(issue.id)} key={issue.id}>{issue.label}</button>)}</div>
    </section>
    <section className="optional-profile-section"><button type="button" className="optional-disclosure" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((open) => !open)}><span><span className="step">03</span><span><b>Improve a specific match</b><small>Optional details, only if you want a more precise starting size or construction check.</small></span></span><CaretDownIcon className={advancedOpen ? "turned" : ""} size={17} /></button>
      {advancedOpen && <div className="optional-profile-body"><p className="optional-profile-note">Measurements are manually entered, never inferred from a photo or scan. “Not sure” is always a valid answer.</p>
        <div className="fields three"><label>Snug underbust <span>cm</span><input type="number" value={profile.underbustSnugCm ?? ""} onChange={number("underbustSnugCm")} /></label><label>Standing bust <span>cm</span><input type="number" value={profile.bustStandingCm ?? ""} onChange={number("bustStandingCm")} /></label><label>How certain is this?<select value={profile.measurementConfidence ?? "not_sure"} onChange={(event) => update("measurementConfidence", event.target.value as BraProfile["measurementConfidence"])}><option value="not_sure">Not sure</option><option value="measured_recently">Measured recently</option><option value="estimated">Estimated</option></select></label></div>
        <div className="fields three"><label>Loose underbust <span>cm · optional</span><input type="number" value={profile.underbustLooseCm ?? ""} onChange={number("underbustLooseCm")} /></label><label>Leaning bust <span>cm · optional</span><input type="number" value={profile.bustLeaningCm ?? ""} onChange={number("bustLeaningCm")} /></label><label>A bra that does not work<input value={profile.knownProblemBra ?? ""} onChange={(event) => update("knownProblemBra", event.target.value)} placeholder="Optional brand / model / size" /></label></div>
        <div className="fields three"><label>Root width<select value={profile.rootWidth ?? "unknown"} onChange={(event) => update("rootWidth", event.target.value as BraProfile["rootWidth"])}><option value="unknown">Not sure</option><option value="narrow">Narrow</option><option value="average">Average</option><option value="wide">Wide</option></select></label><label>Projection<select value={profile.projection ?? "unknown"} onChange={(event) => update("projection", event.target.value as BraProfile["projection"])}><option value="unknown">Not sure</option><option value="shallow">Shallow</option><option value="average">Average</option><option value="projected">Projected</option></select></label><label>Strap placement<select value={profile.strapPlacementPreference ?? "any"} onChange={(event) => update("strapPlacementPreference", event.target.value as BraProfile["strapPlacementPreference"])}><option value="any">No preference</option><option value="centered">More centred</option><option value="wide_set">Wider set</option></select></label></div>
        <label className="change-check"><input type="checkbox" checked={Boolean(profile.fitChangedRecently)} onChange={(event) => update("fitChangedRecently", event.target.checked)} /><span><b>My fit feels different lately</b><small>We will treat older size references more cautiously. You never need to say why.</small></span></label>
      </div>}
    </section>
    <div className="form-actions"><p><LockKeyIcon size={14} /> No photo upload, body scan, appearance score, health reason or public profile. You can update or clear these fields whenever you choose.</p><button className="button" type="submit">{saved ? <><CheckCircleIcon size={16} /> Saved to your timeline</> : "Save My Bra Profile"}</button></div>
  </form>
  <aside className="timeline-card"><p className="eyebrow"><ClockCounterClockwiseIcon size={13} /> Fit timeline</p><h3>{hydrated ? `${snapshots.length} saved fit ${snapshots.length === 1 ? "record" : "records"}` : "Loading your timeline"}</h3><p>Fit changes are normal. A new snapshot updates future matches while keeping past wears and reviews honest.</p><div className="timeline-list">{snapshots.slice(0, 4).map((snapshot, index) => <div key={snapshot.id}><span className="timeline-dot"></span><strong>{index === 0 ? "Current bra fit" : snapshot.label || "Saved fit"}</strong><small>{formatDate(snapshot.recordedAt)} · {snapshot.profile.currentBandSize ?? "—"}{snapshot.profile.currentCupSize ?? ""} · {snapshot.profile.preferredWire ?? "any wire"}</small></div>)}</div></aside>
  </div>;
}
