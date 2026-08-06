# 开发步骤 - prism-mesh

> 创建时间：2026-07-16
> 当前阶段：项目初始化（/sainit-tool）

---

## 🏷 项目元信息（/sainit-* 阶段写入）

> ⚠️ 本节是后续所有 skill（safrontend/saapi/sabackend/saapi-connect）的**信息源**。请勿随意修改。

| 字段 | 值 |
|------|-----|
| **项目名（英文 / kebab-case）** | `prism-mesh` |
| **项目名（中文）** | PrismMesh |
| **项目类型** | saas |
| **工程模式** | 多工程 |
| **工程清单** | `web`（公众用户端）、`admin`（平台运营后台）、`enterprise`（企业后台） |
| **目录映射** | web → `prototype-web/` `frontend-web/`<br>admin → `prototype-admin/` `frontend-admin/`<br>enterprise → `prototype-enterprise/` `frontend-enterprise/` |
| **UI 风格** | D 商务专业风 |
| **核心功能** | 用户注册/登录、模型广场、API Key 管理、使用量&费用统计、个人中心/仪表盘 |
| **增值功能** | 模型在线 Playground、账单&充值、文档中心 |
| **生成的页面（web）** | index.html, home.html, models.html, playground.html, keys.html, stats.html, billing.html, docs.html, me.html |
| **生成的页面（admin）** | index.html, overview.html, users.html, models.html, keys.html, orders.html, reports.html, tickets.html, announcements.html, roles.html, logs.html, settings.html |
| **生成的页面（enterprise）** | index.html, overview.html, keys.html, dialogues.html, key-detail.html, usage.html, audit.html, members.html, settings.html |
| **Tab 配置（web）** | 首页 / 模型 / 统计 / 我的 |
| **localStorage 键名前缀** | web → `prismmesh:`<br>admin → `prismmesh-admin:`<br>enterprise → `prismmesh-ent:` |
| **占位图服务** | picsum + pravatar |
| **设计令牌文件** | web → `prototype-web/assets/css/tokens.css`<br>admin → `prototype-admin/assets/css/tokens.css`<br>enterprise → `prototype-enterprise/assets/css/tokens.css` |
| **公共 JS 文件** | web → `prototype-web/assets/js/common.js`<br>admin → `prototype-admin/assets/js/common.js`<br>enterprise → `prototype-enterprise/assets/js/common.js` |

### 工程 1：web（公众用户端）页面与功能映射

| 选中功能 | 生成的页面 | Tab |
|---------|----------|-----|
| 用户注册/登录 | `index.html` | ☐ |
| 仪表盘总览 | `home.html` | ☑ 首页 |
| 模型广场 | `models.html` | ☑ 模型 |
| 模型 Playground | `playground.html` | ☐ |
| API Key 管理 | `keys.html` | ☐ |
| 使用量 & 费用统计 | `stats.html` | ☑ 统计 |
| 账单 & 充值 | `billing.html` | ☐ |
| 文档中心 | `docs.html` | ☐ |
| 个人中心 | `me.html` | ☑ 我的 |

### 工程 2：admin（后台管理）页面与功能映射

| 选中功能 | 生成的页面 | 侧边栏分组 |
|---------|----------|-----------|
| 管理员登录 | `index.html` | - |
| 平台概览 | `overview.html` | 管理 |
| 用户管理 | `users.html` | 管理 |
| 模型管理 | `models.html` | 管理 |
| API Key 监管 | `keys.html` | 管理 |
| 订单/充值管理 | `orders.html` | 运营 |
| 用量统计报表 | `reports.html` | 运营 |
| 工单/客服管理 | `tickets.html` | 运营 |
| 公告管理 | `announcements.html` | 运营 |
| 角色权限管理 | `roles.html` | 系统 |
| 操作日志 | `logs.html` | 系统 |
| 系统设置 | `settings.html` | 系统 |

### 工程 3：enterprise（企业后台）页面与功能映射

| 选中功能 | 生成的页面 | 侧边栏分组 |
|---------|----------|-----------|
| 企业登录 | `index.html` | - |
| 企业概览 | `overview.html` | 总览 |
| API Key 管理（企业全部 Key） | `keys.html` | 管理 |
| 对话审计（AI 分类 + 项目/功能标签） | `dialogues.html` | 管理 |
| Key 详情（模型/次数/Token + 时间线 + 对话审计） | `key-detail.html` | 管理（Key 下钻） |
| 用量统计报表 | `usage.html` | 分析 |
| 调用审计日志 | `audit.html` | 分析 |
| 成员管理 | `members.html` | 企业 |
| 企业设置 | `settings.html` | 企业 |

### 后续 skill 读取指引

- **/safrontend**：读取本节获取项目名、UI 风格、页面清单；**多工程模式**下按「工程清单」与「目录映射」逐工程生成 `frontend-web/`、`frontend-admin/` 与 `frontend-enterprise/`
- **/saapi**：读取本节获取项目名（中文/英文）、项目类型、已有功能清单作为接口发现来源；`-admin` 工程含管理接口（用户管理/模型管理/订单管理/报表/公告/角色权限/日志等），`-enterprise` 工程含企业接口（企业 Key 管理/对话审计/Key 用量明细/调用审计/成员/企业设置等）
- **/sabackend**：读取本节获取项目中文名（用于推导数据库表前缀拼音）；多工程合并为统一 `backend/`
- **/saapi-connect**：按目录映射配对连接（`frontend-web/` ↔ `backend/`，`frontend-admin/` ↔ `backend/`，`frontend-enterprise/` ↔ `backend/`）

---

## 📚 参考项目：new-api

> 添加时间：2026-08-06  
> 用途：为 PrismMesh 的 API 中转站后端功能提供技术参考

### 基本信息

| 字段 | 值 |
|------|-----|
| **项目名称** | New API |
| **项目类型** | AI API 网关/代理平台（开源） |
| **本地路径** | `D:\Codes\new-api` |
| **代码仓库** | `github.com/QuantumNous/new-api`（基于 `Calcium-Ion/new-api` 的分支） |
| **技术栈** | Go 1.22+ (Gin) + PostgreSQL / SQLite / MySQL + Redis + React 19 |
| **分析文档** | `prism-mesh/new-api-analysis.md` |
| **项目约定** | `D:\Codes\new-api\AGENTS.md` |

### 与 PrismMesh 功能对照

| PrismMesh 功能 | new-api 对应模块 | 参考价值 |
|---------------|-----------------|---------|
| 用户注册/登录 | 认证系统（JWT + OAuth + Passkey + 2FA） | 四级角色体系、多 OAuth 提供商 |
| 模型广场 | 模型管理 + 40+ 供应商适配器 | 适配器模式（统一 OpenAI 格式） |
| API Key 管理 | Token 管理体系 | 配额/过期/IP 白名单/模型限制/分组隔离 |
| 使用量 & 费用统计 | 日志系统 + 配额看板 | 请求日志/错误日志/审计日志 |
| 账单 & 充值 | 计费系统 + 5 种支付方式 | 预扣费/后结算、层级定价、订阅制 |
| 在线 Playground | Relay 转发引擎 | 多格式转发（OpenAI/Claude/Gemini/SSE） |
| 后台用户管理 | 用户管理 + Casbin 权限 | 细粒度 RBAC、管理员审计 |
| 后台模型管理 | 模型 CRUD + 上游同步 | 定价配置、模型倍率 |
| 后台订单/充值 | 充值管理 + 兑换码 | 支付回调、兑换码并发安全 |
| 后台用量报表 | 数据看板 + 排名系统 | 多维度统计 |
| 后台角色权限 | Casbin 权限控制 | 资源级权限（Channel/User/Token/Log/Option） |
| 后台操作日志 | 日志系统 + 系统任务 | 独立日志库、自动清理 |
| 后台系统设置 | 配置管理器 | 数据库热更新、多模块配置 |
| 企业 Key 管理 | Token 管理 | 分组隔离、自动分组、跨分组重试 |
| 企业用量统计 | 日志统计 + 配额看板 | Token/通道级统计 |
| 企业调用审计 | 日志系统 | 按 Key 查询日志、错误追踪 |
| 企业成员管理 | 用户管理 | 角色分配 |

### 核心架构参考

| 模块 | new-api 实现 | PrismMesh 可借鉴 |
|------|------------|-----------------|
| **请求转发** | 适配器模式，`GetAdaptor(apiType)` 路由到 40+ 供应商 | 统一接入层设计 |
| **通道管理** | 多 Key 轮询、权重负载均衡、通道亲和性、自动故障转移 | 上游供应商调度 |
| **限流** | Redis Lua 固定窗口 + 内存限流，IP/用户/全局三级 | 多级限流策略 |
| **计费** | 预扣费 + 后结算，支持多级扣费优先级（Token → 用户 → 订阅） | 按量计费方案 |
| **缓存** | 内存 + Redis 双层缓存，定时同步，多节点策略同步 | 高性能缓存架构 |
| **部署** | 主从多节点，配置热更新，优雅关闭（SSE 等待） | 生产部署方案 |

### 后续 skill 读取指引

- **/saapi**：参考 `new-api-analysis.md` 的 API 端点清单（第 19 章）设计 PrismMesh 接口
- **/sabackend**：参考 new-api 的分层架构（Router → Controller → Service → Model）和 Casbin 权限模型
- **/saapi-platform**：参考 new-api 的平台级 API 设计（API Key 管理、SSE 流式响应、按量计费、OpenAI 兼容端点）

### 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| 2026-07-16 11:32 | 项目初始化 | 创建 STEPS.md + 写入项目元信息（web 工程） |
| 2026-08-04 14:53 | 项目初始化（/sainit-saas） | 新增 admin 后台管理工程：12 个页面（概览/用户/模型/Key/订单/报表/工单/公告/角色/日志/设置），更新为多工程模式 |
| 2026-08-04 15:20 | 项目初始化（/sainit-saas） | 新增 enterprise 企业后台工程：8 个页面（企业登录/概览/Key 管理/Key 详情/用量统计/调用审计/成员/设置），更新工程清单与目录映射 |
| 2026-08-06 14:00 | 技术调研 | 克隆并全面分析参考项目 new-api（D:\Codes\new-api），生成 `new-api-analysis.md`，写入 STEPS.md 参考项目章节与功能对照表 |
