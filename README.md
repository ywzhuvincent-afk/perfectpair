# PerfectPair — 文胸与丝袜独立资料库

PerfectPair 是一个文胸与丝袜的私密穿着决策平台：用可选、可修改的个人资料帮助用户筛选产品，同时用来源核验、审核和发布流程建设可信的产品目录。

线上站点：[perfectpair-theta.vercel.app](https://perfectpair-theta.vercel.app/)
管理后台：[perfectpair-theta.vercel.app/admin](https://perfectpair-theta.vercel.app/admin)

## 当前完成情况

- 正式资料库：5 款文胸 + 5 款丝袜，均保留官方事实来源；
- 数据库：Supabase 独立 `perfectpair` schema；
- 后台：候选录入、来源/版权核验、审核与发布已可用；
- 自动化：每日候选更新及价格刷新任务已配置，任务只创建候选、不自动发布；
- 隐私：MVP 私密资料默认本地保存，可跳过、修改和重置。

## 完整项目文档

[PROJECT.md](PROJECT.md) 是当前项目的完整交接与运营说明，包含：

- 四大核心板块和真实完成状态；
- 用户资料、隐私、匹配与评分原则；
- 品牌/产品资料库、版权边界、候选审核和发布规则；
- 自动更新、用户补全和运营流程；
- 技术架构、环境变量、数据库安全部署、已知限制与后续优先级；
- 所有研究和策略文档的索引。

## 本地启动

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

提交前运行：

```powershell
npm run lint
npm run build
```

真实密钥只能放在 `.env.local` 和 Vercel 的加密环境变量中，不能提交到 GitHub。共享 Supabase 项目的安全部署方法见 [supabase/shared-project/README.md](supabase/shared-project/README.md)。
