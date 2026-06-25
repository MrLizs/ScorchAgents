---
name: "saapi"
description: "为整个项目规划 RESTful API 设计：自动从 prototype 和 frontend 代码中发现端点，生成 OpenAPI 3.0 规范和人类可读 Markdown 文档，支持 JWT 认证、/api/v1/ 路径规范。Invoke when 用户输入 /saapi 或要求规划/设计项目的 API。"
---

# /saapi — API 设计规划

## 触发条件

- 用户输入 `/saapi` 或 `/saapi <项目目录>`
- 适用于任何阶段：可与 `safrontend` 并行（独立运行），也可在后端实现前使用

## 核心原则

1. **API 风格**：RESTful（GET/POST/PUT/PATCH/DELETE）
2. **路径前缀**：所有端点统一 `/api/v1/...`
3. **认证**：JWT（Access Token + Refresh Token）
4. **存放位置**：独立 `api/` 目录（与 prototype/、frontend/ 平级）
5. **API 发现**：混合策略（扫代码 + prototype 反推 + 手动补充）
6. **产出**：OpenAPI 3.0 规范 + Markdown API 文档
7. **Mock 数据**：从 prototype 提取真实示例数据

## 产出文件结构

```
<project-name>/
├── prototype/
├── frontend/
└── api/                              ← 本 skill 产出
    ├── openapi.yaml                  OpenAPI 3.0 规范（机器可读）
    ├── openapi.json                  OpenAPI 3.0 JSON 版本
    ├── API.md                        Markdown API 文档（人类可读）
    ├── endpoints.md                  端点清单（带说明）
    └── mock-data.json                从 prototype 提取的 mock 数据
```

## 工作流程（严格按顺序）

### Step 1：定位项目根目录

1. 优先使用用户指定目录
2. 否则查找当前目录或子目录中的 `prototype/` 或 `frontend/`
3. 若都没有：提示用户先运行 `/sainit-*` 或 `/safrontend`

输出确认：
```
🔍 定位项目：<path>
✅ 检测到 prototype/
✅ 检测到 frontend/（如有）
```

### Step 2：询问 API 基础配置

#### 2.1 后端语言/框架偏好

使用 `AskUserQuestion`，让用户选择预期实现栈（仅用于生成对应的类型定义建议）：

> 后端实现栈偏好？（影响生成的 TypeScript/Java 类型映射）
> - **A. Node.js + Express**（推荐，前端友好）
> - **B. Node.js + NestJS**（企业级、TypeScript 优先）
> - **C. Python + FastAPI**（AI 项目常用）
> - **D. Go + Gin**（高性能）
> - **E. 其他**（请说明）

**注**：这只是参考，OpenAPI 规范本身是语言无关的。

#### 2.2 API 基础信息

询问：
- API 标题（如"心遇 Dating API"）
- API 描述（一句话定位）
- API 版本（默认 `1.0.0`）
- 联系邮箱（可选）
- 服务器 URL（如 `https://api.example.com` 或本地 `http://localhost:3000`）

### Step 3：创建 `api/` 目录

```bash
if [ ! -d api ]; then
  mkdir api
  echo "✅ api/ 目录已创建"
fi
```

### Step 4：API 资源范围选择（复选框，必选 + 多选可选）

**重要**：API 资源分为 **3 大类**，每类独立勾选。

#### 4.0 三大类概览

| 类别 | 是否必需 | 路径前缀 | 用途 | 示例 |
|------|---------|---------|------|------|
| **后端业务 API** | ✅ 必需 | `/api/v1/` | 项目自己的 REST 接口 | `/api/v1/products`、`/api/v1/users` |
| **外部 SDK 接入** | ☐ 可选 | `/api/v1/sdk/` | 包装第三方服务（支付/短信/地图等） | `/api/v1/sdk/wechat-pay`、`/api/v1/sdk/sms` |
| **后台管理 API** | ☐ 可选 | `/api/v1/admin/` | 运营后台的接口（用户管理/审核等） | `/api/v1/admin/users`、`/api/v1/admin/stats` |

#### 4.1 后端业务 API（必需，自动勾选）

这是核心，必须生成。从 frontend 代码和 prototype 中扫描出来。

> **这一类不需要询问用户，默认全部生成**。

#### 4.2 外部 SDK 接入（AI 智能推荐 + 用户确认）

**核心思想**：**不预设 SDK 清单**，根据已选功能让 AI **动态推断**需要哪些 SDK。

##### 4.2.1 AI 推荐流程

```
1. 读取已选功能清单（如：手机登录、商品支付、上传头像、定位）
   ↓
2. AI 根据功能 → SDK 映射规则，生成推荐清单
   ↓
3. 用 AskUserQuestion 展示推荐清单（分优先级）
   ↓
4. 用户确认/调整/补充
```

##### 4.2.2 功能 → SDK 推断规则（AI 内置知识）

AI 根据已选功能自动推断。**SKILL.md 不预设清单**，由 AI 实时分析。

**推断逻辑**（AI 参考）：

| 已选功能 | 推断可能需要 SDK |
|---------|----------------|
| 手机号登录/注册 | 短信服务 |
| 邮箱注册 | 邮件发送 |
| 收货地址、定位 | 地图服务（地址解析） |
| 商品/订单支付 | 微信支付、支付宝 |
| 头像/商品图/评论图上传 | 对象存储 OSS |
| 视频内容 | 视频云、对象存储、CDN |
| 实时聊天 | 即时通讯 IM、推送通知 |
| 实名/年龄认证 | 活体认证、OCR |
| UGC（评论/帖子/动态） | 内容审核（鉴黄/广告） |
| 短视频/直播 | 视频云、CDN、内容审核 |
| 用户行为分析 | 数据统计（埋点） |
| 订单状态变更通知 | 推送通知、短信 |
| 客服入口 | 客服系统 |
| 分享商品/链接 | 分享 SDK |
| 二维码（签到/分享） | 二维码生成 |

**优先级**：
- **强相关**：已选功能直接依赖（如选了"支付"→ 必须选支付 SDK）
- **弱相关**：业务增强（如选了"实时聊天"→ 可选"推送"）
- **可选**：提升体验（如选了"UGC"→ 可选"内容审核"）

##### 4.2.3 询问用户话术（AI 生成）

AI 根据推断结果**动态生成询问内容**，示例：

```
🤖 根据你已选的功能「<功能清单>」，推断可能需要以下 SDK：

【强相关】（已选功能直接依赖）
☐ 短信服务（手机号登录必需）
☐ 对象存储 OSS（头像/商品图上传必需）
☐ 微信支付（购物支付必需）

【弱相关】（业务增强）
☐ 推送通知（订单状态变更推送）
☐ 地图服务（收货地址定位）

【可选】（按需选择）
☐ 内容审核、客服系统、数据统计...

请选择（多选）：
- A. 全部采纳推荐 → 生成对应端点
- B. 部分采纳 → 告诉我保留/排除哪些
- C. 跳过 SDK → 暂不接入第三方
- D. 我要补充 → 列出其他需要的 SDK
```

##### 4.2.4 端点生成（用户确认后）

根据确认的 SDK，生成对应代理端点。**AI 知道每个 SDK 通常需要哪些端点**：

| SDK | 典型端点 |
|-----|---------|
| 短信 | `POST /api/v1/sdk/sms/send`、`POST /api/v1/sdk/sms/verify` |
| 邮件 | `POST /api/v1/sdk/email/send` |
| 微信支付 | `POST /api/v1/sdk/wechat-pay/create`、`POST /api/v1/sdk/wechat-pay/notify`、`POST /api/v1/sdk/wechat-pay/refund` |
| 支付宝 | `POST /api/v1/sdk/alipay/create`、`POST /api/v1/sdk/alipay/notify` |
| 对象存储 | `POST /api/v1/sdk/oss/upload-token`、`POST /api/v1/sdk/oss/callback` |
| 地图 | `GET /api/v1/sdk/amap/geocode`、`GET /api/v1/sdk/amap/regeocode` |
| 推送 | `POST /api/v1/sdk/push/register`、`POST /api/v1/sdk/push/send` |
| IM | `POST /api/v1/sdk/im/token`、`POST /api/v1/sdk/im/message/send` |
| OCR | `POST /api/v1/sdk/ocr/recognize` |
| 内容审核 | `POST /api/v1/sdk/moderation/text`、`POST /api/v1/sdk/moderation/image` |

**生成示例**（用户确认采纳微信支付 + 短信 + 对象存储）：

```yaml
/api/v1/sdk/sms/send:
  post:
    tags: [SDK]
    summary: 发送短信验证码
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              phone: { type: string }
              template: { type: string, enum: [login, register, reset] }
    responses:
      '200':
        description: 发送成功
        content:
          application/json:
            schema:
              type: object
              properties:
                success: { type: boolean }

/api/v1/sdk/wechat-pay/create:
  post:
    tags: [SDK]
    summary: 创建微信支付订单
    ...

/api/v1/sdk/oss/upload-token:
  post:
    tags: [SDK]
    summary: 获取 OSS 上传凭证
    ...
```

#### 4.3 后台管理 API（AI 智能推荐 + 用户确认）

##### 4.3.1 AI 推荐流程（同 SDK）

```
1. 读取业务类型（dating/shop/blog/tool）+ 已选功能
   ↓
2. AI 根据业务规则，生成后台模块推荐
   ↓
3. 用户确认/调整
```

##### 4.3.2 业务 → 后台模块推断规则

**推断逻辑**（AI 参考）：

| 业务特征 | 推荐后台模块 |
|---------|------------|
| 任何项目 | 用户管理、数据统计、系统配置 |
| 有订单/交易 | 订单管理、退款管理 |
| 有 UGC（评论/帖子/动态） | 内容审核 |
| 有商家/卖家入驻 | 商家管理、商家审核 |
| 有优惠券/活动 | 营销管理、优惠券管理 |
| 有多个管理员 | 权限管理（RBAC） |
| 有物流 | 物流管理 |
| 有客服入口 | 客服会话管理 |
| 有 VIP/会员 | 会员管理、权益配置 |

**业务类型默认推荐**：

| 项目类型 | 默认后台模块 |
|---------|------------|
| **dating**（交友） | 用户管理、举报审核、动态审核、消息审计、数据统计 |
| **shop**（电商） | 用户管理、商品审核、订单管理、退款管理、数据统计、营销管理 |
| **blog**（博客） | 用户管理、文章审核、评论审核、数据统计、广告位管理 |
| **tool**（工具） | 用户管理、数据统计、系统配置 |

##### 4.3.3 询问用户话术（AI 生成）

```
🤖 根据你的项目类型「<类型>」和已选功能，推荐以下后台模块：

【基础必备】（任何项目都需要）
☐ 用户管理（列表/详情/封禁）
☐ 数据统计（实时看板/营收报表）
☐ 系统配置（全局参数/Banner）

【业务强相关】（根据你已选功能）
☐ 订单管理（你的项目有支付功能）
☐ 内容审核（你的项目有评论/UGC）
☐ 退款管理（你的项目有订单）

【高级管理】（可选）
☐ 权限管理（多管理员场景）
☐ 操作日志审计

请选择（多选）：
- A. 全部采纳 → 生成完整后台 API
- B. 部分采纳 → 调整
- C. 只要基础 → 仅用户/统计/配置
- D. 不做后台 → 跳过
```

##### 4.3.4 端点生成

每个后台模块生成对应端点（AI 根据模块自动推断所需 CRUD 端点）：

| 后台模块 | 典型端点 |
|---------|---------|
| 用户管理 | `GET/POST/PUT/DELETE /api/v1/admin/users`、`POST /api/v1/admin/users/{id}/ban` |
| 订单管理 | `GET /api/v1/admin/orders`、`POST /api/v1/admin/orders/{id}/refund`、`POST /api/v1/admin/orders/{id}/close` |
| 内容审核 | `GET /api/v1/admin/moderation/pending`、`POST /api/v1/admin/moderation/{id}/approve`、`POST /api/v1/admin/moderation/{id}/reject` |
| 数据统计 | `GET /api/v1/admin/stats/dashboard`、`GET /api/v1/admin/stats/revenue` |
| 权限管理 | `GET/POST/PUT/DELETE /api/v1/admin/roles`、`POST /api/v1/admin/roles/{id}/permissions` |
| 系统配置 | `GET/PUT /api/v1/admin/config`、`GET/POST/PUT/DELETE /api/v1/admin/banners` |

**生成示例**（用户确认采纳：用户管理 + 订单管理 + 数据统计）：

```yaml
/api/v1/admin/users:
  get:
    tags: [Admin]
    summary: 用户列表
    security: [{ adminAuth: [] }]
    parameters:
      - { name: page, in: query, schema: { type: integer, default: 1 } }
      - { name: keyword, in: query, schema: { type: string } }
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                list: { type: array, items: { $ref: '#/components/schemas/User' } }
                total: { type: integer }

/api/v1/admin/users/{id}/ban:
  post:
    tags: [Admin]
    summary: 封禁用户
    security: [{ adminAuth: [] }]

/api/v1/admin/orders:
  get:
    tags: [Admin]
    summary: 订单列表
    security: [{ adminAuth: [] }]
    ...

/api/v1/admin/stats/dashboard:
  get:
    tags: [Admin]
    summary: 实时数据看板
    security: [{ adminAuth: [] }]
    ...
```

#### 4.4 安全方案差异化

| 类别 | 认证方式 | Token 来源 |
|------|---------|-----------|
| 后端业务 API | `bearerAuth`（普通用户 JWT） | 用户登录返回 |
| 外部 SDK API | `bearerAuth`（普通用户 JWT） | 用户登录返回 |
| 后台管理 API | `adminAuth`（管理员 JWT） | 管理员登录返回，独立入口 |

OpenAPI 中分别定义两个 securitySchemes：

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: 普通用户 JWT
    
    adminAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: 管理员 JWT（独立登录入口）
```

#### 4.5 多源 API 发现（核心步骤）

并行执行 3 个发现流程，结果合并（每条端点都标注属于哪一类）：

##### 4.5.1 源 A：扫描 frontend/ 代码

**前提**：`frontend/` 目录存在

执行 grep 查找 API 调用：
```bash
# 查找 fetch 调用
grep -rE "fetch\(|axios\.|apiClient|\.get\(|\.post\(|\.put\(|\.delete\(" frontend/src/ \
  --include="*.ts" --include="*.tsx" --include="*.vue" --include="*.js" \
  -h | sort -u
```

提取每个端点：
- HTTP method（GET/POST/PUT/DELETE）
- URL path（如 `/api/v1/users`）
- 请求参数（query / body）
- 返回类型（TypeScript interface）

**结果记录**到内存中的端点列表（标记 `来源=code`，`类别=后端API`）。

##### 4.5.2 源 B：扫描 prototype/ HTML

**前提**：`prototype/` 目录存在

读取每个 HTML 文件，识别数据需求：

| prototype 中识别到的内容 | 推断 API | 类别 |
|------------------------|---------|------|
| 商品列表（cards 数组） | `GET /api/v1/products` | 后端API |
| 单个商品详情 | `GET /api/v1/products/{id}` | 后端API |
| 用户头像+昵称+token | `POST /api/v1/auth/login` | 后端API |
| 消息列表 | `GET /api/v1/messages` | 后端API |
| 提交表单按钮 | 对应 `POST/PUT` 端点 | 后端API |
| 搜索框 | `GET /api/v1/search?q=` | 后端API |
| 分类筛选 Tab | `GET /api/v1/products?category=X` | 后端API |
| 支付按钮 | `POST /api/v1/sdk/wechat-pay/create` | **外部SDK**（自动识别） |
| 发送验证码 | `POST /api/v1/sdk/sms/send` | **外部SDK**（自动识别） |
| 地图选址 | `GET /api/v1/sdk/amap/geocode` | **外部SDK**（自动识别） |
| 数据看板 | `GET /api/v1/admin/stats/dashboard` | **后台API**（自动识别，若 prototype 含 admin/） |

**结果记录**到端点列表（标记 `来源=prototype`，`类别=自动识别`）。

##### 4.5.3 源 C：让用户手动补充/修改

使用 `AskUserQuestion` 展示已发现的端点，让用户：
- 确认保留
- 添加遗漏
- 修改/删除
- 调整路径
- **重新分类**（如把某些端点标记为 SDK）

> 已发现 N 个端点（X 后端API、Y SDK、Z 后台API），请确认：
> - **A. 全部保留，继续生成**
> - **B. 我要手动调整**（输入修改）
> - **C. 我要添加更多端点**（逐个输入，需标注类别）

### Step 5：生成 OpenAPI 3.0 规范（`api/openapi.yaml`）

#### 5.1 基础结构（按 3 类划分 tag）

```yaml
openapi: 3.0.3
info:
  title: <API 标题>
  description: <API 描述>
  version: 1.0.0
  contact:
    email: <联系邮箱>
servers:
  - url: <服务器 URL>
    description: <环境名>

tags:
  - name: 认证
    description: 用户登录注册相关
  - name: 用户
    description: 用户基本信息
  - name: 商品
    description: 商品浏览、详情、搜索
  - name: SDK-支付
    description: 第三方支付接入（微信/支付宝）
  - name: SDK-通讯
    description: 短信、推送、邮件
  - name: SDK-地图
    description: 地图选址、定位
  - name: SDK-存储
    description: 文件上传、对象存储
  - name: SDK-AI
    description: OCR、人脸、内容审核
  - name: Admin-用户
    description: 后台用户管理
  - name: Admin-订单
    description: 后台订单管理
  - name: Admin-审核
    description: 后台内容审核
  - name: Admin-统计
    description: 后台数据统计
  - name: Admin-权限
    description: 后台权限与角色

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: 普通用户 JWT
    
    adminAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: 管理员 JWT（独立登录入口）

  schemas:
    # 共用数据模型
    User: ...
    Error: ...
    # ... 按 prototype 提取的所有数据模型

# 默认安全：普通用户 JWT
security:
  - bearerAuth: []

paths:
  # ========== 后端业务 API（/api/v1/） ==========
  /api/v1/auth/login:
    post:
      tags: [认证]
      summary: 用户登录
      security: []  # 公开端点
      ...

  /api/v1/users/me:
    get:
      tags: [用户]
      summary: 获取当前用户
      ...

  # ========== 外部 SDK 接入（/api/v1/sdk/） ==========
  /api/v1/sdk/wechat-pay/create:
    post:
      tags: [SDK-支付]
      summary: 创建微信支付订单
      ...

  /api/v1/sdk/sms/send:
    post:
      tags: [SDK-通讯]
      summary: 发送短信验证码
      ...

  # ========== 后台管理 API（/api/v1/admin/） ==========
  /api/v1/admin/users:
    get:
      tags: [Admin-用户]
      summary: 用户列表
      security:
        - adminAuth: []   # 后台专用 token
      ...

  /api/v1/admin/stats/dashboard:
    get:
      tags: [Admin-统计]
      summary: 实时数据看板
      security:
        - adminAuth: []
      ...
```

#### 5.2 端点生成规则

对每个端点：
1. **路径分类**：
   - 后端业务 API → `/api/v1/<resource>`
   - 外部 SDK → `/api/v1/sdk/<sdk-name>/<action>`
   - 后台管理 → `/api/v1/admin/<resource>`
2. **Method**：根据 HTTP 语义推断
3. **认证**：
   - 后端业务 API → `bearerAuth`（登录/注册除外）
   - 外部 SDK → `bearerAuth`（部分可能公开，如地图查询）
   - 后台管理 → `adminAuth`
4. **tag**：根据类别自动打标（用户可微调）
5. **Request/Response schemas**：从 frontend TypeScript 类型或 prototype 数据结构推断
6. **错误响应**：每个端点至少包含 401（未认证）、403（无权限）、404（不存在）、500（服务器错误）

### Step 6：生成 Markdown API 文档（`api/API.md`）

```markdown
# <项目名> API 文档

> <一句话定位>
> 版本：1.0.0
> Base URL：<服务器 URL>

## 目录

- [认证](#认证)
- [用户](#用户)
- [业务模块 1](#业务模块-1)
- [错误码](#错误码)

## 认证

所有 API（除登录/注册外）需要在 Header 中携带 JWT：
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

Access Token 有效期：2 小时
Refresh Token 有效期：30 天

### POST /api/v1/auth/login

用户登录（手机号 + 验证码）

**请求体**：
\`\`\`json
{
  "phone": "13800138000",
  "code": "123456"
}
\`\`\`

**响应 200**：
\`\`\`json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "nickname": "用户1234",
    "avatar": "https://..."
  }
}
\`\`\`

**错误码**：
- 400：参数错误
- 401：验证码错误
- 429：请求过于频繁

---

## 用户

### GET /api/v1/users/me

获取当前登录用户信息

**需要认证**：是

**响应 200**：
...

---

## 业务模块

...

---

## 错误码

| HTTP | 含义 |
|------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或 token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
```

### Step 7：生成 `api/endpoints.md`（端点清单）

简洁的端点列表，便于快速查阅：

```markdown
# 端点清单

| Method | Path | 标签 | 认证 | 描述 |
|--------|------|------|------|------|
| POST | /api/v1/auth/login | 认证 | ❌ | 用户登录 |
| POST | /api/v1/auth/refresh | 认证 | ❌ | 刷新 token |
| GET  | /api/v1/users/me | 用户 | ✅ | 获取当前用户 |
| GET  | /api/v1/products | 商品 | ✅ | 商品列表 |
| ... | ... | ... | ... | ... |
```

### Step 8：生成 `api/mock-data.json`

从 prototype HTML 中提取的 mock 数据（按端点路径组织）：

```json
{
  "GET /api/v1/products": [
    {
      "id": 1,
      "name": "商品名 1",
      "price": 99.00,
      "image": "https://picsum.photos/..."
    },
    ...
  ],
  "GET /api/v1/users/me": {
    "id": 1,
    "nickname": "示例用户",
    "avatar": "https://i.pravatar.cc/150?img=10"
  }
}
```

**提取规则**：
- 遍历 prototype/*.html
- 找到图片 URL（picsum/pravatar/unsplash）→ 作为图片字段 mock
- 找到中文文字内容 → 作为文本字段 mock
- 找到价格（`¥XX.XX` 或 `XX.XX元`）→ 作为价格字段 mock
- 找到数组结构 → 复制 3-5 个变体

### Step 9：输出最终结果

```
✅ API 设计完成！

📁 产出文件（api/）：
   • openapi.yaml       OpenAPI 3.0 规范
   • openapi.json       JSON 版本
   • API.md             Markdown 文档
   • endpoints.md       端点清单
   • mock-data.json     Mock 数据

📊 统计：
   • 后端业务 API：A 个端点（X from code, Y from prototype）
   • 外部 SDK 接入：B 个端点（用户勾选 Y 个 SDK）
   • 后台管理 API：C 个端点（用户勾选 Z 个后台模块）
   • 共 N 个端点
   • 共 M 个数据模型

🎯 资源范围：
   ✅ 后端业务 API（必需）
   ☐ 外部 SDK：微信支付、短信、高德地图（你勾选的）
   ☐ 后台管理：用户管理、订单管理、数据统计（你勾选的）

🚀 下一步建议：
   1. 用 Swagger UI 查看 openapi.yaml：
      npx @apidevtools/swagger-cli serve api/openapi.yaml
      
   2. 用 Apifox / Postman 导入 openapi.json 调试
      
   3. 后端实现时参考 API.md：
      - Node: nestjs / express + prisma
      - Python: fastapi + sqlalchemy
      
   4. /sabackend 一键生成后端代码（含 mock 实现）
   
   5. 后台管理 API 对应单独的后台项目：
      /saadmin 一键生成后台管理界面（如果存在该 skill）

💡 提示：
   - 修改 API 后可重新运行 /saapi 增量更新
   - 让前端开发者直接看 API.md，无需读 openapi.yaml
   - 后台 API 需独立的 admin 入口和 JWT 体系
```

## 关键技术约束

- ⚠️ **3 类路径前缀**：
  - 后端业务 API → `/api/v1/<resource>`
  - 外部 SDK → `/api/v1/sdk/<name>/<action>`
  - 后台管理 → `/api/v1/admin/<resource>`
- ⚠️ **认证差异化**：
  - 普通接口用 `bearerAuth`（用户 JWT）
  - 后台接口用 `adminAuth`（管理员 JWT，独立登录）
- ⚠️ **错误响应统一格式**：`{ code: number, message: string }`
- ⚠️ **时间字段用 ISO 8601**：`2024-01-15T10:30:00Z`
- ⚠️ **分页参数统一**：`page`、`pageSize`（默认 20）
- ⚠️ **OpenAPI 3.0.3**（最新稳定版）
- ⚠️ **SDK 代理原则**：前端永远不直接调第三方，必须走自家后端代理

## 关联 Skill

- `sainit-*` — 前置（生成 prototype）
- `safrontend` — 可并行（已生成的代码会作为 API 发现来源）
- `sabackend` — 后续（基于 OpenAPI 生成后端业务代码）
- `saadmin` — 后续（基于 admin API 生成后台管理界面）
- `sadeploy` — 后续部署（含 API mock 服务）