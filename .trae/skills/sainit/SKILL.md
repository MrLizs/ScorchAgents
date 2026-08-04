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
| SaaS / API 平台 / 开发者平台 / 模型平台 / 云服务 / 开放平台 / AI 平台 | **saas** | `sainit-saas` |
| 都不匹配 / 跨类型 / 全新领域 | **other** | `sainit-other` |

#### 识别结果处理

**情况 A：明确匹配到一种类型**
1. 告诉用户：「识别到「<类型>」类项目，正在切换到 `/sainit-<type>` 子 skill...」
2. **加载并执行** `.trae/skills/sainit-<type>/SKILL.md` 的全部工作流程
3. 后续不再由本 skill 处理，由子 skill 接管

**情况 B：匹配到多个类型（如"社交电商"，跨类型项目）**
1. **自动路由到 `/sainit-other` 子 skill**，不再询问用户
2. 直接加载并执行 `.trae/skills/sainit-other/SKILL.md` 的全部工作流程
3. 由 `sainit-other` 提供通用 5 页骨架（`index + home + list + detail + me`）承接跨类型场景

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

## 多工程目录命名规范

> 📌 **背景**：复杂项目可能包含多个"工程"（如 SaaS 平台同时有面向用户的 Web 端、开发者控制台、后台管理面板）。当项目涉及多个工程时，`prototype/`、`frontend/`、`backend/` 等目录应带清晰的后缀标识，避免所有产物堆在同一个扁平目录中。

### 何时启用多工程目录

| 场景 | 是否需要多目录 | 典型工程 |
|------|-------------|---------|
| 单一用户端（电商、交友、博客、工具） | ❌ 不需要 | `prototype/` `frontend/` `backend/`（保持现有扁平命名） |
| SaaS 平台（落地页 + 控制台 + 管理后台） | ✅ 需要 | `prototype-web/` `prototype-console/` `prototype-admin/` |
| 多端应用（Web + 移动端 + 桌面端） | ✅ 需要 | `prototype-web/` `mobile/` `desktop/`（跨端由 sacrossplatform/sadesktop 生成，不在此列） |
| 有独立商家端（如电商平台含商家后台） | ✅ 需要 | `prototype-shop/` `prototype-merchant/` |
| 用户端 + 运营后台 | ✅ 需要 | `prototype-app/` `prototype-admin/` |

> 💡 **判断标准**：如果不同角色看到的页面完全不同（不同导航、不同功能集、不同认证方式），就应该拆分为独立工程目录。同一角色下的不同页面（如电商的首页/详情/购物车/订单）仍在同一个 `prototype/` 目录内。

### 目录命名后缀规范

| 后缀 | 含义 | 典型角色 | 示例 |
|------|------|---------|------|
| `-web` | 面向公众的 Web 端（落地页、文档等） | 访客 / 未登录用户 | `prototype-web/` `frontend-web/` |
| `-app` | 面向核心用户的 Web 应用端 | 普通用户（登录后） | `prototype-app/` `frontend-app/` |
| `-console` | 开发者控制台（SaaS 平台专属） | 注册开发者 | `prototype-console/` `frontend-console/` |
| `-admin` | 后台管理面板 | 管理员 / 运营 | `prototype-admin/` `frontend-admin/` |
| `-merchant` | 商家端（电商平台） | 商家 / 店主 | `prototype-merchant/` `frontend-merchant/` |
| `-client` | 客户端（SDK 示范 / 嵌入式） | 集成方开发者 | `prototype-client/` |

### 多目录下的项目结构

启用多工程目录后，每个工程独立拥有完整的前端/后端子目录，**共享** `api/` 接口规范：

```
<project-name>/
├── README.md
├── STEPS.md                           # 统一追踪（含多工程元信息）
├── api/                               # 共享：所有工程共用接口规范
│   ├── openapi.yaml
│   └── API.md
├── prototype-web/                     # 工程 1：公众 Web 端原型
│   ├── index.html
│   └── assets/
├── prototype-console/                 # 工程 2：开发者控制台原型
│   ├── dashboard.html
│   └── assets/
├── prototype-admin/                   # 工程 3：后台管理原型
│   ├── index.html
│   └── assets/
├── frontend-web/                      # 工程 1：公众 Web 端前端
├── frontend-console/                  # 工程 2：开发者控制台前端
├── frontend-admin/                    # 工程 3：后台管理前端
├── backend-web/                       # 工程 1：公众 Web 端后端
├── backend-console/                   # 工程 2：控制台后端（可合并为 backend/）
└── backend/                           # 或：统一后端（多个 frontend-* 共享一个 backend/）
```

> 💡 **后端合并建议**：多个前端工程通常共享同一个后端服务（一套用户系统、一套数据库），此时可用统一的 `backend/` 目录而非拆分。仅当不同工程的认证体系、部署环境完全独立时，才拆分为 `backend-web/`、`backend-admin/` 等。

### 子 skill 实施要求

1. **sainit-* 子 skill**：在 Step 2（反问 UI 风格）之后、Step 3（反问功能）之前，**若项目类型可能涉及多工程**（尤其是 `sainit-saas`），必须增加一个反问步骤：

   > 本项目的功能涉及多个不同角色的使用场景。是否需要拆分为独立工程目录？
   > - **A. 拆分为独立工程**（如 Web 端 + 控制台 + 管理后台，各自独立 prototype）
   > - **B. 合并在一起**（所有页面放在一个 prototype/ 中，通过页面内 Tab/导航区分角色）

   - 选 A → 进入多工程模式，后续每个工程独立执行完整的 Step 2-8 流程
   - 选 B → 按现有单工程模式执行

2. **STEPS.md 元信息节**：多工程模式下，每个工程单独记录一条元信息（含独立的"生成的页面"和"Tab 配置"）。项目级元信息增加"工程清单"行：

   ```markdown
   | **工程清单** | `web`（公众端）、`console`（控制台）、`admin`（管理后台） |
   | **目录映射** | web → `prototype-web/` `frontend-web/` `backend-web/`<br>console → `prototype-console/` `frontend-console/`<br>admin → `prototype-admin/` `frontend-admin/` |
   ```

3. **safrontend / sabackend / saapi-connect**：识别 STEPS.md 中的"工程清单"与"目录映射"，按工程逐个生成代码。若后端合并（统一 `backend/`），sabackend 只执行一次。

### 向后兼容

- 现有单工程项目（`prototype/`、`frontend/`、`backend/` 等扁平命名）**完全不受影响**
- 下游 skill（safrontend、saapi、sabackend、saapi-connect、sacrossplatform、sadesktop）读取 STEPS.md 的"工程清单"字段来判断是单工程还是多工程模式
- 若"工程清单"字段不存在 → 回退到单工程模式（向后兼容）

## 统一行为：所有子 skill 在 prototype 完成后必须分流（Step 7）

> 📌 **本节是路由与子 skill 的契约**。所有 `sainit-*` 子 skill 在 `prototype/` 生成完毕 + `STEPS.md` 写入完毕 + `README.md` 写入完毕之后，**必须先执行 Step 6.5「自动预览 prototype」（自动打开浏览器预览），再执行 Step 7「原型后续流程选择（用户分流）」**，直接以对话形式询问用户下一步是「重新设计」还是「开始前端开发」。

### 子 skill 的 Step 7 固定选项

| 选项 | 动作 | 对应 skill |
|------|------|-----------|
| A | 高保真 UI 重做 | `frontend-design` |
| B | UI/UX 设计智能（设计令牌 + 微文案 + 可访问性） | `ui-ux-pro-max` |
| C | 全栈前端（含媒体资产生成 + 高阶 motion + 转化文案） | `frontend-dev` |
| D | 配色 + 字体调优 | `color-font-skill` |
| E | PPT/视觉风格统一（radius / spacing / 组件风格令牌） | `design-style-skill` |
| F | **不再设计，直接进入前端代码开发**（默认推荐） | `safrontend` |

### 链式调用（叠加修改）

- 选 A~E → 加载对应设计 skill → 设计完成后**回到 Step 7 再次询问**
- 选 F → 移交 `safrontend`，本路由链路结束
- A~E 可多次循环（如先 `color-font-skill` 改配色 → 再 `frontend-design` 重做 → 最后 `safrontend`）

### 设计 skill 与 prototype/ 的关系

- 设计 skill **基于已生成的 `prototype/` + `STEPS.md` 项目元信息**进行迭代
- **不要清空 `prototype/`**——设计 skill 会原地优化或新增文件（设计 skill 内部应自己处理差异）

> ⚠️ **本路由 skill 不直接执行分流**——分流细节全部由子 skill 在 Step 7 实现。本路由 skill 仅在此处声明该契约，避免子 skill 各自遗忘。

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
| **项目类型** | <dating \| shop \| blog \| tool \| saas> |
| **工程模式** | <单工程 \| 多工程>（单工程时此项省略，仅多工程时填写） |
| **工程清单** | <`web`（公众端）、`console`（控制台）、`admin`（管理后台）……多工程时必填> |
| **目录映射** | <web → `prototype-web/` `frontend-web/`<br>console → `prototype-console/` `frontend-console/`<br>……多工程时必填> |
| **UI 风格** | <A 简约清新 \| B 霓虹灯风格 \| C 温馨治愈 \| D 商务专业 \| E 复古文艺 \| A 科技蓝 \| ……> |
| **核心功能** | <已选功能列表> |
| **增值功能** | <已选功能列表> |
| **生成的页面** | <已生成的 HTML 文件名清单> |
| **Tab 配置** | <Tab 列表> |
| **localStorage 键名前缀** | `<projectName>:` |
| **占位图服务** | <picsum + pravatar> |
| **设计令牌文件** | `prototype/assets/css/tokens.css`（多工程时按目录映射列出各工程的 tokens.css 路径） |
| **公共 JS 文件** | `prototype/assets/js/common.js`（多工程时按目录映射列出各工程的 common.js 路径） |

### 页面与功能映射

| 选中功能 | 生成的页面 | Tab |
|---------|----------|-----|
| <功能 1> | `<file>.html` | ☐ |
| <功能 2> | `<file>.html` | ☑ |
| ... | ... | ... |

### 后续 skill 读取指引

- **/safrontend**：读取本节获取项目名、UI 风格、页面清单；前端框架与 TS/JS 由 safrontend 阶段询问用户。**多工程模式下**按「工程清单」与「目录映射」逐工程生成 `frontend-{suffix}/` 目录
- **/saapi**：读取本节获取项目名（中文/英文）、项目类型、已有功能清单作为接口发现来源。**多工程模式**下按工程后缀分别识别接口范围（如 `-console` 工程含开发者接口，`-admin` 工程含管理接口）
- **/sabackend**：读取本节获取项目中文名（用于推导数据库表前缀拼音）。**多工程模式**下若后端合并（统一 `backend/`）则只执行一次，若拆分则按目录映射逐工程生成
- **/saapi-connect**：间接依赖（通过 sabackend 写入的命名规范）。**多工程模式**下按目录映射配对连接（如 `frontend-web/` ↔ `backend/`，`frontend-console/` ↔ `backend/`）

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
| `/sainit-saas` | SaaS/API 平台 🆕 | ✅ |
| `/sainit-other` | 通用/兜底 | ✅ |

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-06-29-1 | 初始化「修改记录（skill 自身演进）」section；约定时间格式为「年-月-日-当天变动次数」；AI 写入前必须用 PowerShell `Get-Date -Format "yyyy-MM-dd"` 校准北京时间；变动次数 N 按「该 skill 文件落地次数」自增（同一天多次改动依次为 1,2,3...） |
| 2026-06-29-2 | 新增「统一行为：所有子 skill 在 prototype 完成后必须分流（Step 7）」契约节；约定子 skill 在 prototype + STEPS.md + README.md 写完后，必须用 AskUserQuestion 让用户在 A~E（重新设计 5 个设计 skill） / F（直接进 safrontend）之间做选择；声明 A~E 可链式循环、不要清空 prototype/ |
| 2026-08-04-1 | 新增「多工程目录命名规范」节：定义何时启用多工程目录（SaaS 多角色/电商商家端等场景）、目录命名后缀规范（`-web`/`-app`/`-console`/`-admin`/`-merchant`/`-client`）、多目录项目结构示例、子 skill 实施要求（sainit-saas 增加 Step 2.5 反问工程拆分）、STEPS.md 元信息节新增「工程模式」「工程清单」「目录映射」字段；更新核心链路关联 Skill 表适配多工程产出；更新后续 skill 读取指引（safrontend/saapi/sabackend/saapi-connect 按多工程模式分支说明）；向后兼容单工程现有扁平命名

---

## 关联 Skill

### 核心链路（按执行顺序）

| Skill | 阶段 | 产出 |
|-------|------|------|
| `sainit-*` | 原型生成 | `prototype/`（单工程）或 `prototype-{web,console,admin}/`（多工程） + `STEPS.md` 项目元信息 |
| `safrontend` | Web 前端 | `frontend/`（单工程）或 `frontend-{suffix}/`（多工程）（Vue 3 / React 18） |
| `saapi` | 消费者 API 设计 | `api/openapi.yaml`（所有工程共享） |
| `sabackend` | 后端实现 | `backend/`（单工程或多工程合并后端）或 `backend-{suffix}/`（多工程拆分后端） |
| `saapi-connect` | 前后端接通 | 环境变量 + JWT + 错误处理（多工程时按目录映射逐对连接） |

> 📌 **多工程目录映射示例**：SaaS 平台拆分为 `prototype-web/` + `prototype-console/` + `prototype-admin/` → frontend 对应生成 `frontend-web/` + `frontend-console/` + `frontend-admin/` → 统一后端 `backend/`。详见上方「多工程目录命名规范」节。

### API 平台扩展（核心链路后，构建 SaaS/API 平台专用）

| Skill | 场景 | 产出 |
|-------|------|------|
| `saapi-platform` | 平台级 API 设计（API Key / SSE 流式 / 按量计费 / OpenAI 兼容） | `api/platform-openapi.yaml` + `api/streaming-extensions.yaml` + `api/gateway-spec.yaml` |
| `sainference` | 模型推理集成（对接 vLLM / TGI / Ollama / Triton） | `inference/` + 自动填充 gateway-spec.yaml upstreams |

### 跨平台扩展（核心链路后可选）

| Skill | 场景 | 产出 |
|-------|------|------|
| `sacrossplatform` | Web → iOS + Android App | `mobile/`（uni-app / Expo / Taro / Flutter） |
| `sadesktop` | Web → Windows + macOS + Linux 桌面应用 | `desktop/`（Electron / Tauri） |
| `sanative-bridge` | 原生能力封装（相机/定位/推送等） | `mobile/src/native/` 或 `desktop/src/native/` |

### 设计迭代（原型阶段可用）

- `frontend-design` — 高保真 UI
- `color-font-skill` — 配色字体
- `ui-ux-pro-max` — UI/UX 设计智能
- `frontend-dev` — 全栈前端
- `design-style-skill` — PPT/视觉风格统一