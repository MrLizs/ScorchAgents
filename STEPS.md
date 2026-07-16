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
| **项目类型** | tool |
| **UI 风格** | D 商务专业风 |
| **核心功能** | 用户注册/登录、模型广场、API Key 管理、使用量&费用统计、个人中心/仪表盘 |
| **增值功能** | 模型在线 Playground、账单&充值、文档中心 |
| **生成的页面** | index.html, home.html, models.html, playground.html, keys.html, stats.html, billing.html, docs.html, me.html |
| **Tab 配置** | 首页 / 模型 / 统计 / 我的 |
| **localStorage 键名前缀** | `prismcore:` |
| **占位图服务** | picsum + pravatar |
| **设计令牌文件** | `prototype/assets/css/tokens.css` |
| **公共 JS 文件** | `prototype/assets/js/common.js` |

### 页面与功能映射

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

### 后续 skill 读取指引

- **/safrontend**：读取本节获取项目名、UI 风格、页面清单；前端框架与 TS/JS 由 safrontend 阶段询问用户
- **/saapi**：读取本节获取项目名（中文/英文）、项目类型、已有功能清单作为接口发现来源
- **/sabackend**：读取本节获取项目中文名（用于推导数据库表前缀拼音）
- **/saapi-connect**：间接依赖（通过 sabackend 写入的命名规范）

### 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| 2026-07-16 11:32 | 项目初始化 | 创建 STEPS.md + 写入项目元信息 |
