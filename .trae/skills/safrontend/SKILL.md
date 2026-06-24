---
name: "safrontend"
description: "基于已有 prototype/ 原型，按步骤开发前端代码（Vue 3 或 React 18），自动生成并维护 STEPS.md，每个步骤完成后需用户验收。Invoke when 用户输入 /safrontend 或要求把原型转化为可运行的前端项目。"
---

# /safrontend — 原型转前端代码

## 触发条件

- 用户输入 `/safrontend` 或 `/safrontend <项目目录>`
- 前置条件：项目目录已有 `prototype/`（由 `/sainit-*` 生成）

## 工作流程（严格按顺序）

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
- **目标**：将 prototype/ 下的 N 个 HTML 页面转化为 Vue/React 组件
- **页面清单**：
  | 原型文件 | 对应组件 |
  |---------|---------|
  | `prototype/index.html` | `frontend/src/pages/Index.vue` (或 `.tsx`) |
  | `prototype/home.html` | `frontend/src/pages/Home.vue` |
  ...（按 prototype 实际页面生成）

---

## 🚧 开发步骤

### Step 0: 创建 frontend/ 目录（前置，必做）

**目标**：**先创建空的 `frontend/` 目录**，后续所有代码都在此目录下

**执行步骤**：
1. 检查 `<project-name>/frontend/` 是否存在
2. **如果不存在**：执行 `mkdir frontend` 创建
3. **如果已存在**：提示用户
   - 目录为空 → 继续
   - 目录非空（已有 package.json 等）→ 询问是否清空 / 跳过 / 备份后继续

**预计命令**：
```bash
# 检查并创建
if [ ! -d frontend ]; then
  mkdir frontend
  echo "✅ frontend/ 目录已创建"
else
  echo "⚠️ frontend/ 已存在"
  ls frontend/
fi
```

**验证标准**：
- `frontend/` 目录存在
- `frontend/` 目录当前为空（或用户已确认继续）

**状态**：⏳ 待开始

---

### Step 1: 项目脚手架

**目标**：在已创建的 `frontend/` 目录下初始化 Vite + <框架> 项目，建立目录结构

**前置条件**：Step 0 已完成，`frontend/` 目录存在

**预计产出**（全部位于 `frontend/` 下）：
- `frontend/package.json`
- `frontend/vite.config.ts`（或 `.js`）
- `frontend/index.html`（Vite 入口 HTML）
- 入口文件（`frontend/src/main.ts` / `frontend/src/main.tsx`）
- `frontend/src/App.vue`（或 `App.tsx`）
- 基础目录结构：
  ```
  frontend/src/
  ├── pages/         # 页面组件
  ├── components/    # 通用组件
  ├── stores/        # 状态管理
  ├── router/        # 路由
  ├── styles/        # 全局样式
  └── utils/         # 工具函数
  ```

**预计命令**：
```bash
# cd 进 frontend/（必须先存在，由 Step 0 创建）
cd frontend

# Vue 3 + TS
npm create vite@latest . -- --template vue-ts
npm install vue-router pinia

# React 18 + TS
npm create vite@latest . -- --template react-ts
npm install react-router-dom zustand
```

**状态**：⏳ 待开始

---

### Step 2: 设计令牌与全局样式

**目标**：将 `prototype/assets/css/tokens.css` 移植到 Vue/React 项目

**预计产出**（位于 `frontend/src/styles/`）：
- `frontend/src/styles/tokens.css`（CSS 变量）
- `frontend/src/styles/global.css`（全局样式）

**操作**：
1. 复制 `prototype/assets/css/tokens.css` 内容
2. 在 `frontend/src/styles/` 下创建同名文件
3. 在入口文件引入

**状态**：⏳ 待开始

---

### Step 3: 通用组件库

**目标**：实现 prototype/components.css 中的通用组件

**预计产出**（位于 `frontend/src/components/`）：
- `frontend/src/components/Button.vue` / `.tsx`
- `frontend/src/components/Card.vue` / `.tsx`
- `frontend/src/components/Input.vue` / `.tsx`
- `frontend/src/components/BottomTab.vue` / `.tsx`
- `frontend/src/components/SubHeader.vue` / `.tsx`
- `frontend/src/components/ListItem.vue` / `.tsx`

**每个组件**：
- Props 设计
- 样式与 prototype 完全一致
- 基础用法示例

**状态**：⏳ 待开始

---

### Step 4: 路由配置

**目标**：配置路由，对应 prototype 页面

**预计产出**：
- `frontend/src/router/index.ts`
- 路由表（path → component）
- 路由守卫（登录态检查）

**状态**：⏳ 待开始

---

### Step 5: 状态管理（Store）

**目标**：将 prototype/common.js 中的 Store 移植

**预计产出**（位于 `frontend/src/stores/`）：
- `frontend/src/stores/user.ts`（用户、token）
- `frontend/src/stores/<业务>.ts`（如 cart、todos 等）

**Vue Pinia 示例**：
```typescript
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(`${PROJECT_KEY}:token`) || '',
    user: JSON.parse(localStorage.getItem(`${PROJECT_KEY}:user`) || 'null')
  }),
  actions: {
    login(userData) {
      this.token = 'mock-' + Date.now();
      this.user = userData;
      localStorage.setItem(`${PROJECT_KEY}:token`, this.token);
      localStorage.setItem(`${PROJECT_KEY}:user`, JSON.stringify(userData));
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem(`${PROJECT_KEY}:token`);
      localStorage.removeItem(`${PROJECT_KEY}:user`);
    }
  }
});
```

**状态**：⏳ 待开始

---

### Step 6: 启动页 + 登录（index.html → Index 页面）

**目标**：实现 `prototype/index.html` 对应的 Vue/React 页面

**预计产出**：
- `frontend/src/pages/Index.vue` / `.tsx`
- 包含 Hero 区、登录表单、其他登录方式
- 与 prototype 视觉 1:1 一致

**状态**：⏳ 待开始

---

### Step 7: 首页（home.html → Home 页面）

**目标**：实现 `prototype/home.html`

**预计产出**：
- `frontend/src/pages/Home.vue` / `.tsx`

**状态**：⏳ 待开始

---

...（按 prototype 页面数生成 Step 7-N，每个页面对应一个 Step，产出位于 `frontend/src/pages/`）

---

### Step N: 联调与构建测试

**目标**：完整跑通所有页面，验证跳转与状态

**预计操作**（在 `frontend/` 目录下）：
- `npm run dev` 启动开发服务器
- 浏览器手动测试所有用户路径
- `npm run build` 验证构建无错误

**状态**：⏳ 待开始

---

## ✅ 验收记录

| Step | 实施完成 | 用户验收 | 备注 |
|------|---------|---------|------|
| Step 1 | ☐ | ☐ | - |
| Step 2 | ☐ | ☐ | - |
| Step 3 | ☐ | ☐ | - |
| ... | ☐ | ☐ | - |
```

**说明**：
- 每个页面（prototype 下的 HTML）对应一个 Step
- 总步骤数 ≈ prototype 页面数 + 5（脚手架、tokens、components、router、store、联调）
- 所有前端代码产出均在 `frontend/` 下

### Step 4：循环执行每个 Step

> 🚨 **核心原则（必须严格遵守）**：
> 1. **用户验收列默认是 ☐（未勾选）**，AI 永远不能自动勾选
> 2. 每个 Step 完成后，AI 提示用户**自己执行命令**运行验证
> 3. AI 主动向用户提问「是否满意？」
> 4. 用户明确表示「满意」后，AI 才将「用户验收」列打 ☑
> 5. 用户表示「不满意」时，AI 等待用户输入修改意见后迭代
> 6. **未通过用户验收的 Step 不能进入下一个 Step**

对 STEPS.md 中每个 Step，按以下协议执行：

#### 4.0 前置检查（每个 Step 开始前必做）

1. **检查 `frontend/` 目录是否存在**：
   ```bash
   if [ ! -d frontend ]; then
     echo "❌ frontend/ 目录不存在！"
     echo "⚠️ 必须先执行 Step 0 创建 frontend/ 目录"
     exit 1
   fi
   ```
2. **如果不存在**：立即停止当前 Step，提示用户回到 Step 0 创建目录
3. **如果存在**：继续执行

#### 4.1 实施 Step

1. **读取 prototype 对应 HTML**（如有），作为视觉参考
2. **生成对应代码**（**所有路径必须在 `frontend/` 下**）：
   - 创建必要的文件（components、pages 等）
   - 编写代码（与 prototype 视觉保持一致）
   - 配置依赖（如有）
3. **路径安全检查**：
   - 写入文件前确认路径以 `frontend/` 开头
   - **禁止**在项目根目录创建 `src/`、`package.json` 等
4. **更新 STEPS.md**：
   - 该 Step 的 **状态**：`⏳ 待开始` → `🔨 实施中` → `✓ 实施完成`（**仅实施完成，不是验收通过**）
   - 验收记录的 **实施完成** 列：打 ☑
   - 验收记录的 **用户验收** 列：**保持 ☐ 不动**（等用户主动确认）

#### 4.2 提示用户自己执行命令验证

> ⚠️ **AI 不要自动运行 `npm run dev` 等服务**，让用户在终端自己执行
> ⚠️ **AI 不要自动勾选用户验收列**

输出：
```
✅ Step X 实施完成！

📝 已修改文件：
   • frontend/src/pages/Home.vue
   • frontend/src/router/index.ts

🚀 请你在终端自己执行下面命令来验证：

   cd "d:\Codes\scorch-agents\cotton-store\frontend"
   npm run dev

   然后浏览器打开：http://localhost:5173

🔍 请重点检查：
   ☐ 首页布局与 prototype 一致
   ☐ 点击 Tab 切换正常
   ☐ 样式与原型一致

📋 STEPS.md 状态已更新：
   - 实施完成：☑
   - 用户验收：☐（待你确认）
```

#### 4.3 询问用户是否满意

**必须使用 `AskUserQuestion`** 向用户提问：

> Step X - <标题> 已实施完成，请问你是否满意？
> 
> 💡 如果你已经在终端运行了 `npm run dev` 并检查过效果，请告诉我：
> - **A. 满意，继续下一步** → AI 会将「用户验收」打勾并进入 Step X+1
> - **B. 需要修改** → 请直接告诉我你想怎么改，AI 会根据你的反馈调整
> - **C. 暂停** → 保存当前进度，下次执行 `/safrontend` 从这里继续
> - **D. 我还没测，等我测完再说** → AI 等待你测试完成

**多选支持**：用户可以直接在对话里输入"满意"、"继续"、"可以"、"通过"等关键词，AI 识别后自动勾选用户验收。

#### 4.4 用户满意后的处理

**触发条件**：用户在 AskUserQuestion 中选 A，或在对话中明确表示「满意」「继续」「通过」

1. **更新 STEPS.md**：
   - 验收记录的 **用户验收** 列：打 ☑
   - 该 Step 状态变为：`✓✓ 验收通过`

2. **输出并询问下一步**：

> ✅ Step X 已验收通过！
>
> 📋 当前进度：X / N
> 下一步：Step X+1 - <标题>
>
> 继续吗？
> - **A. 继续 Step X+1**
> - **B. 回滚到之前某个 Step**（详见 4.7）
> - **C. 插入新 Step**（详见 4.8）
> - **D. 暂停**（当前进度已保存到 STEPS.md，下次执行 /safrontend 会从断点继续）

#### 4.5 用户不满意（4.3 选 B）的处理

**触发条件**：用户在 AskUserQuestion 中选 B，或在对话中说"不满意"、"改一下"、"XXX 有问题"等

1. AI 等待用户在对话里提供具体修改意见
2. 根据反馈调整代码
3. **重走 4.1-4.3 流程**（包括再次提示用户运行命令验证）
4. **重要**：用户验收列保持 ☐ 不变，实施完成 ☑ 保留（修改是该 Step 的迭代）

#### 4.6 断点续跑

用户重新执行 `/safrontend` 时：
1. 读取 STEPS.md
2. 找到第一个「用户验收」未勾选的 Step
3. 从该 Step 继续（**注意：不是从「实施完成」未勾选的 Step 继续**）

#### 4.7 回滚 Step（Rollback）

**触发场景**：用户已验收 Step N 之后，发现 Step X（X ≤ N）有问题，需要回到 Step X 重做。

**协议**：

1. **询问目标 Step**：
   使用 `AskUserQuestion`，列出所有已「实施完成」的 Step，让用户选择回滚目标。

   > 需要回滚到哪个 Step？
   > - **A. Step X**（回到 Step X 实施完成后的状态，删除 X+1 到 N 的所有改动）
   > - **B. Step X-1**（回到 X-1 实施完成后的状态）
   > - ...

2. **预览影响范围**：
   - 列出将被删除/还原的文件
   - 列出将被重置的 Step
   - 等用户二次确认

3. **执行回滚**（按项目是否有 git 仓库选择策略）：

   **策略 A：项目有 `.git`**（推荐）
   ```bash
   # 假设每个完成 Step 都做了 commit（commit message 含 step 编号）
   git log --oneline | grep "step-N"
   # 回滚到目标 Step 之后的 commit
   git reset --hard <commit-of-target-step>
   ```
   - 删除从目标 Step 到当前的所有 commit
   - 文件系统回到目标 Step 完成时的状态

   **策略 B：无 git（手动快照）**
   1. 读取 STEPS.md 中目标 Step 之前 Step 记录的「产出文件」清单
   2. 删除目标 Step 之后 Step 涉及的所有文件
   3. 重写目标 Step 之后 Step 的代码（用 git stash 或备份机制）

4. **更新 STEPS.md**：
   - 目标 Step 的状态：保持 `✓✓ 验收通过`
   - 目标 Step 之后的所有 Step：
     - 状态：重置为 `⏳ 待开始`
     - 验收记录：「实施完成」「用户验收」全部打 ☐

5. **从目标 Step 重新执行**：
   ```
   ⏪ 已回滚到 Step X
   
   📋 当前进度：X / N
   下一步：Step X（重新实施）
   
   是否继续？
   - A. 重新实施 Step X
   - B. 暂停
   ```

**注意事项**：
- ⚠️ **回滚前必须二次确认**（不可逆操作）
- ⚠️ **建议项目初始化时 `git init`**，让回滚有据可查
- ⚠️ **跨设备/分支的回滚**：只处理当前分支，不影响远程

#### 4.8 插入新 Step（Insert）

**触发场景**：开发过程中发现需要补充一个 Step（例如 Step 5 之后发现需要先做"国际化配置"才能做 Step 6）。

**协议**：

1. **询问插入位置**：
   使用 `AskUserQuestion`，让用户选择插入位置。

   > 在哪个位置插入新 Step？
   > - **A. 在 Step X 之后**（作为新 Step X+1，原 Step X+1 变为 X+2）
   > - **B. 在两个 Step 之间**（指定 Step X 和 X+1 之间）

2. **询问新 Step 信息**：
   - 标题
   - 目标描述
   - 预计产出
   - 预计命令（如有）

3. **更新 STEPS.md**：
   - 在指定位置插入新 Step
   - 后续所有 Step 编号 +1
   - **重置受影响 Step 的状态**：
     - 新插入 Step 之后的、已「实施完成」或「用户验收」的 Step，全部重置为 `⏳ 待开始`
     - 这是因为新 Step 可能影响它们的实现

4. **执行新 Step**：
   - 按 4.1-4.4 协议实施新 Step
   - 之后继续执行后续 Step

**注意事项**：
- ⚠️ **插入位置之后的所有 Step 视为失效**，必须重做
- ⚠️ 新 Step 的目标要清晰，否则后续 Step 可能仍需调整

#### 4.9 跳过 Step（Skip）

**触发场景**：某些 Step 在当前项目不需要（例如不需要做"主题切换"功能）。

**协议**：

1. **确认跳过必要性**：
   > 确认要跳过 Step X 吗？
   > - **A. 确认跳过**（标记为 `⏭ 已跳过`，不实施）
   > - **B. 取消**（不跳过）

2. **更新 STEPS.md**：
   - 该 Step 状态：`⏳ 待开始` → `⏭ 已跳过`
   - 验收记录：标记为 `-`（不适用）
   - 原因说明写入「备注」列

3. **后续 Step 不受影响**，继续执行

**注意事项**：
- ⚠️ 跳过 Step 可能影响后续 Step 的实现（如下游 Step 依赖跳过的功能）
- ⚠️ 若发现下游 Step 无法继续，提供以下选择：
  - 恢复跳过 Step 并实施
  - 调整下游 Step 移除依赖
  - 接受功能缺失继续

#### 4.10 动态命令（在 Step 4 任意时刻可用）

用户可随时输入以下指令（无需等待提示）：

| 命令 | 效果 |
|------|------|
| `/safrontend rollback` | 启动回滚流程（同 4.7） |
| `/safrontend insert` | 启动插入 Step 流程（同 4.8） |
| `/safrontend skip` | 启动跳过 Step 流程（同 4.9） |
| `/safrontend status` | 查看当前进度（已 X/N，未完成列表） |
| `/safrontend list` | 列出所有 Step 及状态 |
| `/safrontend goto <N>` | 跳到指定 Step（不推荐，可能破坏状态） |

### Step 5：全部完成后输出

```
🎉 所有 Step 验收完成！

📊 总进度：N / N ✓✓

� 项目结构：
   prototype/    原型设计
   frontend/     前端代码（本次开发产出）
   STEPS.md      步骤记录

�� 项目已可运行：
   cd frontend
   npm run dev

📦 构建生产版本：
   cd frontend
   npm run build

📋 完整记录见 STEPS.md

下一步建议：
- /sadeploy 一键部署到预览环境
- /saapi 添加后端 API 集成
```

## 关键技术约束

- ⚠️ **严格对齐 prototype**：颜色、字体、间距、圆角必须用 `tokens.css` 中的 CSS 变量
- ⚠️ **不要修改视觉**：除非用户明确说"调整样式"
- ⚠️ **每个 Step 独立可运行**：哪怕是中间 Step，完成后 `npm run dev` 也不能报错
- ⚠️ **STEPS.md 是真实记录**：必须实际更新文件，不能只在对话中说"已标记"
- ⚠️ **断点续跑支持**：用户中断后再来 `/safrontend` 必须能从断点继续
- ⚠️ **所有前端代码必须在 `frontend/` 下**：
  - Step 0 先创建 `frontend/` 目录
  - 每个 Step 开始前检查 `frontend/` 存在
  - 写入文件路径必须以 `frontend/` 开头
  - **禁止**在项目根目录创建 `src/`、`package.json`、`vite.config.ts` 等
- ⚠️ **【强制】用户验收不能自动勾选**：
  - 实施完成（☑）可以由 AI 标记
  - **用户验收（☑）必须由用户在对话中明确确认后，AI 才能勾选**
  - 用户验收未勾选 = 该 Step 未通过，AI 不得进入下一个 Step

## 步骤数估算公式

```
总 Step 数 = 6（基础，含 Step 0 创建 frontend/） + prototype 页面数 - 1（index 与基础合并可选）

例：6 个 prototype 页面
  → 6 + 6 = 12 个 Step（含 Step 0 + 脚手架/tokens/components/router/store/各页/联调）

例：10 个 prototype 页面
  → 6 + 10 = 16 个 Step
```

## 关联 Skill

- `sainit-*` — 前置（生成 prototype）
- `frontend-design` — 高保真 UI 参考
- `sadeploy` — 后续部署
- `saapi` — 后续接入后端 API