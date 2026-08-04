# PrismCore

> 一站式 AI 模型推理平台 · 高性能 · 低成本 · 易集成

## 页面清单

| 页面 | 文件 |
|------|------|
| 启动 + 登录/注册 | `prototype-web/index.html` |
| 仪表盘 | `prototype-web/home.html` |
| 模型广场 | `prototype-web/models.html` |
| 在线 Playground | `prototype-web/playground.html` |
| API Key 管理 | `prototype-web/keys.html` |
| 使用统计 | `prototype-web/stats.html` |
| 账单与充值 | `prototype-web/billing.html` |
| 文档中心 | `prototype-web/docs.html` |
| 个人中心 | `prototype-web/me.html` |

## 本地预览

双击 `prototype-web/index.html` 在浏览器中打开，使用示例账号登录体验。

示例账号：`demo@prismcore.ai` / 密码任意（6位以上）

---

## 后台管理系统（`prototype-admin/`）

平台运营管理后台，面向管理员 / 运营 / 财务角色。

| 页面 | 文件 |
|------|------|
| 管理员登录 | `prototype-admin/index.html` |
| 平台概览 | `prototype-admin/overview.html` |
| 用户管理 | `prototype-admin/users.html` |
| 模型管理 | `prototype-admin/models.html` |
| API Key 监管 | `prototype-admin/keys.html` |
| 订单/充值管理 | `prototype-admin/orders.html` |
| 用量统计报表 | `prototype-admin/reports.html` |
| 工单/客服管理 | `prototype-admin/tickets.html` |
| 公告管理 | `prototype-admin/announcements.html` |
| 角色权限管理 | `prototype-admin/roles.html` |
| 操作日志 | `prototype-admin/logs.html` |
| 系统设置 | `prototype-admin/settings.html` |

### 后台预览

双击 `prototype-admin/index.html` 登录体验。

演示账号：`admin@prismcore.ai` / `admin123`

---

## 企业后台（`prototype-enterprise/`）

面向企业客户的**企业控制台**，企业管理员可自助管理企业全部 API Key、查看每个 Key 的模型调用情况与 Token 消耗，并按时间审计每个 Key 做了什么。

| 页面 | 文件 |
|------|------|
| 企业登录 | `prototype-enterprise/index.html` |
| 企业概览 | `prototype-enterprise/overview.html` |
| API Key 管理（企业全部 Key） | `prototype-enterprise/keys.html` |
| 对话审计（AI 分类 + 项目/功能标签） | `prototype-enterprise/dialogues.html` |
| Key 详情（模型/次数/Token + 时间线 + 对话审计） | `prototype-enterprise/key-detail.html` |
| 用量统计报表（按模型 / Key） | `prototype-enterprise/usage.html` |
| 调用审计日志（Key 何时做了什么） | `prototype-enterprise/audit.html` |
| 成员管理 | `prototype-enterprise/members.html` |
| 企业设置 | `prototype-enterprise/settings.html` |

### 企业后台预览

双击 `prototype-enterprise/index.html` 登录体验。

演示账号：`admin@acmecorp.com` / `ent123`
