import { Nav } from "@/components/nav";
import { PrivacyCenter } from "@/components/privacy-center";
import { ProfileForm } from "@/components/profile-form";
import { TightsProfileForm } from "@/components/tights-profile-form";
import { LowerBodyProfileForm } from "@/components/lower-body-profile-form";

export default function ProfilePage() {
  return <><Nav /><main className="page-shell"><div className="page-intro"><p className="eyebrow">My fit profile</p><h1>Fit starts with the body you have today.</h1><p>Start with as little as a known size or a practical preference. Bras, tights, leggings and jeans each keep their own fit facts; every update affects future suggestions without rewriting your private history.</p></div><PrivacyCenter /><div className="profile-stack"><ProfileForm /><TightsProfileForm /><LowerBodyProfileForm /></div><aside className="privacy-note"><p className="eyebrow">How changes work</p><h3>Update today. Keep yesterday honest.</h3><p>Saving a real change creates a dated private record. It improves the next recommendation without altering the profile that was attached to an earlier wear or review.</p></aside></main></>;
}
