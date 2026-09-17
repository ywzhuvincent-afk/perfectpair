"use client";

import { CompassIcon, LockKeyIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { getBraMatchReadiness, getTightsMatchReadiness } from "@/lib/profile-readiness";
import type { BraProfile } from "@/lib/types";
import type { TightsProfile } from "@/lib/tights";

type Props =
  | { category: "bra"; profile: BraProfile }
  | { category: "tights"; profile: TightsProfile };

export function ProfileReadiness(props: Props) {
  const readiness = props.category === "bra" ? getBraMatchReadiness(props.profile) : getTightsMatchReadiness(props.profile);

  return <aside className={`profile-readiness profile-readiness--${readiness.level}`} aria-live="polite">
    <div className="profile-readiness-icon"><SparkleIcon size={18} weight="fill" /></div>
    <div>
      <p className="eyebrow"><CompassIcon size={13} /> Match detail</p>
      <h3>{readiness.title}</h3>
      <p>{readiness.description}</p>
    </div>
    <div className="profile-readiness-next"><LockKeyIcon size={14} /><span>{readiness.nextQuestion}</span></div>
  </aside>;
}
