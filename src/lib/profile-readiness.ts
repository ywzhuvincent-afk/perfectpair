import type { BraProfile } from "@/lib/types";
import type { TightsProfile } from "@/lib/tights";

export type MatchReadiness = {
  level: "starter" | "personal" | "refined";
  title: string;
  description: string;
  nextQuestion: string;
};

const hasBraSize = (profile: BraProfile) => Boolean(profile.currentBandSize && profile.currentCupSize);
const hasBraMeasurements = (profile: BraProfile) => Boolean(profile.underbustSnugCm && profile.bustStandingCm);

/**
 * This deliberately expresses recommendation detail—not a judgment about a
 * person's body or how "complete" they are. It also never blocks browsing.
 */
export function getBraMatchReadiness(profile: BraProfile): MatchReadiness {
  const hasReference = hasBraSize(profile) || hasBraMeasurements(profile) || Boolean(profile.knownWorkingBra?.trim());
  const hasPracticalSignal = profile.fitPriorities.length > 0 || profile.avoid.length > 0 || profile.commonUseCases.length > 0;
  const hasConstructionSignal = Boolean(
    (profile.preferredWire && profile.preferredWire !== "any")
      || (profile.rootWidth && profile.rootWidth !== "unknown")
      || (profile.projection && profile.projection !== "unknown")
      || (profile.strapPlacementPreference && profile.strapPlacementPreference !== "any"),
  );

  if (!hasReference) {
    return {
      level: "starter",
      title: "Ready to explore",
      description: "You can browse freely. One familiar bra size or a bra that works gives the next recommendation a much stronger starting point.",
      nextQuestion: "Best next question: What bra size or model feels closest today?",
    };
  }
  if (!hasPracticalSignal) {
    return {
      level: "starter",
      title: "A solid starting point",
      description: "Your private reference is saved. Add one comfort goal or one fit problem to make the shortlist more personal.",
      nextQuestion: "Best next question: What do you want the next bra to do better?",
    };
  }
  if (!hasConstructionSignal) {
    return {
      level: "personal",
      title: "Personalised shortlist",
      description: "We can rank models around your current reference and practical preferences. Fine details remain optional.",
      nextQuestion: "Optional next question: Do you prefer wire-free, a particular wire, or a strap position?",
    };
  }
  return {
    level: "refined",
    title: "Refined private match",
    description: "You have shared the signals that this catalogue can explain today. Keep it current only when the fit feels different.",
    nextQuestion: "No more detail is needed now. A quick wear check-in will be more useful after trying a product.",
  };
}

export function getTightsMatchReadiness(profile: TightsProfile): MatchReadiness {
  const hasReference = Boolean(profile.usualSize?.trim());
  const hasPracticalSignal = Boolean(profile.preferredDenier || (profile.preferredWaist && profile.preferredWaist !== "any") || profile.priorities.length || profile.avoid.length);
  const hasChartSignal = Boolean(profile.heightCm || profile.waistCm || profile.hipCm || profile.inseamCm);

  if (!hasReference) {
    return {
      level: "starter",
      title: "Ready to explore",
      description: "Coverage and comfort preferences are enough to browse. A familiar tights size lets us begin a size check.",
      nextQuestion: "Best next question: What size do you usually buy in tights?",
    };
  }
  if (!hasPracticalSignal) {
    return {
      level: "starter",
      title: "A solid starting point",
      description: "Your usual size is saved privately. Add one coverage preference or problem to avoid for more useful ranking.",
      nextQuestion: "Best next question: Do you want sheer, everyday, opaque, or warm coverage?",
    };
  }
  if (!hasChartSignal) {
    return {
      level: "personal",
      title: "Personalised shortlist",
      description: "We can rank coverage, waistband and comfort. We only ask for a measurement when a selected brand’s official chart can use it.",
      nextQuestion: "Optional next question: If a brand chart asks for it, would you rather use height or waist / hip?",
    };
  }
  return {
    level: "refined",
    title: "Chart-ready private match",
    description: "Your optional measurements are held for official size-chart checks, not appearance scoring. Update only when your fit feels different.",
    nextQuestion: "No more detail is needed now. Confirm a result after wearing it to improve your next recommendation.",
  };
}
