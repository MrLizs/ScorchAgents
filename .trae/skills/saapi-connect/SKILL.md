---
name: "saapi-connect"
description: "把 /safrontend 和 /saadmin 生成的前端代码接入到 /sabackend 实现的真实后端 API：替换 baseURL、注入 JWT、全局错误处理、替换 mock 认证、配置 Vite proxy 与后端 CORS。可由 /sabackend 末尾自动触发，也可手动调用。Invoke when 后端已实现完毕需要接通前后端及后台管理面板，或用户输入 /saapi-connect。"
---

# /saapi-connect — 前后端接通

## 为什么需要这一步？

```
/safrontend ──► 前端开发时用 localStorage mock 数据（没真实后端）
/saapi      ──► 接口规范已定（含 Admin API）
/sabackend  ──► 后端实现完毕
/saadmin    ──► 后台管理面板开发完毕
              ↓
         【前后端接通】← 本 skill 负责
              ↓
   主前端 + admin 后台 → 真实调用后端，JWT 鉴权，错误统一处理
```

**问题场景**（不接通的痛点）：
- 前端 store 里塞的是假 token，刷新就掉登录
- axios 指向 `localhost:3000`（mock 地址），但后端跑在 `localhost:8080`
- 401 报错没拦截，用户看到一片白屏
- 后端没开 CORS，浏览器跨域失败

**这个 skill 的工作**：把上面 4 个坑一次性填完，让 `npm run dev` 同时启动前后端就能跑通真实业务。

## 触发条件

- 用户输入 `/saapi-connect` 或 `/saapi-connect <项目目录>`
- **自动触发**：sabackend 全部接口完成后，末尾会询问「是否开始接入前端？」选是即跳到此 skill
- **前置条件**：
  - `frontend/` 已存在（来自 `/safrontend`）
  - `backend/` 已存在（来自 `/sabackend`）
  - `api/openapi.yaml` 已存在（来自 `/saapi`）
  - safrontend 在 Phase 1 已生成 API 客户端脚手架（详见 §「前置约定」）

## 核心原则

1. **API 客户端脚手架已在 safrontend Phase 1 生成**：本 skill **只填空**，不重写文件结构
2. **baseURL 来源**：`frontend/.env.{development,production}` → `VITE_API_BASE_URL`
3. **JWT 流程**：登录拿 access + refresh → request 拦截器自动注入 → 401 触发 refresh → refresh 失败跳登录
4. **错误处理**：HTTP 错误（4xx/5xx/网络）→ 业务错误 toast；401/403 特殊处理
5. **mock 认证替换**：所有 `localStorage.getItem('mock_token')` 改成走真实登录接口
6. **Vite proxy**：开发环境 `/api/*` 代理到后端，避免 CORS
7. **后端 CORS**：允许 `http://localhost:5173`（Vite 默认端口）
8. **不动 `api/` 目录**：那是 `/saapi` 的领域
9. **记录到 STEPS.md**：**每执行完一步立即增量记录**（不等所有步骤做完），改了哪个文件、改动类型（新建/修改/删除）、涉及 mock 清理与否都要写
10. **mock 清理是独立步骤**：用户切换回 safrontend 重新开发时可能再产生 mock_token，本 skill 必须显式清理
11. **HTTPS 证书 / 反代 SSL 终止**：本 skill 不涉及，留给部署阶段

## 前置约定（依赖 safrontend Phase 1 预留）

> 📌 **本 skill 假定 safrontend 已在 Phase 1 生成以下脚手架**。若未生成，本 skill 也会临时创建，但建议升级 safrontend。

| 文件 | 作用 | safrontend 已生成？ |
|------|------|-------------------|
| `frontend/src/api/client.ts` | axios 实例（带 interceptor 占位） | ✅ 应已生成 |
| `frontend/src/api/auth.ts` | login / logout / refresh 函数封装 | ✅ 应已生成 |
| `frontend/src/api/users.ts` | 用户相关 API | ✅ 应已生成 |
| `frontend/src/stores/auth.ts` | Pinia/Zustand auth 状态（mock 实现） | ✅ 应已生成 |
| `frontend/src/utils/errorHandler.ts` | 全局错误处理（占位） | ✅ 应已生成 |
| `frontend/.env.example` | 环境变量模板 | ✅ 应已生成 |
| `frontend/.env.development` | 开发环境变量（待本 skill 写入） | ❌ 本 skill 生成 |
| `frontend/.env.production` | 生产环境变量（待本 skill 写入） | ❌ 本 skill 生成 |

## STEPS.md 增量记录机制（强约束）

> ⚠️ **本 skill 一气呵成，但每执行一步立即写入 STEPS.md，不等所有步骤做完再补记**。

**记录位置**：项目根目录 `STEPS.md`，在 sabackend 章节之后追加「前端接入」主章节。

**记录模板**（每步完成后追加一行）：

```markdown
## 🔌 前端接入（基于 /sabackend 真实 API）

> 接入时间：YYYY-MM-DD HH:mm
> 触发方式：<自动（sabackend 末尾触发）/ 手动 /saapi-connect>
> 后端基址：`<baseURL>`（从 backend/config.yaml 读取）
> API 前缀：`/api/v1`
> 命名规范：前缀 `<prefix>_`（与 sabackend 一致）

### 🔌 接入步骤进度

| 时间 | 步骤 | 状态 | 改动摘要 |
|------|------|------|---------|
| HH:mm | Step 0：前置检查 | ✅ | 三件套就位 / 指纹比对 |
| HH:mm | Step 1：环境变量 | ✅ | 新建 .env.development / .env.production |
| HH:mm | Step 2：API 客户端 | ✅ | 填充 client.ts + JWT interceptor |
| HH:mm | **Step 3：清理 mock 认证遗留** | ✅ | 新建 mockCleanup.ts + 扫描删除 <N> 处引用 |
| HH:mm | Step 4：JWT 认证接入 | ✅ | 重写 auth.ts 接真实后端 |
| HH:mm | Step 5：错误处理 | ✅ | 填充 errorHandler.ts |
| HH:mm | Step 6：Vite proxy + CORS | ✅ | vite.config.ts + 后端 CORS 中间件 |
| HH:mm | Step 7：验证接通 | ✅/❌ | 8 项验证结果 |
| HH:mm | Step 8：汇总核对 | ✅ | 与 sabackend 接口清单交叉核对 |
```

> 📌 **AI 执行纪律**：
> - 每完成一个 Step → 立即追加一行到 STEPS.md
> - 摘要要写**具体文件路径 + 改动类型**
> - 不能跳过 / 不能批量补记
> - 失败时也要记录（标 ❌ + 失败原因）

---

## 工作流程（严格按顺序）

### Step 0：前置检查（含前端框架检测）

> 📌 **本 Step 必须先检测前端框架**，后续 Step 2/3/4/5 根据检测结果走 Vue 3 或 React 18 分支。

#### 0.1 三件套检查

1. `frontend/` 存在且含 `package.json`？
2. `backend/` 存在且含 `config.yaml`？
3. `api/openapi.yaml` 存在？
4. 任意一项缺失 → 提示用户先运行对应 skill 并终止

#### 0.2 前端框架检测（决定后续所有代码分支）

**检测逻辑**（按优先级）：

```bash
# 1. 读 STEPS.md（如已生成）—— safrontend 已在「项目信息」记录框架
grep -E "框架：|Framework:" STEPS.md

# 2. 读 frontend/package.json —— 看 dependencies
cat frontend/package.json | jq '.dependencies, .devDependencies'
```

**判断矩阵**：

| 检测到 | 框架 | 状态管理 | UI 库（自动推断） | HTTP 客户端 |
|-------|------|---------|----------------|-----------|
| `vue` 依赖 + `pinia` | **Vue 3** | Pinia | Element Plus / Naive UI / Vant | axios |
| `react` 依赖 + `zustand` | **React 18** | Zustand | Ant Design / MUI / Chakra | axios / fetch |
| `react` 依赖 + `redux toolkit` | **React 18** | Redux Toolkit | 同上 | axios / RTK Query |
| `vue` 依赖（无 pinia） | **Vue 3** | 询问用户 | 询问用户 | 询问用户 |
| 都不是 | **未知** | 询问用户 | 询问用户 | 询问用户 |

> ⚠️ **AI 严禁硬编码默认框架**——必须先检测，再走分支。若检测失败则用 `AskUserQuestion` 询问用户（提供 Vue 3 + Pinia / React 18 + Zustand / 其它 三选项）。

#### 0.3 API 客户端脚手架检查

- 扫描 `frontend/src/api/` 是否已有 `client.ts`
- 不存在 → 警告「safrontend 未生成 API 客户端脚手架」并询问「本 skill 临时生成 / 中断」
- 选择「本 skill 临时生成」→ 按 safrontend 标准结构创建占位文件（**根据检测到的框架走对应分支**）

#### 0.4 指纹比对（沿用 sabackend 机制）

- 计算 `api/openapi.yaml` 的 sha256
- 与 STEPS.md 后端章节的「API 来源指纹」表比对
- 不一致 → 警告「saapi 已更新，是否要先回归后端」

#### 0.5 读取后端配置

- 读取 `backend/config.yaml`，提取 `server.port`（默认 3000）
- 读取 OpenAPI 的 `servers` 节点，确定生产域名（可选）

输出确认：
```
🔍 检测到 frontend/ + backend/ + api/ 三件套齐全
🎨 前端框架：<Vue 3 + Pinia | React 18 + Zustand | ...>（来自 STEPS.md / package.json）
🧩 状态管理：<Pinia | Zustand | RTK>
🎨 UI 库：<Element Plus | Ant Design | ...>
🔐 API 指纹：openapi.yaml sha256=abc123...（与 sabackend 记录一致 ✅）
📡 后端端口：3000（来自 backend/config.yaml）
🚀 开始接入前端...
```

> 📌 **后续 Step 2 / 3.2 / 4 / 5 都会按检测到的框架走对应分支**，不再询问。

---

### Step 1：生成环境变量文件

**目标**：让 baseURL 通过 `.env` 注入，不写死代码。

**生成 `frontend/.env.development`**：
```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:3000
VITE_API_PREFIX=/api/v1
VITE_USE_MOCK=false
```

**生成 `frontend/.env.production`**：
```bash
# 生产环境（由用户填入真实域名）
VITE_API_BASE_URL=https://api.example.com
VITE_API_PREFIX=/api/v1
VITE_USE_MOCK=false
```

> ⚠️ `.env.production` 是模板，**AI 不填真实域名**，只留占位符；用户在部署前手动改。
> ⚠️ `.env.{development,production}` 加入 `.gitignore`（如未加）。

**同时更新 `frontend/.env.example`**：
```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:3000
VITE_API_PREFIX=/api/v1
VITE_USE_MOCK=false

# 生产环境（部署时填写）
# VITE_API_BASE_URL=https://api.example.com
```

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| 2026-XX-XX | Step 1：环境变量 | ✅ | 
  - 新建 `frontend/.env.development`（baseURL=http://localhost:3000）
  - 新建 `frontend/.env.production`（占位，待部署前填）
  - 更新 `frontend/.env.example`
  - 检查 `.gitignore` 含 `.env.*`
```

---

### Step 2：更新 API 客户端（baseURL + axios 实例）

**目标**：在 safrontend 生成的 `client.ts` 占位上，填入真实的 baseURL + interceptor。

**文件**：`frontend/src/api/client.ts`

> 📌 **根据 Step 0.2 检测到的框架，按 A / B / C 分支填入对应代码**。AI 只填用户所用框架的分支，**不展示其它分支的代码**（除非用户主动询问对比）。

---

#### A. Vue 3 + Pinia + axios 分支

**文件**：`frontend/src/api/client.ts`

```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth';
import { handleError } from '@/utils/errorHandler';

const baseURL = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_PREFIX}`;
// 例：http://localhost:3000/api/v1

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ===== Request 拦截器：注入 JWT =====
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = useAuthStore();   // ⚠️ Pinia 在 setup 外需传 pinia 实例，见下方说明
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

// ===== Response 拦截器：401 自动 refresh =====
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const auth = useAuthStore();
    const original = error.config;

    if (error.response?.status === 401 && !original._isRetry && original.url !== '/auth/refresh') {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await auth.refresh();
          isRefreshing = false;
          pendingQueue.forEach((cb) => cb(newToken));
          pendingQueue = [];
          original._isRetry = true;
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        } catch (e) {
          isRefreshing = false;
          auth.logout();
          window.location.href = '/login';
          return Promise.reject(e);
        }
      }
      return new Promise((resolve) => {
        pendingQueue.push((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          original._isRetry = true;
          resolve(apiClient(original));
        });
      });
    }

    handleError(error);
    return Promise.reject(error);
  }
);

export default apiClient;
```

> ⚠️ **Pinia 在 axios interceptor 外部调用**：interceptor 是模块级代码，Pinia 实例必须在 `app.use(pinia)` 之后才能用。如果遇到「getActivePinia was called with no active Pinia」错误，改为：
> ```ts
> import { getActivePinia } from 'pinia';
> const auth = useAuthStore(getActivePinia()!);
> ```

---

#### B. React 18 + Zustand + axios 分支

**文件**：`frontend/src/api/client.ts`

```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth';
import { handleError } from '@/utils/errorHandler';

const baseURL = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_PREFIX}`;
// 例：http://localhost:3000/api/v1

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ===== Request 拦截器：注入 JWT =====
// ⚠️ Zustand 是模块单例（无 Provider），可直接在 interceptor 内部调用
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;   // Zustand getState() API
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Response 拦截器：401 自动 refresh =====
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const authState = useAuthStore.getState();

    if (error.response?.status === 401 && !original._isRetry && original.url !== '/auth/refresh') {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await authState.refresh();
          isRefreshing = false;
          pendingQueue.forEach((cb) => cb(newToken));
          pendingQueue = [];
          original._isRetry = true;
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        } catch (e) {
          isRefreshing = false;
          authState.logout();
          window.location.href = '/login';
          return Promise.reject(e);
        }
      }
      return new Promise((resolve) => {
        pendingQueue.push((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          original._isRetry = true;
          resolve(apiClient(original));
        });
      });
    }

    handleError(error);
    return Promise.reject(error);
  }
);

export default apiClient;
```

> ⚠️ **Zustand 在 interceptor 中调用**：用 `useAuthStore.getState()` 而不是 `useAuthStore()`（后者是 React hook，必须在组件内）。

---

#### C. React 18 + Redux Toolkit + RTK Query 分支

> 📌 **RTK Query 场景**：如果 safrontend 用了 RTK Query，**不需要手写 axios interceptor**，由 RTK Query 的 `baseQueryWithReauth` 处理（详见官方文档）。本 skill 在 RTK 场景下：
> - `client.ts` 改为 `frontend/src/store/api/baseApi.ts`
> - 在 `baseQuery` 中注入 Authorization header
> - 在 `prepareHeaders` 中读取 store
> - 401 → 用 `extraOptions` + `refresh` thunk

---

#### D. 其它框架（Svelte / Angular / Vanilla TS）

询问用户具体框架，提供对应模板。**严禁 AI 自己脑补**。

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| 2026-XX-XX | Step 2：API 客户端 | ✅ |
  - 填充 `frontend/src/api/client.ts`：baseURL + JWT request interceptor + 401 refresh interceptor
  - 检查 axios 版本与 interceptor 类型兼容
  - 若用 fetch 替代：封装 `apiFetch` 函数
```

**如果不使用 axios**（如项目用 fetch）：本 skill 改为封装一个 `apiFetch` 函数。

---

### Step 3：清理 mock 认证遗留（前置清理）

**目标**：把 safrontend 阶段生成的 mock 数据**先全部清掉**，再开始真实接入。避免：
- 浏览器残留 `mock_token` 导致新旧 token 冲突
- 用户来回切换 safrontend / saapi-connect 时再次产生 mock
- 注释 / 控制台残留 `// TODO: 接入真实后端` 干扰代码阅读

**3.1 清理浏览器 localStorage（生成迁移脚本）**

> 📌 **本步骤必须清理 3 个来源的键名**，避免新旧 key 共存造成状态混乱。

| 来源 | 键名模式 | 举例 |
|------|---------|------|
| safrontend mock | 固定串 | `mock_token`, `mock_user`, `fakeToken`, `fakeUser`, `MOCK_AUTH` |
| **prototype 阶段**（sainit-*） | **`<projectName>:*` 前缀** | `<projectName>:token`, `<projectName>:user`, `<projectName>:settings`, `<projectName>:matches`, `<projectName>:messages`, `<projectName>:posts` |
| 其它可疑残留 | `test_*`, `demo_*` 前缀 | `test_login`, `demo_user` |

**前置**：从 STEPS.md「🏷 项目元信息」节读取 `项目名（英文 / kebab-case）` 与 `localStorage 键名前缀`，**禁止猜测**。

**文件**：`frontend/src/utils/mockCleanup.ts`（新建）

```ts
/**
 * safrontend + prototype 阶段遗留的 localStorage 数据清理工具
 * 在 saapi-connect 启动时执行一次，之后不再使用
 */

// ⚠️ 必填：与 sainit-* 写入 STEPS.md 的「项目名（英文 / kebab-case）」一致
const PROJECT_NAME = '<projectName>';

export function cleanupMockAuth() {
  // 1. safrontend 阶段的 mock 键名
  const mockKeys = ['mock_token', 'mock_user', 'fakeToken', 'fakeUser', 'MOCK_AUTH'];
  mockKeys.forEach((key) => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      console.info(`[saapi-connect] 已清理 safrontend mock: localStorage.${key}`);
    }
  });

  // 2. prototype 阶段（sainit-*）的 <projectName>:* 前缀键名
  //    必须按 prefix 全量清理，避免新旧 token / user 共存
  const projectPrefix = `${PROJECT_NAME}:`;
  const projectKeys = Object.keys(localStorage).filter((k) => k.startsWith(projectPrefix));
  projectKeys.forEach((key) => {
    localStorage.removeItem(key);
    console.info(`[saapi-connect] 已清理 prototype 残留: localStorage.${key}`);
  });

  // 3. 其它可疑测试残留（test_* / demo_* 前缀）
  Object.keys(localStorage)
    .filter((k) => k.startsWith('test_') || k.startsWith('demo_'))
    .forEach((key) => {
      localStorage.removeItem(key);
      console.info(`[saapi-connect] 已清理可疑残留: localStorage.${key}`);
    });

  // 4. 兜底：如果用户从 prototype 直接带入且项目名前缀不同，提示用户
  //    （无法自动清理——避免误删其他应用的数据）
}
```

**注入 PROJECT_NAME 的最佳实践**：AI 在生成文件前**必须**先从 `STEPS.md` 读取项目英文名（如 `fashion-shop`），再把 `<projectName>` 占位符替换为真实值。否则 `cleanupMockAuth()` 将无法清理 prototype 残留，导致 `<projectName>:token` 与 `access_token` 并存，登录态混乱。

> ⚠️ **如 STEPS.md 不存在项目名**，AI 必须先用 `AskUserQuestion` 询问用户「sainit 阶段定义的项目英文名是什么？」，不可默认占位。

**3.2 在 main.ts 启动时调用**

**文件**：`frontend/src/main.ts`（Vue）/ `frontend/src/main.tsx`（React）

> 📌 **按检测到的框架选对应分支**：

#### A. Vue 3

```ts
import { createApp } from 'vue';
import App from './App.vue';
import { cleanupMockAuth } from '@/utils/mockCleanup';

// ⚠️ 在创建 app 之前调用
cleanupMockAuth();

const app = createApp(App);
app.mount('#app');
```

#### B. React 18

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { cleanupMockAuth } from '@/utils/mockCleanup';

// ⚠️ 在渲染之前调用
cleanupMockAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### C. 其它框架

由用户告知入口文件位置，在 app 初始化前调用 `cleanupMockAuth()` 即可。

> 📌 用户首次访问页面时，浏览器自动清理一次 localStorage 中的 mock 残留。

**3.3 扫描并删除前端代码中的 mock 引用**

```bash
# 扫描 mock 标识符（应已无残留）
grep -rEn "mock_token|mock_user|fakeToken|fakeUser|MOCK_AUTH|// TODO.*真实后端|// TODO.*接入" frontend/src/
```

对每个匹配项：
- **代码引用**（如 `localStorage.getItem('mock_token')`）→ 在 Step 4 / 5 中替换为真实 store 调用
- **纯注释**（如 `// 此处为 mock，实现接入真实后端`）→ 删除或改为说明性注释
- **mock 文件**（如 `frontend/src/api/mock.ts`）→ 删除整个文件
- **mock 路由守卫**（如 `if (useMock) return mockData`）→ 删除整段 if 块

**3.4 清理 Vite proxy 中的 mock 路径（如有）**

检查 `frontend/vite.config.ts`：
```ts
// ❌ 删除这种 mock 专用的 proxy 条目
proxy: {
  '/mock-api': { target: 'http://localhost:3001' }
}
```

**3.5 STEPS.md 增量记录**

```markdown
| 2026-XX-XX | 清理 mock 认证遗留 | ✅ | 
  - 新建 `frontend/src/utils/mockCleanup.ts`（清理 localStorage）
  - 在 `main.ts` 启动时调用 `cleanupMockAuth()`
  - 扫描删除 <N> 处 mock 引用
  - 删除 mock 文件 <文件清单>
  - 清理 Vite proxy 中的 /mock-api 条目
```

---

### Step 4：JWT 认证接入（替换 mock 认证）

**目标**：把 safrontend 阶段用的 mock token 替换为真实后端返回的 JWT。

**4.1 修改 auth store**

**文件**：`frontend/src/stores/auth.ts`

> 📌 **按检测到的框架选对应分支**，下面同时给出 Vue 3 (Pinia) 与 React 18 (Zustand) 两个版本；AI 只填用户所用框架的分支。

---

#### A. Vue 3 + Pinia

```ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!accessToken.value);

  async function login(username: string, password: string) {
    const res = await apiClient.post('/auth/login', { username, password });
    accessToken.value = res.data.access_token;
    refreshToken.value = res.data.refresh_token;
    user.value = res.data.user;
    localStorage.setItem('access_token', accessToken.value!);
    localStorage.setItem('refresh_token', refreshToken.value!);
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  async function refresh(): Promise<string> {
    if (!refreshToken.value) throw new Error('No refresh token');
    const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken.value });
    accessToken.value = res.data.access_token;
    localStorage.setItem('access_token', accessToken.value!);
    return accessToken.value;
  }

  function logout() {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    // 删除 safrontend 阶段的 mock 标记
    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_user');
  }

  return { accessToken, refreshToken, user, isLoggedIn, login, refresh, logout };
});
```

---

#### B. React 18 + Zustand

```ts
import { create } from 'zustand';
import apiClient from '@/api/client';

interface User {
  id: number;
  username: string;
  avatar?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  refresh: () => Promise<string>;
  logout: () => void;
}

// 初始化：从 localStorage 读取
const initialAccessToken = localStorage.getItem('access_token');
const initialRefreshToken = localStorage.getItem('refresh_token');
const initialUser = JSON.parse(localStorage.getItem('user') || 'null');

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  user: initialUser,
  isLoggedIn: !!initialAccessToken,

  async login(username, password) {
    const res = await apiClient.post('/auth/login', { username, password });
    set({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      user: res.data.user,
      isLoggedIn: true,
    });
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  },

  async refresh() {
    const { refreshToken: rt } = get();
    if (!rt) throw new Error('No refresh token');
    const res = await apiClient.post('/auth/refresh', { refresh_token: rt });
    set({ accessToken: res.data.access_token });
    localStorage.setItem('access_token', res.data.access_token);
    return res.data.access_token;
  },

  logout() {
    set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    // 删除 safrontend 阶段的 mock 标记
    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_user');
  },
}));
```

> ⚠️ Zustand 使用方式（与 Pinia 不同）：
> - 组件内：`const { accessToken, login } = useAuthStore()`（hook）
> - 模块顶层（interceptor 内）：`useAuthStore.getState().accessToken` 或 `useAuthStore.getState().login()`
> - 修改状态用 `set({ ... })`，不用 `value =`

---

#### C. React 18 + Redux Toolkit

```ts
// frontend/src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/api/client';

interface User { id: number; username: string; avatar?: string }
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
};

export const login = createAsyncThunk('auth/login', async (creds: { username: string; password: string }) => {
  const res = await apiClient.post('/auth/login', creds);
  return res.data;
});

export const refreshTokenThunk = createAsyncThunk('auth/refresh', async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  return res.data.access_token;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        localStorage.setItem('access_token', action.payload.access_token);
        localStorage.setItem('refresh_token', action.payload.refresh_token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.accessToken = action.payload;
        localStorage.setItem('access_token', action.payload);
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

> ⚠️ RTK 在 interceptor 中调用：`store.dispatch(refreshTokenThunk())`，需传入 `store` 实例（在 client.ts 中通过 `import { store } from '@/store'`）。

---

#### D. 其它框架

询问用户具体框架，提供对应模板。**严禁 AI 自己脑补**。

**4.2 替换所有 mock 认证（按框架走对应分支）**

扫描 `frontend/src/` 下的所有 `.ts/.tsx/.vue/.js/.jsx` 文件：
```bash
grep -rE "mock_token|mock_user|fakeToken|fakeUser|MOCK_AUTH" frontend/src/
```

对每个匹配项，按框架替换：

| 旧代码 | Vue 3 (Pinia) | React 18 (Zustand) | React 18 (RTK) |
|--------|---------------|--------------------|-----------------|
| `localStorage.getItem('mock_token')` | `useAuthStore().accessToken` | `useAuthStore((s) => s.accessToken)` | `useSelector((s) => s.auth.accessToken)` |
| `localStorage.getItem('mock_user')` | `useAuthStore().user` | `useAuthStore((s) => s.user)` | `useSelector((s) => s.auth.user)` |
| 硬编码假 token | 删除 | 删除 | 删除 |
| 注释残留 "mock" | 改成 "real backend" | 改成 "real backend" | 改成 "real backend" |

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| 2026-XX-XX | Step 4：JWT 认证接入 | ✅ |
  - 重写 `frontend/src/stores/auth.ts`：login/refresh/logout 接真实后端
  - 替换 <N> 处 mock_token/mock_user 引用
  - 检查 logout() 已删除 mock_token / mock_user
```

---

### Step 4.5：业务页面 API 接入（核心步骤，必做）

> ⛔ **硬约束**：本步骤必须执行。safrontend 生成的页面组件内部硬编码了 mock 数据（`const products = ref([...])`），仅靠 Step 4 的认证层接入，**业务接口仍不会真实调用**。本页负责把每个页面的 mock 数据替换为 `apiClient.get/post/...` 调用。

#### 4.5.1 扫描页面 mock 数据硬编码

```bash
# 扫描所有页面组件（含 .vue / .tsx / .jsx）
grep -rEn "const\s+\w+\s*=\s*(ref|useState)\(\s*\[|const\s+(mock|hardcoded|hardCoded|sample|demo)\w*\s*=" frontend/src/pages/ frontend/src/views/ 2>/dev/null
# 扫描硬编码 token / 假用户字段
grep -rEn "'mock-|fake-|test-|hardcode-" frontend/src/pages/ frontend/src/views/ 2>/dev/null
# 扫描 inline JSON 假数据数组
grep -rEn "=\s*\[\s*\{[^]]*id:\s*[0-9]+" frontend/src/pages/ frontend/src/views/ 2>/dev/null
```

**结果归类**：

| 匹配模式 | 处理方式 |
|---------|---------|
| `const xxx = ref([{...}])` | 改为「`ref<API.Xxx[]>([])` + `onMounted(() => fetchXxx())`」 |
| `setTimeout(() => xxx = [...], 300)` | 改为真实 `await apiClient.get(...)` |
| 静态 const 对象（用户信息 / 站点配置） | 改为「首次 `onMounted` 从 `/api/v1/xxx` 拉取 + Pinia/Zustand 缓存」 |
| 路由 guard 里的 `if (mock) return mockData` | 删除整段 if，改为真实 store 读取 |

#### 4.5.2 建立页面 ↔ 接口映射表

> 📌 从 `api/openapi.yaml` 的 `paths` 节点 + `api/mock-data.json` 的 key 反推每个页面需要哪些接口。

生成映射表（写入 STEPS.md）：

```markdown
### 页面 ↔ 接口映射表

| 页面 | 文件 | 调用的 API | 触发时机 |
|------|------|----------|---------|
| Home | pages/Home.vue | GET /api/v1/products?featured=true | onMounted |
| ProductDetail | pages/ProductDetail.vue | GET /api/v1/products/:id | onMounted（路由参数） |
| Cart | pages/Cart.vue | GET /api/v1/cart, DELETE /api/v1/cart/:id | onMounted + 事件 |
| ... | ... | ... | ... |
```

#### 4.5.3 逐页面接入（按框架分支）

> 📌 **按 Step 0.2 检测到的框架走对应分支**。每个页面按下列模板改写：声明 `loading`/`error` 状态、`onMounted` 调接口、把返回值赋给响应式 ref。

##### A. Vue 3 + Composition API（Pinia / 无 Pinia 都适用）

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/api/client';
// 可选：import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const product = ref<API.Product | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function fetchProduct() {
  loading.value = true;
  error.value = null;
  try {
    // 后端约定响应格式：{ code: 0, data: ... }，interceptor 已 return response.data
    const data = await apiClient.get(`/products/${route.params.id}`);
    product.value = data.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchProduct);
</script>

<template>
  <div v-if="loading">加载中…</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else-if="product">
    <h1>{{ product.name }}</h1>
    <p>¥{{ product.price }}</p>
  </div>
</template>
```

##### B. React 18 + Hooks（Zustand / RTK / 纯 hooks 都适用）

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/api/client';
import type { Product } from '@/types/api';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/products/${id}`);
        if (!cancelled) setProduct(data.data);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div>加载中…</div>;
  if (error) return <div>{error}</div>;
  if (!product) return null;
  return (
    <div>
      <h1>{product.name}</h1>
      <p>¥{product.price}</p>
    </div>
  );
}
```

#### 4.5.4 强制规则

| 规则 | 说明 |
|------|------|
| ⛔ 禁止保留任何 `const mockProducts = [...]` 形式的硬编码数组 | 全部从 `api/openapi.yaml` 推导接口调用 |
| ⛔ 禁止用 `setTimeout` 模拟接口延迟 | 真实 `await apiClient.xxx` |
| ⛔ 禁止在页面组件里直接 `axios.get('http://...')` | 必须走 `apiClient`（自动带 JWT、自动处理 401） |
| ✅ 每个页面必须处理 4 种状态 | `loading` / `error` / `empty` / `data` |
| ✅ 接口路径必须与 `api/openapi.yaml` 一致 | 严格按 `paths` 节点；如发现页面用了 OpenAPI 没有的接口，立即提示用户「需先回 saapi 补接口」 |

#### 4.5.5 提交类型定义（避免 `any`）

**文件**：`frontend/src/types/api.d.ts`（新建）

> 📌 从 `api/openapi.yaml` 的 `components.schemas` 反推类型定义，避免页面用 `any`。

```ts
// 示例：从 openapi.yaml 推导出的类型
export interface API {
  Product: {
    id: number;
    name: string;
    price: number;
    image: string;
    description?: string;
  };
  User: {
    id: number;
    nickname: string;
    avatar: string;
  };
  // ... 与 openapi.yaml 的 schemas 一一对应
}

declare global {
  namespace API {}
}
```

> AI 在接入过程中，**每个接口的响应都必须有对应类型**，禁止 `product.value = await ... as any`。

#### 4.5.6 验证扫描（不可省略）

```bash
# 1. 页面组件中应无 mock 硬编码（除了空数组 []）
grep -rEn "=\s*\[\s*\{[^]]*id:\s*[0-9]+" frontend/src/pages/ frontend/src/views/ 2>/dev/null
# → 必须为 0 个匹配，或仅匹配 `ref<API.Xxx[]>([])` 的初始空数组

# 2. 页面应全部使用 apiClient
grep -rEn "axios\.(get|post|put|delete|patch)" frontend/src/pages/ frontend/src/views/ 2>/dev/null
# → 必须为 0 个匹配（仅允许 apiClient.xxx）

# 3. 页面应有 loading/error 状态
grep -rEn "loading\.value\s*=\s*true|setLoading\(true" frontend/src/pages/ frontend/src/views/ 2>/dev/null
# → 至少 N 个匹配（N = 页面数）
```

任一检查不通过 → 视为本步未完成，必须修复后重跑。

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| 2026-XX-XX | Step 4.5：业务页面 API 接入 | ✅/❌ |
  - 扫描 <N> 处 mock 硬编码，全部替换为 apiClient 调用
  - 新建 `frontend/src/types/api.d.ts`（从 openapi.yaml 推导）
  - 接入 <M> 个页面（loading/error/empty/data 四态完整）
  - 验证扫描 0 个硬编码 / 0 个裸 axios / <M> 个 loading 标记
```

---

### Step 5：全局错误处理

**目标**：把 safrontend 占位的 `errorHandler.ts` 填实。

**5.1 选择 toast 适配器（按检测到的 UI 库）**

| 检测到的 UI 库 | toast 函数 |
|---------------|----------|
| Element Plus (Vue 3) | `ElMessage.error(msg)` |
| Naive UI (Vue 3) | `useMessage().error(msg)` |
| Vant (Vue 3 H5) | `showToast(msg)` |
| Ant Design (React) | `message.error(msg)`（需 `App` 包裹） |
| MUI (React) | `enqueueSnackbar(msg, { variant: 'error' })` |
| Chakra UI (React) | `toast({ status: 'error', description: msg })` |
| 未知 / 纯 JS | `alert(msg)`（仅兜底，提示用户接入 toast） |

> ⚠️ **AI 必须按 Step 0.2 检测结果选对应 toast**，不混用。

**5.2 填充 errorHandler.ts**

**文件**：`frontend/src/utils/errorHandler.ts`

> 📌 **下面以 Element Plus / Ant Design 为例展示**，其它 UI 库按 5.1 表替换 `notify` 函数即可。

#### A. Vue 3 + Element Plus

```ts
import { ElMessage } from 'element-plus';

function notify(msg: string) {
  ElMessage.error(msg);
}

export function handleError(error: any) {
  if (!error.response) {
    notify('网络异常，请检查后端服务是否启动');
    return;
  }

  const { status, data } = error.response;
  switch (status) {
    case 400: notify(data.message || '请求参数错误'); break;
    case 401: notify('登录已过期，请重新登录'); break;
    case 403: notify('没有权限'); break;
    case 404: notify('资源不存在'); break;
    case 500: notify('服务器错误，请稍后再试'); break;
    default:  notify(data.message || `请求失败（${status}）`);
  }
}
```

#### B. React 18 + Ant Design

```tsx
import { message } from 'antd';

// ⚠️ Ant Design v5 的 message 必须用 App 包裹才能拿到正确上下文
// 在 main.tsx 用 <App> 包裹根组件后，这里直接调用 message.error()
function notify(msg: string) {
  message.error(msg);
}

export function handleError(error: any) {
  if (!error.response) {
    notify('网络异常，请检查后端服务是否启动');
    return;
  }

  const { status, data } = error.response;
  switch (status) {
    case 400: notify(data.message || '请求参数错误'); break;
    case 401: notify('登录已过期，请重新登录'); break;
    case 403: notify('没有权限'); break;
    case 404: notify('资源不存在'); break;
    case 500: notify('服务器错误，请稍后再试'); break;
    default:  notify(data.message || `请求失败（${status}）`);
  }
}
```

> ⚠️ Ant Design v5 初始化：在 `main.tsx` 中用 `<App>` 包裹根组件，并调用 `App.useApp()` 获取 message 实例。
> 详见 [Ant Design v5 message 用法](https://ant.design/components/message)。

#### C. React 18 + MUI（使用 notistack）

```tsx
import { enqueueSnackbar } from 'notistack';

function notify(msg: string) {
  enqueueSnackbar(msg, { variant: 'error' });
}

export function handleError(error: any) {
  // ... 同上结构
}
```

> ⚠️ MUI 需安装 `notistack` 并用 `<SnackbarProvider>` 包裹根组件。

#### D. 其它 UI 库

按 5.1 表选择对应 toast 函数，按 A/B/C 结构组织 `notify()` 即可。

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| 2026-XX-XX | Step 5：错误处理 | ✅ |
  - 框架：<Vue 3 | React 18 | ...>
  - UI 库：<Element Plus | Ant Design | ...>
  - 填充 `frontend/src/utils/errorHandler.ts`：HTTP 4xx/5xx/网络 → toast
  - 在 client.ts response interceptor 末尾调用 `handleError()`
  - toast 适配器：<ElMessage | message.error | ...>
```

---

### Step 6：Vite proxy + 后端 CORS

**6.1 前端 Vite proxy**

**文件**：`frontend/vite.config.ts`

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // 后端地址（从 backend/config.yaml 读）
        changeOrigin: true,
      },
    },
  },
});
```

> **效果**：前端 `axios.get('/api/v1/products')` → 浏览器 → Vite 代理 → `http://localhost:3000/api/v1/products`
> 优势：避免浏览器 CORS 报错。

**5.2 后端 CORS**

读取 `backend/src/app.ts`（或等效入口），添加 CORS 中间件：

**Node + Express**：
```ts
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],  // Vite dev + preview
  credentials: true,
}));
```

**NestJS**：在 `main.ts` 添加 `app.enableCors({...})`。
**Python FastAPI**：添加 `CORSMiddleware`。
**Go Gin**：使用 `cors` 中间件。

**同时更新后端 `config.yaml`（可选）**：
```yaml
cors:
  allowed_origins:
    - http://localhost:5173   # Vite dev
    - http://localhost:4173   # Vite preview
    # - https://your-production-domain.com
```

> 📌 **本 skill 不涉及 HTTPS 证书 / 反代 SSL 终止**，生产环境部署时再处理（sabackend §4.5 CI/CD 阶段或运维侧）。

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| 2026-XX-XX | Step 6：Vite proxy + CORS | ✅ |
  - `frontend/vite.config.ts`：新增 `/api → http://localhost:<port>` proxy
  - 后端入口启用 CORS：允许 http://localhost:5173 / 4173
  - 可选：后端 config.yaml 新增 `cors.allowed_origins` 段
  - ⚠️ 不涉及 HTTPS 证书（留给部署阶段）
```

---

### Step 7：验证接入

**7.1 启动两个服务**

使用两个终端（或并行命令）：
```bash
# 终端 1
cd backend && npm run dev
# 等待输出：Server listening on http://localhost:3000

# 终端 2
cd frontend && npm run dev
# 等待输出：Local: http://localhost:5173/
```

**7.2 验证流程（agent 提示用户手动测试）**

```
🎉 前后端已接通，请按以下步骤验证：

1. 浏览器打开 http://localhost:5173
2. 打开 DevTools Network 面板
3. 在登录页输入 safrontend 阶段预留的测试账号（如果有）或 admin/123456
4. 登录成功后，验证：
   ☐ 请求 header 含 Authorization: Bearer eyJ...
   ☐ 401 响应触发 refresh（可在 Network 看 /auth/refresh）
   ☐ 业务接口（如 /api/v1/products）返回真实数据（不再是 mock）
   ☐ 关闭浏览器再打开，token 仍在（持久化 OK）
5. 验证错误处理：
   ☐ 故意输错密码 → toast「请求参数错误」
   ☐ 后端关掉再请求 → toast「网络异常」
   ☐ 登录过期 → 自动跳回登录页

请回复「测试通过」或具体问题。
```

**7.3 自动化验证（agent 自检）**

```bash
# 1. 后端健康检查
curl http://localhost:3000/api/v1/health || echo "FAIL: backend down"

# 2. 登录接口
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | jq -r .data.access_token)

# 3. 业务接口
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/products

# 4. 401 测试
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/v1/users/me
```

**📝 本步完成后立即写入 STEPS.md**（验证结果）：
```markdown
| 2026-XX-XX | Step 7：验证接通 | ✅/❌ |
  - 后端健康检查：✅/❌
  - 登录接口：✅/❌（返回 access + refresh token）
  - 业务接口带 JWT：✅/❌
  - 401 → 自动 refresh：✅/❌
  - refresh 失败 → 跳登录：✅/❌
  - 错误 toast 显示：✅/❌
  - localStorage 持久化：✅/❌
  - 浏览器 localStorage 不含 mock_token / mock_user：✅/❌
```

---

### Step 8：汇总 STEPS.md（最终一致性核对）

> 📌 **本步不是补记，是一致性核对**——前 7 步每完成都已即时写入 STEPS.md，本步负责：
> 1. 把前 7 步的增量记录整合为一份「文件改动清单」表格
> 2. 标 ✅ 所有步骤状态
> 3. 与 sabackend 的接口映射清单做交叉核对（前后端接口应 1:1 匹配）

在项目根目录的 `STEPS.md` 中追加「前端接入」章节（在 sabackend 章节之后）：

```markdown
---

## 🔌 前端接入（基于 /sabackend 真实 API）

> 接入时间：YYYY-MM-DD
> 触发方式：<自动（sabackend 末尾）/ 手动 /saapi-connect>
> 后端基址：`<baseURL>`（从 backend/config.yaml 读取）
> API 前缀：`/api/v1`

### 📝 文件改动清单

| # | 文件 | 改动类型 | 描述 |
|---|------|---------|------|
| 1 | `frontend/.env.development` | 新建 | 开发环境 VITE_API_BASE_URL |
| 2 | `frontend/.env.production` | 新建 | 生产环境模板 |
| 3 | `frontend/.env.example` | 更新 | 加入完整环境变量示例 |
| 4 | `frontend/src/api/client.ts` | 填充 | 注入 baseURL + JWT interceptor + 401 refresh |
| 5 | `frontend/src/stores/auth.ts` | 重写 | login/refresh/logout 接真实后端 |
| 6 | `frontend/src/utils/errorHandler.ts` | 填充 | HTTP 错误码 → toast 映射 |
| 7 | `frontend/vite.config.ts` | 新增 proxy | `/api → http://localhost:3000` |
| 8 | `backend/src/app.ts` | 新增 CORS | 允许 http://localhost:5173 |
| 9 | `frontend/src/**/*.ts` | 替换 | 所有 mock_token / mock_user → 真实 store |

### 🔍 验证结果

| 项 | 状态 | 备注 |
|----|------|------|
| 后端健康检查 | ✅ / ❌ | - |
| 登录接口 | ✅ / ❌ | 返回 access + refresh token |
| 业务接口（带 JWT） | ✅ / ❌ | - |
| 401 → 自动 refresh | ✅ / ❌ | - |
| refresh 失败 → 跳登录 | ✅ / ❌ | - |
| 错误 toast 显示 | ✅ / ❌ | - |
| localStorage 持久化 | ✅ / ❌ | - |

### ✅ 项目最终状态

- 原型：✅ `/sainit-*`
- 前端开发：✅ `/safrontend`
- API 规范：✅ `/saapi`
- 后端实现：✅ `/sabackend`
- **前后端接通：✅ `/saapi-connect`（本 skill）**
```

---

## 与其他 skill 的关系

```
/sainit-* ──► /safrontend ──► /saapi ──► /sabackend ──► /saadmin ──► /saapi-connect（本 skill）
   原型         前端代码       接口规范     后端实现      后台管理面板     前后端全部接通
```

| 上游 skill | 本 skill 依赖其产出 |
|-----------|-------------------|
| `/safrontend` | `frontend/` + API 客户端脚手架（client.ts / auth.ts / errorHandler.ts / .env.example） |
| `/saadmin` | `admin/` 后台管理面板（React 18 + Ant Design） |
| `/sabackend` | `backend/` + 真实 API 实现 + `config.yaml` 端口 |
| `/saapi` | `api/openapi.yaml`（鉴权要求、路径前缀，含 Admin API） |

---

## 🌐 多端调试方案（Step 7 扩展）

> 📌 **当 safrontend 选择了全平台响应式（Step 2.7 分支 C）或非纯 Web 平台时，Step 7 的验证流程需要覆盖多端场景。**

### 场景 1：Web H5 + 桌面响应式（同源调试）

开发阶段只需一个 Vite dev server + 一个后端：

```bash
# 同一套代码，在不同设备上验证
# 1. 桌面端：浏览器直接打开 http://localhost:5173
# 2. 移动端 H5：手机连接同一 WiFi，访问 http://<本机IP>:5173
#    （Vite 默认监听 0.0.0.0，可用 ifconfig/ipconfig 查本机 IP）
# 3. Chrome DevTools → Device Toolbar → 切换 iPhone/Android 模拟
```

> ⚠️ **移动端真机调试注意事项**：
> - `VITE_API_BASE_URL` 在 `.env.development` 中不能用 `localhost`（手机访问会指向手机自身）
> - 改为 `VITE_API_BASE_URL=http://<本机局域网IP>:3000`
> - 后端 CORS 需额外允许该 IP 来源
> - 🔒 **HTTPS 要求**：部分浏览器（iOS Safari 14+）要求 `localhost` 以外的连接必须 HTTPS；如遇此问题，使用 `mkcert` 生成本地证书或改用 `ngrok` 反向代理

### 场景 2：SSR 模式（Next.js / Nuxt）调试

若 safrontend Step 2.3 选了 SSR：

| 项目 | Vite SPA | Next.js SSR | Nuxt 3 SSR |
|------|---------|------------|-----------|
| 前端端口 | 5173 | 3000（默认，可能与后端冲突→改为 3001） | 3000（同上→改为 3001） |
| API baseURL | `VITE_API_BASE_URL` | `NEXT_PUBLIC_API_BASE_URL` | `NUXT_PUBLIC_API_BASE_URL` |
| 代理方式 | `vite.config.ts` proxy | `next.config.js` rewrites | `nuxt.config.ts` nitro.devProxy |
| 环境变量文件 | `.env.development` | `.env.local` | `.env`（nuxt 自动加载） |
| SSR API 调用 | 不需要（客户端 fetch） | `getServerSideProps` 需直连后端或走内部网络 | `useFetch` / `useAsyncData` |

**Next.js 代理配置示例**（`next.config.js`）：
```js
module.exports = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:3000/api/:path*' }
    ];
  }
};
```

**Nuxt 3 代理配置示例**（`nuxt.config.ts`）：
```ts
export default defineNuxtConfig({
  nitro: {
    devProxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
});
```

### 场景 3：PWA 离线调试

若 safrontend Step 2.4 启用了 PWA：

1. **Service Worker 更新**：开发时 SW 可能缓存旧资源，打开 DevTools → Application → Service Workers → 勾选 "Update on reload"
2. **离线测试**：DevTools → Network → 勾选 "Offline" → 刷新页面 → 应从 SW 缓存加载
3. **添加到主屏幕**：Chrome DevTools → Application → Manifest → 检查清单完整性
4. **推送通知测试**：需 HTTPS（`localhost` 例外）→ 生产环境必须 HTTPS

### 场景 4：移动端 WebView 调试（App 内嵌 H5）

若用户未来将 H5 打包进 App WebView：

```bash
# Android WebView 调试
# 1. 手机开启 USB 调试
# 2. Chrome 打开 chrome://inspect → 远程调试 WebView
# 3. 前端 .env 用局域网 IP（不能用 localhost）

# iOS WKWebView 调试
# 1. Safari → 开发 → [设备名] → 选择 WebView 上下文
# 2. 同样需要局域网 IP 或 ngrok 代理
```

**WebView 环境变量模板**（追加到 `.env.example`）：
```bash
# App WebView 嵌入模式（部署时填写）
# VITE_API_BASE_URL=https://api.example.com
# VITE_IS_WEBVIEW=true            # 开启时：隐藏浏览器地址栏相关 UI、使用原生分享/支付
```

---

## 关键约定速查

| 项目 | 约定 |
|------|------|
| 接入目录 | `frontend/`（不动 `backend/` 结构，只加 CORS） |
| baseURL 配置 | `frontend/.env.{development,production}` 的 `VITE_API_BASE_URL` |
| API 前缀 | `/api/v1`（与 saapi 一致） |
| 鉴权方式 | JWT（access + refresh），自动注入 header |
| 401 处理 | 静默 refresh → 失败跳登录 |
| 错误处理 | 全局 `errorHandler.ts`，按 HTTP 状态码映射 toast |
| 开发代理 | Vite proxy：`/api → http://localhost:<port>` |
| 生产部署 | 用户手动改 `.env.production`，**AI 不填真实域名** |
| 步骤追踪 | 项目根目录 `STEPS.md` 追加「前端接入」章节 |

## 失败 / 边界处理

| 场景 | 处理 |
|------|------|
| 缺 frontend / backend / api 任一 | 提示先运行对应 skill |
| safrontend 未生成 API 客户端脚手架 | 询问「本 skill 临时生成 / 中断」，推荐先升级 safrontend |
| api/openapi.yaml hash 与 sabackend 记录不一致 | 警告「saapi 已更新，建议先回归后端」 |
| 后端启动失败 | 检查 `backend/config.yaml` 数据库连接、init.sql 是否已执行 |
| Vite proxy 仍报 CORS | 检查 `vite.config.ts` proxy 是否覆盖 `/api`、后端 CORS 是否允许 `localhost:5173` |
| 登录后仍 401 | 检查后端 `system_config.jwt_secret` 是否被改、auth.controller 是否真校验 token |
| refresh 接口 401 | refresh token 已过期；清除 localStorage 让用户重新登录 |
| 用户已上线、想再次接入 | 检测现有 `.env.development` 是否已含 `VITE_API_BASE_URL`；提示「是否重新生成」 |
| 移动端真机访问 localhost 失败 | `VITE_API_BASE_URL` 改为局域网 IP + 后端 CORS 追加该来源 |
| iOS Safari 非 localhost 要求 HTTPS | 使用 `mkcert` 生成本地证书或 `ngrok` 临时反向代理 |
| SSR 模式代理不生效 | 检查 `next.config.js` rewrites / `nuxt.config.ts` devProxy 是否覆盖 `/api` |
| PWA SW 缓存导致旧页面 | DevTools → Application → Service Workers → Update on reload |
| WebView 中 JWT Cookie 丢失 | WebView 可能不共享浏览器 Cookie；改用 localStorage 存储 token（当前已是 localStorage） |
| 多端 baseURL 不一致 | 按 `.env.development`（Web）/ `.env.webview`（App WebView）/ `.env.production`（上线）分别管理 |

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| YYYY-MM-DD | 初版：基于 safrontend 脚手架填空式接入，7 步流程（环境变量 / API 客户端 / JWT / 错误处理 / Vite proxy + CORS / 验证 / STEPS.md）+ 一次性 STEPS.md 记录 |
| YYYY-MM-DD v2 | 改为**强约束增量记录**：每完成一步立即写 STEPS.md（不等全部完成），9 步进度表 + AI 执行纪律；新增独立 **Step 3：清理 mock 认证遗留**（localStorage + 代码扫描 + Vite proxy），防止用户来回切换 safrontend 再次产生 mock；明确「本 skill 不涉及 HTTPS 证书」 |
| YYYY-MM-DD v3 | **前端框架支持全面化**：Step 0 新增 §0.2 框架检测（读 STEPS.md + package.json，自动识别 Vue 3+Pinia / React 18+Zustand / React 18+RTK / 其它，未识别则询问用户）；Step 2 / 3.2 / 4 / 5 全部改为 A/B/C/D 分支代码（不再硬编码 Vue），AI 只填用户所用框架的分支；Step 4.2 mock 替换规则做成框架对照表；Step 5.1 toast 适配器做成 UI 库对照表 |
| 2026-06-29-1 | 修正「修改记录」时间格式 bug：原 v1~v3 的占位符 `YYYY-MM-DD` 保留为历史；自本条起改为「年-月-日-当天变动次数」格式（如 `2026-06-29-1`），AI 写入前必须用 PowerShell `Get-Date -Format "yyyy-MM-dd"` 校准北京时间；变动次数 N 按「该 skill 文件落地次数」自增（同一天多次改动依次为 1,2,3...） |