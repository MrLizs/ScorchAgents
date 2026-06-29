---
name: "sainit-blog"
description: "初始化一个博客/内容类软件项目的产品原型。Invoke when /sainit 路由到 blog 类型，或用户直接调用 /sainit-blog。会创建 prototype/ 目录、按功能生成多页 HTML 原型（含文章列表、详情、发布、收藏等博客专属页面）。"
---

# /sainit-blog — 博客类项目初始化

## 触发条件

- 由 `/sainit` 主 skill 路由而来（识别到"博客/文章/资讯/笔记/阅读"等关键词）
- 用户直接调用：`/sainit-blog <项目描述>`

## 工作流程

### Step 1：解析项目描述 & 创建项目目录

1. 提取项目关键词 → kebab-case 英文名
2. 创建结构：
   ```
   <project-name>/
   ├── README.md
   └── prototype/
       ├── index.html              # 启动 + 登录一体页
       ├── home.html               # 首页（Tab）
       └── <其他功能页面>.html
       └── assets/{css,js,img}/
   ```

### Step 2：反问 UI 风格（5 选 1）

| 选项 | 风格 | 典型色系 |
|------|------|---------|
| A | 简约清新风 | 白底 + 大量留白 |
| B | 霓虹灯风格 | 黑底 + 霓虹紫/青 |
| C | 温馨治愈风（推荐） | 米色 + 暖色 |
| D | 商务专业风 | 深蓝 + 灰白 |
| E | 复古文艺风（推荐） | 莫兰迪 + 衬线字体 |

### Step 3：反问功能需求（多选）

**核心功能**（必选）：
1. 用户注册 / 登录
2. 文章列表 / 分类
3. 文章详情
4. 发布文章
5. 个人主页

**增值功能**（可选）：
6. 评论 / 点赞
7. 收藏夹
8. 关注作者
9. 专题 / 专栏
10. 搜索

### Step 4：功能 → 页面映射

| 选中功能 | 生成页面 | Tab |
|---------|---------|-----|
| 注册/登录 | `index.html`（内含登录表单） | ❌ |
| 文章列表 | `home.html`（推荐 + 分类） | ✅ |
| 文章详情 | `article.html` | ❌ |
| 发布文章 | `editor.html` | ❌ |
| 个人主页 | `me.html` | ✅ |
| 收藏夹 | `favorites.html` | ✅ |
| 作者主页 | `author.html` | ❌ |
| 专题 | `topics.html` | ❌ |
| 搜索 | `search.html` | ❌ |

**Tab 配置**：首页 / 收藏 / 我的（3 个；若选发布可加"发布" Tab）

### Step 4.5：页面 & 按钮完整性自检

生成文件前，对照 Step 4 映射表逐项确认：

- [ ] 每个选中功能都有对应页面
- [ ] 每个页面的入口按钮 / 链接已规划
- [ ] 每个入口都指向已生成的页面
- [ ] Tab 配置覆盖所有 Tab 页面
- [ ] 无悬空入口 / 死链

### Step 5：生成文件

#### 5.0 完整性铁律（贯穿所有页面）

- 每个按钮必有行为：onclick / href / 提交，必有其一。
- 每个交互必有反馈：loading、toast、状态切换，必有其一。
- 每条数据必有闭环：新增 → 展示 → 编辑 → 删除，全链路通。
- 每个页面必有结构：标题区、主体区、操作区、底部 Tab（如适用）。
- 每个跳转必有目标：href 指向已生成的 HTML，不留死链。

#### 5.1 `assets/css/tokens.css`（博客默认偏 E 复古文艺风）

```css
:root {
  /* 默认：E 复古文艺风 */
  --primary: #8FA68E;          /* 莫兰迪绿 */
  --primary-soft: #E8EFE7;
  --accent: #C97B63;           /* 莫兰迪橙棕 */
  --accent-soft: #F5E8E0;
  --bg: #F5F1EA; --surface: #FFFEFA;
  --text: #3D4A3D; --text-sub: #6B7568; --border: #D9D2C5;
  --font-serif: 'Noto Serif SC', 'Source Han Serif SC', Georgia, serif;
  --radius-sm: 4px; --radius: 8px; --radius-lg: 16px;
  --shadow: 0 2px 12px rgba(61, 74, 61, 0.06);
}
```

#### 5.2 `assets/css/components.css`

通用组件 + 博客专属：`.article-card`、`.article-cover`、`.article-title`、`.article-meta`、`.article-content`、`.article-actions`（点赞/收藏/评论按钮）、`.tag`、`.author-card`、`.topic-card`、`.comment-item`、`.comment-input`

#### 5.3 `assets/js/common.js`

同 dating 子 skill

#### 5.4 localStorage 键名（博客专属）

| 键名 | 类型 | 用途 | 写入页 | 读取页 |
|------|------|------|--------|--------|
| `<name>:user` | Object | 当前登录用户 | `index.html` | 全站 |
| `<name>:token` | String | 登录态 | `index.html` | 全站 |
| `<name>:articles` | Array | 文章列表 | `editor.html` | `home.html`、`favorites.html` |
| `<name>:favorites` | Array | 收藏文章ID | `article.html` | `favorites.html` |
| `<name>:likes` | Array | 点赞文章ID | `article.html` | `article.html` |
| `<name>:comments` | Object | 文章评论（key为articleId） | `article.html` | `article.html` |
| `<name>:follows` | Array | 关注作者ID | `author.html` | `author.html` |

#### 5.5 index.html 设计（启动+登录一体）

Hero 区用衬线大字标题（如"记录生活的诗意"）+ 装饰图案。表单简化（邮箱+密码或手机号+验证码皆可）。

#### 5.6 【必填】关键页面要点

**【必填】home.html（首页）**：
- 顶部 Logo + 搜索图标
- 分类横滑 Tab（推荐 / 科技 / 生活 / 旅行 / 美食 ...）
- 文章卡片流：封面图 + 标题 + 摘要 + 作者 + 发布时间 + 阅读数
- 底部 Tab

**【必填】article.html（文章详情）**：
- 顶部返回 + 收藏/分享图标
- 标题（衬线大字）
- 作者信息条（头像/昵称/关注按钮）
- 发布时间 · 阅读时长 · 字数
- 正文（衬线字体，行高 1.8）
- 文末：标签
- 底部固定栏：点赞 / 评论 / 收藏

**【必填】editor.html（编辑器）**：
- 顶部：返回 + 发布按钮
- 标题输入（大字号）
- 封面图选择（占位）
- 正文编辑（textarea 或 contenteditable）
- 标签输入
- 字数统计

**【必填】favorites.html（收藏夹）**：
- 顶部 Tab：文章 / 专题 / 作者
- 列表卡片（复用 article-card 样式）

**【必填】me.html（我的）**：
- 用户卡（头像/昵称/简介）
- 数据统计：文章数 / 粉丝 / 获赞
- 功能列表：我发布的 / 我的收藏 / 关注 / 设置

#### 5.7 占位数据

- 封面图：`https://picsum.photos/seed/<slug>/800/450`
- 头像：`https://i.pravatar.cc/150?img=<n>`
- 标题示例：贴合主题（科技/生活/旅行...）
- 摘要：1-2 行中文

#### 5.8 链接可达性扫描（生成后必跑）

1. 收集所有已生成的 HTML 文件名清单
2. 遍历每个 HTML 中的 `<a href="*.html">` 与 `location.href = '*.html'`
3. 凡是目标不在清单内的 → 修复 href 或补建缺失页面
4. 输出扫描报告：`✅ X 个链接全部可达` / `❌ 缺失：xxx.html`

### Step 6：生成 README.md

```markdown
# <项目名>

> <一句话定位>

## 页面清单

| 页面 | 文件 |
|------|------|
| 启动 + 登录 | `prototype/index.html` |
| 首页 | `prototype/home.html` |
| 文章详情 | `prototype/article.html` |
| 发布 | `prototype/editor.html` |
| 收藏 | `prototype/favorites.html` |
| 我的 | `prototype/me.html` |
...

## 本地预览

双击 `prototype/index.html`
```

### Step 7：输出最终回复

```
✅ 项目「<name>」已初始化完成！

📁 目录：<abs-path>
🎨 风格：复古文艺风（衬线字体）
🧩 功能：文章列表、详情、发布、收藏、个人主页...

📄 已生成页面（共 N 个）：
   • index.html（启动 + 登录）
   • home.html（首页 Tab）
   • article.html（文章详情）
   • editor.html（发布文章）
   • favorites.html（收藏 Tab）
   • me.html（我的 Tab）
   ...

🚀 打开 prototype/index.html 开始体验。
```

## 注意事项

- ⚠️ **正文字体用 `--font-serif`** 衬线，体现阅读质感
- ⚠️ **文章列表必须有封面图**，否则视觉单调
- ⚠️ **发布文章 → 立即刷新 home.html 列表**（同源 localStorage 自动同步）
- ⚠️ **评论输入框固定底部**

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-06-29-1 | 初始化「修改记录（skill 自身演进）」section；约定时间格式为「年-月-日-当天变动次数」；AI 写入前必须用 PowerShell `Get-Date -Format "yyyy-MM-dd"` 校准北京时间；变动次数 N 按「该 skill 文件落地次数」自增（同一天多次改动依次为 1,2,3...） |

---

## 关联 Skill

- `frontend-design` — 高保真 UI
- `color-font-skill` — 配色字体（衬线字体）