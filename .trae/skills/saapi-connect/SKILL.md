---
name: "saapi-connect"
description: "把 /safrontend 生成的前端代码接入到 /sabackend 实现的真实后端 API：替换 baseURL、注入 JWT、全局错误处理、替换 mock 认证、配置 Vite proxy 与后端 CORS。可由 /sabackend 末尾自动触发，也可手动调用。Invoke when 后端已实现完毕需要接通前后端，或用户输入 /saapi-connect。"
---

# /saapi-connect — 前后端接通

## 为什么需要这一步？

```
/safrontend ──► 前端开发时用 localStorage mock 数据（没真实后端）
/saapi      ──► 接口规范已定
/sabackend  ──► 后端实现完毕
              ↓
         【前后端接通】← 本 skill 负责
              ↓
   前端真实调用后端，JWT 鉴权，错误统一处理
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

### Step 0：前置检查

1. **三件套检查**：
   - `frontend/` 存在且含 `package.json`？
   - `backend/` 存在且含 `config.yaml`？
   - `api/openapi.yaml` 存在？
   - 任意一项缺失 → 提示用户先运行对应 skill 并终止

2. **API 客户端脚手架检查**：
   - 扫描 `frontend/src/api/` 是否已有 `client.ts`
   - 不存在 → 警告「safrontend 未生成 API 客户端脚手架」并询问「本 skill 临时生成 / 中断」
   - 选择「本 skill 临时生成」→ 按 safrontend 标准结构创建占位文件

3. **指纹比对**（沿用 sabackend 机制）：
   - 计算 `api/openapi.yaml` 的 sha256
   - 与 STEPS.md 后端章节的「API 来源指纹」表比对
   - 不一致 → 警告「saapi 已更新，是否要先回归后端」

4. **读取后端配置**：
   - 读取 `backend/config.yaml`，提取 `server.port`（默认 3000）
   - 读取 OpenAPI 的 `servers` 节点，确定生产域名（可选）

输出确认：
```
🔍 检测到 frontend/ + backend/ + api/ 三件套齐全
🔐 API 指纹：openapi.yaml sha256=abc123...（与 sabackend 记录一致 ✅）
📡 后端端口：3000（来自 backend/config.yaml）
🚀 开始接入前端...
```

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

**Vue + Axios 模板**：
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
  const auth = useAuthStore();
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

    // 401 + 不是 refresh 接口本身 → 尝试刷新 token
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
      // 等待 refresh 完成
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

**React + Axios 模板**：同上，差异在 `useAuthStore` 替换为 `useAuthStore()` hook 调用。

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

**文件**：`frontend/src/utils/mockCleanup.ts`（新建）

```ts
/**
 * safrontend 阶段遗留的 mock 数据清理工具
 * 在 saapi-connect 启动时执行一次，之后不再使用
 */
export function cleanupMockAuth() {
  const mockKeys = ['mock_token', 'mock_user', 'fakeToken', 'fakeUser', 'MOCK_AUTH'];
  mockKeys.forEach((key) => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      console.info(`[saapi-connect] 已清理 localStorage.${key}`);
    }
  });
}
```

**3.2 在 main.ts 启动时调用**

**文件**：`frontend/src/main.ts`

```ts
import { cleanupMockAuth } from '@/utils/mockCleanup';

// 在创建 app 之前调用
cleanupMockAuth();
// ... 后续 app 初始化
```

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

**3.1 修改 auth store**

**文件**：`frontend/src/stores/auth.ts`

**Vue + Pinia 示例**：
```ts
import { defineStore } from 'pinia';
import apiClient from '@/api/client';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!accessToken.value);

  async function login(username: string, password: string) {
    // ✅ 替换 safrontend 阶段直接赋假 token 的逻辑
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
    // ❌ 删除 safrontend 阶段的 mock 标记
    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_user');
  }

  return { accessToken, refreshToken, user, isLoggedIn, login, refresh, logout };
});
```

**3.2 替换所有 mock 认证**

扫描 `frontend/src/` 下的所有 `.ts/.tsx/.vue/.js/.jsx` 文件：
```bash
grep -rE "mock_token|mock_user|fakeToken|fakeUser|MOCK_AUTH" frontend/src/
```

对每个匹配项：
- `localStorage.getItem('mock_token')` → `useAuthStore().accessToken`
- `localStorage.getItem('mock_user')` → `useAuthStore().user`
- 硬编码的假 token → 删除
- 注释里残留的 "mock" → 改成 "real backend"

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| 2026-XX-XX | Step 4：JWT 认证接入 | ✅ |
  - 重写 `frontend/src/stores/auth.ts`：login/refresh/logout 接真实后端
  - 替换 <N> 处 mock_token/mock_user 引用
  - 检查 logout() 已删除 mock_token / mock_user
```

---

### Step 5：全局错误处理

**目标**：把 safrontend 占位的 `errorHandler.ts` 填实。

**文件**：`frontend/src/utils/errorHandler.ts`

```ts
import { ElMessage } from 'element-plus'; // 或你用的 UI 库的 toast

export function handleError(error: any) {
  if (!error.response) {
    // 网络错误 / 后端未启动
    ElMessage.error('网络异常，请检查后端服务是否启动');
    return;
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      ElMessage.error(data.message || '请求参数错误');
      break;
    case 401:
      // 已在 response 拦截器处理
      ElMessage.error('登录已过期，请重新登录');
      break;
    case 403:
      ElMessage.error('没有权限');
      break;
    case 404:
      ElMessage.error('资源不存在');
      break;
    case 500:
      ElMessage.error('服务器错误，请稍后再试');
      break;
    default:
      ElMessage.error(data.message || `请求失败（${status}）`);
  }
}
```

> 不同 UI 库替换 `ElMessage`：`antd` 用 `message.error`、`naive-ui` 用 `useMessage()`、`vant` 用 `showToast`。

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| 2026-XX-XX | Step 5：错误处理 | ✅ |
  - 填充 `frontend/src/utils/errorHandler.ts`：HTTP 4xx/5xx/网络 → toast
  - 在 client.ts response interceptor 末尾调用 `handleError()`
  - 替换 UI 库的 toast API（ElMessage / message / useMessage / showToast）
```

---

### Step 6：Vite proxy + 后端 CORS

**5.1 前端 Vite proxy**

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

**6.1 启动两个服务**

使用两个终端（或并行命令）：
```bash
# 终端 1
cd backend && npm run dev
# 等待输出：Server listening on http://localhost:3000

# 终端 2
cd frontend && npm run dev
# 等待输出：Local: http://localhost:5173/
```

**6.2 验证流程（agent 提示用户手动测试）**

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

**6.3 自动化验证（agent 自检）**

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
/sainit-* ──► /safrontend ──► /saapi ──► /sabackend ──► /saapi-connect（本 skill） ──► ✅ 上线
   原型         前端代码       接口规范     后端实现         前后端接通                完整应用
```

| 上游 skill | 本 skill 依赖其产出 |
|-----------|-------------------|
| `/safrontend` | `frontend/` + API 客户端脚手架（client.ts / auth.ts / errorHandler.ts / .env.example） |
| `/sabackend` | `backend/` + 真实 API 实现 + `config.yaml` 端口 |
| `/saapi` | `api/openapi.yaml`（鉴权要求、路径前缀） |

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

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| YYYY-MM-DD | 初版：基于 safrontend 脚手架填空式接入，7 步流程（环境变量 / API 客户端 / JWT / 错误处理 / Vite proxy + CORS / 验证 / STEPS.md）+ 一次性 STEPS.md 记录 |
| YYYY-MM-DD v2 | 改为**强约束增量记录**：每完成一步立即写 STEPS.md（不等全部完成），9 步进度表 + AI 执行纪律；新增独立 **Step 3：清理 mock 认证遗留**（localStorage + 代码扫描 + Vite proxy），防止用户来回切换 safrontend 再次产生 mock；明确「本 skill 不涉及 HTTPS 证书」 |