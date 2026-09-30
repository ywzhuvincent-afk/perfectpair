import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, CompassIcon, HouseIcon, ScalesIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { LangToggle } from "@/components/lang-toggle";
import { getT } from "@/lib/i18n-server";

export async function Nav() {
  const t = await getT();
  const primary = [
    { href: "/discover", label: t("Library", "产品库") },
    { href: "/compare", label: t("Compare", "对比") },
    { href: "/contribute", label: t("Contribute", "补充资料") },
    { href: "/passport", label: t("My Passport", "我的试穿册") },
    { href: "/pass-it-forward", label: t("Pass it forward", "转给下一位") },
  ];
  return <>
    <header className="site-header">
      <Link className="wordmark" href="/"><span className="wordmark-mark">P</span>PerfectPair</Link>
      <nav aria-label={t("Primary navigation", "主导航")}>{primary.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</nav>
      <div className="header-end"><LangToggle /><Link className="profile-link" href="/profile"><UserCircleIcon size={19} weight="regular" /> <span>{t("My profile", "我的尺码档案")}</span></Link></div>
    </header>
    <nav className="mobile-nav" aria-label={t("Mobile navigation", "手机导航")}>
      <Link href="/"><HouseIcon size={20} weight="regular" /><span>{t("Home", "首页")}</span></Link>
      <Link href="/discover"><CompassIcon size={20} weight="regular" /><span>{t("Library", "产品库")}</span></Link>
      <Link href="/compare"><ScalesIcon size={20} weight="regular" /><span>{t("Compare", "对比")}</span></Link>
      <Link href="/passport"><BookOpenIcon size={20} weight="regular" /><span>{t("Passport", "试穿册")}</span></Link>
      <Link href="/pass-it-forward"><ArrowRightIcon size={20} weight="regular" /><span>{t("Pass on", "转让")}</span></Link>
      <Link href="/profile"><UserCircleIcon size={20} weight="regular" /><span>{t("Profile", "档案")}</span></Link>
    </nav>
  </>;
}
