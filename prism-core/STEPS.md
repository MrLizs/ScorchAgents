# 开发步骤 - prism-core

> 创建时间：2026-07-16
> 当前阶段：项目初始化（/sainit-tool）

---

## 🏷 项目元信息（/sainit-* 阶段写入）

> ⚠️ 本节是后续所有 skill（safrontend/saapi/sabackend/saapi-connect）的**信息源**。请勿随意修改。

| 字段 | 值 |
|------|-----|
| **项目名（英文 / kebab-case）** | `prism-core` |
| **项目名（中文）** | PrismCore |
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
| **localStorage 键名前缀** | web → `prismcore:`<br>admin → `prismcore-admin:`<br>enterprise → `prismcore-ent:` |
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

### 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| 2026-07-16 11:32 | 项目初始化 | 创建 STEPS.md + 写入项目元信息（web 工程） |
| 2026-08-04 14:53 | 项目初始化（/sainit-saas） | 新增 admin 后台管理工程：12 个页面（概览/用户/模型/Key/订单/报表/工单/公告/角色/日志/设置），更新为多工程模式 |
| 2026-08-04 15:20 | 项目初始化（/sainit-saas） | 新增 enterprise 企业后台工程：8 个页面（企业登录/概览/Key 管理/Key 详情/用量统计/调用审计/成员/设置），更新工程清单与目录映射 |
