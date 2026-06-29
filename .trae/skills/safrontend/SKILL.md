---
name: "safrontend"
description: "基于已有 prototype/ 原型，按步骤开发前端代码（Vue 3 或 React 18），自动生成并维护 STEPS.md，每个步骤完成后需用户验收。Invoke when 用户输入 /safrontend 或要求把原型转化为可运行的前端项目。"
---

# /safrontend — 原型转前端代码

## 触发条件

- 用户输入 `/safrontend` 或 `/safrontend <项目目录>`
- 前置条件：项目目录已有 `prototype/`（由 `/sainit-*` 生成）

## 工作流程（严格按顺序）

### Step 0：读取 STEPS.md 项目元信息（P1-1：项目名统一传递）

> 📌 **本步骤为 safrontend 新增强制步骤**。从 STEPS.md 读取 /sainit-* 阶段写入的项目元信息，避免后续环节反复追问用户。

#### 0.1 读取与校验

```bash
# 1. STEPS.md 是否存在
if [ -f STEPS.md ]; then
  echo "✅ STEPS.md 已存在（来自 /sainit-*）"
else
  echo "⚠️ STEPS.md 不存在（用户可能跳过了 /sainit-*）"
fi
```

#### 0.2 解析「项目元信息」节

从 STEPS.md 提取如下字段（**作为 Phase 1 默认值，用户可在 Step 2 调整前端框架**）：

| 字段 | 来源 | 用途 |
|------|------|------|
| 项目名（英文） | 「项目元信息」节 | `package.json` 的 `name` 字段、浏览器标题 |
| 项目名（中文） | 「项目元信息」节 | 浏览器标题（与英文名拼接，如「心遇 - 心遇」）、README 描述 |
| 项目类型 | 「项目元信息」节 | 推断业务模块（如 dating→含聊天、shop→含购物车） |
| UI 风格 | 「项目元信息」节 | 设计令牌（与 prototype `tokens.css` 一致） |
| 生成的页面 | 「项目元信息」节 | Step 1 页面清单参考 |
| localStorage 键名前缀 | 「项目元信息」节 | Phase 1 替换 prototype 的 `<PROJECT_KEY>` 占位符 |

#### 0.3 缺失字段处理

- **若 STEPS.md 不存在**：提示用户「建议先运行 /sainit-* 生成 STEPS.md 的项目元信息节」，但**不阻断**——safrontend 可独立运行（仅 Phase 4 末尾提示「项目元信息缺失，后续 sabackend 会再次追问」）
- **若 STEPS.md 存在但「项目元信息」节缺失**：同上提示，不阻断

#### 0.4 验证输出

```
🔍 读取 STEPS.md 项目元信息：
   • 项目名：<英文>（中文：<中文>）
   • 类型：<dating|shop|blog|tool>
   • UI 风格：<A|B|C|D|E>
   • 页面：N 个
   • localStorage 前缀：`<projectName>:`
   ✅ 全部读取成功，后续不再追问
```

> 📌 **本步骤不写 STEPS.md**——只读不写。本步骤读取的字段在 Phase 1 写 STEPS.md 时（Step 3）会被原样引用。

### Step 1：定位原型目录

1. 优先使用用户指定目录，否则查找当前目录或子目录中的 `prototype/`
2. 读取 `prototype/index.html` 确认存在
3. 列出 prototype 下的所有 HTML 文件，识别需要实现的页面清单
4. 若 prototype 不存在：提示用户先运行 `/sainit-<type>`

输出确认：
```
🔍 检测到原型目录：<path>
📄 共识别 N 个页面：
   • index.html（启动+登录）
   • home.html（首页 Tab）
   ...
是否开始开发？[是/否]
```

### Step 2：询问前端框架（Vue vs React）

使用 `AskUserQuestion`，**提供框架对比说明**后让用户选择（单选）。

#### 两框架对比（展示给用户）

| 维度 | **Vue 3** | **React 18** |
|------|----------|-------------|
| **学习曲线** | 平缓，模板语法贴近 HTML | 中等，JSX 需要 JS 基础 |
| **组件写法** | SFC（`.vue` 文件），HTML/CSS/JS 三段式 | JSX（`.tsx`），逻辑与模板混写 |
| **状态管理** | Pinia（官方推荐，轻量） | Zustand / Redux（生态多） |
| **路由** | Vue Router（官方） | React Router |
| **UI 生态** | Element Plus、Vant、Naive UI | Ant Design、MUI、Chakra UI |
| **中文社区** | 非常活跃 | 一般 |
| **适用场景** | 中小项目快速上手、国内团队 | 大型项目、海外项目、复杂交互 |
| **构建工具** | Vite（官方推荐） | Vite / Next.js |

#### 提问话术

> 请选择前端框架：
> - **A. Vue 3**（推荐国内中小团队，学习成本低，中文社区好）
> - **B. React 18**（推荐大型项目、海外项目，生态更丰富）
> - **C. 其他**（如 Svelte、Angular，请说明）

#### 追问 TypeScript

确认框架后追问：
> 是否使用 TypeScript？
> - **A. 是**（推荐，类型安全）
> - **B. 否**（纯 JS，简单）

### Step 2.5：写入 README.md 技术栈与运行指南

> 📌 **本步骤为 safrontend 强制步骤**。在用户选定前端框架与语言后，**必须**把框架信息、初始化方式、运行方式写入项目根目录的 `README.md`，确保后续维护者能直接根据 README 跑起项目。

#### 2.5.1 检查 README.md 是否存在

```bash
if [ -f README.md ]; then
  echo "✅ README.md 已存在，将在末尾追加/更新「## 技术栈」与「## 本地开发」章节"
else
  echo "📝 README.md 不存在，将自动创建（结合 Step 0 读取的项目元信息）"
fi
```

#### 2.5.2 写入规则

根据 Step 2 选定的框架 + 语言组合，**必须**向 `README.md` 写入以下两个章节：

| 章节 | 必含内容 |
|------|---------|
| `## 技术栈` | 框架名称 + 版本、构建工具、状态管理、路由、HTTP 客户端、UI 风格来源（指向 `prototype/assets/css/tokens.css`） |
| `## 本地开发` | 环境要求（Node 版本）、初始化命令（脚手架命令）、依赖安装命令、启动命令（含默认端口）、构建命令、目录结构、常见问题 |

#### 2.5.3 模板示例

> AI 根据用户选择的框架，**只填对应模板**，不要输出其它模板的内容。

##### 模板 A：Vue 3 + TypeScript + Pinia（默认推荐）

```markdown
## 技术栈

- **前端框架**：Vue 3（Composition API）
- **语言**：TypeScript
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **HTTP 客户端**：Axios
- **UI 风格**：复用 `prototype/assets/css/tokens.css`

## 本地开发

### 环境要求

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0（或 pnpm ≥ 8 / yarn ≥ 1.22）

### 初始化（首次拉取项目后）

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（默认 5173 端口） |
| `npm run build` | 生产构建（输出到 `frontend/dist/`） |
| `npm run preview` | 本地预览生产构建产物 |
| `npm run type-check` | TypeScript 类型检查 |

### 目录结构

```
frontend/
├── public/              # 静态资源（不经 Vite 处理）
├── src/
│   ├── api/             # API 客户端
│   ├── components/      # 通用组件
│   ├── pages/           # 页面组件
│   ├── router/          # 路由配置
│   ├── stores/          # Pinia 状态管理
│   ├── styles/          # 全局样式（含 tokens.css）
│   ├── utils/           # 工具函数
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 常见问题

- **端口 5173 被占用**：Vite 会自动尝试 5174、5175...；也可在 `vite.config.ts` 中修改 `server.port`
- **Node 版本过低**：建议使用 nvm 切换：`nvm use 18`
- **依赖安装失败**：可尝试 `npm install --legacy-peer-deps`
```

##### 模板 B：React 18 + TypeScript + Zustand

```markdown
## 技术栈

- **前端框架**：React 18
- **语言**：TypeScript
- **构建工具**：Vite
- **状态管理**：Zustand
- **路由**：React Router 6
- **HTTP 客户端**：Axios
- **UI 风格**：复用 `prototype/assets/css/tokens.css`

## 本地开发

### 环境要求

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0（或 pnpm ≥ 8 / yarn ≥ 1.22）

### 初始化（首次拉取项目后）

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（默认 5173 端口） |
| `npm run build` | 生产构建（输出到 `frontend/dist/`） |
| `npm run preview` | 本地预览生产构建产物 |
| `npm run lint` | ESLint 代码检查 |
| `npm run type-check` | TypeScript 类型检查 |

### 目录结构

```
frontend/
├── public/              # 静态资源
├── src/
│   ├── api/             # API 客户端
│   ├── components/      # 通用组件
│   ├── pages/           # 页面组件
│   ├── router/          # 路由配置
│   ├── stores/          # Zustand 状态管理
│   ├── styles/          # 全局样式（含 tokens.css）
│   ├── utils/           # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 常见问题

- **端口 5173 被占用**：Vite 会自动尝试 5174、5175...；也可在 `vite.config.ts` 中修改 `server.port`
- **Node 版本过低**：建议使用 nvm 切换：`nvm use 18`
- **依赖安装失败**：可尝试 `npm install --legacy-peer-deps`
```

##### 模板 C：React 18 + TypeScript + Redux Toolkit

```markdown
## 技术栈

- **前端框架**：React 18
- **语言**：TypeScript
- **构建工具**：Vite
- **状态管理**：Redux Toolkit
- **路由**：React Router 6
- **HTTP 客户端**：Axios
- **UI 风格**：复用 `prototype/assets/css/tokens.css`

## 本地开发

### 环境要求

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0（或 pnpm ≥ 8 / yarn ≥ 1.22）

### 初始化（首次拉取项目后）

```bash
cd frontend
npm install
npm run dev
# 浏览器打开 http://localhost:5173
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（默认 5173 端口） |
| `npm run build` | 生产构建（输出到 `frontend/dist/`） |
| `npm run preview` | 本地预览生产构建产物 |
| `npm run lint` | ESLint 代码检查 |
| `npm run type-check` | TypeScript 类型检查 |

### 目录结构

```
frontend/
├── public/
├── src/
│   ├── api/             # API 客户端
│   ├── components/      # 通用组件
│   ├── pages/           # 页面组件
│   ├── router/          # 路由配置
│   ├── store/           # Redux store + slices
│   ├── styles/          # 全局样式（含 tokens.css）
│   ├── utils/           # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 常见问题

- **端口 5173 被占用**：Vite 会自动尝试 5174、5175...；也可在 `vite.config.ts` 中修改 `server.port`
- **Node 版本过低**：建议使用 nvm 切换：`nvm use 18`
- **依赖安装失败**：可尝试 `npm install --legacy-peer-deps`
```

##### 模板 D：纯 JavaScript（不推荐，TS 不可用时使用）

根据实际选用的框架（Vue 3 / React 18），将上述模板的 `TypeScript` 替换为 `JavaScript`，并删除 `tsconfig.json` 相关说明、删除 `npm run type-check` 命令。

#### 2.5.4 写入位置规则

- 若 `README.md` 已存在：定位到末尾的「## 技术栈」与「## 本地开发」章节，**覆盖更新**（其它章节保持不动）
- 若 `README.md` 不存在：使用 Step 0 读取的项目元信息创建完整 README.md，**必须**包含：项目简介、页面清单、技术栈、本地开发、数据存储（如有）

#### 2.5.5 验证输出

```
📝 写入 README.md：
   • 框架：Vue 3 + TypeScript
   • 状态管理：Pinia
   • 初始化命令：cd frontend && npm install
   • 启动命令：npm run dev → http://localhost:5173
   • 章节位置：## 技术栈、## 本地开发
   ✅ README.md 已更新
```

> ⚠️ **本步骤必须先于 Step 3（生成 STEPS.md）执行**——STEPS.md 中的「框架」「语言」字段应与 README.md 保持一致。

> 📌 **safrontend 被重新调用时**：
> - 若 README.md 已包含「## 技术栈」与「## 本地开发」章节，且框架未变更：**跳过本步**
> - 若框架发生变更（如 Vue 3 → React 18）：提示用户「检测到框架变更，是否覆盖更新 README.md 技术栈章节？」

### Step 2.6：图标与按钮渲染策略（SVG 优先三级降级）

> 📌 **本步骤为 safrontend 新增强制步骤**。在用户选定前端框架（Step 2）之后、生成 STEPS.md（Step 3）之前，AI **必须**判定图标/按钮的渲染方案，并写入 STEPS.md。判定结果会影响 README.md 的「技术栈」节、Phase 1 实施清单、以及最终产物的体积与可维护性。

#### 2.6.1 三级降级决策流程

```
[Step 2 选定框架]
        │
        ▼
① 框架是否原生支持 SVG？──查询 2.6.2 矩阵 + 必要时联网核实
   ├─ ✅ 是 → 方案 A：SVG 内联绘制（**强制采用**）
   └─ ❌ 否 ↓
② 是否存在可用的第三方矢量渲染库？──AI 必须联网查询当年可用版本
   ├─ ✅ 是 → 方案 B：第三方矢量库
   └─ ❌ 否 ↓
③ 让用户逐项提供所有按钮与图标素材
   → 生成「页面 + 图标编号」菜单（2.6.5 模板），逐项收集
```

#### 2.6.2 框架 SVG 支持矩阵（AI 直接查询）

| 框架 / 场景 | 原生 SVG | 推荐方案 | 备注 |
|------------|---------|---------|------|
| Vue 3（Web / Vite） | ✅ | 方案 A | 模板中可直接写 `<svg>` |
| React 18（Web / Vite） | ✅ | 方案 A | JSX 中可直接写 `<svg>` |
| React 18（Next.js） | ✅ | 方案 A | 同上 |
| Tauri（Webview 内核） | ✅ | 方案 A | 默认 Chromium 内核 |
| Electron | ✅ | 方案 A | 默认 Chromium 内核 |
| React Native（bare） | ❌ | 方案 B | 需 react-native-svg |
| Expo（React Native） | ❌ | 方案 B | 推荐 @expo/vector-icons（Expo 内置） |
| 微信小程序 | ⚠️ 部分 | 方案 B | 推荐 iconfont / Iconfont-CSS |
| 飞书 / 钉钉小程序 | ⚠️ 部分 | 方案 B | 需查询对应平台文档 |
| Flutter（误选场景） | ❌ | 方案 B | flutter_svg |
| 其它未知框架 | ❓ | — | **AI 必须联网查询后再决策，禁止脑补** |

#### 2.6.3 方案 A：SVG 内联绘制（首选）

**强制规则**：若框架原生支持 SVG，**所有按钮与图标必须使用 SVG 实现**，禁止使用位图（png/jpg/svg-from-design-tool 同样禁止直接外链）。

**实施规范**：

1. **存放位置**：
   - Vue 3：`frontend/src/components/icons/IconXxx.vue`
   - React 18：`frontend/src/components/icons/IconXxx.tsx`

2. **命名规范**：PascalCase，文件名即组件名（`IconHome`、`IconSearch`、`IconUser`），按钮中的图标组件名与用途严格对应（如 `IconWechatLogin`、`IconPhoneLogin`）

3. **Props 约定**：
   ```ts
   interface IconProps {
     size?: number;        // 默认 24
     color?: string;       // 默认 currentColor（继承父级文字色）
     strokeWidth?: number; // 默认 1.5
   }
   ```

4. **按钮 + 图标组合**：通过 `<BaseButton>` 通用组件包裹图标，**禁止**直接拼接 DOM（如 `<button><svg>...</svg></button>` 必须包一层 `<BaseButton>`）

5. **样式参考**：[Heroicons](https://heroicons.com/) / [Feather Icons](https://feathericons.com/)，24×24 viewBox，统一 `stroke-linecap="round"` `stroke-linejoin="round"`

**示例输出（Vue 3）**：

```vue
<!-- src/components/icons/IconHome.vue -->
<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none"
       :stroke="color" :stroke-width="strokeWidth"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12L12 4l9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number; color?: string; strokeWidth?: number
}>(), { size: 24, color: 'currentColor', strokeWidth: 1.5 });
</script>
```

**示例输出（React 18）**：

```tsx
// src/components/icons/IconHome.tsx
interface IconProps { size?: number; color?: string; strokeWidth?: number; }

export const IconHome: React.FC<IconProps> = ({
  size = 24, color = 'currentColor', strokeWidth = 1.5,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={strokeWidth}
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 4l9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);
```

#### 2.6.4 方案 B：第三方矢量库（第一级降级）

若框架不原生支持 SVG，AI **必须先联网查询**当前可用的矢量渲染库（**严禁凭记忆推荐**——库版本与维护状态可能已变化）：

| 场景 | 联网查询关键词 |
|------|--------------|
| React Native（bare） | `react-native-svg latest version 2026` |
| Expo | `@expo/vector-icons built-in packages` |
| 微信小程序 | `wechat miniprogram vector icons solution 2026` |
| Flutter（误选场景） | `flutter_svg latest version` |
| 其它 | `<framework name> svg rendering library 2026` |

**集成规范**：
- 选定的库必须固定版本号写入 `package.json`（如 `"react-native-svg": "15.x.y"`）
- 在 README.md 的「技术栈」节**追加**「图标库」字段
- 在 STEPS.md 的 Phase 1 列表中**追加**「Step X.X：集成图标库」
- 若用户希望 AI 联网后自动给出 2~3 个候选库对比，由用户拍板

#### 2.6.5 方案 C：用户提供全部素材（最终降级）

若框架既不支持 SVG 也无可用矢量库，AI **必须**：

1. **扫描 prototype/**，列出所有出现按钮与图标的页面
2. **生成「页面 + 图标编号」菜单**（Markdown 表格），每项必须说明图片用途
3. **要求用户逐项提供素材**（PNG / JPG / SVG）
4. 用户将素材粘贴到 `frontend/public/icons/` 目录，文件名严格按编号命名
5. AI 在通用组件库中按编号引用，缺失项**用灰色占位方块代替 + 标注 TODO**，**不阻塞**其他开发

**菜单生成模板**：

```markdown
## 📋 图标素材清单（请逐项提供）

> 存放目录：`frontend/public/icons/`
> 文件命名：`<页码>-<序号>.<扩展名>`，如 `1-1.png`
> 尺寸建议：单色图标 96×96，多色图标 192×192；Tab 图标需同时提供选中/未选中两态
> 提交方式：将文件一次性粘贴到上述目录，文件名严格按编号

### 页面 1：index.html（启动 + 登录）
| 编号 | 位置 | 用途 | 用户提供 |
|------|------|------|---------|
| 1-1 | 顶部 Logo 区 | 应用 Logo 图标 | ⬜ 待提供 |
| 1-2 | 登录按钮内 | 微信登录图标 | ⬜ 待提供 |
| 1-3 | 登录按钮内 | 手机号登录图标 | ⬜ 待提供 |

### 页面 2：home.html（首页）
| 编号 | 位置 | 用途 | 用户提供 |
|------|------|------|---------|
| 2-1 | 底部 Tab | 首页图标（未选中） | ⬜ 待提供 |
| 2-2 | 底部 Tab | 首页图标（选中） | ⬜ 待提供 |
| 2-3 | 顶部导航 | 搜索图标 | ⬜ 待提供 |
| 2-4 | 顶部导航 | 消息图标 | ⬜ 待提供 |
...
```

**收集规则**：
- AI 在用户提交后立即更新表格「用户提供」列（✅ 已提供 / ⬜ 仍待提供）
- AI 通用组件库中通过 `<Icon name="1-1" />` 按编号引用
- 缺失项用 `<div class="icon-placeholder">1-1</div>` 占位，**禁止**让开发停摆

#### 2.6.6 决策结果必须写入 STEPS.md

AI 选定方案后，**必须**在 STEPS.md 顶部「项目信息」节**追加**以下小节：

```markdown
### 🎨 图标渲染策略

- **方案**：<A. SVG 内联 | B. 第三方库 | C. 用户提供素材>
- **选定理由**：<例如：Vue 3 模板原生支持 SVG，无第三方依赖，构建产物最小>
- **库名（如选 B）**：<react-native-svg | @expo/vector-icons | ...>
- **图标存放路径**：<frontend/src/components/icons | frontend/public/icons | ...>
- **命名规范**：<IconXxx.vue PascalCase | <页码>-<序号>.png | ...>
```

#### 2.6.7 验证输出

```
🎨 图标渲染策略判定：
   • 框架：<Vue 3 | React 18 | React Native | ...>
   • SVG 支持：<✅ 原生 | ❌ 不支持>
   • 第三方库：<✅ 有：xxx | ❌ 无>
   • 最终方案：<A. SVG 内联绘制 | B. 第三方库：xxx | C. 用户提供素材>
   • 已写入 STEPS.md「图标渲染策略」节
   • 已同步更新 README.md「技术栈」节（如选 B）
   ✅ 判定完成，可进入 Step 3
```

> ⚠️ **本步骤必须先于 Step 3 执行**——STEPS.md 中的「图标渲染策略」字段依赖本步的决策结果。

### Step 3：生成 `STEPS.md`

在项目根目录（与 `prototype/` 同级）创建 `STEPS.md`，包含完整开发步骤清单。

#### 3.1 目录约定

所有前端代码统一放在 `frontend/` 子目录，与 `prototype/` 平级：

```
<project-name>/
├── README.md
├── STEPS.md                 # 步骤追踪（项目根目录）
├── prototype/               # 原型设计（来自 /sainit）
│   ├── index.html
│   ├── home.html
│   └── assets/
└── frontend/                # 前端代码（本次开发产出）
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.ts / main.tsx
        ├── App.vue / App.tsx
        ├── pages/           # 页面组件
        ├── components/      # 通用组件
        ├── stores/          # 状态管理
        ├── router/          # 路由
        ├── styles/          # 全局样式
        └── utils/           # 工具函数
```

> 💡 **为什么用 `frontend/` 子目录？**
> - 与 prototype/ 解耦，未来后端、移动端可各自有目录
> - 一键 `rm -rf frontend/` 即可丢弃所有前端代码重来
> - 便于部署工具识别（如 Docker COPY frontend/）

#### STEPS.md 模板

```markdown
# 开发步骤 - <project-name>

> 基于 prototype/ 原型自动生成的前端开发步骤
> 框架：<Vue 3 | React 18>
> 语言：<TypeScript | JavaScript>
> 状态管理：<Pinia | Zustand>
> 路由：<Vue Router | React Router>
> 代码目录：`frontend/`
> 创建时间：<YYYY-MM-DD>

---

## 📋 项目信息

- **项目名**：<name>
- **原型目录**：`prototype/`
- **代码目录**：`frontend/`
- **目标**：根据 prototype 的**实际功能**生成前端页面，**风格与布局完全参考 prototype**

> ⚠️ **重要设计原则**：
> - **页面数量 ≠ prototype HTML 数量**：可根据功能合并/拆分页面
> - **风格（颜色、字体、间距、圆角、阴影）100% 复用 prototype 的 `tokens.css`**
> - **布局（头部/底部/Tab/卡片结构）参考 prototype 的视觉模式**
> - **功能实现可超出 prototype**（如 prototype 是简化版，可补全细节）

### 🎯 功能清单（从 prototype 提取）

| 序号 | 功能模块 | prototype 参考 | 是否必须 |
|------|---------|--------------|---------|
| 1 | 用户注册/登录 | `prototype/index.html` 登录表单 | 是 |
| 2 | 个人资料编辑 | `prototype/edit-profile.html` | 是 |
| 3 | 滑动匹配 | `prototype/match.html` | 是 |
| 4 | 即时聊天 | `prototype/chat.html` + `messages.html` | 是 |
| 5 | 个人主页 | `prototype/me.html` | 是 |
| 6 | 附近的人 | `prototype/nearby.html` | 否 |
| ... | ... | ... | ... |

### 📄 页面映射（基于功能，可与 prototype HTML 不一一对应）

> agent 根据功能清单设计最终页面，prototype HTML 仅作视觉参考

| 序号 | 页面名 | 文件路径 | 包含功能 | prototype 参考 |
|------|--------|---------|---------|--------------|
| 1 | 启动+登录 | `frontend/src/pages/Index.vue` | 登录、注册 | `prototype/index.html` |
| 2 | 首页 | `frontend/src/pages/Home.vue` | 推荐流、Tab 导航 | `prototype/home.html` |
| 3 | 滑动匹配 | `frontend/src/pages/Match.vue` | 滑动卡片交互 | `prototype/match.html` |
| 4 | 消息中心 | `frontend/src/pages/Messages.vue` | 会话列表 | `prototype/messages.html` |
| 5 | 聊天详情 | `frontend/src/pages/Chat.vue` | 单聊界面 | `prototype/chat.html` |
| 6 | 个人中心 | `frontend/src/pages/Me.vue` | 资料、设置 | `prototype/me.html` |
| ... | ... | ... | ... | ... |

**合并示例**：
- 若 prototype 只有 `chat.html`，agent 可拆分为 `Messages.vue`（列表） + `Chat.vue`（详情）两个页面
- 若 prototype 已有 `messages.html` 和 `chat.html`，agent 可保持或合并

**拆分示例**：
- 若 prototype 的 `me.html` 包含资料+设置+VIP，可拆分为 `Me.vue` + `Settings.vue` + `Vip.vue`

---

## 🚧 Phase 1：实施进度（agent 自动完成，不询问用户）

agent 会按顺序执行以下 Step，**实施过程不打扰用户**：

- [ ] Step 0: 创建 frontend/ 目录
- [ ] Step 1: 项目脚手架（Vite + 框架）
- [ ] Step 2: 设计令牌与全局样式
- [ ] Step 3: 通用组件库
- [ ] Step 4: 路由配置
- [ ] Step 5: 状态管理（Store）
- [ ] **Step 5.5: API 客户端脚手架**（为后端接入预留，见下方说明）
- [ ] Step 6: 启动页 + 登录（Index 页面）
- [ ] Step 7: 首页（Home 页面）
- [ ] ...（按 prototype 页面数生成）
- [ ] Step N: 构建测试

#### 🚧 Step 5.5：API 客户端脚手架（为后端接入预留）

> 📌 **本步为 `/saapi-connect` 预留接入点**，避免后期接入时大改文件结构。

**必须生成的 5 个文件**（即便 Phase 2 / 3 暂时用不到）：

| 文件 | 内容（占位） | 接入时填充 |
|------|------------|----------|
| `frontend/src/api/client.ts` | axios 实例 + 空 interceptor | baseURL + JWT 拦截器 |
| `frontend/src/api/auth.ts` | login / logout / refresh 函数占位 | 接真实后端接口 |
| `frontend/src/api/users.ts` | getMe / updateProfile 占位 | 接真实接口 |
| `frontend/src/stores/auth.ts` | store（**mock 实现**：直接 setTimeout 赋假 token） | 接真实 login() |
| `frontend/src/utils/errorHandler.ts` | 空函数 + TODO 注释 | HTTP 错误 → toast |
| `frontend/.env.example` | `VITE_API_BASE_URL=` 占位 | 真实 baseURL |

> 📌 **根据 Step 2 选定的前端框架，按 A / B / C 分支生成对应代码**。AI 只填用户所用框架的分支。
> - **A. Vue 3 + Pinia**（默认）
> - **B. React 18 + Zustand**
> - **C. React 18 + Redux Toolkit**
> - **D. 其它** → 询问用户具体框架，严禁 AI 自己脑补

下面同时给出 Vue 3 / React 18 两个版本示例，AI 只填用户所用框架的分支：

`frontend/src/api/client.ts`（占位）：
```ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '',                       // ⚠️ 占位，由 /saapi-connect 注入
  timeout: 15000,
});

// TODO: /saapi-connect 会填充以下内容
// - JWT request interceptor
// - 401 response interceptor (auto refresh)
// - error handler hook
```

`frontend/src/stores/auth.ts`（**mock 实现**，方便 Phase 1-2 跑通）：

#### A. Vue 3 + Pinia

```ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// ⚠️ 此为 safrontend 阶段的 mock 实现
// 真实接入由 /saapi-connect 替换为真实后端调用
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('mock_token'));
  const user = ref<any>(JSON.parse(localStorage.getItem('mock_user') || 'null'));
  const isLoggedIn = computed(() => !!accessToken.value);

  async function login(username: string, password: string) {
    // ⚠️ Mock：直接赋假 token，真实接入会改成调 /api/v1/auth/login
    accessToken.value = 'mock_token_' + Date.now();
    user.value = { id: 1, username, avatar: '/default-avatar.png' };
    localStorage.setItem('mock_token', accessToken.value);
    localStorage.setItem('mock_user', JSON.stringify(user.value));
  }

  function logout() {
    accessToken.value = null;
    user.value = null;
    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_user');
  }

  return { accessToken, user, isLoggedIn, login, logout };
});
```

#### B. React 18 + Zustand

```ts
import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  avatar?: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// ⚠️ 此为 safrontend 阶段的 mock 实现
// 真实接入由 /saapi-connect 替换为真实后端调用
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('mock_token'),
  user: JSON.parse(localStorage.getItem('mock_user') || 'null'),
  isLoggedIn: !!localStorage.getItem('mock_token'),

  async login(username, _password) {
    // ⚠️ Mock：直接赋假 token，真实接入会改成调 /api/v1/auth/login
    const mockToken = 'mock_token_' + Date.now();
    const mockUser = { id: 1, username, avatar: '/default-avatar.png' };
    set({ accessToken: mockToken, user: mockUser, isLoggedIn: true });
    localStorage.setItem('mock_token', mockToken);
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
  },

  logout() {
    set({ accessToken: null, user: null, isLoggedIn: false });
    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_user');
  },
}));
```

#### C. React 18 + Redux Toolkit

```ts
// frontend/src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User { id: number; username: string; avatar?: string }
interface AuthState {
  accessToken: string | null;
  user: User | null;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('mock_token'),
  user: JSON.parse(localStorage.getItem('mock_user') || 'null'),
};

// ⚠️ 此为 safrontend 阶段的 mock 实现（login 不发请求）
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    mockLogin(state, action: PayloadAction<{ username: string }>) {
      state.accessToken = 'mock_token_' + Date.now();
      state.user = { id: 1, ...action.payload, avatar: '/default-avatar.png' };
      localStorage.setItem('mock_token', state.accessToken!);
      localStorage.setItem('mock_user', JSON.stringify(state.user));
    },
    logout(state) {
      state.accessToken = null;
      state.user = null;
      localStorage.removeItem('mock_token');
      localStorage.removeItem('mock_user');
    },
  },
});

export const { mockLogin, logout } = authSlice.actions;
export default authSlice.reducer;
```

`frontend/.env.example`：
```bash
# ⚠️ 占位，由 /saapi-connect 填充真实值
VITE_API_BASE_URL=
VITE_API_PREFIX=/api/v1
VITE_USE_MOCK=true
```

**验收标准**（Step 5.5 完成判定）：
- [ ] 6 个文件全部生成（含 mock 实现）
- [ ] `npm run dev` 启动后浏览器能正常登录（用 mock token）
- [ ] DevTools Network 看到登录请求是 mock 路径（或不发请求）
- [ ] localStorage 有 `mock_token` / `mock_user`

> ⚠️ **后续 `/saapi-connect` 会做的事**：
> 1. 改 `VITE_API_BASE_URL` 为真实后端地址
> 2. 填充 `client.ts` 的 JWT 拦截器
> 3. **新增独立 Step 3：清理 mock 认证遗留**（删除 `mockCleanup.ts` 自动清理 localStorage、扫描删除代码引用、清理 Vite proxy 中的 mock 路径）
> 4. 重写 `auth.ts` 的 login() 接真实后端
> 5. 配置 Vite proxy + 后端 CORS

> 📌 **safrontend 被重新调用时的注意事项**：
> - 若 STEPS.md 显示已完成 `/saapi-connect`，不要重新生成 mock_token / mock_user（保持真实实现）
> - 若用户来回切换（safrontend → saapi-connect → safrontend），safrontend 检测到 `frontend/src/api/client.ts` 已被填充真实 baseURL 时，**不要覆盖**，只追加新功能
> - 若用户主动回到 mock 模式（重新开发不接后端），可重新生成 mock 实现，但需提示「已存在真实接入代码，是否要备份？」

> 📌 **完成后**：agent 会一次性提示用户运行 `npm run dev` 测试全部页面

---

## 📋 Phase 2：页面验收清单（用户测试后逐个确认）

agent 在用户反馈后**自动标记**所有页面，然后**逐个询问**用户是否满意。

| 序号 | 页面 | 文件路径 | 已标记 | 用户确认 | 备注 |
|------|------|---------|--------|---------|------|
| 1 | 启动+登录 | `frontend/src/pages/Index.vue` | ☐ | ☐ | - |
| 2 | 首页 | `frontend/src/pages/Home.vue` | ☐ | ☐ | - |
| 3 | 匹配 | `frontend/src/pages/Match.vue` | ☐ | ☐ | - |
| 4 | 消息 | `frontend/src/pages/Messages.vue` | ☐ | ☐ | - |
| 5 | 聊天 | `frontend/src/pages/Chat.vue` | ☐ | ☐ | - |
| 6 | 我的 | `frontend/src/pages/Me.vue` | ☐ | ☐ | - |
| ... | ... | ... | ☐ | ☐ | - |

---

## 🔘 Phase 3：功能按钮验收清单（用户测试后逐个确认）

agent 在用户反馈后**自动标记**所有功能按钮，然后**逐个询问**用户交互是否正常。

| 序号 | 按钮/交互 | 所在页面 | 已标记 | 用户确认 | 备注 |
|------|----------|---------|--------|---------|------|
| 1 | 登录/注册按钮 | 启动+登录 | ☐ | ☐ | - |
| 2 | 获取验证码按钮（60s倒计时） | 启动+登录 | ☐ | ☐ | - |
| 3 | 其他登录方式切换 | 启动+登录 | ☐ | ☐ | - |
| 4 | 滑动卡片（左/右滑） | 匹配 | ☐ | ☐ | - |
| 5 | Tab 切换 | 首页 | ☐ | ☐ | - |
| 6 | 发送消息按钮 | 聊天 | ☐ | ☐ | - |
| 7 | 退出登录 | 我的 | ☐ | ☐ | - |
| ... | ... | ... | ☐ | ☐ | - |

---

## ✅ Phase 4：项目状态

- 实施进度：0 / N ☐
- 页面验收：0 / M ☐
- 按钮验收：0 / K ☐
- API 设计：⏭ 未开始

---

## 📝 修改记录（agent 自动追加）

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| <创建时间> | 初始化 | 生成 STEPS.md |
| ... | ... | ... |
```

**说明**：
- Phase 1（实施）：agent 自动完成，不询问
- Phase 2-3（验收）：agent 标记后逐个询问用户
- Phase 4（状态）：agent 自动维护
- 所有按钮/交互需根据 prototype 实际页面动态生成

### Step 4：四阶段工作流

> 🚨 **核心原则**：
> 1. **Phase 1（实施）**：agent 一次性完成所有 Step，**不打断用户**
> 2. **Phase 2（提示测试）**：实施完毕一次性提示用户运行测试
> 3. **Phase 3（逐项验收）**：用户反馈后，agent **先批量标记**所有页面和按钮，**再逐个询问**用户
> 4. **Phase 4（API 设计）**：前端全部验收通过后，询问是否开始 API 设计

#### 4.0 前置检查（实施开始前必做）

1. 检查 `frontend/` 目录是否存在
2. 检查 prototype 目录与文件
3. 报告检查结果

#### 4.1 Phase 1：批量实施所有 Step（agent 自动，不询问）

**重要**：实施阶段不打扰用户，agent 一口气完成所有 Step。

执行顺序：
1. **Step 0**：创建 `frontend/` 目录
2. **Step 1**：Vite + 框架脚手架（cd frontend → npm create vite）
3. **Step 2**：移植 design tokens（**严格 100% 复用 prototype 的 tokens.css**）
4. **Step 3**：实现通用组件库（参考 prototype/components.css 样式）
5. **Step 4**：配置路由
6. **Step 5**：实现状态管理（Store）
7. **Step 5.5**：生成 API 客户端脚手架（**为 `/saapi-connect` 预留接入点**，见 Phase 1 步骤列表下方说明）
8. **Step 6 - N**：实现所有页面（**基于功能生成，参考 prototype 风格与布局**）
9. **Step N+1**：联调（npm install → 检查能否启动）

每个 Step 的执行细则：
- **路径检查**：所有写入路径必须以 `frontend/` 开头
- **代码一致性**：与 prototype 视觉保持一致
- **依赖安装**：每个 Step 涉及的依赖立即安装
- **STEPS.md 更新**：实施完成打 ☑（仅"实施"列）

##### 4.1.1 页面生成核心原则（重要）

> ⚠️ **页面数量 ≠ prototype HTML 数量**

**判断依据（按优先级）**：

1. **功能需求**：根据 prototype 提取的功能清单决定页面边界
   - 例：prototype 有"用户认证"功能，但只有 1 个简单的表单 → 可拆为「登录页」+「注册页」2 个页面（功能完整）
   - 例：prototype 有"商品详情"功能但 HTML 简陋 → 可补全规格选择、评价等细节

2. **prototype 视觉风格**：必须 100% 复用
   - 颜色：`var(--primary)` 等 tokens
   - 字体：`tokens.css` 中的 font-family
   - 圆角、阴影、间距：tokens 中的 CSS 变量
   - 组件外观：参考 prototype/components.css

3. **prototype 布局结构**：参考但不机械照搬
   - 头部位置、底部 Tab 位置、卡片样式等可以复用
   - 但页面内部的逻辑流程可以重新组织
   - 例：prototype 的 me.html 把资料和设置挤在一个页面 → 可拆为 2 页

4. **业务合理性**：
   - 不能为了"和 prototype 一致"而保留糟糕的 UX
   - 应当用更好的方式实现同样的功能

**实施 Step 6-N 时**：
1. 先列出本 Step 要实现的功能
2. 确认要新建/修改哪些页面（不机械 1:1）
3. 视觉从 prototype 对应 HTML 提取
4. 实现完整功能（不必和 prototype 一样简陋）

实施过程中**不要**：
- ❌ 询问用户"是否继续？"
- ❌ 提示用户运行命令
- ❌ 等待用户反馈

实施过程结束输出：
```
✅ Phase 1 全部完成！

📊 已实施 N 个 Step：
   ✓ Step 0: 创建 frontend/ 目录
   ✓ Step 1: 项目脚手架
   ✓ Step 2: 设计令牌
   ...
   ✓ Step N+1: 联调

� 产出文件：
   • frontend/package.json
   • frontend/src/pages/*.vue (M 个)
   • frontend/src/components/*.vue (K 个)
   ...

🚀 Phase 2：现在请你测试所有页面
```

#### 4.2 Phase 2：一次性提示用户测试（不询问实施）

**重要**：这是**唯一一次**提示用户测试的地方。

输出：
```
🎉 所有前端页面已开发完毕！

🚀 请你在终端自己执行下面命令测试所有页面：

   cd "d:\Codes\scorch-agents\<project-name>\frontend"
   npm install   # 第一次需要安装依赖
   npm run dev   # 启动开发服务器

   然后浏览器打开：http://localhost:5173

🔍 请你自由测试以下内容：
   ☐ 所有页面的显示效果（布局、颜色、字体）
   ☐ 所有按钮的交互（点击、滑动、切换）
   ☐ 页面之间的跳转逻辑
   ☐ localStorage 数据持久化（登录、收藏等）

📋 测试完毕后，请在对话里回复：
   • "测试完了" / "测完了" / "完成测试" → 进入 Phase 3
   • 或具体问题描述 → agent 先修复再继续
```

**等待用户反馈**：不要催用户。

#### 4.3 Phase 3：用户反馈后 → 批量标记 + 逐个询问

**触发条件**：用户在对话中说"测完了"、"测试完成"、"OK" 等关键词，或主动列出问题

**子流程 A：批量标记（agent 自动）**

agent **一次性**扫描所有页面和功能按钮，更新 STEPS.md：

```
1. 更新 Phase 2 页面验收清单的"已标记"列 → 全部打 ☑
2. 更新 Phase 3 按钮验收清单的"已标记"列 → 全部打 ☑
3. 更新 Phase 4 项目状态：
   - 实施进度：N / N ☑
   - 页面验收：0 / M ☐
   - 按钮验收：0 / K ☐
4. 追加修改记录
```

输出示例：
```
📋 已批量标记：
   ✓ 页面验收：M 个已标记
   ✓ 按钮验收：K 个已标记

现在开始逐个确认...
```

**子流程 B：逐个询问页面（每个都用 AskUserQuestion）**

对每个页面，使用 `AskUserQuestion`：

> 页面 1/6：启动+登录（frontend/src/pages/Index.vue）
>
> 该页面的显示与交互是否满意？
> - **A. 满意** → 标记 ☑
> - **B. 需要修改** → 请告诉我具体问题，agent 修改后再来确认
> - **C. 跳过**（不验收）

**逐个顺序**：按 STEPS.md 中的序号依次询问，每完成一个就更新"用户确认"列。

**子流程 C：逐个询问按钮**

页面全部确认后，再逐个询问按钮：

> 按钮 1/N：登录/注册按钮（启动+登录页面）
>
> 该按钮的交互是否正常？
> - **A. 满意** → 标记 ☑
> - **B. 需要修改** → 请描述问题
> - **C. 跳过**

**注意事项**：
- ⚠️ 用户的"用户确认"必须由用户明确选择 A 后才能勾选
- ⚠️ B 选项触发修改：agent 修改后**重新回到该页面/按钮**询问
- ⚠️ C 选项跳过：保持 ☐，最终统计会显示未完成项

#### 4.4 Phase 4：全部验收后 → 询问是否开始 API 设计

**触发条件**：所有页面（M 项）和按钮（K 项）的"用户确认"列都已打 ☑

agent 输出：
```
🎉 前端全部验收完成！

📊 最终状态：
   ✅ 实施进度：N / N
   ✅ 页面验收：M / M
   ✅ 按钮验收：K / K

🚀 项目可运行：
   cd frontend
   npm run dev

📦 生产构建：
   cd frontend
   npm run build

---

❓ 接下来是否开始设计这个项目的 API？

   • **A. 是 → 调用 /saapi**（开始 API 设计规划）
   • **B. 暂不 API，先调整前端** → 回到 Phase 3 继续验收
   • **C. 结束** → 标记 STEPS.md 完成

> 📌 **完整闭环**：safrontend → saapi → sabackend → **saapi-connect**（前后端接通）。
> 当前 safrontend 完成的是 Phase 4 的「前端开发验收」，后续 `/saapi-connect` 阶段会用 safrontend 阶段生成的 API 客户端脚手架（Step 5.5）接入真实后端。

**用户选 A 时**：

agent **必须调用 `/saapi` skill**（不要在 safrontend 内做 API 设计）。

更新 STEPS.md：
- Phase 4 项目状态：`API 设计：🚀 进行中（已调用 /saapi）`
- 追加修改记录

**用户选 B 时**：
- 回到 Phase 3 继续验收/修改

**用户选 C 时**：
- Phase 4 项目状态：`API 设计：⏭ 用户暂不需要`
- 输出最终完成提示

#### 4.5 断点续跑

用户重新执行 `/safrontend` 时：
1. 读取 STEPS.md
2. 检查当前阶段：
   - Phase 1 未完成 → 继续实施剩余 Step
   - Phase 1 已完成，Phase 2 未完成 → 重新提示测试
   - Phase 2 已完成，Phase 3 进行中 → 继续逐个询问未确认项
   - Phase 4 完成 → 输出最终状态

#### 4.6 回滚 / 插入 / 跳过

由于 Phase 1 已批量实施，回滚/插入/跳过在 Phase 3 阶段适用：

**回滚某个页面/按钮**（在 Phase 3）：
- 用户在某页面/按钮选 B 并描述问题
- agent 修改该页面/按钮代码
- 重新标记该页面/按钮为"待用户确认"状态
- 重新询问

**插入新页面/按钮**（在 Phase 3）：
- 用户要求新增页面/按钮
- agent 在 STEPS.md 中插入新条目
- 实施代码
- 加入逐个询问队列

**跳过页面/按钮**（在 Phase 3）：
- 用户选 C → 标记 `-`（不适用）
- 后续询问跳过该项

#### 4.7 动态命令（任意时刻可用）

| 命令 | 效果 |
|------|------|
| `/safrontend status` | 查看当前阶段与进度 |
| `/safrontend list-pending` | 列出未确认的页面和按钮 |
| `/safrontend retry-page <name>` | 重新询问指定页面 |
| `/safrontend retry-button <name>` | 重新询问指定按钮 |
| `/safrontend start-api` | 立即调用 /saapi（跳过询问） |

### Step 5：全部完成后输出

> 注：本步骤的实际触发在 Phase 4 完成时（详见 4.4）

```
🎉 前端全部完成！

📊 最终状态：
   ✅ 实施进度：N / N
   ✅ 页面验收：M / M
   ✅ 按钮验收：K / K

📁 项目结构：
   prototype/    原型设计
   frontend/     前端代码（本次开发产出）
   STEPS.md      步骤记录

🚀 项目已可运行：
   cd frontend
   npm run dev

📦 构建生产版本：
   cd frontend
   npm run build

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| YYYY-MM-DD | 初版：四阶段流程（实施/测试/验收/API 设计），Vue 3 / React 18 双栈支持 |
| YYYY-MM-DD v2 | Phase 1 新增 Step 5.5「API 客户端脚手架」：生成 client.ts / auth.ts / errorHandler.ts / .env.example 6 个文件，为 `/saapi-connect` 预留接入点；Phase 4 末尾提示完整闭环 `safrontend → saapi → sabackend → saapi-connect` |
| YYYY-MM-DD v3 | safrontend 被重复调用时的兼容规则：检测 `/saapi-connect` 已完成则不重新生成 mock；检测 `client.ts` 已有真实 baseURL 则不覆盖；用户主动回 mock 模式时提示备份 |
| YYYY-MM-DD v4 | Step 5.5 脚手架改为 A/B/C 框架分支：Vue 3+Pinia / React 18+Zustand / React 18+RTK 各自 mock 实现；明确「AI 只填用户所用框架的分支」；增加「其它框架需询问用户」约束 |

📋 完整记录见 STEPS.md

---

❓ 接下来是否开始设计这个项目的 API？
   • A. 是 → 调用 /saapi
   • B. 暂不 API，先调整前端
   • C. 结束（标记完成）
```

**详细处理见 4.4 Phase 4**：用户选 A → agent 调用 `/saapi`。

## 关键技术约束

- ⚠️ **风格 100% 对齐 prototype**：
  - 颜色、字体、间距、圆角、阴影必须用 `tokens.css` 中的 CSS 变量
  - 组件外观参考 prototype 的 `components.css`
  - **这些不能改**，是设计的核心
- ⚠️ **布局可灵活调整**：
  - 头部/底部/Tab 位置参考 prototype
  - 页面内部逻辑流程可重新组织
  - 可以根据功能合并/拆分页面
- ⚠️ **页面基于功能生成，不机械 1:1 对应 prototype HTML**：
  - prototype 是参考，不是约束
  - 功能完整 > 与 prototype 文件一一对应
  - 例：prototype 的 `me.html` 简陋，可拆为多个页面
- ⚠️ **所有前端代码必须在 `frontend/` 下**：
  - Step 0 先创建 `frontend/` 目录
  - 写入文件路径必须以 `frontend/` 开头
  - **禁止**在项目根目录创建 `src/`、`package.json`、`vite.config.ts` 等
- ⚠️ **STEPS.md 是真实记录**：必须实际更新文件，不能只在对话中说"已标记"
- ⚠️ **Phase 1 不打扰用户**：agent 必须一次性完成所有 Step，期间不询问、不暂停
- ⚠️ **Phase 3 用户确认不能自动勾选**：
  - "已标记"（☑）可以由 AI 自动批量打勾
  - **"用户确认"（☑）必须由用户在 AskUserQuestion 中明确选 A 后才能勾选**
- ⚠️ **Phase 4 必须询问 API 设计**：前端全部验收后必须问用户是否调用 `/saapi`

## 步骤数估算公式

```
Phase 1（实施）Step 数 = 6（基础）+ prototype 页面数
  例：6 页 → 12 Step（0~5 基础 + 6 个页面 Step + 1 个联调）

Phase 2（提示测试）：1 次提示
Phase 3（逐项验收）：M 个页面 + K 个按钮的逐个确认
Phase 4（API 询问）：1 次询问
```

## 关联 Skill

- `sainit-*` — 前置（生成 prototype）
- `frontend-design` — 高保真 UI 参考
- `saapi` — Phase 4 调用（API 设计）
- `sadeploy` — 后续部署