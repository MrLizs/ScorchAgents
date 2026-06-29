---
name: "sainit"
description: "项目初始化路由器：识别用户描述的项目类型，并路由到对应的子 skill（sainit-dating / sainit-shop / sainit-blog / sainit-tool / sainit-other）。Invoke when 用户输入 /sainit 且未指定具体类型。"
---

# /sainit — 项目初始化路由器

## 触发条件

- 用户输入 `/sainit <项目描述>`（**未指定类型**）
- 例：`/sainit 我想要一个交友项目`
- 例：`/sainit 做一个在线商城`

> 💡 如果用户已明确类型，直接调用子 skill：
> - `/sainit-dating` — 交友类
> - `/sainit-shop` — 电商类
> - `/sainit-blog` — 博客类
> - `/sainit-tool` — 工具类

## 工作流程（仅路由，不做实质工作）

### Step 1：解析项目描述

从用户输入中提取**项目关键词**，去掉前缀（"我想要一个/做一个"等）。

### Step 2：识别项目类型

按以下关键词映射表识别：

| 关键词 | 类型 | 目标子 skill |
|--------|------|------------|
| 交友 / 相亲 / 社交 / 聊天 / 匹配 / 找对象 | **dating** | `sainit-dating` |
| 商城 / 电商 / 购物 / 商店 / 订单 / 商品 | **ecommerce** | `sainit-shop` |
| 博客 / 文章 / 资讯 / 笔记 / 阅读 / 专栏 | **blog** | `sainit-blog` |
| 待办 / 记账 / 工具 / 效率 / 提醒 / 清单 | **tool** | `sainit-tool` |
| 都不匹配 / 跨类型 / 全新领域 | **other** | `sainit-other` |

#### 识别结果处理

**情况 A：明确匹配到一种类型**
1. 告诉用户：「识别到「<类型>」类项目，正在切换到 `/sainit-<type>` 子 skill...」
2. **加载并执行** `.trae/skills/sainit-<type>/SKILL.md` 的全部工作流程
3. 后续不再由本 skill 处理，由子 skill 接管

**情况 B：匹配到多个类型（如"社交电商"）**
1. 用 `AskUserQuestion` 让用户选择主要类型
2. 根据选择加载对应子 skill

**情况 C：未匹配到任何已知类型**
1. 用 `AskUserQuestion` 展示 5 个类型供用户选择（含"其他 / 通用模板"）
2. 若选"其他" → **加载并执行** `.trae/skills/sainit-other/SKILL.md` 的全部工作流程
3. `sainit-other` 提供通用 5 页骨架（`index + home + list + detail + me`）、2 Tab（首页 / 我的）、通用 3 个 localStorage 键（`user` / `token` / `settings`）

### Step 3：传递项目上下文

将以下信息传递给子 skill：
- 项目描述原文
- 已提取的项目名（如未提取，提示用户在子 skill 中确认）

子 skill 负责后续所有工作：
- UI 风格选择
- 功能清单确认
- 页面映射与生成
- 输出最终结果

## 输出示例

```
🔍 识别项目类型...

✅ 识别到「交友」类项目

📦 正在切换到 /sainit-dating 子 skill...
```

随后由子 skill 接管，输出完整的项目初始化结果。

## 注意事项

- ⚠️ **本 skill 只做路由**：识别类型后立即移交，不做任何风格/功能/生成工作
- ⚠️ **关键词匹配失败**：必须用 AskUserQuestion 让用户选，不要猜
- ⚠️ **子 skill 完整自包含**：所有通用模板（CSS、JS、HTML 结构）都在子 skill 内，不需要回头读本 skill
- ⚠️ **新增类型**：要新增类型时，建一个 `sainit-<type>/SKILL.md` 子 skill，并在上方映射表中加一行即可
- ⚠️ **STEPS.md 由子 skill 创建**：本路由 skill 不创建 STEPS.md，统一由子 skill 在 Step 5.5（创建项目元信息节）创建

## 统一 STEPS.md 元信息节（子 skill 必写）

> 📌 **所有 `sainit-*` 子 skill 在完成 prototype 生成后，必须在项目根目录创建 `STEPS.md`（若已存在则追加），并写入如下「项目元信息」节**。后续 `/safrontend`（读取前端选型）、`/saapi`（读取项目名/类型）、`/sabackend`（读取命名规范）都依赖此节。

```markdown
# 开发步骤 - <项目英文名>

> 创建时间：YYYY-MM-DD
> 当前阶段：项目初始化（/sainit-*）

---

## 🏷 项目元信息（/sainit-* 阶段写入）

> ⚠️ 本节是后续所有 skill（safrontend/saapi/sabackend/saapi-connect）的**信息源**。请勿随意修改。

| 字段 | 值 |
|------|-----|
| **项目名（英文 / kebab-case）** | `<project-name>` |
| **项目名（中文）** | `<用户填>` |
| **项目类型** | <dating \| shop \| blog \| tool> |
| **UI 风格** | <A 简约清新 \| B 霓虹灯风格 \| C 温馨治愈 \| D 商务专业 \| E 复古文艺> |
| **核心功能** | <已选功能列表> |
| **增值功能** | <已选功能列表> |
| **生成的页面** | <已生成的 HTML 文件名清单> |
| **Tab 配置** | <Tab 列表> |
| **localStorage 键名前缀** | `<projectName>:` |
| **占位图服务** | <picsum + pravatar> |
| **设计令牌文件** | `prototype/assets/css/tokens.css` |
| **公共 JS 文件** | `prototype/assets/js/common.js` |

### 页面与功能映射

| 选中功能 | 生成的页面 | Tab |
|---------|----------|-----|
| <功能 1> | `<file>.html` | ☐ |
| <功能 2> | `<file>.html` | ☑ |
| ... | ... | ... |

### 后续 skill 读取指引

- **/safrontend**：读取本节获取项目名、UI 风格、页面清单；前端框架与 TS/JS 由 safrontend 阶段询问用户
- **/saapi**：读取本节获取项目名（中文/英文）、项目类型、已有功能清单作为接口发现来源
- **/sabackend**：读取本节获取项目中文名（用于推导数据库表前缀拼音）
- **/saapi-connect**：间接依赖（通过 sabackend 写入的命名规范）

### 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| YYYY-MM-DD HH:mm | 项目初始化 | 创建 STEPS.md + 写入项目元信息 |
```

> 📌 **子 skill 必填项**（无默认值，必须从用户输入获取）：
> - 项目名（中文）— 反问时单独追问，不从英文名推断
> - 项目类型 — 由路由 skill 决定，子 skill 已知
> - UI 风格 — Step 2 反问结果
> - 核心/增值功能 — Step 3 反问结果
> - 生成的页面 — Step 4 映射表结果

## 已支持的子 skill

| 子 skill | 类型 | 状态 |
|---------|------|------|
| `/sainit-dating` | 交友/社交 | ✅ |
| `/sainit-shop` | 电商/商城 | ✅ |
| `/sainit-blog` | 博客/内容 | ✅ |
| `/sainit-tool` | 工具/效率 | ✅ |
| `/sainit-other` | 通用/兜底 | ✅ |

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-06-29-1 | 初始化「修改记录（skill 自身演进）」section；约定时间格式为「年-月-日-当天变动次数」；AI 写入前必须用 PowerShell `Get-Date -Format "yyyy-MM-dd"` 校准北京时间；变动次数 N 按「该 skill 文件落地次数」自增（同一天多次改动依次为 1,2,3...） |

---

## 关联 Skill

- `sainit-dating` / `sainit-shop` / `sainit-blog` / `sainit-tool` / `sainit-other` — 子 skill
- `frontend-design` — 高保真 UI（子 skill 内部使用）
- `color-font-skill` — 配色字体（子 skill 内部使用）