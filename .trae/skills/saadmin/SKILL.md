---
name: "saadmin"
description: "基于 /saapi 生成的 Admin API 接口，直接生成 React 18 + TypeScript + Ant Design 后台管理面板。读取项目 STEPS.md 和 api/openapi.yaml，自动生成仪表盘、用户管理、数据管理、系统配置、操作日志等管理页面。Invoke when 用户输入 /saadmin 或 sabackend 完成后需要生成后台管理界面。"
---

# /saadmin — 后台管理面板

## 什么是后台管理面板？

后台管理面板是给运营人员/管理员使用的内部工具，用于管理用户、审核内容、查看数据、配置系统参数。它和普通用户看到的页面不同——后台重在**数据表格、表单、统计图表**，而非营销展示。

这个 skill 的工作就是：**读取项目已有的 API 规范和项目信息，直接生成可运行的 React 18 + Ant Design 后台管理面板。**

## 触发条件

- 用户输入 `/saadmin` 或 `/saadmin <项目目录>`
- **自动触发**：sabackend 全部接口完成后，末尾会询问「是否生成后台管理面板？」选是即跳到此 skill
- **前置条件**：
  - `api/openapi.yaml` 已存在（来自 `/saapi`），且含 `/api/v1/admin/` 前缀的管理接口
  - `backend/` 已存在（来自 `/sabackend`）
  - `STEPS.md` 已存在（项目元信息）

## 核心原则

1. **直接生成 React 代码**：跳过原型阶段，直接产出可运行的 React 18 + TypeScript + Ant Design 项目
2. **读取项目上下文**：从 `STEPS.md` 获取项目名、UI 风格，从 `api/openapi.yaml` 获取 Admin API 接口
3. **存放位置**：`admin/` 目录，与 `frontend/`、`backend/` 平级
4. **页面自动生成**：根据 OpenAPI 中 Admin tag 的接口自动推导页面结构
5. **步骤追踪**：每步完成后立即写入 `STEPS.md`

## 工作流程

### Step 0：读取项目上下文

#### 0.1 读取 STEPS.md

从 `STEPS.md` 提取项目元信息：

| 字段 | 用途 |
|------|------|
| 项目名（英文） | `package.json` name、浏览器标题 |
| 项目名（中文） | 后台标题（如「心遇 - 后台管理」） |
| 项目类型 | 推断数据管理页面类型 |
| UI 风格 | 设计令牌色系参考 |

#### 0.2 读取 api/openapi.yaml

扫描 Admin 相关 tag 的接口：

```bash
grep -E "tags:.*Admin" api/openapi.yaml
```

提取 Admin API 清单，按模块分组：

| Admin Tag | 推断页面 |
|-----------|---------|
| Admin-用户 | 用户管理 |
| Admin-订单 | 订单管理 |
| Admin-商品 | 商品管理 |
| Admin-审核 | 内容审核 |
| Admin-统计 | 仪表盘 |
| Admin-权限 | 权限管理 |
| Admin-配置 | 系统配置 |
| Admin-日志 | 操作日志 |

#### 0.3 前置检查

```
🔍 读取项目上下文：
   • 项目名：<英文>（中文：<中文>）
   • 类型：<dating|shop|blog|tool|saas>
   • Admin API：N 个模块，M 个接口
   ✅ 上下文读取完毕
```

### Step 1：创建 admin/ 项目脚手架

```bash
cd <project-name>
npm create vite@latest admin -- --template react-ts
cd admin
npm install
npm install antd@^5.0.0 @ant-design/icons@^5.0.0 @ant-design/charts@^2.0.0
npm install axios react-router-dom@^6.0.0 dayjs
npm install -D @types/react @types/react-dom
```

**目录结构**：

```
admin/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts          # axios 实例（连接后端）
│   │   ├── auth.ts            # 管理员登录/登出
│   │   ├── users.ts           # 用户管理 API
│   │   ├── data.ts            # 数据管理 API（按项目类型）
│   │   ├── config.ts          # 系统配置 API
│   │   └── audit.ts           # 操作日志 API
│   ├── components/
│   │   ├── AdminLayout.tsx     # 后台布局壳（侧边栏 + 顶栏 + 内容区）
│   │   ├── Sidebar.tsx        # 侧边导航菜单
│   │   ├── StatCard.tsx        # 统计卡片组件
│   │   └── PageHeader.tsx     # 页面标题栏
│   ├── pages/
│   │   ├── Login.tsx          # 管理员登录
│   │   ├── Dashboard.tsx      # 仪表盘
│   │   ├── Users.tsx          # 用户管理
│   │   ├── Data.tsx           # 数据管理（按项目类型命名）
│   │   ├── Config.tsx         # 系统配置
│   │   └── AuditLog.tsx       # 操作日志
│   ├── router/
│   │   └── index.tsx          # 路由配置
│   ├── stores/
│   │   └── auth.ts            # 管理员认证状态（Zustand）
│   ├── styles/
│   │   └── admin.css          # 后台全局样式
│   ├── types/
│   │   └── api.d.ts           # 从 openapi.yaml 推导的类型
│   ├── utils/
│   │   └── errorHandler.ts    # 全局错误处理
│   ├── App.tsx
│   └── main.tsx
├── .env.development           # 开发环境变量
├── .env.production            # 生产环境模板
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| YYYY-MM-DD HH:mm | Step 1：项目脚手架 | ✅ |
  - 创建 admin/ 目录
  - 安装依赖：React 18 + TypeScript + Ant Design 5 + Axios + React Router 6
  - 已写入 STEPS.md
```

### Step 2：设计令牌与全局样式

从 `prototype/assets/css/tokens.css` 提取设计令牌，适配到 Ant Design 主题：

```ts
// admin/src/App.tsx
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const theme = {
  token: {
    colorPrimary: '<从 tokens.css 提取 --primary>',
    borderRadius: '<从 tokens.css 提取 --radius>',
    // ... 其他令牌
  },
};

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <RouterProvider />
    </ConfigProvider>
  );
}
```

**admin.css 核心样式**：

```css
/* 后台布局 */
.admin-layout { min-height: 100vh; }
.admin-sider { background: #001529; }
.admin-content { padding: 24px; background: #f5f5f5; }
.admin-header { background: #fff; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }

/* 统计卡片 */
.stat-card { border-radius: 8px; }
.stat-card .ant-statistic-title { font-size: 14px; color: #8c8c8c; }
.stat-card .ant-statistic-content { font-size: 28px; }

/* 页面标题 */
.page-header { margin-bottom: 24px; }
.page-header h2 { margin: 0; font-size: 20px; }
```

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| YYYY-MM-DD HH:mm | Step 2：设计令牌与全局样式 | ✅ |
  - 从 prototype/tokens.css 提取色系令牌
  - 配置 Ant Design ConfigProvider 主题
  - 已写入 STEPS.md
```

### Step 3：通用组件实现

#### 3.1 AdminLayout（布局壳）

```tsx
// admin/src/components/AdminLayout.tsx
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const { Header, Sider, Content } = Layout;

export default function AdminLayout() {
  return (
    <Layout className="admin-layout">
      <Sider className="admin-sider" collapsible breakpoint="lg">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
          <项目中文名> 后台
        </div>
        <Sidebar />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <span>管理员</span>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
```

#### 3.2 Sidebar（侧边导航）

根据 OpenAPI 中的 Admin 模块动态生成菜单项。

#### 3.3 StatCard（统计卡片）

```tsx
// admin/src/components/StatCard.tsx
import { Card, Statistic } from 'antd';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  color?: string;
}

export default function StatCard({ title, value, prefix, color }: StatCardProps) {
  return (
    <Card className="stat-card" bordered={false}>
      <Statistic title={title} value={value} prefix={prefix} valueStyle={{ color }} />
    </Card>
  );
}
```

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| YYYY-MM-DD HH:mm | Step 3：通用组件 | ✅ |
  - AdminLayout、Sidebar、StatCard、PageHeader
  - 已写入 STEPS.md
```

### Step 4：路由配置

```tsx
// admin/src/router/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Data from '@/pages/Data';
import Config from '@/pages/Config';
import AuditLog from '@/pages/AuditLog';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'users', element: <Users /> },
      { path: 'data', element: <Data /> },
      { path: 'config', element: <Config /> },
      { path: 'audit-log', element: <AuditLog /> },
    ],
  },
]);
```

### Step 5：API 客户端

```ts
// admin/src/api/client.ts
import axios from 'axios';

const baseURL = `${import.meta.env.VITE_ADMIN_API_BASE_URL}${import.meta.env.VITE_API_PREFIX}`;

export const adminClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request 拦截器：注入 Admin JWT
adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response 拦截器：401 → 跳登录
adminClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

```ts
// admin/src/api/auth.ts
import { adminClient } from './client';

export async function adminLogin(username: string, password: string) {
  return adminClient.post('/admin/auth/login', { username, password });
}
```

### Step 6：页面实现

#### 6.1 Login（管理员登录）

Ant Design Form + 账号密码登录，登录成功后存储 `admin_token` 到 localStorage，跳转 `/dashboard`。

#### 6.2 Dashboard（仪表盘）

- 4 个统计卡片：总用户数、今日新增、活跃用户、<按项目类型动态生成>
- 最近操作日志列表（Ant Design Table）
- 从 `GET /api/v1/admin/stats/dashboard` 获取数据

#### 6.3 Users（用户管理）

- Ant Design Table：用户列表（ID、昵称、手机号、注册时间、状态）
- 搜索栏：按手机号/昵称搜索
- 操作列：查看详情、封禁/启用
- 分页：`GET /api/v1/admin/users?page=&pageSize=`

#### 6.4 Data（数据管理）

根据项目类型自动生成对应管理页面：

| 项目类型 | 管理内容 | 表格列 |
|---------|---------|--------|
| shop | 商品管理、订单管理 | 商品名/价格/库存/状态；订单号/用户/金额/状态 |
| blog | 文章管理、评论管理 | 标题/作者/发布时间/状态；内容/用户/时间 |
| dating | 动态审核、举报管理 | 用户/内容/时间/状态；举报人/被举报人/原因 |
| tool | 条目管理 | 标题/创建者/时间/状态 |
| saas | 模型管理、API Key 管理 | 模型名/供应商/状态；Key/用户/用量 |

#### 6.5 Config（系统配置）

- Ant Design Form：`system_config` 表可视化编辑
- 配置项：站点名称、上传配置、短信/邮件配置、JWT 过期时间等
- 从 `GET /api/v1/admin/config` 获取，`PUT /api/v1/admin/config` 保存

#### 6.6 AuditLog（操作日志）

- Ant Design Table：时间、操作人、操作类型、详情、IP
- 时间范围筛选（DatePicker）
- 从 `GET /api/v1/admin/audit-logs` 获取

**📝 每完成一个页面立即写入 STEPS.md**：
```markdown
| YYYY-MM-DD HH:mm | Step 6.X：<页面名> | ✅ |
  - 已生成 admin/src/pages/<Page>.tsx
  - 已写入 STEPS.md
```

### Step 7：环境变量

```bash
# admin/.env.development
VITE_ADMIN_API_BASE_URL=http://localhost:3000
VITE_API_PREFIX=/api/v1
```

```bash
# admin/.env.production
VITE_ADMIN_API_BASE_URL=https://api.example.com
VITE_API_PREFIX=/api/v1
```

### Step 8：构建验证

```bash
cd admin
npm run build
```

输出确认：
```
✅ 后台管理面板生成完毕！

📁 目录：admin/
📊 页面：登录、仪表盘、用户管理、数据管理、系统配置、操作日志

🚀 启动：
   cd admin
   npm install
   npm run dev
   → http://localhost:5174

📦 构建：
   cd admin
   npm run build
   → admin/dist/
```

### Step 9：写入 STEPS.md

在项目根目录 `STEPS.md` 追加「后台管理面板」章节：

```markdown
---

## 🖥️ 后台管理面板（基于 /saadmin skill）

> 创建时间：YYYY-MM-DD HH:mm
> 技术栈：React 18 + TypeScript + Ant Design 5
> 产出目录：`admin/`

### 📄 页面清单

| 页面 | 文件 | 路由 |
|------|------|------|
| 管理员登录 | `admin/src/pages/Login.tsx` | `/login` |
| 仪表盘 | `admin/src/pages/Dashboard.tsx` | `/dashboard` |
| 用户管理 | `admin/src/pages/Users.tsx` | `/users` |
| 数据管理 | `admin/src/pages/Data.tsx` | `/data` |
| 系统配置 | `admin/src/pages/Config.tsx` | `/config` |
| 操作日志 | `admin/src/pages/AuditLog.tsx` | `/audit-log` |

### ✅ 后台管理面板状态

- [x] 项目脚手架已创建
- [x] 设计令牌已适配
- [x] 通用组件已实现
- [x] 路由已配置
- [x] API 客户端已生成
- [x] 所有页面已实现
- [x] 构建验证通过

### 📝 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| YYYY-MM-DD HH:mm | 后台管理面板 | 创建 admin/ + 6 个管理页面 |
```

### Step 10：分流询问

后台管理面板完成，询问用户下一步：

```
🎉 后台管理面板已生成！

📊 页面：登录、仪表盘、用户管理、数据管理、系统配置、操作日志

❓ 接下来是否接通前后端（含后台管理面板）？
   • A. 是 → 调用 /saapi-connect（接通主前端 + admin 后台）
   • B. 暂不接通，先调整后台
   • C. 结束
```

## 关联 Skill

- `saapi` — 前置（Admin API 接口规范）
- `sabackend` — 前置（后端实现）
- `saapi-connect` — 后续（接通主前端 + admin 后台）
- `sadeploy` — 后续部署

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-08-06-1 | 初版：React 18 + TypeScript + Ant Design 5，直接生成 6 个管理页面（仪表盘/用户管理/数据管理/系统配置/操作日志/登录），读取 STEPS.md + api/openapi.yaml 自动适配项目类型 |