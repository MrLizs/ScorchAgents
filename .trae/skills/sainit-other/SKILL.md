---
name: "sainit-other"
description: "通用项目初始化子 skill：处理未匹配到 dating/shop/blog/tool 任何具体类型的项目。Invoke when /sainit 路由后未匹配到子类，或用户直接调用 /sainit-other。会创建 prototype/ 目录、生成通用多页 HTML 原型（index + home + list + detail + me 的极简骨架），支持用户自定义功能/页面映射。"
---

# /sainit-other — 通用项目初始化

## 触发条件

- 由 `/sainit` 主 skill 路由而来（**未匹配到** dating / shop / blog / tool 任何具体类型）
- 用户直接调用：`/sainit-other <项目描述>`

> 💡 本 skill 是**兜底通用模板**，使用最普适的目录结构（`index + home + list + detail + me`），适合未知类型 / 跨类型 / 全新领域的项目。如项目能明确归类为 dating / shop / blog / tool，请优先使用对应子 skill。

## 工作流程

### Step 1：解析项目描述 & 创建项目目录

1. 提取**项目关键词** → 生成英文项目名（kebab-case）
2. 创建目录结构：
   ```
   <project-name>/
   ├── README.md
   └── prototype/
       ├── index.html              # 启动 + 登录一体页
       ├── home.html               # 首页（Tab）
       ├── list.html               # 列表页
       ├── detail.html             # 详情页
       ├── me.html                 # 我的（Tab）
       └── assets/
           ├── css/
           │   ├── tokens.css
           │   └── components.css
           ├── js/common.js
           └── img/
   ```

### Step 2：反问 UI 风格（5 选 1）

| 选项 | 风格 | 典型色系 |
|------|------|---------|
| A | 简约清新风 | 白底 + 淡彩主色 |
| B | 霓虹灯风格 | 黑底 + 霓虹紫/青 |
| C | 温馨治愈风（推荐） | 米色 + 暖橙 |
| D | 商务专业风 | 深蓝 + 灰白 |
| E | 复古文艺风 | 莫兰迪绿/灰粉 |

### Step 3：反问功能需求（多选）

> 📌 通用模板提供 8 个**跨类型通用功能**，按需勾选即可覆盖大部分未知类型项目。

**核心功能**（必选，至少 3 个）：
1. 用户注册 / 登录
2. 列表浏览（搜索 / 分类）
3. 详情查看
4. 新增 / 编辑条目
5. 个人中心

**增值功能**（可选）：
6. 收藏 / 点赞
7. 评论 / 留言
8. 设置 / 偏好

> 若用户的功能需求超出上述清单（如：复杂业务流、定制化模块），可基于本 skill 生成的**极简骨架**继续扩展，或建议用户改用更合适的具体子 skill / 自行设计。

### Step 4：功能 → 页面映射（通用）

> 📌 通用模板的固定 5 个页面**对应 5 大类功能**，勾选的功能会自动落到对应页面，无需追问。

| 选中功能 | 生成页面 | Tab |
|---------|---------|-----|
| 注册/登录 | `index.html`（内含登录表单） | ❌ |
| 列表浏览 | `home.html` + `list.html` | ✅ home |
| 详情查看 | `detail.html` | ❌ |
| 新增/编辑 | `detail.html`（含编辑模式） | ❌ |
| 个人中心 | `me.html` | ✅ |
| 收藏/点赞 | `detail.html`（按钮） + `me.html` | ❌ |
| 评论/留言 | `detail.html`（区块） | ❌ |
| 设置/偏好 | `me.html` | ❌ |

**Tab 配置**：首页 / 我的（**2 个**——最简通用）

### Step 4.5：页面 & 按钮完整性自检

生成文件前，对照 Step 4 映射表逐项确认：

- [ ] 每个选中功能都有对应页面 / 区域
- [ ] 每个页面的入口按钮 / 链接已规划
- [ ] 每个入口都指向已生成的页面
- [ ] Tab 配置覆盖所有 Tab 页面（首页 / 我的）
- [ ] 无悬空入口 / 死链

### Step 5：生成文件

#### 5.0 完整性铁律（贯穿所有页面）

- 每个按钮必有行为：onclick / href / 提交，必有其一。
- 每个交互必有反馈：loading、toast、状态切换，必有其一。
- 每条数据必有闭环：新增 → 展示 → 编辑 → 删除，全链路通。
- 每个页面必有结构：标题区、主体区、操作区、底部 Tab（如适用）。
- 每个跳转必有目标：href 指向已生成的 HTML，不留死链。

#### 5.1 `assets/css/tokens.css`（默认偏 C 温馨治愈风）

```css
:root {
  /* 默认：C 温馨治愈风 */
  --primary: #FF9F68;          /* 暖橙 */
  --primary-soft: #FFE9DC;
  --accent: #6BCB77;           /* 浅绿 */
  --accent-soft: #E1F5E3;
  --bg: #FFF8F0; --surface: #FFFFFF;
  --text: #4A3F35; --text-sub: #8B7E72; --border: #F0E6D8;
  --radius-sm: 8px; --radius: 12px; --radius-lg: 20px;
  --shadow: 0 4px 16px rgba(74, 63, 53, 0.06);
}
/* 风格 A 简约清新
   --primary: #6EC1E4; --primary-soft: #E0F2FB; --bg: #FAFCFE; --text: #1F2937;
*/
/* 风格 B 霓虹灯风格
   --primary: #B829F0; --primary-soft: #2D1B4E; --bg: #0A0E1A; --text: #E0E6FF;
*/
/* 风格 D 商务专业
   --primary: #2563EB; --primary-soft: #DBEAFE; --bg: #F8FAFC; --text: #0F172A;
*/
/* 风格 E 复古文艺
   --primary: #8FA68E; --primary-soft: #E8EFE7; --bg: #F5F1EA; --text: #3D4A3D;
*/
```

#### 5.2 `assets/css/components.css`

通用组件：
- 基础：`.btn`、`.btn-primary`、`.btn-ghost`、`.input`、`.card`、`.list-item`、`.badge`、`.switch`、`.toast`
- 布局：`.bottom-tab`、`.tab-item`、`.sub-header`、`.back-btn`
- 认证页：`.auth-page`、`.auth-hero`、`.auth-form`、`.input-group`、`.captcha-row`、`.btn-send-code`、`.agree`、`.divider`
- 列表 / 详情：`.item-card`、`.item-cover`、`.item-title`、`.item-meta`、`.item-actions`（点赞/收藏/评论按钮）

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
  const path = location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('.tab-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') === path);
  });
}

document.addEventListener('DOMContentLoaded', highlightTab);
```

#### 5.4 localStorage 键名（通用 3 个 + 可选扩展）

| 键名 | 类型 | 用途 | 写入页 | 读取页 |
|------|------|------|--------|--------|
| `<name>:user` | Object | 当前登录用户 | `index.html` | 全站 |
| `<name>:token` | String | 登录态 | `index.html` | 全站 |
| `<name>:settings` | Object | 用户偏好 | `me.html` | 全站 |
| `<name>:items` | Array | 列表数据（默认） | `detail.html`（新增/编辑） | `home.html`、`list.html`、`detail.html` |
| `<name>:favorites` | Array | 收藏条目 ID（可选） | `detail.html` | `me.html` |
| `<name>:likes` | Array | 点赞条目 ID（可选） | `detail.html` | `detail.html` |
| `<name>:comments` | Object | 条目评论（key 为 itemId，可选） | `detail.html` | `detail.html` |

> 📌 若勾选了"评论/留言"则启用 `comments`；勾选"收藏/点赞"则启用 `favorites` 和 `likes`。**通用模板只内置 `items` 列表数据**——条目字段以 `{ id, title, cover, summary, content, createdAt }` 为默认结构，用户可在 `detail.html` 中按需扩展字段。

#### 5.5 index.html 设计（启动 + 登录一体）

三段式：Hero 区（品牌 + slogan）→ 登录表单（手机号 + 验证码 + 协议）→ 其他登录方式

```html
<div class="app">
  <main class="auth-page">
    <section class="auth-hero">
      <div class="brand-logo">✨</div>
      <h1>项目名</h1>
      <p>一句 slogan</p>
    </section>
    <form class="auth-form" onsubmit="return doLogin(event)">
      <div class="input-group"><input type="tel" id="phone" placeholder="请输入手机号" maxlength="11"></div>
      <div class="input-group captcha-row">
        <input type="text" id="code" placeholder="验证码" maxlength="6">
        <button type="button" class="btn-send-code">获取验证码</button>
      </div>
      <label class="agree"><input type="checkbox" id="agree" checked> 我已阅读并同意 <a href="#">《服务条款》</a></label>
      <button type="submit" class="btn btn-primary">登录 / 注册</button>
    </form>
    <section class="auth-other">
      <div class="divider"><span>其他登录方式</span></div>
      <div class="oauth-row">
        <button class="oauth-btn">微信</button>
        <button class="oauth-btn">Apple</button>
      </div>
    </section>
  </main>
</div>

<script>
function doLogin(e) {
  e.preventDefault();
  const phone = document.querySelector('#phone').value.trim();
  const code = document.querySelector('#code').value.trim();
  if (!/^1\d{10}$/.test(phone)) return alert('请输入正确的手机号');
  if (!/^\d{4,6}$/.test(code)) return alert('请输入验证码');
  if (!document.querySelector('#agree').checked) return alert('请先同意服务条款');
  Store.set('token', 'mock-token-' + Date.now());
  Store.set('user', { id: 1, phone, nickname: '用户' + phone.slice(-4), avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70) });
  location.href = 'home.html';
}

document.querySelector('.btn-send-code').onclick = () => {
  const btn = document.querySelector('.btn-send-code');
  let n = 60; btn.disabled = true; btn.textContent = n + 's 后重试';
  const t = setInterval(() => {
    if (--n <= 0) { clearInterval(t); btn.disabled = false; btn.textContent = '获取验证码'; }
    else btn.textContent = n + 's 后重试';
  }, 1000);
  alert('验证码已发送（演示环境，请填写 123456）');
};
</script>
```

#### 5.6 HTML 页面通用结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>页面名 - 项目名</title>
  <link rel="stylesheet" href="assets/css/tokens.css">
  <link rel="stylesheet" href="assets/css/components.css">
</head>
<body>
  <div class="app">
    <!-- 子页面：sub-header -->
    <main class="page-content">...</main>
    <!-- Tab 页面：bottom-tab -->
  </div>
  <script src="assets/js/common.js"></script>
  <script>/* 页面逻辑 */</script>
</body>
</html>
```

Tab 页面底部导航（通用 2 Tab）：
```html
<nav class="bottom-tab">
  <a href="home.html" class="tab-item">首页</a>
  <a href="me.html" class="tab-item">我的</a>
</nav>
```

子页面顶部返回：
```html
<header class="sub-header">
  <a href="javascript:history.back()" class="back-btn">←</a>
  <h1>页面标题</h1>
  <span class="placeholder"></span>
</header>
```

#### 5.7 【必填】关键页面要点

**【必填】home.html（首页 Tab）**：
- 顶部品牌 / Logo
- 搜索入口（跳 `list.html?search=1`）
- 分类横滑 / 宫格入口（跳 `list.html?cat=xxx`）
- 推荐列表（卡片流，跳 `detail.html?id=X`）
- "新增"悬浮按钮（+ 跳 `detail.html?new=1`）
- 底部 Tab

**【必填】list.html（列表页）**：
- 顶部返回 + 标题 + 搜索框
- 筛选条（最新 / 热门 / 收藏最多）
- 列表卡片流（复用 `.item-card`）
- 空状态：未登录 / 无数据
- 不带底部 Tab（子页面）

**【必填】detail.html（详情页）**：
- 顶部返回 + 标题 + 编辑图标（仅本人可编辑）
- 封面图（如有）
- 标题（主标题）
- 元信息（作者 / 时间 / 分类 / 阅读数）
- 正文（多行文本，支持换行）
- 标签（可选）
- 底部固定操作栏：点赞 / 收藏 / 评论 / 编辑
- 编辑模式（URL 带 `?new=1` 或 `?edit=X`）：表单输入 + 保存 / 取消

**【必填】me.html（我的 Tab）**：
- 顶部用户卡（头像 / 昵称 / 简介）
- 数据统计：发布数 / 获赞 / 收藏数
- 功能列表（按勾选的功能动态生成）：
  - 我发布的（跳 `list.html?mine=1`）
  - 我的收藏（跳 `list.html?fav=1`，仅勾选"收藏"时显示）
  - 设置（`settings` 键）
  - 关于
- 退出登录按钮

#### 5.8 占位数据

- 封面图：`https://picsum.photos/seed/<slug>/800/450`
- 头像：`https://i.pravatar.cc/150?img=<n>`
- 条目标题：贴合用户输入的项目主题（"我的项目"→ 适合的示例词）
- 摘要：1-2 行中文

#### 5.9 链接可达性扫描（生成后必跑）

1. 收集所有已生成的 HTML 文件名清单（应为 5 个：`index.html`、`home.html`、`list.html`、`detail.html`、`me.html`）
2. 遍历每个 HTML 中的 `<a href="*.html">` 与 `location.href = '*.html'`
3. 凡是目标不在清单内的 → 修复 href 或补建缺失页面
4. 输出扫描报告：`✅ X 个链接全部可达` / `❌ 缺失：xxx.html`

### Step 5.5：创建 STEPS.md（项目元信息持久化）

> 📌 **本步骤为强制步骤**。项目名、UI 风格、功能清单、页面映射必须写入 `STEPS.md`，供后续 `/safrontend` `/saapi` `/sabackend` 读取。

#### 5.5.1 前置检查

```bash
# 1. STEPS.md 是否已存在（极少见，可能用户已用 safrontend）
if [ -f STEPS.md ]; then
  echo "⚠️ STEPS.md 已存在，将追加「项目初始化」章节"
  # 不覆盖已有内容
else
  echo "✅ 创建 STEPS.md"
fi

# 2. 准备项目元信息（从前置步骤汇总）
PROJECT_NAME_EN="<Step 1 推导的英文名>"
PROJECT_NAME_CN="<Step 1.5 反问的项目中文名>"
PROJECT_TYPE="other"
UI_STYLE="<A|B|C|D|E>"
CORE_FEATURES="<Step 3 选中的核心功能>"
VALUE_FEATURES="<Step 3 选中的增值功能>"
GENERATED_PAGES="index.html, home.html, list.html, detail.html, me.html"
TAB_CONFIG="首页 / 我的"
```

#### 5.5.2 反问项目中文名（必填）

> ⚠️ **必须反问，不能从英文名推断**——后端表前缀拼音依赖中文名。
>
> 使用 `AskUserQuestion`（填空题）：
> - **问题**：项目的中文名是什么？（用于后端生成数据库表前缀，例如「杂记」→ `zj_`）
> - **说明**：1-6 个汉字

#### 5.5.3 生成 STEPS.md

**若 STEPS.md 不存在**（典型场景），创建并写入：

```markdown
# 开发步骤 - <PROJECT_NAME_EN>

> 创建时间：YYYY-MM-DD HH:mm
> 当前阶段：项目初始化（/sainit-other）

---

## 🏷 项目元信息（/sainit-* 阶段写入）

> ⚠️ 本节是后续所有 skill（safrontend/saapi/sabackend/saapi-connect）的**信息源**。请勿随意修改。

| 字段 | 值 |
|------|-----|
| **项目名（英文 / kebab-case）** | `<PROJECT_NAME_EN>` |
| **项目名（中文）** | `<PROJECT_NAME_CN>` |
| **项目类型** | `other` |
| **UI 风格** | <A 简约清新 \| B 霓虹灯风格 \| C 温馨治愈 \| D 商务专业 \| E 复古文艺> |
| **核心功能** | <逗号分隔> |
| **增值功能** | <逗号分隔> |
| **生成的页面** | <`index.html`, `home.html`, `list.html`, `detail.html`, `me.html`> |
| **Tab 配置** | 首页 / 我的 |
| **localStorage 键名前缀** | `<PROJECT_NAME_EN>:` |
| **占位图服务** | picsum + pravatar |
| **设计令牌文件** | `prototype/assets/css/tokens.css` |
| **公共 JS 文件** | `prototype/assets/js/common.js` |

### 页面与功能映射

| 选中功能 | 生成的页面 | Tab |
|---------|----------|-----|
| <注册/登录> | `index.html` | ☐ |
| <列表浏览> | `home.html` + `list.html` | ☑ |
| <详情查看> | `detail.html` | ☐ |
| <新增/编辑> | `detail.html` | ☐ |
| <个人中心> | `me.html` | ☑ |
| <收藏/点赞> | `detail.html` + `me.html` | ☐ |
| <评论/留言> | `detail.html` | ☐ |
| <设置/偏好> | `me.html` | ☐ |

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

**若 STEPS.md 已存在**（极少见），仅追加一个章节（保留 safrontend 阶段已有的内容）：

```markdown
---

## 🏷 项目元信息（/sainit-* 阶段补充）

> ⚠️ 补写时间：YYYY-MM-DD HH:mm

（与上面的项目元信息表 + 页面与功能映射 + 修改记录 相同内容，但时间戳为补写时间）
```

#### 5.5.4 验收标准

- [ ] STEPS.md 已生成（或追加）
- [ ] 「项目元信息」节 12 个字段全部填写
- [ ] 「页面与功能映射」表与 Step 5 实际生成文件一致
- [ ] 「后续 skill 读取指引」4 条说明完整
- [ ] 修改记录已追加

#### 5.5.5 失败处理

- **若 STEPS.md 写入失败**：打印错误并提示用户「请检查项目根目录权限」，但不阻断后续流程（README.md 仍生成）
- **若项目中文名获取失败**：使用项目英文名首字母（去元音）作为兜底，例如 `my-app` → `ma`

> ⚠️ **重要性**：后续 `/safrontend` 会读取 STEPS.md 中的「项目名（中文）」用于浏览器标题与 PWA 配置；`/sabackend` 会读取它用于数据库表前缀推导。缺失此节会导致后续环节反复追问用户。

### Step 6：生成 README.md

```markdown
# <项目名>

> <一句话定位>

## 页面清单

| 页面 | 文件 | 入口 |
|------|------|------|
| 启动 + 登录 | `prototype/index.html` | 浏览器默认打开 |
| 首页 | `prototype/home.html` | 登录后 / 底部 Tab |
| 列表 | `prototype/list.html` | 首页分类入口 |
| 详情 | `prototype/detail.html` | 列表卡片 / 新增按钮 |
| 我的 | `prototype/me.html` | 底部 Tab |

## 本地预览

双击 `prototype/index.html`，或在项目根目录运行 `python -m http.server 8000` 访问 `http://localhost:8000/prototype/`

## 下一步

请打开 `prototype/index.html` 预览当前原型（仅 5 个极简骨架页）。**两种走向**：

1. **设计优化**（不满意当前视觉）→ 由本 skill 的 **Step 7** 调用 `frontend-design` / `ui-ux-pro-max` / `frontend-dev` / `color-font-skill` / `design-style-skill` 5 个设计 skill 之一
2. **进入前端代码开发**（设计 OK）→ 调用 `/safrontend`

> A~E 可链式循环（如先 `color-font-skill` 改配色 → 再 `frontend-design` 重做 → 最后选 F 进 safrontend）。通用模板建议先多次循环调用设计 skill 完善后再进 safrontend。详见本 skill 的 **Step 7「原型后续流程选择（用户分流）」**。
```

### Step 6.5：自动预览 prototype

> 📌 **本步骤为强制步骤**。`prototype/` 所有文件已生成完毕，必须自动打开预览让用户直观体验。

1. prototype 为静态 HTML 文件，可直接用浏览器打开
2. 使用 `Start` 命令直接打开 `<project-name>\prototype\index.html`（Windows）或 `open` 命令（macOS），或直接双击 `prototype/index.html` 文件
3. 浏览器会自动展示完整的原型页面，无需启动本地服务器

### Step 7：原型后续流程选择（用户分流）

> 📌 **本步骤为强制步骤**。`prototype/` + `STEPS.md` + `README.md` 均已生成 → 在宣告完成与进入正式开发之间，必须让用户在「继续设计优化」与「开始前端开发」之间二选一。

#### 7.1 直接询问用户（不弹出选择框）

prototype 已生成完毕，直接以对话文本向用户发出询问——直接输出以下文字询问用户：

「prototype 已生成完毕，请问你是想重新设计一下视觉风格（配色/字体/整体UI等），还是直接开始前端代码开发？」

然后根据用户的文字回复，参考下面的选项清单进行分流处理。

#### 7.2 选项清单

| 选项 | 动作描述 | 调用 skill |
|------|---------|-----------|
| A | 重新设计：高保真 UI 重做（推荐作为首次重新设计选项） | `frontend-design` |
| B | 重新设计：UI/UX 设计智能（设计令牌 + 微文案 + 可访问性） | `ui-ux-pro-max` |
| C | 重新设计：全栈前端（媒体资产生成 + 高阶 motion + 转化文案） | `frontend-dev` |
| D | 重新设计：配色 + 字体调优 | `color-font-skill` |
| E | 重新设计：PPT/视觉风格统一（radius / spacing / 组件风格令牌） | `design-style-skill` |
| F | **不再设计，直接进入前端代码开发**（默认推荐） | `safrontend` |

#### 7.3 处理逻辑

**情况 1：用户选 A~E 之一（重新设计）**

1. **加载并执行** `.trae/skills/<skill-name>/SKILL.md` 全部工作流程
2. 设计 skill 会读取本 skill 已生成的 `STEPS.md`「项目元信息」节 + `prototype/` 目录，并基于现有产出做优化（**不重建 prototype/**，避免覆盖用户已确认的内容）
3. 设计完成后 → **回到 Step 7 再次询问用户**，允许链式调用（如先 `color-font-skill` → 再 `frontend-design` → 最后 `safrontend`）
4. 不要清空 `prototype/`；若设计 skill 建议用新文件覆盖，给用户看 diff 后再决定

**情况 2：用户选 F（直接进入 safrontend，推荐）**

1. 输出提示：「即将调用 `/safrontend` 开始前端代码开发」
2. **加载并执行** `.trae/skills/safrontend/SKILL.md` 的工作流程
3. 后续不再由本 skill 处理，由 safrontend 接管

**情况 3：用户选「其他」/ 自定义输入**

- 让用户用一句话说明下一步意图，按意图路由到相应 skill 或给出指引

#### 7.4 注意事项

- ⚠️ **本步骤是 prototype 与正式前端开发之间的必经节点**——不要跳过分流直接进 safrontend
- ⚠️ **A~E 是叠加关系，可循环调用**：第一次不满意 → `color-font-skill` 改配色 → 仍不满意 → `frontend-design` 重做 → 满意后选 F
- ⚠️ 重新设计后不要立即清空 `prototype/`，设计 skill 会基于现有 prototype/ 迭代
- ⚠️ **通用模板只有 5 个极简骨架页**——若需要更复杂业务流，建议多次循环调用设计 skill 完善后再进 safrontend

### Step 8：输出最终回复

```
✅ 项目「<name>」已初始化完成！

📁 目录：<abs-path>
🎨 风格：<风格名>
🧩 功能：注册登录、列表浏览、详情查看、个人中心...

📄 已生成页面（共 5 个，位于 prototype/）：
   • index.html（启动 + 登录一体）
   • home.html（首页 Tab）
   • list.html（列表）
   • detail.html（详情 + 编辑）
   • me.html（我的 Tab）

🚀 打开 prototype/index.html 体验完整用户旅程。
```

## 注意事项

- ⚠️ **通用模板仅生成 5 个极简页面**——若项目需要更复杂业务流（如支付、聊天、地图），建议在生成后基于本骨架继续扩展
- ⚠️ **页面数量固定为 5 个**：`index + home + list + detail + me`
- ⚠️ **跨页面跳转用相对路径**（`href="home.html"`）
- ⚠️ **占位用真实图片服务**（picsum/pravatar），避免本地资源缺失
- ⚠️ **若项目能明确归类**（dating / shop / blog / tool），应优先回到 `/sainit` 路由到对应子 skill 以获得更贴合的页面与组件

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-06-29-1 | 初始化「修改记录（skill 自身演进）」section；约定时间格式为「年-月-日-当天变动次数」；AI 写入前必须用 PowerShell `Get-Date -Format "yyyy-MM-dd"` 校准北京时间；变动次数 N 按「该 skill 文件落地次数」自增（同一天多次改动依次为 1,2,3...） |
| 2026-06-29-2 | 在 Step 7 新增「原型后续流程选择（用户分流）」节点；选项 A~E 对应 frontend-design / ui-ux-pro-max / frontend-dev / color-font-skill / design-style-skill 5 个设计 skill，选项 F 直接进入 safrontend；约定 A~E 可链式循环、不能清空 prototype/；通用模板建议多次循环设计 skill 完善后再进 safrontend；原 Step 7 顺延为 Step 8 |

---

## 关联 Skill

- `frontend-design` — 高保真 UI（Step 7 选项 A）
- `ui-ux-pro-max` — UI/UX 设计智能（Step 7 选项 B）
- `frontend-dev` — 全栈前端开发（Step 7 选项 C）
- `color-font-skill` — 配色字体（Step 7 选项 D）
- `design-style-skill` — 视觉风格统一（Step 7 选项 E）
- `safrontend` — 原型转前端代码（Step 7 选项 F，默认推荐）
