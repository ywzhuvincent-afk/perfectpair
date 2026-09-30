import { Nav } from "@/components/nav";
import { PrivacyCenter } from "@/components/privacy-center";
import { ProfileForm } from "@/components/profile-form";
import { TightsProfileForm } from "@/components/tights-profile-form";
import { LowerBodyProfileForm } from "@/components/lower-body-profile-form";
import { getT } from "@/lib/i18n-server";

export default async function ProfilePage() {
  const t = await getT();
  return <><Nav /><main className="page-shell"><div className="page-intro"><p className="eyebrow">{t("My fit profile", "我的尺码档案")}</p><h1>{t("Fit starts with the body you have today.", "合身，从今天的你开始。")}</h1><p>{t("Start with as little as a known size or a practical preference. Bras, tights, leggings and jeans each keep their own fit facts; every update affects future suggestions without rewriting your private history.", "只填一个熟悉的尺码或一个偏好就能开始。内衣、丝袜、打底裤和牛仔裤各自保存自己的尺码信息；每次更新只影响之后的推荐，不会改写你过去的私人记录。")}</p></div><PrivacyCenter /><div className="profile-stack"><ProfileForm /><TightsProfileForm /><LowerBodyProfileForm /></div><aside className="privacy-note"><p className="eyebrow">{t("How changes work", "修改是怎么生效的")}</p><h3>{t("Update today. Keep yesterday honest.", "今天可以更新，过去的记录保持原样。")}</h3><p>{t("Saving a real change creates a dated private record. It improves the next recommendation without altering the profile that was attached to an earlier wear or review.", "每次保存真实的变化，都会生成一条带日期的私人记录。它会让下一次推荐更准，但不会改动之前试穿或点评时所用的档案。")}</p></aside></main></>;
}
