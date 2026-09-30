import { HomeExperience } from "@/components/home-experience";
import { Nav } from "@/components/nav";
import { getT } from "@/lib/i18n-server";

export default async function Home() {
  const t = await getT();
  return <><Nav /><HomeExperience /><footer><span>© 2026 PerfectPair</span><span>{t("Independent by design · Private by default", "独立运营 · 默认私密")}</span></footer></>;
}
