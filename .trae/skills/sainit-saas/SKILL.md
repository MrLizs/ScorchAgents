---
name: "sainit-saas"
description: "初始化一个 SaaS/API 平台类软件项目的产品原型（如 AI 模型平台、开发者工具平台、API 服务）。Invoke when /sainit 路由到 SaaS 类型，或用户直接调用 /sainit-saas。会创建 prototype/ 目录、按功能生成多页 HTML 原型（含落地页、开发者控制台、Playground、API Key 管理、计费、文档等 SaaS 专属页面）。"
---

# /sainit-saas — SaaS/API 平台项目初始化

## 触发条件

- 由 `/sainit` 主 skill 路由而来（识别到"SaaS/API平台/开发者平台/模型平台/云服务"等关键词）
- 用户直接调用：`/sainit-saas <项目描述>`

## 工作流程

### Step 1：解析项目描述 & 创建项目目录

1. 提取项目关键词 → kebab-case 英文名
2. 创建目录结构：

**默认单工程模式**（所有页面在一个 prototype/ 内）：

```
<project-name>/
├── README.md
└── prototype/
    ├── index.html              # 落地页（Hero + 特性 + 定价 + CTA）
    ├── dashboard.html           # 开发者控制台（Tab）
    ├── playground.html          # 模型/API Playground
    ├── keys.html                # API Key 管理
    ├── billing.html             # 用量 + 计费
    ├── docs.html                # API 文档
    ├── me.html                  # 账户设置（Tab）
    └── assets/
        ├── css/
        │   ├── tokens.css
        │   ├── components.css
        │   └── pages.css
        ├── js/common.js
        └── img/
```

**推荐多工程模式**（SaaS 平台通常涉及多角色，按「公众 Web 端 + 开发者控制台 + 后台管理」拆分）：

```
<project-name>/
├── README.md
├── prototype-web/              # 工程 1：公众 Web 端（落地页 + 文档）
│   ├── index.html              # 落地页（Hero + 特性 + 定价 + CTA）
│   ├── docs.html               # API 文档
│   └── assets/{css,js,img}/
├── prototype-console/          # 工程 2：开发者控制台
│   ├── index.html              # 登录/注册
│   ├── dashboard.html          # 控制台概览（Tab）
│   ├── playground.html         # API Playground（Tab）
│   ├── keys.html               # API Key 管理
│   ├── billing.html            # 用量 + 计费
│   └── assets/{css,js,img}/
└── prototype-admin/            # 工程 3：后台管理（可选）
    ├── index.html              # 管理员登录
    ├── overview.html           # 平台概览
    ├── users.html              # 用户管理
    ├── models.html             # 模型管理
    └── assets/{css,js,img}/
```

> 💡 **多工程 vs 单工程**：Step 2（UI 风格）后反问用户选择。判断依据见主 skill `sainit/SKILL.md` 的「多工程目录命名规范」节。

### Step 2：反问 UI 风格（5 选 1）

| 选项 | 风格 | 典型色系 |
|------|------|---------|
| A | **科技蓝（推荐）** | 深蓝底 + 渐变蓝紫 + 白字 |
| B | 暗黑极简 | 纯黑底 + 亮色点缀 |
| C | 清新白 | 白底 + 品牌蓝 + 大量留白 |
| D | 商务专业 | 深蓝 + 灰白 |
| E | 紫黑科技 | 深紫黑 + 霓虹青 |

### Step 2.5：反问工程拆分（SaaS 专属）

> 📌 **本步骤为 SaaS 项目强制步骤**。由于 SaaS 平台天然涉及多角色（访客/开发者/管理员），需要在 UI 风格确认后询问是否拆分为多工程目录。

使用 `AskUserQuestion`：

> 本项目涉及多个不同角色（公众访客、注册开发者、平台管理员）。是否需要拆分为独立工程目录？
> - **A. 拆分为独立工程（推荐）** → `prototype-web/`（公众端）+ `prototype-console/`（开发者控制台）+ `prototype-admin/`（后台管理）
>   - 优点：各角色独立开发、独立部署、目录清晰
> - **B. 合并在一起** → 所有页面放在 `prototype/` 中，通过页面内 Tab/导航区分角色
>   - 优点：结构简单、开发快速

- 选 A → 多工程模式，按下方「推荐多工程模式」目录结构生成，后续 Step 3 按工程分别反问功能
- 选 B → 单工程模式，保持 `prototype/` 扁平结构

### Step 3：反问功能需求（多选）

**核心功能**（必选）：
1. 落地页（Hero + 特性 + 定价）
2. 用户注册 / 登录（邮箱或 GitHub）
3. 开发者控制台（Dashboard）
4. API Key 管理（创建/查看/删除/轮换）
5. API 文档 / 参考

**增值功能**（可选）：
6. API Playground（在线调试）
7. 用量统计 + 账单
8. 模型/服务列表（如适用）
9. 团队/组织管理
10. Webhook / 通知设置

### Step 4：功能 → 页面映射

| 选中功能 | 生成页面 | Tab |
|---------|---------|-----|
| 注册/登录 | `index.html`（内含登录/注册表单） | ❌ |
| 落地页 | `index.html`（Hero + 特性 + 定价） | ❌ |
| 开发者控制台 | `dashboard.html`（概览 + 快速开始） | ✅ |
| API Key 管理 | `keys.html` | ❌ |
| API Playground | `playground.html` | ✅ |
| 用量 + 账单 | `billing.html` | ❌ |
| API 文档 | `docs.html` | ✅ |
| 账户设置 | `me.html` | ✅ |

**Tab 配置**：控制台 / Playground / 文档 / 我的（4 个）

### Step 4.5：页面 & 按钮完整性自检

- [ ] 每个选中功能都有对应页面
- [ ] 每个页面的入口按钮 / 链接已规划
- [ ] 每个入口都指向已生成的页面
- [ ] Tab 配置覆盖所有 Tab 页面
- [ ] 无悬空入口 / 死链

### Step 5：生成文件

#### 5.0 完整性铁律

- 每个按钮必有行为：onclick / href / 提交，必有其一
- 每个交互必有反馈：loading、toast、状态切换，必有其一
- 每条数据必有闭环：新增 → 展示 → 编辑 → 删除，全链路通
- 每个页面必有结构：标题区、主体区、操作区、底部 Tab（如适用）
- 每个跳转必有目标：href 指向已生成的 HTML，不留死链

#### 5.1 `assets/css/tokens.css`（默认 A 科技蓝）

```css
:root {
  /* 默认：A 科技蓝（适合 AI/SaaS 平台） */
  --primary: #4F6EF7;              /* 品牌蓝 */
  --primary-soft: #EEF1FE;
  --primary-gradient: linear-gradient(135deg, #4F6EF7 0%, #7C5CFC 100%);
  --accent: #10B981;               /* 成功绿 */
  --accent-soft: #D1FAE5;
  --warning: #F59E0B;
  --danger: #EF4444;
  --bg: #F8FAFC; --surface: #FFFFFF;
  --bg-dark: #0F172A;              /* 深色区域背景 */
  --text: #1E293B; --text-sub: #64748B; --text-light: #F1F5F9;
  --border: #E2E8F0; --border-light: rgba(255,255,255,0.1);
  --radius-sm: 6px; --radius: 10px; --radius-lg: 16px;
  --shadow: 0 4px 16px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 40px rgba(79, 110, 247, 0.12);
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

  /* ===== 响应式断点 ===== */
  --bp-sm: 640px; --bp-md: 768px; --bp-lg: 1024px; --bp-xl: 1280px; --bp-2xl: 1536px;
  --container-sm: 640px; --container-md: 768px; --container-lg: 1024px; --container-xl: 1280px;
}

/* 风格 B 暗黑极简
   --primary: #818CF8; --bg: #0A0A0A; --surface: #1A1A2E; --text: #E2E8F0;
*/
/* 风格 C 清新白
   --primary: #2563EB; --bg: #FFFFFF; --surface: #F8FAFC; --text: #1F2937;
*/
/* 风格 D 商务专业
   --primary: #1E40AF; --bg: #F1F5F9; --surface: #FFFFFF; --text: #0F172A;
*/
/* 风格 E 紫黑科技
   --primary: #A855F7; --bg: #0B011D; --surface: #1A0533; --text: #E8D5FF;
*/
```

#### 5.2 `assets/css/components.css`

SaaS 平台专属组件：

```css
/* ===== 基础组件 ===== */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
  border-radius: var(--radius); font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-primary { background: var(--primary-gradient); color: #fff; border: none; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
.btn-ghost { background: transparent; color: var(--primary); border: 1px solid var(--border); }
.btn-lg { padding: 14px 32px; font-size: 16px; }
.input { width: 100%; padding: 12px 16px; border: 2px solid var(--border);
  border-radius: var(--radius); font-size: 15px; transition: border-color 0.2s; }
.input:focus { border-color: var(--primary); outline: none; }
.card { background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow); }
.badge { display: inline-block; padding: 2px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600; }
.badge-blue { background: var(--primary-soft); color: var(--primary); }
.badge-green { background: var(--accent-soft); color: var(--accent); }
.toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
  background: var(--text); color: #fff; padding: 12px 24px; border-radius: var(--radius);
  font-size: 14px; z-index: 9999; animation: toastIn 0.3s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* ===== 落地页组件 ===== */
.hero-section { background: var(--bg-dark); color: var(--text-light);
  padding: 80px 24px; text-align: center; }
.hero-title { font-size: clamp(32px, 5vw, 56px); font-weight: 800;
  line-height: 1.2; margin-bottom: 20px; }
.hero-subtitle { font-size: 18px; color: var(--text-sub); max-width: 600px;
  margin: 0 auto 40px; }
.hero-cta { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px; padding: 80px 24px; max-width: var(--container-xl); margin: 0 auto; }
.feature-card { text-align: center; padding: 40px 24px; }
.feature-icon { font-size: 40px; margin-bottom: 16px; }
.pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px; padding: 80px 24px; max-width: var(--container-lg); margin: 0 auto; }
.pricing-card { border: 2px solid var(--border); border-radius: var(--radius-lg);
  padding: 40px 32px; text-align: center; transition: border-color 0.2s; }
.pricing-card.featured { border-color: var(--primary); box-shadow: var(--shadow-lg); }
.pricing-price { font-size: 48px; font-weight: 800; color: var(--primary); }
.pricing-unit { font-size: 16px; color: var(--text-sub); }

/* ===== Dashboard 组件 ===== */
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; margin-bottom: 32px; }
.stat-card { padding: 20px; }
.stat-label { font-size: 13px; color: var(--text-sub); margin-bottom: 4px; }
.stat-value { font-size: 28px; font-weight: 700; }
.code-block { background: var(--bg-dark); color: var(--text-light); padding: 16px 20px;
  border-radius: var(--radius); font-family: var(--font-mono); font-size: 13px;
  line-height: 1.6; overflow-x: auto; position: relative; }
.code-block .copy-btn { position: absolute; top: 12px; right: 12px;
  background: rgba(255,255,255,0.1); color: var(--text-light); border: none;
  padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; }

/* ===== API Key 组件 ===== */
.key-card { display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-radius: var(--radius); background: var(--bg);
  border: 1px solid var(--border); margin-bottom: 12px; }
.key-name { font-weight: 600; }
.key-prefix { font-family: var(--font-mono); color: var(--text-sub); font-size: 13px; }
.key-status { display: flex; align-items: center; gap: 6px; }
.key-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.key-dot.active { background: var(--accent); }
.key-dot.inactive { background: var(--text-sub); }

/* ===== Playground 组件 ===== */
.playground-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  height: calc(100vh - 120px); }
@media (max-width: 768px) { .playground-layout { grid-template-columns: 1fr; } }
.playground-input { padding: 20px; overflow-y: auto; border-right: 1px solid var(--border); }
.playground-output { padding: 20px; overflow-y: auto; background: var(--bg-dark);
  color: var(--text-light); font-family: var(--font-mono); font-size: 13px; }
.model-selector { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.model-chip { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
  font-size: 13px; cursor: pointer; transition: all 0.2s; }
.model-chip.selected { background: var(--primary-soft); border-color: var(--primary);
  color: var(--primary); }

/* ===== 底部 Tab ===== */
.bottom-tab { position: fixed; bottom: 0; left: 0; right: 0; height: 56px;
  background: var(--surface); border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-around; z-index: 100; }
.tab-item { display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 11px; color: var(--text-sub); text-decoration: none; padding: 4px 12px; }
.tab-item.active { color: var(--primary); }
.tab-item .tab-icon { font-size: 20px; }
```

#### 5.3 `assets/js/common.js`

```javascript
const PROJECT_KEY = '<projectName>';

const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(`${PROJECT_KEY}:${key}`); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(`${PROJECT_KEY}:${key}`, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem(`${PROJECT_KEY}:${key}`); },
  clear() { Object.keys(localStorage).filter(k => k.startsWith(`${PROJECT_KEY}:`)).forEach(k => localStorage.removeItem(k)); }
};

function requireLogin(redirect = 'index.html') {
  if (!Store.get('token')) { location.href = redirect; return false; }
  return true;
}

function currentUser() { return Store.get('user'); }

function logout() { Store.clear(); location.href = 'index.html'; }

function highlightTab() {
  const path = location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.tab-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') === path);
  });
}

function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
}

document.addEventListener('DOMContentLoaded', highlightTab);
```

#### 5.4 localStorage 键名（SaaS 专属）

| 键名 | 类型 | 用途 | 写入页 | 读取页 |
|------|------|------|--------|--------|
| `<name>:user` | Object | 当前登录用户 | `index.html` | 全站 |
| `<name>:token` | String | 登录态 | `index.html` | 全站 |
| `<name>:api_keys` | Array | API Key 列表 | `keys.html` | `dashboard.html` |
| `<name>:usage` | Object | 用量数据 | `dashboard.html` | `billing.html` |
| `<name>:billing` | Array | 账单记录 | `billing.html` | `billing.html` |
| `<name>:settings` | Object | 用户偏好 | `me.html` | 全站 |

#### 5.5 index.html 设计（落地页 + 登录一体）

采用 SaaS 平台经典结构：

1. **顶部导航**：Logo + 功能链接 + 登录/注册按钮
2. **Hero 区**：深色背景 + 渐变标题（如"为开发者而生的 AI 平台"）+ 代码块演示（`curl` 示例）
3. **特性区**：3-4 列网格（高吞吐、低延迟、OpenAI 兼容、按量计费）
4. **定价区**：3 列定价卡片（Free / Pro / Enterprise）
5. **CTA 区**：大按钮"免费开始使用"
6. **登录弹窗**：点击"登录"时弹出 Modal（邮箱 + 密码 + GitHub OAuth）

#### 5.6 【必填】关键页面要点

**【必填】dashboard.html（开发者控制台）**：

- 欢迎卡片："👋 欢迎回来，<用户名>"
- 统计卡片：今日调用次数 / Token 消耗 / 余额 / 活跃 Key 数
- 快速开始代码块（3 步：注册 → 拿 Key → 第一次调用）
- 最近用量迷你图表（可用纯 CSS 柱状图模拟）
- 底部 Tab

**【必填】playground.html（API Playground）**：

- 左右分栏（桌面端）/ 上下分栏（移动端）
- 左侧：模型选择器（chips）+ Messages 编辑器（多行 textarea）+ 参数面板（temperature/top_p/max_tokens slider）+ 发送按钮
- 右侧：深色背景 + 等宽字体的响应输出区 + SSE 流式逐字显示动画（模拟）
- "复制 curl"按钮：自动生成当前请求的 curl 命令

**【必填】keys.html（API Key 管理）**：

- 顶部说明："API Key 是你的秘密钥匙，请妥善保管"
- Key 列表卡片（名称 + `sk-****...****` + 状态绿点 + 创建时间）
- 每个 Key 右侧：复制 / 轮换 / 删除 按钮
- 底部"+"按钮 → 弹出 Modal（名称 + 权限范围 + IP 白名单） → 创建成功后**仅展示一次完整 Key** + "已复制到剪贴板"提示
- 空状态（无 Key 时）：引导创建第一个 Key

**【必填】billing.html（计费 + 用量）**：

- 顶部：余额卡片（大字显示 + 充值按钮）
- 用量曲线（本周/本月 toggle）
- 消费明细列表（时间 + 模型 + Token 数 + 费用）
- 套餐卡片（当前套餐高亮 + 升级按钮）

**【必填】docs.html（API 文档）**：

- 左侧侧边栏：快速开始 / 认证 / Chat Completions / Embeddings / Models / 错误码
- 右侧内容区：Markdown 风格渲染 + curl/Python/Node.js 三语言 Tab 切换
- 每个端点包含：方法+路径 / 请求示例 / 响应示例 / 参数表格

**【必填】me.html（账户设置）**：

- 用户信息卡（头像/用户名/邮箱/注册时间）
- 设置列表：通知偏好 / Webhook URL / 默认模型 / 语言 / 主题
- 底部：退出登录 + 注销账号（红色警告）

#### 5.7 占位数据

- 统计数值：真实感数据（非全部 0），如"今日调用 1,247 次"、"消耗 856K tokens"
- 代码示例：完整的 curl 命令 + JSON 响应
- 模型列表：3-5 个模拟模型（Chat / Embedding / Image）
- 定价：Free（0 元，100K tokens/月）/ Pro（99 元/月，10M tokens）/ Enterprise（联系我们）

#### 5.8 链接可达性扫描（生成后必跑）

1. 收集所有已生成的 HTML 文件名清单
2. 遍历每个 HTML 中的 `<a href="*.html">` 与 `location.href = '*.html'`
3. 凡是目标不在清单内的 → 修复 href 或补建缺失页面
4. 输出扫描报告：`✅ X 个链接全部可达` / `❌ 缺失：xxx.html`

### Step 6：生成 README.md

```markdown
# <项目名>

> 为开发者而生的 <定位> 平台

## 页面清单

| 页面 | 文件 |
|------|------|
| 落地页 + 登录 | `prototype/index.html` |
| 开发者控制台 | `prototype/dashboard.html` |
| API Playground | `prototype/playground.html` |
| API Key 管理 | `prototype/keys.html` |
| 计费 + 用量 | `prototype/billing.html` |
| API 文档 | `prototype/docs.html` |
| 账户设置 | `prototype/me.html` |

## 本地预览

双击 `prototype/index.html` 或使用 Live Server
```

### Step 6.5：自动预览 prototype

生成完所有文件后，**自动打开浏览器预览 `prototype/index.html`**。

### Step 7：原型后续流程选择

> 📌 与所有 sainit-* 子 skill 一致。

| 选项 | 动作 |
|------|------|
| A | 高保真 UI 重做 |
| B | UI/UX 设计智能 |
| C | 全栈前端 |
| D | 配色 + 字体调优 |
| E | PPT/视觉风格统一 |
| **F** | **不再设计，直接进入前端代码开发（默认推荐）→ `/safrontend`** |

### Step 7.5：创建 STEPS.md 项目元信息

同其他 sainit-* 子 skill 格式，写入项目根目录。

---

## 与路由的关系

本 skill 由 `/sainit` 识别到以下关键词时触发：

| 关键词 | 示例 |
|--------|------|
| SaaS / 平台 / API 平台 | "做一个 SaaS 平台" |
| 开发者平台 / 云服务 | "做一个开发者 API 平台" |
| 模型平台 / AI 平台 | "做一个 AI 模型平台（类似硅基流动）" |
| 开放平台 | "做一个开放 API 平台" |

## 修改记录

| 时间 | 改动 |
|------|------|
| 2026-07-14-1 | 初版：SaaS/API 平台项目类型；7 页原型（落地页/控制台/Playground/Key管理/计费/文档/账户）；科技蓝 UI 风格；SaaS 专属组件（代码块/Key 卡片/Playground 分栏/定价卡片） |
| 2026-08-04-1 | 新增多工程目录支持：Step 1 增加「推荐多工程模式」目录结构（`prototype-web/` + `prototype-console/` + `prototype-admin/`）；新增 Step 2.5「反问工程拆分（SaaS 专属）」强制步骤；页面按角色拆分到不同工程目录 |
