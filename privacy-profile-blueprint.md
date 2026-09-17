# PerfectPair 用户资料与隐私蓝图

> 这是一份产品与工程设计说明，不代替面向实际运营地区的法律意见。

## 结论

用户资料不能被当作“越完整越好”的问卷。PerfectPair 的资料档案应当是：**可从极少信息开始、默认只供本人私密匹配、按用途分别同意、可修改而不改写历史、可导出和清除**。文胸与丝袜共享这些隐私原则，但各自收集真正有用的字段。

## 研究依据：观察与推论

| 观察到的正式原则 | 对 PerfectPair 的产品推论 |
| --- | --- |
| 加拿大隐私专员列出的 PIPEDA 原则包括明确用途、知情同意、限制收集、限制使用/保留、准确性、保障措施，以及个人访问和更正权。资料不得为不合理目的而收集。 [PIPEDA Fair Information Principles](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/) | 不把身高、围度、体重设为推荐的门槛；先说明每一项为何有用；用户可编辑当前资料、导出副本、清除资料。 |
| PIPEDA 进一步要求新用途获得新的同意，且不应把非必要的资料处理设为提供服务的条件。 [Limiting use, disclosure and retention](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_use/) | “私人匹配”与“匿名相似人群”和“汇总产品洞察”不能共用一个勾选框；后两项必须默认关闭并可随时撤回。 |
| ICO 的 privacy by design/default 指导把隐私放在设计起点，并强调数据最小化和目的限制。 [ICO guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/) | 不收集照片、body scan、外貌评分或与推荐无关的身份特征；资料页首先显示“谁能看到、用于什么、保存多少历史”。 |
| NIST Privacy Framework 用 Identify、Govern、Control、Communicate、Protect 五个方面管理数据处理带来的隐私风险。 [NIST Privacy Framework](https://www.nist.gov/privacy-framework/frequently-asked-questions) | 建立资料盘点、用途和同意记录、用户控制、清晰告知、访问控制及事件审计；不能只依赖前端的一句隐私文案。 |

## 用户资料应收集什么

### 文胸：从低敏感到可选细节

| 层级 | 字段 | 用途 | 默认状态 |
| --- | --- | --- | --- |
| 轻量起步 | 当前常用 band/cup、已知好穿/不好穿款、wire 偏好、优先项和问题 | 初步筛选与解释推荐 | 全部可跳过 |
| 可选调整 | underbust、standing/leaning bust、root width、projection | 给出更好的尺码起点与构造风险提示 | 不填也可使用 |
| 不收集 | 照片、身体扫描、外貌评价、真实姓名与推荐无关的身份资料 | 对匹配没有必要，风险高 | 永不收集 |

### 丝袜：独立于文胸的实用资料

| 层级 | 字段 | 用途 |
| --- | --- | --- |
| 轻量起步 | 常用尺码、透明/保暖偏好、腰头偏好、优先项、容易下滑/卷边/勒脚趾/勾丝等问题 | 匹配 denier、腰头、脚趾和耐用性 |
| 可选调整 | 身高、臀围、内腿长 | 改善长短和尺码起点；不作为外貌或身体评分 |
| 不收集 | 照片、体型标签、审美排名 | 与产品适配无关，也会增加不必要隐私风险 |

## 已完成的体验与数据机制

1. **默认私密**：新资料为空白，不再预填任何身体测量。用户可以只提供已知尺码或偏好。
2. **资料用途可见**：资料页把“其他人能看到什么、用于什么、保存多少历史”放到表单前面。
3. **两个独立同意**：匿名相似人群和汇总产品洞察均默认关闭；关闭或撤回不会影响用户自己的私密匹配。
4. **修改不覆盖历史**：每次真实变化会创建有日期的文胸或丝袜 snapshot。未来推荐使用当前资料，过去穿着/评价仍对应当时资料。
5. **用户控制**：可下载 JSON 数据副本；清除按钮需二次确认，删除本浏览器中的资料字段、历史和 Fit Diary，但保留用户主动收藏的产品清单。
6. **生产数据库边界**：新增私密偏好、丝袜资料快照、无敏感字段的同意审计、导出/删除请求表；全部采用 user-owned RLS policy。

## 上线前必须补齐

- 接入 Supabase Auth 与 server-side repository，禁止把敏感档案依赖在浏览器 localStorage 作为正式存储。
- 在服务端实现资料导出、删除请求、身份验证、数据保留期、审计记录和异常访问告警。
- 为每个市场确认适用法律、隐私通知、未成年人流程、cookie/analytics 同意和处理者协议。
- 对“匿名”设定最小群体阈值、去标识化规则、再识别风险审查；样本不足时不显示相似群体洞察。
- 不把资料、匹配分数或匿名洞察出售给品牌，也不允许赞助、广告或佣金改变个人匹配。
