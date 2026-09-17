"use client";

import { CheckCircleIcon, DownloadSimpleIcon, EyeSlashIcon, LockKeyIcon, ShieldCheckIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { useFitState } from "@/lib/fit-state";

const eventLabels = {
  anonymous_matching_enabled: "Anonymous matching enabled",
  anonymous_matching_disabled: "Anonymous matching turned off",
  insights_enabled: "Anonymous product insights enabled",
  insights_disabled: "Anonymous product insights turned off",
  exported: "Private data copy downloaded",
  fit_data_erased: "Private fit data cleared",
} as const;

export function PrivacyCenter() {
  const { hydrated, privacy, privacyEvents, snapshots, tightsSnapshots, exportPrivateData, eraseFitData, updatePrivacy } = useFitState();
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [erased, setErased] = useState(false);
  const recordCount = snapshots.length + tightsSnapshots.length;
  const latestEvent = privacyEvents[0];
  const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

  function clearFitData() {
    eraseFitData();
    setConfirmingErase(false);
    setErased(true);
  }

  return <section className="privacy-center" aria-labelledby="privacy-center-title">
    <div className="privacy-center-intro">
      <p className="eyebrow"><LockKeyIcon size={13} /> Privacy controls</p>
      <h2 id="privacy-center-title">You decide what stays private.</h2>
      <p>Start with only a size or a preference. Measurements are optional, never visible to other members, and are not shared with brands or advertisers.</p>
    </div>

    <div className="privacy-facts" aria-label="Private data summary">
      <article><EyeSlashIcon size={20} /><span>Visible to others</span><strong>Only you</strong></article>
      <article><ShieldCheckIcon size={20} /><span>Used for</span><strong>Your private match</strong></article>
      <article><LockKeyIcon size={20} /><span>Saved history</span><strong>{hydrated ? `${recordCount} private ${recordCount === 1 ? "record" : "records"}` : "Loading…"}</strong></article>
    </div>

    <div className="privacy-controls">
      <div className="privacy-choice">
        <div><strong>Anonymous matching</strong><p>Off by default. Turn this on only if you want de-identified fit signals to improve future “People Like You” guidance. No individual measurement is shown.</p></div>
        <button type="button" className={`privacy-switch ${privacy.anonymousMatching ? "on" : ""}`} role="switch" aria-checked={privacy.anonymousMatching} onClick={() => { setErased(false); updatePrivacy({ anonymousMatching: !privacy.anonymousMatching }); }}><span></span><b>{privacy.anonymousMatching ? "On" : "Off"}</b></button>
      </div>
      <div className="privacy-choice">
        <div><strong>Anonymous product insights</strong><p>Off by default. This future-facing setting permits only aggregated product-improvement signals; the current demo does not send data to any outside party.</p></div>
        <button type="button" className={`privacy-switch ${privacy.aggregatedProductInsights ? "on" : ""}`} role="switch" aria-checked={privacy.aggregatedProductInsights} onClick={() => { setErased(false); updatePrivacy({ aggregatedProductInsights: !privacy.aggregatedProductInsights }); }}><span></span><b>{privacy.aggregatedProductInsights ? "On" : "Off"}</b></button>
      </div>
    </div>

    <div className="privacy-actions">
      <div><strong>Keep a copy or start fresh</strong><p>This working demo stores profile information in this browser. A signed-in version keeps the same choices, plus account-level export and deletion requests.</p></div>
      <div className="privacy-action-buttons"><button type="button" className="text-button" onClick={() => { setErased(false); exportPrivateData(); }}><DownloadSimpleIcon size={16} /> Download my private data</button><button type="button" className="danger-button" onClick={() => setConfirmingErase(true)}><TrashIcon size={16} /> Clear fit profile</button></div>
    </div>

    {confirmingErase && <div className="privacy-confirm" role="alert"><div><strong>Clear your private fit profile?</strong><p>This removes bra and tights profile fields, dated fit history, and private wear notes from this browser. Saved product cards stay in your Passport.</p></div><div><button type="button" className="text-button" onClick={() => setConfirmingErase(false)}>Cancel</button><button type="button" className="danger-button" onClick={clearFitData}>Yes, clear my fit data</button></div></div>}
    {(erased || latestEvent) && <p className="privacy-last-action"><CheckCircleIcon size={14} /> {erased ? "Your private fit fields and history were cleared in this browser." : `${eventLabels[latestEvent.type]} · ${formatDate(latestEvent.recordedAt)}`}</p>}
  </section>;
}
