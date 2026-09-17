"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowsClockwiseIcon, BookOpenIcon, LockKeyIcon, SparkleIcon, StarIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { useFitState } from "@/lib/fit-state";

const systems = [
  { number: "01", title: "Your Fit DNA", copy: "Keep only the measurements, size history and preferences that make a better next choice. It stays private by default.", href: "/profile", icon: UserCircleIcon },
  { number: "02", title: "The full product record", copy: "Brand facts, materials, construction, size range, availability and version history stay linked to their source.", href: "/discover", icon: BookOpenIcon },
  { number: "03", title: "Experience, not a vague star", copy: "Structured community reporting separates comfort, fit, durability and value from your private Personal Match.", href: "/discover", icon: StarIcon },
  { number: "04", title: "A reviewed update pipeline", copy: "New brands and product changes enter a quality queue first. Nothing discovered by a source goes live without review.", href: "#updates", icon: ArrowsClockwiseIcon },
];

export function HomeExperience() {
  const { profile, tightsProfile, hydrated } = useFitState();
  const braSummary = hydrated ? `${profile.currentBandSize ?? "—"}${profile.currentCupSize ?? ""} · ${profile.fitPriorities.slice(0, 2).join(" + ") || "profile in progress"}` : "Loading your private profile…";
  const tightsSummary = hydrated ? `${tightsProfile.usualSize ?? "—"} · ${tightsProfile.preferredDenier?.replace("_", " ") ?? "profile in progress"}` : "Loading your private profile…";

  return <main className="landing-main">
    <section className="pair-hero">
      <div className="pair-copy">
        <p className="eyebrow">Independent fit intelligence</p>
        <h1>Buy with more fit.<br /><em>Waste less after.</em></h1>
        <p className="pair-lead">PerfectPair brings bras, tights, leggings and jeans into one private research space—so product facts, real-world experience and your own needs can make the next choice more accurate.</p>
        <div className="pair-profile-glance">
          <Link href="/profile"><SparkleIcon size={17} weight="fill" /><span><b>Your fit profile</b><small>Bras: {braSummary}</small></span><ArrowRightIcon size={16} /></Link>
          <Link href="/profile"><span className="tights-mark">T</span><span><b>Your tights profile</b><small>Tights: {tightsSummary}</small></span><ArrowRightIcon size={16} /></Link>
        </div>
        <Link className="find-button pair-cta" href="/profile">Build my Fit DNA <ArrowRightIcon size={17} /></Link>
        <p className="private-note"><LockKeyIcon size={14} /> Your information stays private. Always.</p>
      </div>
      <div className="pair-hero-image"><Image src="/images/perfectpair-hero-bra-tights.png" alt="A nude bra and black tights arranged as an editorial still life" fill priority sizes="(max-width: 820px) 100vw, 45vw" /></div>
    </section>

    <section className="category-doors" aria-label="Choose a product category">
      <Link href="/discover?category=bra" className="category-door"><Image src="/images/perfectpair-bra-category.png" alt="Nude lace bra on an ivory textile background" fill sizes="(max-width: 720px) 100vw, 50vw" /><div><p className="eyebrow">Support · comfort · real life</p><h2>Bras</h2><span>Explore bras <ArrowRightIcon size={18} /></span></div></Link>
      <Link href="/discover?category=tights" className="category-door"><Image src="/images/perfectpair-tights-category.png" alt="Black sheer tights fabric on an ivory textile background" fill sizes="(max-width: 720px) 100vw, 50vw" /><div><p className="eyebrow">Coverage · confidence · your way</p><h2>Tights</h2><span>Explore tights <ArrowRightIcon size={18} /></span></div></Link>
      <Link href="/profile#lower-body-fit" className="category-door category-door--signal"><div><p className="eyebrow">Rise · compression · movement</p><h2>Leggings</h2><span>Build my fit profile <ArrowRightIcon size={18} /></span></div></Link>
      <Link href="/profile#lower-body-fit" className="category-door category-door--signal category-door--denim"><div><p className="eyebrow">Waist · seat · inseam</p><h2>Jeans</h2><span>Build my fit profile <ArrowRightIcon size={18} /></span></div></Link>
    </section>

    <section className="pair-principle"><span>Fit before you buy. Pass it forward if it still misses.</span><p>Personal Match and Community Score are separate. One is private guidance; the other is moderated, product-level experience. Eligible outerwear can later be prepared for an external marketplace—without PerfectPair handling payment or personal contact.</p></section>

    <section className="systems-section" aria-labelledby="systems-title">
      <div className="section-heading"><div><p className="eyebrow">The four systems behind every better fit</p><h2 id="systems-title">One network. Four trustworthy layers.</h2></div><p className="systems-intro">The site is designed as a research platform, not a retailer: what a brand says, what people experience and what suits you remain visibly distinct.</p></div>
      <div className="systems-grid">{systems.map(({ number, title, copy, href, icon: Icon }) => <Link href={href} className="system-item" key={number}><span className="system-number">{number}</span><Icon size={25} weight="regular" /><h3>{title}</h3><p>{copy}</p><span className="system-link">Open <ArrowRightIcon size={15} /></span></Link>)}</div>
    </section>

    <section className="updates-ledger" id="updates">
      <div><p className="eyebrow">Newness with a paper trail</p><h2>Updates arrive as evidence—not instant listings.</h2></div>
      <div className="update-steps"><article><span>01</span><h3>Discover</h3><p>Official sources, authorized feeds and approved public pages may add candidates.</p></article><article><span>02</span><h3>Normalize</h3><p>We map category-specific facts: support, coverage, rise, inseam and construction never become one generic field.</p></article><article><span>03</span><h3>Review & publish</h3><p>Source, version, quality checks and a human decision remain attached before a record becomes searchable.</p></article></div>
    </section>
  </main>;
}
