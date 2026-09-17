"use client";

import { ArrowClockwiseIcon, CheckCircleIcon, DatabaseIcon, LockKeyIcon, PauseCircleIcon, SignOutIcon, SparkleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Candidate = { id: string; external_id: string; canonical_url: string; normalized_payload: Record<string, unknown> | null; quality_score: number | null; quality_reasons: string[]; blocking_issues: string[]; status: string; product_category: "bra" | "tights" | "leggings" | "jeans"; created_at: string; reviewer_note: string | null };
type Contribution = { id: string; submission_type: string; category: string; brand_name: string; product_name: string | null; product_url: string | null; relationship: string; business_email: string | null; preferred_update_method: string | null; moderation_state: string; created_at: string };
type Gap = { id: string; category: string; brand_name: string; product_name: string; priority_score: number; contribution_count: number; resolution_state: string; last_reported_at: string };
type Source = { id: string; slug: string; name: string; source_kind: string; base_url: string | null; enabled: boolean; allowed_categories: string[]; refresh_interval_hours: number | null; automated_access_permitted: boolean; publication_permitted: boolean; paused_reason: string | null; last_success_at: string | null };
type Run = { id: string; status: string; refresh_lane: string | null; trigger_kind: string; request_count: number; no_change_count: number; counts: Record<string, unknown>; started_at: string | null; completed_at: string | null };
type ReviewIntake = { id: string; category: "bra" | "tights"; product_reference: string; product_version: string; size_bought: string; moderation_state: string; created_at: string; reviewer_note: string | null };
type ModerationReview = { id: string; category: "bra" | "tights"; product_id: string; product_version: string; size_bought: string; overall: number; comfort: number | null; moderation_state: string; created_at: string };
type Dashboard = { summary: { candidates: number; contributionsToReview: number; gaps: number; activeSources: number; pendingReviews: number; privacyRequests: number; draftSourceReviews: number; publishedBras: number; publishedTights: number; publishedLeggings: number; publishedJeans: number }; candidates: Candidate[]; contributions: Contribution[]; gaps: Gap[]; sources: Source[]; runs: Run[]; reviewIntake: ReviewIntake[]; moderationReviews: ModerationReview[]; auditEvents: Array<{ id: string; action: string; entity_type: string; entity_id: string; created_at: string }> };
type ManualProductForm = {
  category: "bra" | "tights" | "leggings" | "jeans";
  canonicalUrl: string;
  sourceAttested: boolean;
  brand: string;
  name: string;
  material: string;
  sizeRange: string;
  braStyle: string;
  wire: string;
  cupConstruction: string;
  supportLevel: string;
  tightsStyle: string;
  denier: string;
  opacity: string;
  waist: string;
  toe: string;
  rise: string;
  compression: string;
  stretch: string;
  inseam: string;
  jeansCut: string;
};

const tabs = ["Overview", "Candidates", "Contributions", "Reviews", "Sources", "Runs"] as const;
type Tab = typeof tabs[number];

const emptyManualProduct: ManualProductForm = {
  category: "bra", canonicalUrl: "", sourceAttested: false, brand: "", name: "", material: "", sizeRange: "",
  braStyle: "", wire: "", cupConstruction: "", supportLevel: "", tightsStyle: "", denier: "", opacity: "", waist: "", toe: "", rise: "", compression: "", stretch: "", inseam: "", jeansCut: "",
};

function shortDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—";
}

function payloadSummary(payload: Record<string, unknown> | null) {
  if (!payload) return "No normalized record";
  return [payload.brand, payload.name, payload.style, payload.denier ? `${payload.denier} denier` : payload.wire, payload.sizeRange].filter(Boolean).join(" · ");
}

export function AdminConsole() {
  const [session, setSession] = useState<"checking" | "signed_out" | "signed_in" | "unconfigured">("checking");
  const [accessCode, setAccessCode] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [manualProduct, setManualProduct] = useState<ManualProductForm>(emptyManualProduct);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
    if (response.status === 401) { setSession("signed_out"); setDashboard(null); return; }
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not load the operations dashboard.");
    setDashboard(body.data as Dashboard);
    setSession("signed_in");
  }, []);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" }).then(async (response) => {
      const body = await response.json();
      if (!body.configured) { setSession("unconfigured"); return; }
      if (body.authenticated) await refresh(); else setSession("signed_out");
    }).catch(() => setError("Could not check the operator session."));
  }, [refresh]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("login"); setError(null);
    try {
      const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessCode }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Sign-in failed.");
      setAccessCode(""); await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Sign-in failed."); }
    finally { setBusy(null); }
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" }); setDashboard(null); setSession("signed_out"); setTab("Overview");
  }

  async function operate(payload: Record<string, unknown>, label: string) {
    setBusy(label); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/admin/operations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Operation failed.");
      setNotice(payload.type === "run_refresh" ? `Refresh completed: ${body.data.runs.length} source run(s), ${body.data.skipped.length} skipped.` : "Saved to the private audit trail.");
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Operation failed."); }
    finally { setBusy(null); }
  }

  async function sourceAction(id: string, action: "approve" | "pause") {
    const reason = action === "pause" ? "Paused by the operator for review." : undefined;
    setBusy(`${action}-${id}`); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/admin/sources", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reason }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Source action failed.");
      setNotice(action === "approve" ? "Source approved and queued for its next scheduled refresh." : "Source paused.");
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Source action failed."); }
    finally { setBusy(null); }
  }

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy("add-source"); setError(null); setNotice(null);
    const categories = form.getAll("categories").map(String);
    const allowedFields = String(form.get("allowedFields") ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
    try {
      const response = await fetch("/api/admin/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), slug: form.get("slug"), feedUrl: form.get("feedUrl"), baseUrl: form.get("baseUrl"), termsUrl: form.get("termsUrl"), robotsUrl: form.get("robotsUrl"), categories, refreshHours: Number(form.get("refreshHours")), allowedFields, sourceKind: form.get("sourceKind"), legalBasis: form.get("legalBasis") }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Source draft could not be created.");
      event.currentTarget.reset(); setNotice("Source draft saved. Verify the agreement and sample feed, then approve it here."); await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Source creation failed."); }
    finally { setBusy(null); }
  }

  function updateManualProduct<Key extends keyof ManualProductForm>(key: Key, value: ManualProductForm[Key]) {
    setManualProduct((current) => ({ ...current, [key]: value }));
  }

  async function prefillManualProduct() {
    if (!manualProduct.canonicalUrl.trim()) { setError("请先粘贴产品链接。"); return; }
    if (!manualProduct.sourceAttested) { setError("请先确认该链接可用于事实核对。"); return; }
    setBusy("product-draft"); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/admin/product-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: manualProduct.canonicalUrl, sourceAttested: true }) });
      const body = await response.json();
      if (!response.ok || !body?.data) throw new Error(body?.error ?? "无法读取产品资料。");
      const draft = body.data as { sourceUrl: string; brand?: string; name?: string; material?: string[]; sizeRange?: string; productIdentifier?: string; categoryHint?: ManualProductForm["category"]; denierHint?: number; warnings?: string[] };
      setManualProduct((current) => ({
        ...current,
        canonicalUrl: draft.sourceUrl || current.canonicalUrl,
        category: draft.categoryHint ?? current.category,
        brand: draft.brand ?? current.brand,
        name: draft.name ?? current.name,
        material: draft.material?.join(", ") || current.material,
        sizeRange: draft.sizeRange ?? current.sizeRange,
        denier: draft.denierHint ? String(draft.denierHint) : current.denier,
      }));
      setNotice(draft.warnings?.join(" ") ?? "已从结构化公开事实中预填可用字段；请核对后继续。");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "无法读取产品资料。"); }
    finally { setBusy(null); }
  }

  async function addManualCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("manual-candidate"); setError(null); setNotice(null);
    const material = manualProduct.material.split(",").map((entry) => entry.trim()).filter(Boolean);
    const product = manualProduct.category === "bra"
      ? { brand: manualProduct.brand, name: manualProduct.name, style: manualProduct.braStyle, wire: manualProduct.wire, cupConstruction: manualProduct.cupConstruction, supportLevel: Number(manualProduct.supportLevel), material, sizeRange: manualProduct.sizeRange || undefined }
      : manualProduct.category === "tights"
        ? { brand: manualProduct.brand, name: manualProduct.name, style: manualProduct.tightsStyle, denier: Number(manualProduct.denier), opacity: manualProduct.opacity, waist: manualProduct.waist, toe: manualProduct.toe || undefined, material, sizeRange: manualProduct.sizeRange || undefined }
        : manualProduct.category === "leggings"
          ? { brand: manualProduct.brand, name: manualProduct.name, rise: manualProduct.rise, compression: manualProduct.compression || undefined, stretch: manualProduct.stretch || undefined, inseam: manualProduct.inseam || undefined, material, sizeRange: manualProduct.sizeRange || undefined }
          : { brand: manualProduct.brand, name: manualProduct.name, cut: manualProduct.jeansCut, rise: manualProduct.rise, stretch: manualProduct.stretch || undefined, inseam: manualProduct.inseam || undefined, material, sizeRange: manualProduct.sizeRange || undefined };
    try {
      const response = await fetch("/api/admin/operations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "manual_candidate", candidate: { category: manualProduct.category, canonicalUrl: manualProduct.canonicalUrl, product } }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Manual candidate could not be created.");
      if (body.data?.duplicate) {
        setNotice(`该链接已在${body.data.type === "product" ? "已发布资料库" : "候选审核队列"}中，未重复创建。`);
      } else {
        setManualProduct(emptyManualProduct);
        setNotice("产品事实已进入私有审核队列。请核对后再单独发布。");
      }
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Manual candidate could not be created."); }
    finally { setBusy(null); }
  }

  if (session === "checking") return <main className="admin-gate"><p className="eyebrow">Private operations</p><h1>Opening the console…</h1></main>;
  if (session === "unconfigured") return <main className="admin-gate"><LockKeyIcon size={32} weight="thin" /><p className="eyebrow">Private operations</p><h1>Console setup is incomplete.</h1><p>The host must have both server-only operator secrets before this area can open. Public visitors cannot access operations data.</p></main>;
  if (session === "signed_out") return <main className="admin-gate"><LockKeyIcon size={32} weight="thin" /><p className="eyebrow">Private operations</p><h1>PerfectPair<br /><em>operations console.</em></h1><p>Source rights, product candidates, community moderation and privacy-workload counts stay inside this encrypted session.</p><form onSubmit={signIn}><label>Operator access code<input type="password" autoComplete="current-password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} minLength={12} required /></label><button className="button" disabled={busy === "login"}>{busy === "login" ? "Opening…" : "Open console"}</button></form>{error && <p className="admin-error">{error}</p>}</main>;
  if (!dashboard) return <main className="admin-gate"><p>Loading the operations workspace…</p></main>;

  const cards = [
    ["Candidate review", dashboard.summary.candidates, "Evidence-led product records"],
    ["Source review", dashboard.summary.draftSourceReviews, "Draft permissions to verify"],
    ["Open gaps", dashboard.summary.gaps, "Demand-led research queue"],
    ["Community moderation", dashboard.summary.pendingReviews, "Published only after review"],
    ["Active sources", dashboard.summary.activeSources, "Scheduled and monitored"],
    ["Published bras", dashboard.summary.publishedBras, "Visible in the live catalogue"],
    ["Published tights", dashboard.summary.publishedTights, "Visible in the live catalogue"],
    ["Published leggings", dashboard.summary.publishedLeggings, "Source-backed records ready for discovery"],
    ["Published jeans", dashboard.summary.publishedJeans, "Source-backed records ready for discovery"],
    ["Privacy requests", dashboard.summary.privacyRequests, "Counts only — never profile data"],
  ];

  return <main className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">Private operator workspace</p><h1>Run the research<br /><em>with a paper trail.</em></h1></div><div className="admin-header-actions"><button className="outline-button" onClick={() => refresh()}><ArrowClockwiseIcon size={15} />Refresh</button><button className="text-button" onClick={signOut}><SignOutIcon size={16} />Sign out</button></div></header>
    <div className="admin-nav">{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {notice && <p className="admin-notice"><CheckCircleIcon size={16} />{notice}</p>}{error && <p className="admin-error"><WarningCircleIcon size={16} />{error}</p>}
    {tab === "Overview" && <><section className="admin-metric-grid">{cards.map(([label, value, copy]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong><p>{copy}</p></article>)}</section><section className="admin-split"><article><p className="eyebrow">Safe controls</p><h2>Refresh only approved sources.</h2><p>Every update remains a candidate until an operator publishes it. No product copy, image or personal profile is pulled into this console.</p><div className="admin-actions"><button className="button" disabled={Boolean(busy)} onClick={() => operate({ type: "run_refresh", lane: "catalog" }, "refresh-catalog")}><DatabaseIcon size={16} />Run catalogue update</button><button className="outline-button" disabled={Boolean(busy)} onClick={() => operate({ type: "run_refresh", lane: "price_availability" }, "refresh-price")}>Refresh prices</button></div></article><article><p className="eyebrow">Recent audit trail</p><div className="admin-list">{dashboard.auditEvents.length ? dashboard.auditEvents.map((event) => <div key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong><span>{event.entity_type} · {shortDate(event.created_at)}</span></div>) : <p>No operator activity yet.</p>}</div></article></section></>}
    {tab === "Candidates" && <section className="admin-section">
      <div className="admin-section-heading"><div><p className="eyebrow">01 / Candidate review</p><h2>Facts before products.</h2><p>Paste one permitted product link, let the workspace prefill the usable factual fields, then verify the few fit fields that cannot be safely guessed.</p></div></div>
      <details className="admin-source-form" open>
        <summary><SparkleIcon size={17} />快速录入产品 / Quick product record</summary>
        <p className="admin-form-note">仅从一条公开 HTTPS 产品链接读取结构化事实。不会保存图片、长描述、评论或网页原文，也不会自动发布。</p>
        <form onSubmit={addManualCandidate}>
          <div className="fields three">
            <label>类别 / Category<select value={manualProduct.category} onChange={(event) => updateManualProduct("category", event.target.value as ManualProductForm["category"])}><option value="bra">文胸 / Bra</option><option value="tights">丝袜 / Tights</option><option value="leggings">Leggings</option><option value="jeans">牛仔裤 / Jeans</option></select></label>
            <label className="admin-full-label">产品链接 / Product URL<input type="url" required value={manualProduct.canonicalUrl} onChange={(event) => updateManualProduct("canonicalUrl", event.target.value)} placeholder="https://brand.example/product" /></label>
          </div>
          <label className="admin-confirm"><input type="checkbox" required checked={manualProduct.sourceAttested} onChange={(event) => updateManualProduct("sourceAttested", event.target.checked)} /><span>我确认这是品牌官方页、授权零售商页，或我获准用于事实核对的来源。</span></label>
          <div className="admin-actions"><button type="button" className="outline-button" disabled={Boolean(busy)} onClick={prefillManualProduct}>{busy === "product-draft" ? "读取中…" : "从链接预填事实"}</button><span className="admin-form-note">只预填可识别内容；空白字段请核实后填写，不能猜测。</span></div>
          <div className="fields three">
            <label>品牌 / Brand<input required maxLength={120} value={manualProduct.brand} onChange={(event) => updateManualProduct("brand", event.target.value)} placeholder="例如 Panache" /></label>
            <label>产品名 / Product name<input required maxLength={180} value={manualProduct.name} onChange={(event) => updateManualProduct("name", event.target.value)} placeholder="例如 Envy Balconette" /></label>
            <label>尺码范围 / Size range<input maxLength={100} value={manualProduct.sizeRange} onChange={(event) => updateManualProduct("sizeRange", event.target.value)} placeholder="例如 30–46 D–J" /></label>
          </div>
          <label className="admin-full-label">材质 / Material <span>逗号分隔；可留空。</span><input maxLength={480} value={manualProduct.material} onChange={(event) => updateManualProduct("material", event.target.value)} placeholder="例如 nylon, elastane" /></label>
          {manualProduct.category === "bra" ? <div className="fields three">
            <label>款式 / Style<select required value={manualProduct.braStyle} onChange={(event) => updateManualProduct("braStyle", event.target.value)}><option value="">请选择</option><option value="t_shirt">T-shirt</option><option value="balconette">Balconette</option><option value="plunge">Plunge</option><option value="full_coverage">Full coverage</option><option value="wireless">Wireless</option><option value="bralette">Bralette</option><option value="minimizer">Minimizer</option><option value="strapless">Strapless</option><option value="sports">Sports</option><option value="nursing">Nursing</option></select></label>
            <label>钢圈 / Wire<select required value={manualProduct.wire} onChange={(event) => updateManualProduct("wire", event.target.value)}><option value="">请选择</option><option value="underwire">Underwire</option><option value="wireless">Wireless</option><option value="flex_wire">Flex wire</option></select></label>
            <label>杯型结构 / Cup construction<select required value={manualProduct.cupConstruction} onChange={(event) => updateManualProduct("cupConstruction", event.target.value)}><option value="">请选择</option><option value="moulded">Moulded</option><option value="seamed">Seamed</option><option value="unlined">Unlined</option><option value="padded">Padded</option><option value="spacer">Spacer</option><option value="soft_cup">Soft cup</option></select></label>
            <label>支撑等级 / Support<select required value={manualProduct.supportLevel} onChange={(event) => updateManualProduct("supportLevel", event.target.value)}><option value="">请选择</option><option value="1">1 · 轻</option><option value="2">2</option><option value="3">3 · 中</option><option value="4">4</option><option value="5">5 · 高</option></select></label>
          </div> : manualProduct.category === "tights" ? <div className="fields three">
            <label>款式 / Style<select required value={manualProduct.tightsStyle} onChange={(event) => updateManualProduct("tightsStyle", event.target.value)}><option value="">请选择</option><option value="sheer">Sheer</option><option value="semi_opaque">Semi-opaque</option><option value="opaque">Opaque</option><option value="shaping">Shaping</option><option value="thermal">Thermal</option><option value="patterned">Patterned</option></select></label>
            <label>丹尼数 / Denier<input required type="number" min="1" max="300" value={manualProduct.denier} onChange={(event) => updateManualProduct("denier", event.target.value)} /></label>
            <label>透明度 / Opacity<select required value={manualProduct.opacity} onChange={(event) => updateManualProduct("opacity", event.target.value)}><option value="">请选择</option><option value="ultra_sheer">Ultra sheer</option><option value="sheer">Sheer</option><option value="semi_opaque">Semi-opaque</option><option value="opaque">Opaque</option></select></label>
            <label>腰部 / Waist<select required value={manualProduct.waist} onChange={(event) => updateManualProduct("waist", event.target.value)}><option value="">请选择</option><option value="regular">Regular</option><option value="high_waist">High waist</option><option value="control_top">Control top</option><option value="maternity">Maternity</option></select></label>
            <label>袜尖 / Toe <span>可选。</span><select value={manualProduct.toe} onChange={(event) => updateManualProduct("toe", event.target.value)}><option value="">未核实</option><option value="reinforced">Reinforced</option><option value="sheer">Sheer</option><option value="sandal">Sandal</option><option value="closed">Closed</option></select></label>
          </div> : <div className="fields three">
            {manualProduct.category === "jeans" && <label>裤型 / Cut<select required value={manualProduct.jeansCut} onChange={(event) => updateManualProduct("jeansCut", event.target.value)}><option value="">请选择</option><option value="skinny">Skinny</option><option value="slim">Slim</option><option value="straight">Straight</option><option value="wide_leg">Wide leg</option><option value="bootcut">Bootcut</option><option value="flare">Flare</option><option value="relaxed">Relaxed</option><option value="boyfriend">Boyfriend</option><option value="barrel">Barrel</option></select></label>}
            <label>腰高 / Rise<select required value={manualProduct.rise} onChange={(event) => updateManualProduct("rise", event.target.value)}><option value="">请选择</option><option value="low">Low rise</option><option value="mid">Mid rise</option><option value="high">High rise</option></select></label>
            {manualProduct.category === "leggings" && <label>压缩感 / Compression <span>可选。</span><select value={manualProduct.compression} onChange={(event) => updateManualProduct("compression", event.target.value)}><option value="">未核实</option><option value="none">None</option><option value="light">Light</option><option value="firm">Firm</option></select></label>}
            <label>弹力 / Stretch <span>可选。</span><select value={manualProduct.stretch} onChange={(event) => updateManualProduct("stretch", event.target.value)}><option value="">未核实</option><option value="rigid">Rigid</option><option value="some_stretch">Some stretch</option><option value="stretch">Stretch</option></select></label>
            <label>内长 / Inseam <span>可选；按来源原样记录。</span><input maxLength={60} value={manualProduct.inseam} onChange={(event) => updateManualProduct("inseam", event.target.value)} placeholder="例如 28 in" /></label>
          </div>}
          <button className="button" disabled={Boolean(busy)}>{busy === "manual-candidate" ? "保存中…" : "创建私有候选资料"}</button>
        </form>
      </details>
      <div className="admin-table">{dashboard.candidates.length ? dashboard.candidates.map((candidate) => <article key={candidate.id}><div><span className={`admin-status ${candidate.status}`}>{candidate.status.replaceAll("_", " ")}</span><h3>{payloadSummary(candidate.normalized_payload)}</h3><p>{candidate.product_category} · quality {candidate.quality_score ?? "—"} · {shortDate(candidate.created_at)}</p>{candidate.blocking_issues.length > 0 && <small>Check: {candidate.blocking_issues.join(" ")}</small>}</div><div className="admin-row-actions"><a className="quiet-link" href={candidate.canonical_url} target="_blank" rel="noreferrer">Source</a><button disabled={Boolean(busy)} className="outline-button" onClick={() => operate({ type: "candidate", id: candidate.id, status: "approved" }, `candidate-${candidate.id}`)}>Approve facts</button><button disabled={Boolean(busy)} className="button" onClick={() => operate({ type: "publish_candidate", id: candidate.id }, `publish-${candidate.id}`)}>Publish</button><button disabled={Boolean(busy)} className="text-button" onClick={() => operate({ type: "candidate", id: candidate.id, status: "rejected" }, `reject-${candidate.id}`)}>Reject</button></div></article>) : <p className="admin-empty">No product candidates are waiting. Scheduled source updates and verified manual facts will appear here.</p>}</div>
    </section>}
    {tab === "Contributions" && <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">02 / Coverage loop</p><h2>Resolve what people cannot find.</h2><p>Repeated requests become a single priority gap. Brand contacts are visible only in this private console.</p></div></div><div className="admin-table">{dashboard.contributions.map((contribution) => <article key={contribution.id}><div><span className="admin-status">{contribution.moderation_state.replaceAll("_", " ")}</span><h3>{contribution.brand_name} · {contribution.product_name ?? "Brand claim"}</h3><p>{contribution.submission_type.replaceAll("_", " ")} · {contribution.category} · {shortDate(contribution.created_at)}</p>{contribution.business_email && <small>Private brand contact: {contribution.business_email}</small>}</div><div className="admin-row-actions"><button className="outline-button" disabled={Boolean(busy)} onClick={() => operate({ type: "contribution", id: contribution.id, status: "source_review" }, `contribution-${contribution.id}`)}>Review source</button><button className="text-button" disabled={Boolean(busy)} onClick={() => operate({ type: "contribution", id: contribution.id, status: "closed" }, `close-${contribution.id}`)}>Close</button></div></article>)}</div><h3 className="admin-subheading">Prioritised product gaps</h3><div className="admin-table">{dashboard.gaps.map((gap) => <article key={gap.id}><div><span className="admin-status">{gap.resolution_state.replaceAll("_", " ")}</span><h3>{gap.brand_name} · {gap.product_name}</h3><p>{gap.category} · priority {gap.priority_score} · {gap.contribution_count} report(s)</p></div><div className="admin-row-actions"><button className="outline-button" disabled={Boolean(busy)} onClick={() => operate({ type: "gap", id: gap.id, status: "awaiting_source" }, `gap-${gap.id}`)}>Find source</button><button className="text-button" disabled={Boolean(busy)} onClick={() => operate({ type: "gap", id: gap.id, status: "resolved" }, `resolve-${gap.id}`)}>Resolve</button></div></article>)}</div></section>}
    {tab === "Reviews" && <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">03 / Community evidence</p><h2>Match first. Publish second.</h2><p>Only precise, structured product experiences can affect public scorecards. Profile measurements and account identifiers are never shown here.</p></div></div><h3 className="admin-subheading">Exact product reviews ready to moderate</h3><div className="admin-table">{dashboard.moderationReviews.length ? dashboard.moderationReviews.map((review) => <article key={review.id}><div><span className="admin-status needs_review">pending</span><h3>{review.category} review · product {review.product_id.slice(0, 8)}</h3><p>Wore {review.size_bought} · overall {review.overall}/5 · comfort {review.comfort ?? "—"}/5 · version {review.product_version}</p><small>{shortDate(review.created_at)} · no profile data attached</small></div><div className="admin-row-actions"><button className="button" disabled={Boolean(busy)} onClick={() => operate({ type: "review", id: review.id, category: review.category, status: "published" }, `review-publish-${review.id}`)}>Publish score</button><button className="text-button" disabled={Boolean(busy)} onClick={() => operate({ type: "review", id: review.id, category: review.category, status: "rejected" }, `review-reject-${review.id}`)}>Reject</button></div></article>) : <p className="admin-empty">No exact product reviews are waiting for moderation.</p>}</div><h3 className="admin-subheading">Unmatched references</h3><div className="admin-table">{dashboard.reviewIntake.length ? dashboard.reviewIntake.map((review) => <article key={review.id}><div><span className="admin-status needs_review">{review.moderation_state.replaceAll("_", " ")}</span><h3>{review.product_reference}</h3><p>{review.category} · wore {review.size_bought} · version {review.product_version} · {shortDate(review.created_at)}</p><small>No body measurements or account identifiers were stored with this submission.</small></div><div className="admin-row-actions"><button className="outline-button" disabled={Boolean(busy)} onClick={() => operate({ type: "review_intake", id: review.id, status: "requires_mapping" }, `review-map-${review.id}`)}>Keep for product mapping</button><button className="text-button" disabled={Boolean(busy)} onClick={() => operate({ type: "review_intake", id: review.id, status: "rejected" }, `review-reject-${review.id}`)}>Reject</button></div></article>) : <p className="admin-empty">No unmatched review references.</p>}</div></section>}
    {tab === "Sources" && <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">03 / Source rights</p><h2>Activate only what is permitted.</h2><p>A saved source remains a draft until you verify terms, field scope and a sample feed. Credentials never live here.</p></div></div><details className="admin-source-form"><summary><SparkleIcon size={17} />Add an authorised JSON feed</summary><form onSubmit={addSource}><div className="fields three"><label>Name<input name="name" required placeholder="Brand or authorised data partner" /></label><label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="brand-catalog-ca" /></label><label>Refresh hours<input name="refreshHours" type="number" min="1" max="720" defaultValue="24" required /></label></div><div className="fields"><label>HTTPS JSON feed URL<input name="feedUrl" type="url" required placeholder="https://partner.example/feed.json" /></label><label>Terms URL<input name="termsUrl" type="url" required placeholder="https://partner.example/terms" /></label></div><div className="fields three"><label>Base website URL<input name="baseUrl" type="url" placeholder="https://brand.example" /></label><label>Robots URL (if applicable)<input name="robotsUrl" type="url" placeholder="https://brand.example/robots.txt" /></label><label>Source kind<select name="sourceKind" defaultValue="official"><option value="official">Official feed</option><option value="affiliate_feed">Authorised affiliate feed</option><option value="partner_api">Partner API feed</option><option value="retailer_feed">Authorised retailer feed</option></select></label></div><label className="admin-full-label">Permitted fact fields, comma-separated<input name="allowedFields" required defaultValue="brand,name,style,material,sizeRange,rise,cut,stretch,compression,inseam,price,availability,officialUrl" /></label><div className="admin-source-options"><label><input type="checkbox" name="categories" value="bra" defaultChecked />Bras</label><label><input type="checkbox" name="categories" value="tights" />Tights</label><label><input type="checkbox" name="categories" value="leggings" />Leggings</label><label><input type="checkbox" name="categories" value="jeans" />Jeans</label><label>Legal basis<select name="legalBasis" defaultValue="partner_authorized"><option value="partner_authorized">Authorised partner source</option><option value="manual_import">Approved manual import</option></select></label></div><button className="button" disabled={Boolean(busy)}>{busy === "add-source" ? "Saving…" : "Save draft source"}</button></form></details><div className="admin-table">{dashboard.sources.map((source) => <article key={source.id}><div><span className={`admin-status ${source.enabled ? "published" : "needs_review"}`}>{source.enabled ? "active" : "draft"}</span><h3>{source.name}</h3><p>{source.source_kind.replaceAll("_", " ")} · {source.allowed_categories.join(" + ")} · every {source.refresh_interval_hours ?? "—"}h</p><small>{source.enabled ? `Last success: ${shortDate(source.last_success_at)}` : "Draft sources are not contacted."}</small></div><div className="admin-row-actions">{source.base_url && <a className="quiet-link" href={source.base_url} target="_blank" rel="noreferrer">Website</a>}{source.enabled ? <button className="text-button" disabled={Boolean(busy)} onClick={() => sourceAction(source.id, "pause")}><PauseCircleIcon size={16} />Pause</button> : <button className="button" disabled={Boolean(busy)} onClick={() => sourceAction(source.id, "approve")}>Approve & activate</button>}</div></article>)}</div></section>}
    {tab === "Runs" && <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">04 / Reliability</p><h2>Every refresh leaves evidence.</h2><p>Failures back off automatically. A successful update stores only permitted facts and an operator-review candidate.</p></div></div><div className="admin-table">{dashboard.runs.length ? dashboard.runs.map((run) => <article key={run.id}><div><span className={`admin-status ${run.status === "completed" ? "published" : "needs_review"}`}>{run.status}</span><h3>{run.refresh_lane ?? "manual"} refresh</h3><p>{run.request_count} request(s) · {run.no_change_count} no-change response(s) · {shortDate(run.started_at)}</p></div><div className="admin-run-count">{Object.entries(run.counts ?? {}).slice(0, 3).map(([key, value]) => <span key={key}>{key}: {String(value)}</span>)}</div></article>) : <p className="admin-empty">No source runs yet. The scheduler is active and will log the first approved source here.</p>}</div></section>}
  </main>;
}
