# PerfectPair：文胸与丝袜合站研究基准（2026-09-14）

## 结论

应当以 **PerfectPair 一个品牌、文胸和丝袜两个独立业务入口** 运营，而不是混成一个筛选器，也不建议拆成两个彼此孤立的网站。用户可用同一私密档案和信任规则，但每个品类必须有自己的资料字段、匹配逻辑、评分问题和运营审核队列。

这份实现已把用户要求的四块完整建模：私密资料、跨品牌产品资料、结构化评分、持续更新管线。当前前端可直接演示；品牌/型号/价格为 development seed，任何公开资料都必须经过正式来源和人工审核后才可上线。

## 市场做法与可借鉴点

| 能力 | 领先做法 | PerfectPair 的落地 | 不应照搬的部分 |
| --- | --- | --- | --- |
| 私密资料 | 资料最小化、默认私密、按目的收集 | 文胸和丝袜各有可选字段；无照片、无 body scan、无外貌评分；匿名相似用户另行同意 | 以“更精准”为名长期保存不必要的身体信息 |
| 产品资料 | 品牌事实、变体、尺码表、价格和库存来自可追溯的来源 | `brands → products/tights_products → variants → observations → versions`；每个字段可留来源与时间 | 把商家营销词和真实穿着体验写成同一类事实 |
| 评分 | 评分要与可识别型号/版本关联，反垃圾、可审核 | 文胸、丝袜各自结构化维度；先 `pending` moderation，再进入 community evidence | 通用五星评分、付费置顶、用低样本做确定性结论 |
| 更新 | 产品资料与 feed/structured data 配合，频繁变化字段要持续同步 | `discover → normalize → quality → human review → publish`；新增品牌/产品与价格/可用性均进入队列 | 自动抓到就公开；绕过 robots、条款或品牌数据授权 |

Google 对商品资料的公开建议也支持这个分层：结构化数据适合商品页表达，频繁变化的价格与库存应由 feed / API 保持同步；而型号匹配需要 GTIN、品牌与 MPN 等稳定识别字段，而不只是名称。[Google Search：共享商品资料](https://developers.google.com/search/docs/specialty/ecommerce/share-your-product-data-with-google) [Google Merchant：频繁更新](https://developers.google.com/merchant/api/guides/products/frequent-updates) [Google Merchant：产品评分基础](https://support.google.com/merchants/answer/14620705?hl=en)

公开评价不应是“评论一发就显示”。Google 的商品评分政策明确排除低质量内容，并要求商家拥有、收集和处理评价；其审核实践结合自动化和人工处理。PerfectPair 因此将用户提交先放入审核状态，且评分不会直接改变个人推荐。[Google Merchant：产品评分政策](https://support.google.com/merchants/answer/6098512?hl=en)

在品牌伦理、可持续或其他高信任资料场景中，Good On You 的公开方法也采用资料来源、第三方资料、品牌提交、验证及分析师审阅的组合。这不是丝袜/文胸的同类产品，却是“可说明的多来源研究”比单一抓取更可靠的有用参照。[Good On You 评级方法](https://goodonyou.eco/wp-content/uploads/2023/10/GoodOnYou-RatingsMethodology-Oct23.pdf)

资料层采用默认隐私和数据最小化：仅收集本次匹配真正需要的信息，匿名相似用户需单独同意。这和 ICO 对 privacy by design/default 的“默认只处理必要资料”的指导一致。[ICO：Data protection by design and default](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/)

## 四大模块如何对应到代码与数据

### 1. 用户资料信息

- 前台：`/profile` 同屏但分为 Bra Profile 和 Tights Profile；首页也分别显示两条私密摘要。
- 存储：`profiles` 保留文胸资料，新增 `profiles.tights_profile`；两类 profile 都生成带日期的 snapshot，以免今天的资料改写过去的评价。
- 隐私：默认私密；没有相片、扫描、外貌分析；匿名类似人群功能以 `profileMatchingConsent` 单独开关。

### 2. 全品牌、全型号产品资料

- 共享品牌主档：`brands`。文胸使用既有 `products`，丝袜使用新的 `tights_products`，两者共同连接 variant、价格、可用性、版本与逐字段来源。
- 为什么不硬合一张表：文胸核心是 band/cup、wire、cup construction；丝袜核心是 denier、opacity、waist/toe construction、warmth/compression。合一会造成大量空字段和错误筛选。
- 前台：`/discover?category=bra`、`/discover?category=tights` 两条入口，`/products/[slug]` 根据品类显示对应事实与来源层。

### 3. 评分和推荐

- 文胸评价：band、cup、wire、straps、side support 等。
- 丝袜评价：waist comfort、coverage、toe comfort、stay put、durability 等。
- 两者都包括版本、尺码、结构化分项、审核状态与私密 profile snapshot；数据库为丝袜新增 `tights_reviews` 与 `tights_product_scorecards`。
- **Personal Match 不等于 Community Score**：前者在用户私密资料和当天使用需求上计算；后者仅由审核后的产品级体验构成。联盟佣金、赞助和合作关系不能影响任何一项。

### 4. 新品、新品牌发现和更新

1. 由官方页面、授权 feed、合作 API 或已审批的公共来源发现候选；每个 source 必须记录合法基础、频率、责任人和品类范围。
2. Normalize 到文胸/丝袜各自 schema；质量规则检查核心字段、来源 URL、更新时间和版本。
3. 质量未达标进入 review queue，不写入公开资料；通过后保留 observation 与 version，再人工发布。
4. 价格、库存、尺码表和规格更改是“新 observation / version”，不是静默覆盖旧资料。

当前 `/api/ingestion/run` 只演示发现、规范化和质量报告；即使传入非 dry-run，也不会自动公开。这是对真实数据、站点条款和用户信任都必要的上线门槛。

## 运营边界和下一阶段

1. 先把现有 12 个文胸与 6 个丝袜 development records 迁移成已验证正式资料；每个品牌先拿到官方资料、授权 feed 或书面许可之一。
2. 建立管理后台：候选、字段差异、来源、负责人、审核决定和回滚记录必须可查。
3. 真实评分达到每个型号/版本的最小样本阈值前，只展示“样本不足”，不做排名或“最适合”强断言。
4. 接入定时任务时仅自动拉取、去重、diff 和提醒；公开动作保持人工审核，尤其是价格、库存、规格和新型号。
5. 正式上线前补齐地区隐私告知、导出/删除请求、保留期限、未成年人处理和法律/robots 审核。

## 资料状态声明

本项目中 Falke、Wolford、Sheertex、Spanx、Commando、Heist 等名字与所有价格、评分、库存、规格都只是开发演示映射；它们不是实时陈述，也不是购买推荐。正式运营必须重新抓取、标注来源、审核并按版本发布。
