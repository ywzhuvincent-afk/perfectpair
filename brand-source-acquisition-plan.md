# PerfectPair 品牌资料获取与授权计划

> **策略更新（2026-09-14）**：联盟发布者模式不作为上线前提。当前采用“品牌认领 + 授权零售商/分销商 + 独立实物审测 + 同意的用户结构化证据”的方案；完整说明见 [不依赖联盟的产品资料库策略](./non-affiliate-catalog-strategy.md)。本文件中联盟 feed 内容仅保留为将来某品牌主动开放时的备选通道。

## 目标与当前事实

PerfectPair 的目录目前定义了 **32 个品牌目标**：26 个文胸品牌和 6 个丝袜品牌。它们全部已经登记在 `brand_source_targets` 中，并且可通过受保护的内部端点 `/api/ingestion/onboarding` 查看。这个“全量登记”并不等于已经获得 32 个品牌的产品资料或发布授权。

当前 `src/lib/mock-data.ts` 与 `src/lib/tights.ts` 中的产品是开发演示记录，不能作为真实 SKU、价格、库存、尺码或评分来源。生产资料必须逐品牌取得授权后，经过来源、权利和人工审核才可显示。这是为了保证“最全”同时也是“最准确、可长期更新、可证明来源”的资料库。

## 32 个已登记目标

| 文胸（26） | 丝袜（6） |
| --- | --- |
| Aerie、Anita、Bravissimo、Chantelle、Curvy Kate、Elomi、Evelyn & Bobbie、Felina、Fantasie、Freya、Glamorise、Harper Wilde、Knix | Commando、Falke、Heist、Sheertex、Spanx、Wolford |
| Le Mystère、Natori、Panache、Parfait、PrimaDonna、Savage X Fenty、Soma、ThirdLove、Understance、Wacoal、Warner's、Victoria's Secret、Empreinte | |

第一波包含目前已有演示产品的 12 个文胸品牌，以及全部 6 个丝袜品牌；其余 14 个文胸品牌同时进入第二波。两波是为了安排样本校验和人工审核的顺序，不代表第二波不纳入数据库。

## 每个品牌必须拿齐的资料

目录不能只收集产品名称和图片。每一个可显示的商品变体都应有可追溯的最小资料包：

| 资料层 | 文胸 | 丝袜 | 更新要求 |
| --- | --- | --- | --- |
| 身份与跳转 | 品牌、系列、产品名、商家 SKU、变体 ID、官方/授权购买链接 | 相同 | 新品和下架时更新 |
| 匹配核心 | 款式、钢圈、罩杯结构、支撑级别、材质、尺码体系、尺码表版本、罩杯/下胸围范围 | 丹数、透明度、腰头、脚尖、压力、材质、尺码体系、尺码表版本 | 新版尺码表或产品改版时更新 |
| 交易状态 | 市场/币种、常规价/促销价、库存状态、最后更新时间 | 相同 | 由授权源按其许可频率更新 |
| 质量依据 | 每个字段的来源、SKU 与变体关联、来源时间、版本、审核记录 | 相同 | 每次变更保留证据 |
| 体验评分 | PerfectPair 自己收集的匿名化结构化评价 | 相同 | 不复制商家评论正文 |

产品 feed 本身通常可以包含链接、名称、价格、库存、图片和其他属性；Awin 的发布者指南明确说明了这种结构化用途与“按最后更新时间只下载变更 feed”的机制。^1  因此，SKU/变体/尺码/价格应以授权 feed 或品牌提供的文件为主，而不依赖人工抄录网页。

下列内容默认 **不收集或不发布**：产品图及图片 URL、长产品文案、品牌编辑内容、logo、商家评论正文。即使事实本身通常不受美国版权保护，其表达方式、照片、文案和网页编排仍可能受保护；美国版权局也明确区分了事实与受保护表达。^2  这些内容只有在书面授权明确允许的情况下才可进入系统。

## 获取通道与优先顺序

每个品牌都采用同一顺序，避免为了“快”而走不稳定或不合规的抓取路线。

1. **品牌或权利人直接授权（首选）**：索取只含必要事实字段的 API、SFTP/HTTPS feed 或定期 CSV；同时取得自动访问、保存、站内显示、更新频率和市场范围的书面许可。
2. **授权联盟产品 feed（补充）**：若品牌已经参加联盟项目，使用 PerfectPair 作为发布者获得的产品 feed。Awin、CJ 和 Rakuten 都提供面向发布者的动态商品目录/产品 feed；具体能否读取某一品牌，仍取决于发布者账户、品牌项目和访问权限。^3 ^4 ^5
3. **授权零售商 feed（覆盖缺口）**：当品牌没有直接源时，只选择有权销售该品牌、明确允许内容比较/展示且能提供 SKU 级资料的零售商数据源；必须标明“授权零售商”而不是冒充品牌官方资料。
4. **品牌提供的 CSV（最容易启动）**：对于暂时没有 API 的品牌，请其按固定字段提供 CSV/Google Shopping 格式文件，由系统校验并按约定周期导入。CJ 对零售商品 feed 已支持 CSV、分隔文本和 XML，且以唯一商品 ID/SKU 作为重要的资料键。^4

Shopify 不是万能入口。Shopify Storefront API 对部分基础商品查询可以是 tokenless，但更多范围取决于商家授予的 token 与 scopes。^6 因此，只有品牌明确同意时，才将它作为直接数据通道；不能因为某个店铺使用 Shopify 就推定可以采集或再发布其目录。

## 已经落地的技术控制

系统已将 32 个品牌保存为独立的“资料目标”，每个目标都有：分类、优先波次、字段清单、禁止内容、候选通道、状态和下一步动作。还增加了 `brand_source_submissions`，用来记录合作来源、条款、授权字段、有效期、样本验证及证据链接；数据库不保存 API key 或密码。

一个来源要从“目标”进入“启用”，必须依次满足：

```text
确认合作通道
    → 取得书面字段/发布范围
    → 录入来源权利审核
    → 取得小样本 feed
    → 校验 SKU、变体、尺码表和更新时间
    → 创建候选记录
    → 人工审核
    → 才可发布
```

自动任务只运行已批准的来源，且只生成待审核候选记录，不会自动把新资料覆盖到产品页面。价格/库存与目录信息分开刷新；来源应当支持“最后更新时间”、ETag 或等价的变更标识。Awin 的文档建议先检查 feed 的最后更新时间，再下载确有变化的 feed，正好符合本系统的 checkpoint 设计。^1

## 品牌合作方会得到什么

合作方并不是无偿“交出 API”。我们的合作包应说明其获得的实际回报：

- 用户在找到合适尺码/款式后，经可追踪链接回到品牌或授权零售商购买；
- 资料由品牌控制，出现改版、断货或价格变化可快速同步，减少过期信息与客服压力；
- PerfectPair 只处理用户自愿提交的匿名化匹配信号，不向品牌交付可识别的身体资料；
- 合作方可限制字段、国家/市场、刷新频率、图片/文案用途，并可要求暂停或更正；
- 产品 feed 是联盟平台为内容/比较合作伙伴设计的常规模式。Awin 说明维护良好的 feed 有助于发布者准确展示商品，并可能为联盟项目带来销售贡献。^3

这也是为什么应优先争取授权 feed，而不是冒险抓网页：品牌得到了可量化导购入口与可控的资料治理，网站则得到可验证、可更新的 SKU 级数据。

## 对每个数据源的验收条件

来源收到后先在隔离环境验收，任何一项失败都不能上线：

- **身份完整性**：每行有稳定唯一 SKU/variant ID；父商品和颜色/尺码变体关系不混淆。
- **尺码可用性**：尺码体系、尺码范围、尺码表版本/生效时间可识别；文胸不可只给 S/M/L 而缺失罩杯型产品的关键范围。
- **字段授权**：合同/项目条款明确哪些字段允许自动拉取、保存和站内显示；图片与文案没有授权就会被过滤。
- **更新可信度**：价格、库存和停产状态提供更新时间或变更 token；无法确认新鲜度的资料在前台标记“待确认”，不参与“最新”筛选。
- **市场正确性**：加拿大、美国、英国、欧盟等不同的币种、配送市场和尺码体系不能混为一个记录。
- **评分分离**：品牌 feed 只能作为商品事实来源；PerfectPair 的综合评分只由独立、结构化、同意匿名化的用户评价计算。

## 准备给品牌/联盟的资料请求

以下是可由业务负责人审核后发送的初始邮件/表单内容；目前系统只生成准备清单，尚未以 PerfectPair 名义向任何品牌发送请求。

> 我们正在建立一个以尺码与穿着匹配为核心的文胸和丝袜导购目录。希望通过贵方认可的 API、产品 feed 或 CSV，展示准确的 SKU、变体、尺码、材质、价格、库存与购买链接，并把用户导回贵方或贵方认可的零售商。我们默认不使用产品图片、长文案、logo 或商家评论；如贵方愿意授权这些内容，可另行约定。请告知适用的联盟项目、产品资料通道、可使用字段、刷新频率、市场范围、追踪链接要求和联系人。我们可先以少量 SKU 做验证，并提供暂停、更正与资料移除流程。

## 上线前还需要的外部条件

技术、字段模型、排程与权利门槛已经具备；要真正拿齐 32 个品牌的实时资料，还需要由业务主体完成以下外部步骤：

1. 使用公司的真实名称注册并获批至少一个联盟发布者账户，或取得品牌直接合作联系人。
2. 明确 PerfectPair 的公司主体、网站域名、隐私政策、导购/联盟披露与客服邮箱，供品牌审核。
3. 对每一个具体品牌确认项目加入状态和 feed 访问范围；不能假设品牌出现在某联盟就一定可读其完整 feed。
4. 向本系统安全配置被批准的 API key/feed URL（只放 secrets manager），并把批准函、条款链接和字段范围写入来源审核记录。
5. 先导入样本、核对尺码/变体，再逐步扩大到全目录。

在这些账户、授权或凭据尚未取得之前，我不能诚实地说“真实品牌资料已经全部拿齐”，也不应通过绕过登录、验证码、robots 或使用网页抓取来假装完成。那样既会影响资料质量，也会破坏未来合作和版权风险控制。

## Sources

1. Awin, “[Product Feed Publisher Guide Overview](https://help.awin.com/developers/docs/product-feed-publisher-guide-intro),” updated August 31, 2026; “[Product Feed List Download](https://help.awin.com/developers/docs/product-feed-list-download),” published August 31, 2026.
2. U.S. Copyright Office, “[What Does Copyright Protect?](https://copyright.gov/help/faq/faq-protect.html),” accessed September 14, 2026.
3. Awin, “[Product feeds](https://help.awin.com/developers/docs/product-feed-intro),” updated April 28, 2026.
4. CJ, “[Product Feeds](https://developers.cj.com/docs/data-imports/product-feeds),” accessed September 14, 2026.
5. Rakuten Advertising, “[Data Feeds](https://pubhelp.rakutenadvertising.com/hc/en-us/articles/7145964532877-Data-Feeds),” accessed September 14, 2026; “[Download Product Catalog Data Feed Files](https://pubhelp.rakutenadvertising.com/hc/en-us/articles/4412243880333-Download-Product-Catalog-Data-Feed-Files),” accessed September 14, 2026.
6. Shopify, “[Storefront API reference](https://shopify.dev/docs/api/storefront/2026-04),” accessed September 14, 2026; “[API authentication](https://shopify.dev/docs/api/usage/authentication),” accessed September 14, 2026.
