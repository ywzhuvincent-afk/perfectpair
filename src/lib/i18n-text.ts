import type { Lang } from "@/lib/i18n";

/**
 * Chinese for the words and sentences the matching code produces in English. The matching
 * code keeps speaking English (tests and the API rely on it); screens pass its output through
 * `localize` when the reader has chosen 中文. Anything not listed here is shown as written.
 */
const terms: Record<string, string> = {
  // bra styles, wire and cup construction
  t_shirt: "T恤内衣", balconette: "半杯", plunge: "深V", full_coverage: "全罩杯", wireless: "无钢圈", bralette: "软杯文胸",
  minimizer: "显小款", strapless: "无肩带", sports: "运动内衣", nursing: "哺乳内衣",
  underwire: "钢圈", flex_wire: "软钢圈",
  moulded: "模杯", seamed: "拼缝杯", unlined: "无衬", padded: "加垫", spacer: "3D 透气杯", soft_cup: "软杯",
  // tights
  sheer: "透肉", semi_opaque: "半透", opaque: "不透", shaping: "塑形", thermal: "加绒保暖", patterned: "花纹", ultra_sheer: "超薄透肉",
  regular: "普通腰", high_waist: "高腰", control_top: "收腹裆", maternity: "孕妇款",
  reinforced: "加固脚尖", sandal: "露趾凉鞋款", closed: "包脚", not_verified: "未核实",
  // community confidence and fit
  emerging: "初步", developing: "积累中", established: "较稳定", verified: "已验证",
  runs_small: "偏小", true_to_size: "尺码标准", runs_large: "偏大", varies: "因人而异",
  // occasions
  everyday: "日常", work: "上班", lounge: "居家", occasion: "正式场合", travel: "旅行", exercise: "运动", cold_weather: "天冷",
  // priorities
  comfort: "舒适", support: "支撑", band: "下围", cup: "罩杯", wire: "钢圈", straps: "肩带", breathability: "透气", durability: "耐穿", value: "性价比",
  warmth: "保暖", sheerness: "透肉感", control: "收紧",
  any: "不限", "any wire": "不限钢圈",
};

export function term(lang: Lang, value: string | undefined | null): string {
  if (!value) return "";
  if (lang === "zh" && terms[value]) return terms[value];
  return value.replaceAll("_", " ");
}

const sentences: Record<string, string> = {
  // bra match
  "Consented reviewers report strong band-comfort results, relevant to your no-dig priority.": "同意分享数据的用户普遍反映下围很舒服，正好符合你“不勒”的要求。",
  "Its structured ratings are strong for strap comfort and staying in place.": "它在肩带舒适度和不滑落上的评分都很高。",
  "This is a wire-free construction for the goal you selected.": "这是无钢圈款，符合你选的目标。",
  "Its mapped cup depth aligns with your optional self-description.": "它的罩杯深度和你填写的胸型描述相符。",
  "Its mapped strap placement aligns with your optional preference.": "它的肩带位置和你的偏好一致。",
  "Community fit reports may run small; verify the maker’s current chart before ordering.": "用户反馈可能偏小；下单前请核对品牌最新的尺码表。",
  "Fit evidence varies by size or construction; this is a shortlist, not a fit guarantee.": "合身情况因尺码或版型而异；这只是候选清单，不保证一定合身。",
  "Add a current size or two optional measurements to receive a size starting point.": "填写目前的尺码，或两个可选的测量数据，就能得到一个起步尺码。",
  "You marked that your fit feels different lately, so treat an older size reference as a starting point and recheck the current chart.": "你标记了最近身形有变化，所以旧尺码只作参考，请重新核对最新尺码表。",
  // tights match
  "Structured reports indicate above-average durability.": "用户反馈显示耐穿度高于平均。",
  "Structured reports indicate above-average comfort.": "用户反馈显示舒适度高于平均。",
  "Warmth level is aligned with your priority.": "保暖程度符合你的优先需求。",
  "High waist construction may help with your no-roll preference.": "高腰设计可能有助于解决卷边问题。",
  "High warmth may be more than you want.": "保暖度较高，可能比你想要的更热。",
  "Its mapped compression level matches your optional preference.": "它的压力等级符合你的偏好。",
  "Its mapped compression level may not feel like your preference.": "它的压力等级可能和你的偏好不同。",
  "You marked that your fit feels different lately, so use this size as a starting point and check the brand’s current chart.": "你标记了最近身形有变化，这个尺码只作起点，请核对品牌最新尺码表。",
  "Add a usual tights size or coverage preference for a more specific explanation.": "填写常穿的丝袜尺码或遮盖偏好，解释会更具体。",
  // readiness
  "Ready to explore": "可以开始逛了",
  "A solid starting point": "起点不错",
  "Personalised shortlist": "个性化候选清单",
  "Refined private match": "精细的私人匹配",
  "Chart-ready private match": "可对照尺码表的私人匹配",
  "You can browse freely. One familiar bra size or a bra that works gives the next recommendation a much stronger starting point.": "你可以随便逛。填一个熟悉的内衣尺码，或一件合适的内衣，推荐会准很多。",
  "Best next question: What bra size or model feels closest today?": "下一步最好回答：现在哪个尺码或哪款内衣最接近合身？",
  "Your private reference is saved. Add one comfort goal or one fit problem to make the shortlist more personal.": "你的私人参考已保存。再加一个舒适目标或一个合身问题，清单会更贴合你。",
  "Best next question: What do you want the next bra to do better?": "下一步最好回答：你希望下一件内衣哪里做得更好？",
  "We can rank models around your current reference and practical preferences. Fine details remain optional.": "我们可以根据你的尺码参考和实际偏好来排序。更细的信息可填可不填。",
  "Optional next question: Do you prefer wire-free, a particular wire, or a strap position?": "可选问题：你喜欢无钢圈、某种钢圈，还是特定的肩带位置？",
  "You have shared the signals that this catalogue can explain today. Keep it current only when the fit feels different.": "目前产品库能用到的信息你都填好了。只有感觉尺码变了时再更新就行。",
  "No more detail is needed now. A quick wear check-in will be more useful after trying a product.": "现在不用再填了。试穿之后做个快速记录会更有用。",
  "Coverage and comfort preferences are enough to browse. A familiar tights size lets us begin a size check.": "有遮盖和舒适偏好就能逛了。填一个熟悉的丝袜尺码，我们就能开始核对尺码。",
  "Best next question: What size do you usually buy in tights?": "下一步最好回答：你平时买丝袜穿什么尺码？",
  "Your usual size is saved privately. Add one coverage preference or problem to avoid for more useful ranking.": "你的常用尺码已私密保存。再加一个遮盖偏好或想避免的问题，排序会更有用。",
  "Best next question: Do you want sheer, everyday, opaque, or warm coverage?": "下一步最好回答：你想要透肉、日常、不透还是保暖款？",
  "We can rank coverage, waistband and comfort. We only ask for a measurement when a selected brand’s official chart can use it.": "我们可以按遮盖度、腰头和舒适度排序。只有品牌官方尺码表用得上时，才会问你的尺寸。",
  "Optional next question: If a brand chart asks for it, would you rather use height or waist / hip?": "可选问题：如果品牌尺码表需要，你更愿意填身高，还是腰围/臀围？",
  "Your optional measurements are held for official size-chart checks, not appearance scoring. Update only when your fit feels different.": "你填的尺寸只用来对照官方尺码表，不会用来评价外貌。感觉尺码变了再更新。",
  "No more detail is needed now. Confirm a result after wearing it to improve your next recommendation.": "现在不用再填了。穿过之后确认一下结果，下次推荐会更准。",
  // catalogue contribution replies
  "Received for source, privacy and product-review checks. It is not public yet.": "已收到，会先核对来源、隐私和产品资料，暂时不会公开。",
  "Development staging accepted. It is saved only in this browser until Supabase is configured.": "测试环境已接收，数据库接好之前只保存在这个浏览器里。",
  "Invalid submission origin.": "提交来源无效。",
  "Too many reports from this connection. Please try again later.": "提交太频繁了，请稍后再试。",
  "Invalid catalog contribution": "提交内容不完整，请检查后再试。",
  "Catalog submissions are temporarily unavailable. Please try again later.": "暂时无法提交，请稍后再试。",
  "Catalog submission could not be recorded.": "提交没能保存成功。",
  "Submission failed": "提交失败",
};

const patterns: Array<[RegExp, (...groups: string[]) => string]> = [
  [/^(.+) is within this record’s mapped band and cup range\.$/, (size) => `${size} 在这款的下围和罩杯尺码范围内。`],
  [/^Mapped for (.+) wear in the product catalogue\.$/, (occasion) => `产品库把它标为适合「${terms[occasion] ?? occasion}」穿。`],
  [/^You asked for (.+); this model uses (.+) construction\.$/, (want, has) => `你想要${terms[want.replaceAll(" ", "_")] ?? want}，这款是${terms[has.replaceAll(" ", "_")] ?? has}。`],
  [/^Your (.+) size reference uses a different size system; check this brand’s current chart before ordering\.$/, (system) => `你填的 ${system} 尺码和这个品牌用的尺码体系不同；下单前请核对品牌最新尺码表。`],
  [/^(.+) appears outside the seed size map\. Check a sister size or a different model\.$/, (size) => `${size} 好像不在这款的尺码范围内。可以试试姊妹尺码，或换一款。`],
  [/^(\d+) denier matches your preferred coverage\.$/, (d) => `${d}D 符合你想要的遮盖度。`],
  [/^(\d+) denier may not match your preferred coverage\.$/, (d) => `${d}D 可能不符合你想要的遮盖度。`],
  [/^(.+) construction matches your waist preference\.$/, (w) => `${terms[w.replaceAll(" ", "_")] ?? w}设计符合你的腰头偏好。`],
  [/^This pair has a (.+) waist instead of your preference\.$/, (w) => `这款是${terms[w.replaceAll(" ", "_")] ?? w}，和你的偏好不同。`],
];

/** Translate one sentence produced by the matching code. */
export function localize(lang: Lang, text: string): string {
  if (lang !== "zh") return text;
  if (sentences[text]) return sentences[text];
  for (const [pattern, render] of patterns) {
    const found = text.match(pattern);
    if (found) return render(...found.slice(1));
  }
  return text;
}
