import { CatalogContributionForm } from "@/components/catalog-contribution-form";
import { Nav } from "@/components/nav";
import { getT } from "@/lib/i18n-server";

export default async function ContributePage() {
  const t = await getT();
  return <><Nav /><main className="page-shell contribution-page"><div className="page-intro"><p className="eyebrow">{t("Open, reviewed research", "开放、经过审核的研究")}</p><h1>{t("Help us find what the catalogue is missing.", "帮我们找出产品库里还缺什么。")}</h1><p>{t("Submit an unlisted product, flag a correction, or claim a brand record. Your report becomes a private research lead—not an automatic public listing—and commercial facts are only shown when an authorised source confirms them.", "提交还没收录的产品、指出错误，或认领品牌资料。你的提交只会成为内部研究线索，不会自动公开；价格等商业信息只有在授权来源确认后才会显示。")}</p></div><CatalogContributionForm /><section className="contribution-loop"><span>{t("CONTINUOUS COVERAGE LOOP", "持续补全流程")}</span><div><article><b>01</b><h2>{t("Deduplicate demand", "合并重复需求")}</h2><p>{t("Similar reports become one prioritised product gap instead of scattered requests.", "相似的提交会合并成一个待补的产品，按优先级处理，而不是零散的请求。")}</p></article><article><b>02</b><h2>{t("Verify the evidence", "核实证据")}</h2><p>{t("We check source, product identity, privacy and permitted fields before creating a candidate.", "建立候选资料之前，我们会核对来源、产品身份、隐私和可公开的字段。")}</p></article><article><b>03</b><h2>{t("Keep it current", "保持最新")}</h2><p>{t("Approved commercial sources refresh availability; independent evidence improves fit guidance.", "授权的商业来源负责更新库存；独立的用户反馈让合身建议更准。")}</p></article></div></section></main></>;
}
