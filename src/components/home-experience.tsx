"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowsClockwiseIcon, BookOpenIcon, LockKeyIcon, SparkleIcon, StarIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { useI18n } from "@/components/lang-provider";
import { useFitState } from "@/lib/fit-state";

export function HomeExperience() {
  const { t, term } = useI18n();
  const { profile, tightsProfile, hydrated } = useFitState();
  const systems = [
    { number: "01", title: t("Your Fit DNA", "你的尺码基因"), copy: t("Keep only the measurements, size history and preferences that make a better next choice. It stays private by default.", "只保留能帮你下次选得更好的尺寸、尺码记录和偏好，默认只有你自己看得到。"), href: "/profile", icon: UserCircleIcon },
    { number: "02", title: t("The full product record", "完整的产品档案"), copy: t("Brand facts, materials, construction, size range, availability and version history stay linked to their source.", "品牌资料、面料、版型、尺码范围、库存和版本记录，每一条都连着来源。"), href: "/discover", icon: BookOpenIcon },
    { number: "03", title: t("Experience, not a vague star", "真实感受，不是模糊的星星"), copy: t("Structured community reporting separates comfort, fit, durability and value from your private Personal Match.", "用户反馈按舒适、合身、耐穿、性价比分项记录，和你的私人匹配分开。"), href: "/discover", icon: StarIcon },
    { number: "04", title: t("A reviewed update pipeline", "经过审核的更新流程"), copy: t("New brands and product changes enter a quality queue first. Nothing discovered by a source goes live without review.", "新品牌和产品变动先进入审核队列，没经过审核的资料不会上线。"), href: "#updates", icon: ArrowsClockwiseIcon },
  ];
  const loading = t("Loading your private profile…", "正在读取你的私人档案…");
  const inProgress = t("profile in progress", "档案填写中");
  const braSummary = hydrated ? `${profile.currentBandSize ?? "—"}${profile.currentCupSize ?? ""} · ${profile.fitPriorities.slice(0, 2).map(term).join(" + ") || inProgress}` : loading;
  const tightsSummary = hydrated ? `${tightsProfile.usualSize ?? "—"} · ${tightsProfile.preferredDenier ? term(tightsProfile.preferredDenier) : inProgress}` : loading;

  return <main className="landing-main">
    <section className="pair-hero">
      <div className="pair-copy">
        <p className="eyebrow">{t("Independent fit intelligence", "独立的合身研究")}</p>
        <h1>{t("Buy with more fit.", "买得更合身，")}<br /><em>{t("Waste less after.", "买完少浪费。")}</em></h1>
        <p className="pair-lead">{t("PerfectPair brings bras, tights, leggings and jeans into one private research space—so product facts, real-world experience and your own needs can make the next choice more accurate.", "PerfectPair 把内衣、丝袜、打底裤和牛仔裤放进同一个私人研究空间——产品资料、真实穿着感受和你自己的需求放在一起，下一次就能选得更准。")}</p>
        <div className="pair-profile-glance">
          <Link href="/profile"><SparkleIcon size={17} weight="fill" /><span><b>{t("Your fit profile", "你的内衣档案")}</b><small>{t("Bras: ", "内衣：")}{braSummary}</small></span><ArrowRightIcon size={16} /></Link>
          <Link href="/profile"><span className="tights-mark">T</span><span><b>{t("Your tights profile", "你的丝袜档案")}</b><small>{t("Tights: ", "丝袜：")}{tightsSummary}</small></span><ArrowRightIcon size={16} /></Link>
        </div>
        <Link className="find-button pair-cta" href="/profile">{t("Build my Fit DNA", "建立我的尺码档案")} <ArrowRightIcon size={17} /></Link>
        <p className="private-note"><LockKeyIcon size={14} /> {t("Your information stays private. Always.", "你的资料永远只属于你。")}</p>
      </div>
      <div className="pair-hero-image"><Image src="/images/perfectpair-hero-bra-tights.png" alt={t("A nude bra and black tights arranged as an editorial still life", "一件肤色内衣和一双黑色丝袜的静物照")} fill priority sizes="(max-width: 820px) 100vw, 45vw" /></div>
    </section>

    <section className="category-doors" aria-label={t("Choose a product category", "选择品类")}>
      <Link href="/discover?category=bra" className="category-door"><Image src="/images/perfectpair-bra-category.png" alt={t("Nude lace bra on an ivory textile background", "象牙色布料上的肤色蕾丝内衣")} fill sizes="(max-width: 720px) 100vw, 50vw" /><div><p className="eyebrow">{t("Support · comfort · real life", "支撑 · 舒适 · 日常好穿")}</p><h2>{t("Bras", "内衣")}</h2><span>{t("Explore bras", "逛内衣")} <ArrowRightIcon size={18} /></span></div></Link>
      <Link href="/discover?category=tights" className="category-door"><Image src="/images/perfectpair-tights-category.png" alt={t("Black sheer tights fabric on an ivory textile background", "象牙色布料上的黑色透肉丝袜")} fill sizes="(max-width: 720px) 100vw, 50vw" /><div><p className="eyebrow">{t("Coverage · confidence · your way", "遮盖度 · 自信 · 随你搭")}</p><h2>{t("Tights", "丝袜")}</h2><span>{t("Explore tights", "逛丝袜")} <ArrowRightIcon size={18} /></span></div></Link>
      <Link href="/profile#lower-body-fit" className="category-door category-door--signal"><div><p className="eyebrow">{t("Rise · compression · movement", "腰高 · 压力 · 活动自如")}</p><h2>{t("Leggings", "打底裤")}</h2><span>{t("Build my fit profile", "建立我的尺码档案")} <ArrowRightIcon size={18} /></span></div></Link>
      <Link href="/profile#lower-body-fit" className="category-door category-door--signal category-door--denim"><div><p className="eyebrow">{t("Waist · seat · inseam", "腰围 · 臀部 · 内长")}</p><h2>{t("Jeans", "牛仔裤")}</h2><span>{t("Build my fit profile", "建立我的尺码档案")} <ArrowRightIcon size={18} /></span></div></Link>
    </section>

    <section className="pair-principle"><span>{t("Fit before you buy. Pass it forward if it still misses.", "买之前先看合不合身；真不合适，就转给下一位。")}</span><p>{t("Personal Match and Community Score are separate. One is private guidance; the other is moderated, product-level experience. Eligible outerwear can later be prepared for an external marketplace—without PerfectPair handling payment or personal contact.", "个人匹配和用户评分是分开的：一个是给你的私人建议，一个是经过审核的产品真实反馈。符合条件的外穿衣物可以整理好拿到外部二手平台转让——PerfectPair 不经手付款，也不接触你的联系方式。")}</p></section>

    <section className="systems-section" aria-labelledby="systems-title">
      <div className="section-heading"><div><p className="eyebrow">{t("The four systems behind every better fit", "让每次都更合身的四套系统")}</p><h2 id="systems-title">{t("One network. Four trustworthy layers.", "一个平台，四层可信资料。")}</h2></div><p className="systems-intro">{t("The site is designed as a research platform, not a retailer: what a brand says, what people experience and what suits you remain visibly distinct.", "这里是研究平台，不是商店：品牌怎么说、大家怎么穿、什么适合你，三者清清楚楚分开。")}</p></div>
      <div className="systems-grid">{systems.map(({ number, title, copy, href, icon: Icon }) => <Link href={href} className="system-item" key={number}><span className="system-number">{number}</span><Icon size={25} weight="regular" /><h3>{title}</h3><p>{copy}</p><span className="system-link">{t("Open", "打开")} <ArrowRightIcon size={15} /></span></Link>)}</div>
    </section>

    <section className="updates-ledger" id="updates">
      <div><p className="eyebrow">{t("Newness with a paper trail", "每次更新都有据可查")}</p><h2>{t("Updates arrive as evidence—not instant listings.", "更新先当作证据核实，不会直接上架。")}</h2></div>
      <div className="update-steps"><article><span>01</span><h3>{t("Discover", "发现")}</h3><p>{t("Official sources, authorized feeds and approved public pages may add candidates.", "官方来源、授权数据和经过批准的公开网页，可以提交候选产品。")}</p></article><article><span>02</span><h3>{t("Normalize", "整理")}</h3><p>{t("We map category-specific facts: support, coverage, rise, inseam and construction never become one generic field.", "按品类整理资料：支撑、遮盖度、腰高、内长和版型各自独立，不会混成一个笼统字段。")}</p></article><article><span>03</span><h3>{t("Review & publish", "审核并发布")}</h3><p>{t("Source, version, quality checks and a human decision remain attached before a record becomes searchable.", "资料能被搜到之前，来源、版本、质量检查和人工审核记录都会附在上面。")}</p></article></div>
    </section>
  </main>;
}
