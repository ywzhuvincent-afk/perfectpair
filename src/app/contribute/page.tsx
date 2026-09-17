import { CatalogContributionForm } from "@/components/catalog-contribution-form";
import { Nav } from "@/components/nav";

export default function ContributePage() {
  return <><Nav /><main className="page-shell contribution-page"><div className="page-intro"><p className="eyebrow">Open, reviewed research</p><h1>Help us find what the catalogue is missing.</h1><p>Submit an unlisted product, flag a correction, or claim a brand record. Your report becomes a private research lead—not an automatic public listing—and commercial facts are only shown when an authorised source confirms them.</p></div><CatalogContributionForm /><section className="contribution-loop"><span>CONTINUOUS COVERAGE LOOP</span><div><article><b>01</b><h2>Deduplicate demand</h2><p>Similar reports become one prioritised product gap instead of scattered requests.</p></article><article><b>02</b><h2>Verify the evidence</h2><p>We check source, product identity, privacy and permitted fields before creating a candidate.</p></article><article><b>03</b><h2>Keep it current</h2><p>Approved commercial sources refresh availability; independent evidence improves fit guidance.</p></article></div></section></main></>;
}
