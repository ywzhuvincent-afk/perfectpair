import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, CompassIcon, HouseIcon, ScalesIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr";

const primary = [
  { href: "/discover", label: "Library" },
  { href: "/compare", label: "Compare" },
  { href: "/contribute", label: "Contribute" },
  { href: "/passport", label: "My Passport" },
  { href: "/pass-it-forward", label: "Pass it forward" },
];

export function Nav() {
  return <>
    <header className="site-header">
      <Link className="wordmark" href="/"><span className="wordmark-mark">P</span>PerfectPair</Link>
      <nav aria-label="Primary navigation">{primary.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</nav>
      <Link className="profile-link" href="/profile"><UserCircleIcon size={19} weight="regular" /> <span>My profile</span></Link>
    </header>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link href="/"><HouseIcon size={20} weight="regular" /><span>Home</span></Link>
      <Link href="/discover"><CompassIcon size={20} weight="regular" /><span>Library</span></Link>
      <Link href="/compare"><ScalesIcon size={20} weight="regular" /><span>Compare</span></Link>
      <Link href="/passport"><BookOpenIcon size={20} weight="regular" /><span>Passport</span></Link>
      <Link href="/pass-it-forward"><ArrowRightIcon size={20} weight="regular" /><span>Pass on</span></Link>
      <Link href="/profile"><UserCircleIcon size={20} weight="regular" /><span>Profile</span></Link>
    </nav>
  </>;
}
