"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BraProfile, FitContext, FitSnapshot, LowerBodyProfile, LowerBodySnapshot, PassItForwardDraft, PassportItem, PrivacyEvent, PrivacyEventType, PrivacyPreferences, WearEvent } from "@/lib/types";
import type { TightsProfile, TightsSnapshot } from "@/lib/tights";

const storageKey = "perfectpair-bra-fit-state-v1";
const defaultContext: FitContext = {
  occasion: "work",
  goal: "all_day_comfort",
  outfitLabel: "Everyday layers",
  hoursExpected: 8,
};

type FitState = {
  profile: BraProfile;
  tightsProfile: TightsProfile;
  lowerBodyProfile: LowerBodyProfile;
  snapshots: FitSnapshot[];
  tightsSnapshots: TightsSnapshot[];
  lowerBodySnapshots: LowerBodySnapshot[];
  context: FitContext;
  passport: PassportItem[];
  wearEvents: WearEvent[];
  handoffDrafts: PassItForwardDraft[];
  privacy: PrivacyPreferences;
  privacyEvents: PrivacyEvent[];
};

const emptyBraProfile = (): BraProfile => ({ commonUseCases: [], fitPriorities: [], avoid: [], profileMatchingConsent: false });
const emptyTightsProfile = (): TightsProfile => ({ priorities: [], avoid: [], profileMatchingConsent: false });
const emptyLowerBodyProfile = (): LowerBodyProfile => ({ priorities: [], avoid: [], profileMatchingConsent: false });
const freshPrivacy = (): PrivacyPreferences => ({ anonymousMatching: false, aggregatedProductInsights: false, noticeVersion: "2026-09-14", updatedAt: new Date().toISOString() });

function freshState(): FitState {
  return { profile: emptyBraProfile(), tightsProfile: emptyTightsProfile(), lowerBodyProfile: emptyLowerBodyProfile(), snapshots: [], tightsSnapshots: [], lowerBodySnapshots: [], context: defaultContext, passport: [], wearEvents: [], handoffDrafts: [], privacy: freshPrivacy(), privacyEvents: [] };
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const sameProfile = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

function privacyEvent(type: PrivacyEventType): PrivacyEvent {
  return { id: id("privacy"), type, recordedAt: new Date().toISOString() };
}

/**
 * Local-first MVP persistence. It intentionally has the same shape as the future
 * Supabase repository, so a signed-in account can replace this store without UI changes.
 */
export function useFitState() {
  const [state, setState] = useState<FitState>(freshState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<FitState>;
          setState({
            ...freshState(), ...parsed,
            profile: { ...emptyBraProfile(), ...parsed.profile },
            tightsProfile: { ...emptyTightsProfile(), ...parsed.tightsProfile },
            lowerBodyProfile: { ...emptyLowerBodyProfile(), ...parsed.lowerBodyProfile },
            snapshots: parsed.snapshots ?? [], tightsSnapshots: parsed.tightsSnapshots ?? [], lowerBodySnapshots: parsed.lowerBodySnapshots ?? [], passport: parsed.passport ?? [], wearEvents: parsed.wearEvents ?? [], handoffDrafts: parsed.handoffDrafts ?? [],
            privacy: { ...freshPrivacy(), ...parsed.privacy }, privacyEvents: parsed.privacyEvents ?? [],
          });
        }
      } catch {
        // A private browser may reject storage; the interactive demo still works for this session.
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* session-only fallback */ }
  }, [hydrated, state]);

  const saveProfile = useCallback((profile: BraProfile, label?: string) => {
    setState((current) => {
      const changed = !sameProfile(current.profile, profile);
      const snapshot: FitSnapshot = { id: id("snapshot"), profile, recordedAt: new Date().toISOString(), source: "manual", label: label || "Bra profile updated" };
      return { ...current, profile, snapshots: changed ? [snapshot, ...current.snapshots] : current.snapshots };
    });
  }, []);

  const saveTightsProfile = useCallback((tightsProfile: TightsProfile, label?: string) => {
    setState((current) => {
      const changed = !sameProfile(current.tightsProfile, tightsProfile);
      const snapshot: TightsSnapshot = { id: id("tights-snapshot"), profile: tightsProfile, recordedAt: new Date().toISOString(), label: label || "Tights profile updated" };
      return { ...current, tightsProfile, tightsSnapshots: changed ? [snapshot, ...current.tightsSnapshots] : current.tightsSnapshots };
    });
  }, []);

  const saveLowerBodyProfile = useCallback((lowerBodyProfile: LowerBodyProfile, label?: string) => {
    setState((current) => {
      const changed = !sameProfile(current.lowerBodyProfile, lowerBodyProfile);
      const snapshot: LowerBodySnapshot = { id: id("lower-body-snapshot"), profile: lowerBodyProfile, recordedAt: new Date().toISOString(), label: label || "Leggings and jeans profile updated" };
      return { ...current, lowerBodyProfile, lowerBodySnapshots: changed ? [snapshot, ...current.lowerBodySnapshots] : current.lowerBodySnapshots };
    });
  }, []);

  const updatePrivacy = useCallback((patch: Partial<Pick<PrivacyPreferences, "anonymousMatching" | "aggregatedProductInsights">>) => {
    setState((current) => {
      const privacy = { ...current.privacy, ...patch, updatedAt: new Date().toISOString() };
      const events = [...current.privacyEvents];
      if (patch.anonymousMatching !== undefined && patch.anonymousMatching !== current.privacy.anonymousMatching) events.unshift(privacyEvent(patch.anonymousMatching ? "anonymous_matching_enabled" : "anonymous_matching_disabled"));
      if (patch.aggregatedProductInsights !== undefined && patch.aggregatedProductInsights !== current.privacy.aggregatedProductInsights) events.unshift(privacyEvent(patch.aggregatedProductInsights ? "insights_enabled" : "insights_disabled"));
      return { ...current, privacy, privacyEvents: events.slice(0, 12), profile: { ...current.profile, profileMatchingConsent: privacy.anonymousMatching }, tightsProfile: { ...current.tightsProfile, profileMatchingConsent: privacy.anonymousMatching } };
    });
  }, []);

  const exportPrivateData = useCallback(() => {
    const exportedAt = new Date().toISOString();
    const copy = { exportedAt, privacy: state.privacy, braProfile: state.profile, tightsProfile: state.tightsProfile, lowerBodyProfile: state.lowerBodyProfile, braSnapshots: state.snapshots, tightsSnapshots: state.tightsSnapshots, lowerBodySnapshots: state.lowerBodySnapshots, passport: state.passport, wearEvents: state.wearEvents, passItForwardDrafts: state.handoffDrafts };
    const url = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `perfectpair-private-data-${exportedAt.slice(0, 10)}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setState((current) => ({ ...current, privacyEvents: [privacyEvent("exported"), ...current.privacyEvents].slice(0, 12) }));
  }, [state]);

  const eraseFitData = useCallback(() => {
    setState((current) => ({ ...current, profile: emptyBraProfile(), tightsProfile: emptyTightsProfile(), lowerBodyProfile: emptyLowerBodyProfile(), snapshots: [], tightsSnapshots: [], lowerBodySnapshots: [], wearEvents: [], handoffDrafts: [], privacy: freshPrivacy(), privacyEvents: [privacyEvent("fit_data_erased")] }));
  }, []);

  const setContext = useCallback((context: FitContext) => setState((current) => ({ ...current, context })), []);

  const togglePassport = useCallback((productId: string) => setState((current) => {
    const exists = current.passport.some((item) => item.productId === productId);
    return { ...current, passport: exists ? current.passport.filter((item) => item.productId !== productId) : [...current.passport, { productId, state: "want_to_try", addedAt: new Date().toISOString(), priceAlert: { stockAlert: false } }] };
  }), []);

  const updatePassportState = useCallback((productId: string, itemState: PassportItem["state"]) => setState((current) => ({
    ...current,
    passport: current.passport.map((item) => item.productId === productId ? { ...item, state: itemState } : item),
  })), []);

  const addWearEvent = useCallback((event: Omit<WearEvent, "id" | "snapshotId" | "createdAt">) => setState((current) => {
    const snapshot: FitSnapshot = { id: id("snapshot"), profile: current.profile, recordedAt: new Date().toISOString(), source: "wear_checkin", label: "Bra fit at wear check-in" };
    const newEvent: WearEvent = { ...event, id: id("wear"), snapshotId: snapshot.id, createdAt: new Date().toISOString() };
    const passport: PassportItem[] = current.passport.some((item) => item.productId === event.productId)
      ? current.passport.map((item) => item.productId === event.productId ? { ...item, state: item.state === "want_to_try" ? "owned" : item.state } : item)
      : [...current.passport, { productId: event.productId, state: "owned" as const, addedAt: newEvent.createdAt, priceAlert: { stockAlert: false } }];
    return { ...current, snapshots: [snapshot, ...current.snapshots], wearEvents: [newEvent, ...current.wearEvents], passport };
  }), []);

  const saveHandoffDraft = useCallback((draft: Omit<PassItForwardDraft, "id" | "createdAt" | "updatedAt">) => setState((current) => {
    const now = new Date().toISOString();
    const saved: PassItForwardDraft = { ...draft, id: id("pass-it-forward"), createdAt: now, updatedAt: now };
    return { ...current, handoffDrafts: [saved, ...current.handoffDrafts].slice(0, 24) };
  }), []);

  const updateHandoffDraftStatus = useCallback((draftId: string, status: PassItForwardDraft["status"]) => setState((current) => ({
    ...current,
    handoffDrafts: current.handoffDrafts.map((draft) => draft.id === draftId ? { ...draft, status, updatedAt: new Date().toISOString() } : draft),
  })), []);

  const removeHandoffDraft = useCallback((draftId: string) => setState((current) => ({ ...current, handoffDrafts: current.handoffDrafts.filter((draft) => draft.id !== draftId) })), []);

  return useMemo(() => ({ ...state, hydrated, saveProfile, saveTightsProfile, saveLowerBodyProfile, updatePrivacy, exportPrivateData, eraseFitData, setContext, togglePassport, updatePassportState, addWearEvent, saveHandoffDraft, updateHandoffDraftStatus, removeHandoffDraft }), [state, hydrated, saveProfile, saveTightsProfile, saveLowerBodyProfile, updatePrivacy, exportPrivateData, eraseFitData, setContext, togglePassport, updatePassportState, addWearEvent, saveHandoffDraft, updateHandoffDraftStatus, removeHandoffDraft]);
}

export const fitContextDefaults = defaultContext;
