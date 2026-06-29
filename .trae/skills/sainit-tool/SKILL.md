---
name: "sainit-tool"
description: "初始化一个工具/效率类软件项目的产品原型。Invoke when /sainit 路由到 tool 类型，或用户直接调用 /sainit-tool。会创建 prototype/ 目录、按功能生成多页 HTML 原型（含数据列表、新增/编辑、统计、主题切换等工具专属页面）。"
---

# /sainit-tool — 工具类项目初始化

## 触发条件

- 由 `/sainit` 主 skill 路由而来（识别到"待办/记账/笔记/工具/效率"等关键词）
- 用户直接调用：`/sainit-tool <项目描述>`

## 工作流程

### Step 1：解析项目描述 & 创建项目目录

1. 提取项目关键词 → kebab-case 英文名
2. 创建结构：
   ```
   <project-name>/
   ├── README.md
   └── prototype/
       ├── index.html              # 启动 + 登录一体页
       ├── home.html               # 数据列表（Tab）
       └── <其他功能页面>.html
       └── assets/{css,js,img}/
   ```

### Step 2：反问 UI 风格（5 选 1）

| 选项 | 风格 | 典型色系 |
|------|------|---------|
| A | 简约清新风（推荐） | 白底 + 大量留白 |
| B | 霓虹灯风格 | 黑底 + 霓虹紫/青 |
| C | 温馨治愈风 | 米色 + 暖橙 |
| D | 商务专业风 | 深蓝 + 灰白 |
| E | 复古文艺风 | 莫兰迪 |

### Step 3：反问功能需求（多选）

**核心功能**（必选）：
1. 用户注册 / 登录
2. 数据列表（如待办/账目/笔记）
3. 新增 / 编辑
4. 数据统计
5. 个人中心

**增值功能**（可选）：
6. 数据导出
7. 提醒 / 通知
8. 标签 / 分类
9. 多设备同步说明
10. 主题切换

### Step 4：功能 → 页面映射

| 选中功能 | 生成页面 | Tab |
|---------|---------|-----|
| 注册/登录 | `index.html`（内含登录表单） | ❌ |
| 数据列表 | `home.html` | ✅ |
| 新增/编辑 | `edit.html` | ❌ |
| 数据统计 | `stats.html` | ✅ |
| 个人中心 | `me.html` | ✅ |
| 数据导出 | `export.html` | ❌ |
| 提醒 | `notifications.html` | ❌ |
| 主题切换 | 内嵌到 `me.html` | - |

**Tab 配置**：首页 / 统计 / 我的（3 个）

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

#### 5.1 `assets/css/tokens.css`（工具默认偏 A 简约清新风）

```css
:root {
  /* 默认：A 简约清新风 */
  --primary: #4F46E5;          /* 工具强调色（靛蓝） */
  --primary-soft: #EEF2FF;
  --accent: #10B981;           /* 完成绿色 */
  --accent-soft: #D1FAE5;
  --warning: #F59E0B;
  --danger: #EF4444;
  --bg: #FAFAFC; --surface: #FFFFFF;
  --text: #1F2937; --text-sub: #6B7280; --border: #F1F1F4;
  --radius-sm: 6px; --radius: 10px; --radius-lg: 16px;
  --shadow: 0 2px 8px rgba(0,0,0,0.06);
}
```

#### 5.2 `assets/css/components.css`

通用组件 + 工具专属：`.list-item`、`.item-checkbox`、`.item-content`、`.item-actions`、`.empty-state`、`.fab`（悬浮新增按钮）、`.form-field`、`.stat-card`、`.stat-value`、`.stat-label`、`.progress-bar`、`.theme-picker`

#### 5.3 `assets/js/common.js`

同 dating 子 skill

#### 5.4 localStorage 键名（工具专属）

| 键名 | 类型 | 用途 | 写入页 | 读取页 |
|------|------|------|--------|--------|
| `<name>:user` | Object | 当前登录用户 | `index.html` | 全站 |
| `<name>:token` | String | 登录态 | `index.html` | 全站 |
| `<name>:items` | Array | 数据列表（待办/账目等） | `edit.html` | `home.html`、`stats.html` |
| `<name>:tags` | Array | 标签/分类 | `edit.html` | `home.html` |
| `<name>:settings` | Object | 用户偏好（含主题） | `me.html` | 全站 |

#### 5.5 index.html 设计（启动+登录一体）

Hero 区用极简风格（如纯色块 + 大图标 + slogan"专注效率"），表单简洁。

#### 5.6 【必填】关键页面要点

**【必填】home.html（数据列表）**：
- 顶部：标题 + 筛选 Tab（全部 / 进行中 / 已完成 / 已归档）
- 列表项：复选框 + 标题 + 标签 + 时间 + 操作（编辑/删除）
- 点击复选框：划线 + 灰化（标记完成）
- 右下悬浮按钮 [+] → `edit.html`
- 底部 Tab

**【必填】edit.html（新增/编辑）**：
- 顶部：返回 + 保存
- 表单字段：
  - 标题（必填）
  - 内容/详情
  - 标签（多选 chips）
  - 日期（可选）
  - 优先级（低/中/高）
- 删除按钮（编辑模式才有）

**【必填】stats.html（数据统计）**：
- 顶部：时间范围选择（今日/本周/本月/全部）
- 数据卡片：总数 / 已完成 / 进行中 / 完成率
- 图表占位（柱状图/饼图用纯 CSS 实现或 emoji 装饰）
- 标签分布列表

**【必填】me.html（个人中心）**：
- 用户卡
- 数据概览（4 个小卡片）
- 功能列表：
  - 数据导出
  - 主题切换（点击切换 light/dark，写入 settings）
  - 通知设置
  - 关于

#### 5.7 占位数据

- 列表项：5-10 条示例（待办标题、账目金额等）
- 标签：3-5 个（工作/学习/生活/重要/紧急）

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
| 列表 | `prototype/home.html` |
| 新增/编辑 | `prototype/edit.html` |
| 统计 | `prototype/stats.html` |
| 我的 | `prototype/me.html` |
...

## 本地预览

双击 `prototype/index.html`
```

### Step 7：原型后续流程选择（用户分流）

> 📌 **本步骤为强制步骤**。`prototype/` + `STEPS.md` + `README.md` 均已生成 → 在宣告完成与进入正式开发之间，必须让用户在「继续设计优化」与「开始前端开发」之间二选一。

#### 7.1 用 AskUserQuestion 询问用户

```
问题：prototype 已生成完毕，下一步如何进行？
说明：如果对当前 prototype 的设计/视觉不满意，可调用专门的设计 skill 重新设计；若满意，可直接进入 /safrontend 开始前端代码开发。
```

#### 7.2 选项清单

| 选项 | 动作描述 | 调用 skill |
|------|---------|-----------|
| A | 重新设计：高保真 UI 重做（推荐作为首次重新设计选项） | `frontend-design` |
| B | 重新设计：UI/UX 设计智能（设计令牌 + 微文案 + 可访问性） | `ui-ux-pro-max` |
| C | 重新设计：全栈前端（媒体资产生成 + 高阶 motion + 转化文案） | `frontend-dev` |
| D | 重新设计：配色 + 字体调优 | `color-font-skill` |
| E | 重新设计：PPT/视觉风格统一（radius / spacing / 组件风格令牌，尤其适合工具类卡片密度调优） | `design-style-skill` |
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
- ⚠️ **数据卡片密度优化 → 优先选 E**：`design-style-skill` 内含 radius / spacing / 组件密度调优

### Step 8：输出最终回复

```
✅ 项目「<name>」已初始化完成！

📁 目录：<abs-path>
🎨 风格：简约清新风
🧩 功能：数据列表、新增编辑、统计、个人中心...

📄 已生成页面（共 N 个）：
   • index.html（启动 + 登录）
   • home.html（列表 Tab）
   • edit.html（新增/编辑）
   • stats.html（统计 Tab）
   • me.html（我的 Tab）
   ...

🚀 打开 prototype/index.html 开始体验。
```

## 注意事项

- ⚠️ **数据列表按时间倒序**（最新在前）
- ⚠️ **标记完成用本地状态切换**，刷新仍保留（localStorage）
- ⚠️ **删除要有二次确认**（`confirm()` 即可）
- ⚠️ **空状态必须友好**（无数据时显示插画+提示）

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-06-29-1 | 初始化「修改记录（skill 自身演进）」section；约定时间格式为「年-月-日-当天变动次数」；AI 写入前必须用 PowerShell `Get-Date -Format "yyyy-MM-dd"` 校准北京时间；变动次数 N 按「该 skill 文件落地次数」自增（同一天多次改动依次为 1,2,3...） |
| 2026-06-29-2 | 在 Step 7 新增「原型后续流程选择（用户分流）」节点；选项 A~E 对应 frontend-design / ui-ux-pro-max / frontend-dev / color-font-skill / design-style-skill 5 个设计 skill，选项 F 直接进入 safrontend；约定 A~E 可链式循环、不能清空 prototype/；工具类特别强调数据卡片密度优化优先选 E；原 Step 7 顺延为 Step 8 |

---

## 关联 Skill

- `frontend-design` — 高保真 UI（Step 7 选项 A）
- `ui-ux-pro-max` — UI/UX 设计智能（Step 7 选项 B）
- `frontend-dev` — 全栈前端开发（Step 7 选项 C）
- `color-font-skill` — 配色字体（Step 7 选项 D）
- `design-style-skill` — 视觉风格 / 卡片密度（Step 7 选项 E）
- `safrontend` — 原型转前端代码（Step 7 选项 F，默认推荐）