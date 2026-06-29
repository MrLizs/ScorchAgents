---
name: "saapi"
description: "为整个项目规划 API 接口：自动从 prototype 和 frontend 代码中发现需要哪些功能接口，生成 OpenAPI 3.0 规范和人类可读 Markdown 文档，支持 JWT 认证、/api/v1/ 路径规范。Invoke when 用户输入 /saapi 或要求规划/设计项目的 API。"
---

# /saapi — API 接口设计

## 什么是 API 接口？

简单说：**接口就是前端（用户看到的页面）跟后端（服务器）之间的"对话窗口"**。

举个例子：
- 用户点"登录"按钮 → 前端调用"登录接口" → 后端验证 → 返回结果
- 用户看商品列表 → 前端调用"商品列表接口" → 后端返回商品数据

这个 skill 的工作就是：**帮你把所有需要的功能接口都规划清楚**，让前端和后端开发都有章可循。

## 触发条件

- 用户输入 `/saapi` 或 `/saapi <项目目录>`
- 适用于任何阶段：可与 `safrontend` 并行（独立运行），也可在后端实现前使用

## 推荐执行顺序

> ⛔ **强烈推荐顺序**：`/sainit-*` → **`/safrontend`** → **`/saapi`** → `/sabackend` → `/saapi-connect`
>
> 📌 虽然本 skill 自描述「可与 safrontend 并行」，但**只有按推荐顺序跑**才能保证接口发现完整 + 前后端零返工。

### 为什么不推荐并行

`/saapi` 的核心原则 #5 「接口发现」采用**三源混合策略**：

| 发现源 | 内容 | 何时生效 |
|-------|------|---------|
| 源 A：扫 `frontend/src/` 代码 | 从 API 调用（`apiClient.get`、`fetch(...)` 等）提取接口 | ✅ 需要先有 frontend 代码 |
| 源 B：扫 `prototype/` HTML | 从 HTML 数据需求反推接口 | ✅ prototype 阶段已有，**降级模式** |
| 源 C：用户手动补充 | AskUserQuestion 让用户增删改 | ✅ 任何时候 |

**若用户先跑 `/saapi` 而 `frontend/` 不存在**：

- 源 A 失效 → 仅依赖 prototype（精度低）
- 后续 safrontend 引入新接口（如真实分页 / 排序 / 筛选参数）→ `/saapi` 需**重新跑一次**才能补全
- 增加返工成本

**若用户先跑 `/safrontend` 再跑 `/saapi`**：

- 源 A 全量生效 → 接口发现最完整
- sabackend / saapi-connect 按 `api/openapi.yaml` 实现 → 零返工

### 检测与提示

> 📌 **Step 1 必须先检测 frontend 目录是否存在**，若不存在则给出明确警告但仍允许继续（兼容「跳过 safrontend」的极简流程）。

Step 1 输出改造为：

```
🔍 找到项目：<path>

✅ 发现 prototype/    → 源 B 可用
⚠️  发现 frontend/    → 源 A 不可用（接口发现将仅依赖 prototype 反推，建议先跑 /safrontend）

💡 推荐执行顺序：/sainit-* → /safrontend → /saapi
   现在继续执行 /saapi？[是 / 否，先去跑 safrontend]
```

| 情况 | 默认推荐 | 提示文案 |
|------|---------|---------|
| 有 prototype + 有 frontend | 直接继续 | 「接口发现源齐全，开始扫描」 |
| 有 prototype + 无 frontend | **警告但不阻断** | 「⚠️ 接口发现将仅依赖 prototype，建议先跑 /safrontend」 |
| 无 prototype + 有 frontend | 直接继续 | 「从 frontend 代码扫描接口」 |
| 都无 | 阻断 | 「请先运行 /sainit-* 生成 prototype」 |

## 核心原则

1. **接口风格**：RESTful（用 GET/POST/PUT/PATCH/DELETE 这些 HTTP 方法）
2. **路径前缀**：所有接口统一 `/api/v1/...`
3. **认证方式**：JWT（Access Token + Refresh Token）
4. **存放位置**：独立 `api/` 目录（与 prototype/、frontend/ 平级）
5. **接口发现**：混合策略（扫代码 + prototype 反推 + 手动补充）
6. **产出**：OpenAPI 3.0 规范 + Markdown 接口文档
7. **Mock 数据**：从 prototype 提取真实示例数据

## 产出文件结构（精简到 3 个）

```
<project-name>/
├── prototype/
├── frontend/
└── api/                              ← 本 skill 产出
    ├── openapi.yaml                  机器看的接口规范（OpenAPI 3.0）
    ├── API.md                        人看的接口说明文档（大白话）
    └── mock-data.json                机器看的测试数据
```

**为什么是这 3 个？**
- `openapi.yaml`：给 Swagger、Postman、Apifox 等工具读，能自动生成调试页面
- `API.md`：给前端开发者/你自己看，每个接口怎么用、传什么、返回什么
- `mock-data.json`：给后端开发当假数据用，方便边写代码边测试

> 删掉了 `openapi.json`（和 yaml 内容一样，只是格式不同）、`endpoints.md`（信息已在 API.md 里）—— 小白用不到，多了反而懵。

## 工作流程（严格按顺序）

### Step 1：定位项目根目录

1. 优先使用用户指定目录
2. 否则查找当前目录或子目录中的 `prototype/` 或 `frontend/`
3. 若都没有：提示用户先运行 `/sainit-*` 或 `/safrontend`

输出确认：
```
🔍 找到项目：<path>
✅ 发现 prototype/
✅ 发现 frontend/（如有）
```

### Step 2：询问 API 基础配置

#### 2.1 后端语言/框架偏好

使用 `AskUserQuestion`，让用户选择预期实现栈（仅用于生成对应的类型定义建议）：

> 你打算用什么后端技术？（影响接口字段的类型映射，但 API 规范本身是通用的）
> - **A. Node.js + Express**（推荐，前端友好）
> - **B. Node.js + NestJS**（企业级、TypeScript 优先）
> - **C. Python + FastAPI**（AI 项目常用）
> - **D. Go + Gin**（高性能）
> - **E. 其他**（请说明）

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

### Step 4：API 功能范围选择（必选 + 多选可选）

**重要**：API 接口分 **3 大类**，每类独立勾选。

#### 4.0 三大类概览

| 类别 | 是否必需 | 路径长这样 | 干嘛用 | 例子 |
|------|---------|-----------|--------|------|
| **业务接口** | ✅ 必需 | `/api/v1/` | 项目自己用的功能 | `/api/v1/products`、`/api/v1/users` |
| **第三方对接** | ☐ 可选 | `/api/v1/sdk/` | 包装第三方服务（支付/短信/地图等） | `/api/v1/sdk/wechat-pay`、`/api/v1/sdk/sms` |
| **后台管理接口** | ☐ 可选 | `/api/v1/admin/` | 运营后台用的接口 | `/api/v1/admin/users`、`/api/v1/admin/stats` |

#### 4.1 业务接口（必需，自动生成）

这是核心，必须生成。从 frontend 代码和 prototype 中扫描出来。

> **这一类不需要问你，默认全部生成**。

#### 4.2 第三方对接（AI 智能推荐 + 用户确认）

**核心思想**：**不预设清单**，根据已选功能让 AI **动态推断**需要哪些第三方服务。

##### 4.2.1 AI 推荐流程

```
1. 看你勾选的功能（比如：手机登录、商品支付、上传头像、定位）
   ↓
2. AI 根据功能 → 推断需要哪些第三方服务
   ↓
3. 用 AskUserQuestion 给你看推荐清单（分优先级）
   ↓
4. 你确认/调整/补充
```

##### 4.2.2 功能 → 第三方服务推断规则（AI 内置知识）

AI 根据已选功能自动推断。**SKILL.md 不预设清单**，由 AI 实时分析。

**推断逻辑**（AI 参考）：

| 你勾选的功能 | AI 推断可能需要 |
|------------|--------------|
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
- **强相关**：你勾的功能直接依赖（如选了"支付"→ 必须选支付 SDK）
- **弱相关**：业务增强（如选了"实时聊天"→ 可选"推送"）
- **可选**：提升体验（如选了"UGC"→ 可选"内容审核"）

##### 4.2.3 询问用户话术（AI 生成）

AI 根据推断结果**动态生成询问内容**，示例：

```
🤖 根据你勾的功能「<功能清单>」，我猜你需要这些第三方服务：

【强相关】（你勾的功能直接依赖，必须接）
☐ 短信服务（手机号登录必需）
☐ 对象存储 OSS（头像/商品图上传必需）
☐ 微信支付（购物支付必需）

【弱相关】（让产品更好用，建议接）
☐ 推送通知（订单状态变更推送）
☐ 地图服务（收货地址定位）

【可选】（看心情）
☐ 内容审核、客服系统、数据统计...

请选（多选）：
- A. 全部采纳推荐 → 生成对应接口
- B. 部分采纳 → 告诉我保留/排除哪些
- C. 跳过 SDK → 暂不接第三方
- D. 我要补充 → 列出其他需要的
```

##### 4.2.4 接口生成（用户确认后）

根据确认的第三方服务，生成对应代理接口。**AI 知道每个服务通常需要哪些接口**：

| 第三方服务 | 典型接口 |
|-----------|---------|
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

#### 4.3 后台管理接口（AI 智能推荐 + 用户确认）

##### 4.3.1 AI 推荐流程（同 SDK）

```
1. 看项目类型（dating/shop/blog/tool）+ 已选功能
   ↓
2. AI 根据业务规则，生成后台模块推荐
   ↓
3. 你确认/调整
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
🤖 根据你的项目类型「<类型>」和已选功能，推荐这些后台模块：

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

请选（多选）：
- A. 全部采纳 → 生成完整后台接口
- B. 部分采纳 → 调整
- C. 只要基础 → 仅用户/统计/配置
- D. 不做后台 → 跳过
```

##### 4.3.4 接口生成

每个后台模块生成对应接口（AI 根据模块自动推断所需 CRUD 接口）：

| 后台模块 | 典型接口 |
|---------|---------|
| 用户管理 | `GET/POST/PUT/DELETE /api/v1/admin/users`、`POST /api/v1/admin/users/{id}/ban` |
| 订单管理 | `GET /api/v1/admin/orders`、`POST /api/v1/admin/orders/{id}/refund`、`POST /api/v1/admin/orders/{id}/close` |
| 内容审核 | `GET /api/v1/admin/moderation/pending`、`POST /api/v1/admin/moderation/{id}/approve`、`POST /api/v1/admin/moderation/{id}/reject` |
| 数据统计 | `GET /api/v1/admin/stats/dashboard`、`GET /api/v1/admin/stats/revenue` |
| 权限管理 | `GET/POST/PUT/DELETE /api/v1/admin/roles`、`POST /api/v1/admin/roles/{id}/permissions` |
| 系统配置 | `GET/PUT /api/v1/admin/config`、`GET/POST/PUT/DELETE /api/v1/admin/banners` |

#### 4.4 安全方案差异化

| 类别 | 认证方式 | Token 从哪来 |
|------|---------|------------|
| 业务接口 | 用户登录后的 JWT | 用户登录返回 |
| 第三方对接接口 | 用户登录后的 JWT | 用户登录返回 |
| 后台管理接口 | 管理员的 JWT（独立的） | 管理员从独立入口登录返回 |

OpenAPI 中分别定义两个 securitySchemes：

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: 普通用户登录后拿到的 token
    
    adminAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: 管理员登录后拿到的 token（独立登录入口）
```

#### 4.5 多源 API 发现（核心步骤）

并行执行 3 个发现流程，结果合并（每条接口都标注属于哪一类）：

##### 4.5.1 源 A：扫描 frontend/ 代码

**前提**：`frontend/` 目录存在

执行 grep 查找 API 调用：
```bash
# 查找 fetch 调用
grep -rE "fetch\(|axios\.|apiClient|\.get\(|\.post\(|\.put\(|\.delete\(" frontend/src/ \
  --include="*.ts" --include="*.tsx" --include="*.vue" --include="*.js" \
  -h | sort -u
```

提取每个接口：
- HTTP method（GET/POST/PUT/DELETE）
- URL path（如 `/api/v1/users`）
- 请求参数（query / body）
- 返回类型（TypeScript interface）

**结果记录**到内存中的接口列表（标记 `来源=code`，`类别=业务接口`）。

##### 4.5.2 源 B：扫描 prototype/ HTML

**前提**：`prototype/` 目录存在

读取每个 HTML 文件，识别数据需求：

| prototype 里出现的内容 | 推断接口 | 类别 |
|----------------------|---------|------|
| 商品列表（cards 数组） | `GET /api/v1/products` | 业务接口 |
| 单个商品详情 | `GET /api/v1/products/{id}` | 业务接口 |
| 用户头像+昵称+token | `POST /api/v1/auth/login` | 业务接口 |
| 消息列表 | `GET /api/v1/messages` | 业务接口 |
| 提交表单按钮 | 对应 `POST/PUT` 接口 | 业务接口 |
| 搜索框 | `GET /api/v1/search?q=` | 业务接口 |
| 分类筛选 Tab | `GET /api/v1/products?category=X` | 业务接口 |
| 支付按钮 | `POST /api/v1/sdk/wechat-pay/create` | **第三方对接**（自动识别） |
| 发送验证码 | `POST /api/v1/sdk/sms/send` | **第三方对接**（自动识别） |
| 地图选址 | `GET /api/v1/sdk/amap/geocode` | **第三方对接**（自动识别） |
| 数据看板 | `GET /api/v1/admin/stats/dashboard` | **后台接口**（自动识别，若 prototype 含 admin/） |

**结果记录**到接口列表（标记 `来源=prototype`，`类别=自动识别`）。

##### 4.5.3 源 C：让用户手动补充/修改

使用 `AskUserQuestion` 展示已发现的接口，让用户：
- 确认保留
- 添加遗漏
- 修改/删除
- 调整路径
- **重新分类**（如把某些接口标记为 SDK）

> 已经发现 N 个接口（X 业务、Y 第三方、Z 后台），请确认：
> - **A. 全部保留，继续生成**
> - **B. 我要手动调整**（输入修改）
> - **C. 我要添加更多接口**（逐个输入，需标注类别）

### Step 5：生成 OpenAPI 3.0 规范（`api/openapi.yaml`）——给机器看

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
      description: 普通用户登录后拿到的 token
    
    adminAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: 管理员登录后拿到的 token（独立登录入口）

  schemas:
    # 共用数据模型
    User: ...
    Error: ...
    # ... 按 prototype 提取的所有数据模型

# 默认安全：普通用户 JWT
security:
  - bearerAuth: []

paths:
  # ========== 业务接口（/api/v1/） ==========
  /api/v1/auth/login:
    post:
      tags: [认证]
      summary: 用户登录
      security: []  # 公开接口
      ...

  /api/v1/users/me:
    get:
      tags: [用户]
      summary: 获取当前用户
      ...

  # ========== 第三方对接（/api/v1/sdk/） ==========
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

  # ========== 后台管理接口（/api/v1/admin/） ==========
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

#### 5.2 接口生成规则

对每个接口：
1. **路径分类**：
   - 业务接口 → `/api/v1/<resource>`
   - 第三方对接 → `/api/v1/sdk/<name>/<action>`
   - 后台管理 → `/api/v1/admin/<resource>`
2. **Method**：根据 HTTP 语义推断
3. **认证**：
   - 业务接口 → `bearerAuth`（登录/注册除外）
   - 第三方对接 → `bearerAuth`（部分可能公开，如地图查询）
   - 后台管理 → `adminAuth`
4. **tag**：根据类别自动打标（用户可微调）
5. **Request/Response schemas**：从 frontend TypeScript 类型或 prototype 数据结构推断
6. **错误响应**：每个接口至少包含 401（未登录）、403（没权限）、404（找不到）、500（服务器出错）

### Step 6：生成 Markdown API 文档（`api/API.md`）——给人看

**API.md 用大白话写**，让前端开发者或你自己一眼能看懂，**每个接口独立一节**。

```markdown
# <项目名> API 接口文档

> <一句话定位>
> 版本：1.0.0
> 接口根地址：<服务器 URL>

## 目录

- [认证相关](#认证相关)
- [用户相关](#用户相关)
- [业务模块 1](#业务模块-1)
- [出错了怎么办](#出错了怎么办)

## 认证相关

除了登录/注册，其他接口都需要在请求头里带一个 token（相当于你的"通行证"）：
\`\`\`
Authorization: Bearer <你的 token>
\`\`\`

- Access Token（通行证）有效期：2 小时
- Refresh Token（续期凭证）有效期：30 天

### POST /api/v1/auth/login

**干嘛用**：用户登录（用手机号 + 验证码）

**要传什么**：
\`\`\`json
{
  "phone": "13800138000",
  "code": "123456"
}
\`\`\`

**返回什么**（成功时）：
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

**可能出错**：
- 400：你传的数据格式不对
- 401：验证码错了
- 429：你点太快了，休息一下再试

---

## 用户相关

### GET /api/v1/users/me

**干嘛用**：获取当前登录的用户信息

**要登录吗**：要

**返回什么**（成功时）：
...

---

## 业务模块

...

---

## 出错了怎么办

| HTTP 状态码 | 啥意思 |
|------------|--------|
| 400 | 你传的数据有问题 |
| 401 | 没登录或 token 过期了 |
| 403 | 登录了但没权限 |
| 404 | 找的东西不存在 |
| 429 | 请求太频繁，歇会儿 |
| 500 | 服务器出问题了，找后端同学 |
```

### Step 7：生成 `api/mock-data.json` ——给机器看的假数据

从 prototype HTML 中提取假数据（按接口路径组织），后端开发可以拿来当测试数据：

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
- 找到图片 URL（picsum/pravatar/unsplash）→ 作为图片字段
- 找到中文文字内容 → 作为文本字段
- 找到价格（`¥XX.XX` 或 `XX.XX元`）→ 作为价格字段
- 找到数组结构 → 复制 3-5 个变体

### Step 8：输出最终结果

```
✅ API 设计完成！

📁 产出文件（api/ 目录下）：
   • openapi.yaml       给机器看的接口规范
   • API.md             给你看的接口说明（大白话）
   • mock-data.json     给后端当测试用的假数据

📊 统计：
   • 业务接口：A 个（X 来自代码，Y 来自原型）
   • 第三方对接：B 个（你勾了 Y 个）
   • 后台管理接口：C 个（你勾了 Z 个）
   • 共 N 个接口
   • 共 M 个数据模型

🎯 接口范围：
   ✅ 业务接口（必需）
   ☐ 第三方对接：微信支付、短信、高德地图（你勾的）
   ☐ 后台管理：用户管理、订单管理、数据统计（你勾的）

🚀 下一步建议：
   1. 用 Swagger UI 看 openapi.yaml（自动出调试页面）：
      npx @apidevtools/swagger-cli serve api/openapi.yaml
      
   2. 用 Apifox / Postman 导入 openapi.yaml 调试
   
   3. 后端开发看 API.md 实现功能，参考字段类型：
      - Node: nestjs / express + prisma
      - Python: fastapi + sqlalchemy
      
   4. /sabackend 一键生成后端代码（含 mock 实现）
   
   5. 后台管理接口对应单独的后台项目：
      /saadmin 一键生成后台管理界面（如果存在该 skill）

💡 小提示：
   - 修改接口后可以重新跑 /saapi 增量更新
   - 让前端开发者直接看 API.md，不用读 openapi.yaml
   - 后台接口需要独立的 admin 入口和 token 体系
```

### Step 8.5：写入 STEPS.md（关键决策持久化）

> 📌 **本步骤为强制步骤**。saapi 阶段用户的所有关键决策必须写入 `STEPS.md`，供后续 `/sabackend` 读取作为默认推荐。

#### 8.5.1 前置检查

```bash
# 1. STEPS.md 是否已存在（由 safrontend 创建）
if [ -f STEPS.md ]; then
  echo "✅ STEPS.md 已存在（由 safrontend 创建），将追加「API 设计」章节"
else
  echo "⚠️ STEPS.md 不存在（safrontend 未运行），将创建并写入项目根目录"
  # 询问用户是否要补建（避免直接创建空白文件）
  # 若用户已用 /sainit-* 但未 /safrontend，建议先跑 /safrontend
fi
```

#### 8.5.2 追加「API 设计」章节

在 `STEPS.md` 末尾追加如下内容（**无论 STEPS.md 是否由 safrontend 创建，都使用相同的章节结构**）：

```markdown
---

## 🌐 API 设计（基于 /saapi skill）

> 设计时间：YYYY-MM-DD HH:mm
> 触发方式：<手动 /saapi | 与 safrontend 并行>
> API 版本：1.0.0
> 产出目录：`api/`
> API 标题：<Step 2.2 用户填的标题>
> 描述：<Step 2.2 用户填的描述>
> 服务器 URL：<Step 2.2 用户填的服务器地址>

### 🔐 API 来源指纹（变更检测用）

> ⚠️ 每次重新启动 `/saapi` 时自动比对下方 hash；不一致则提示「API 规范已更新」。

| 文件 | SHA-256 | mtime |
|------|---------|-------|
| `api/openapi.yaml`    | `<启动时计算>` | `<启动时计算>` |
| `api/API.md`          | `<启动时计算>` | `<启动时计算>` |
| `api/mock-data.json`  | `<启动时计算>` | `<启动时计算>` |

### 🛠 后端技术栈偏好（传递给 /sabackend）

> ⚠️ **本节是 /sabackend 的默认推荐配置**。/sabackend 启动时会读取此处并作为默认值，用户仍可手动调整。

| 维度 | 用户选择（saapi 阶段） | /sabackend 启动时的默认 |
|------|---------------------|---------------------|
| 后端语言/框架 | <Node.js + Express \| Node.js + NestJS \| Python + FastAPI \| Go + Gin \| 其它> | 沿用 |
| 服务器 URL | `<sabackend 将用此值作为 OpenAPI servers 节点>` | 沿用 |
| API 标题 | `<传递到 sabackend 的 config 注释>` | 沿用 |

> 📌 **本节不决定** ORM、数据库、架构等更细粒度选项——这些由 `/sabackend` 阶段的 Step 1.1-1.4 重新询问（更细粒度的选型由后端开发者根据团队习惯决定）。

### 📊 接口统计

| 类别 | 数量 | 来源 |
|------|------|------|
| 业务接口（必需） | N | X 来自代码 / Y 来自原型 / Z 来自用户补充 |
| 第三方对接（SDK） | M | 用户勾选的服务清单见下方 |
| 后台管理（Admin） | K | 用户勾选的模块清单见下方 |
| **总计** | **N+M+K** | - |

### 🔌 第三方 SDK 清单（用户勾选）

> ⚠️ **传给 /sabackend**：sabackend Phase 2 生成的第三方接口（如 `/api/v1/sdk/wechat-pay/*`）将基于本清单实现；sabackend 的 `system_config` 表默认配置也会按本清单初始化。

| 第三方服务 | 优先级 | 用途 | 默认实现 |
|----------|--------|------|---------|
| <例如：短信> | 强相关 | <手机号登录> | <sms_provider=mock> |
| <例如：微信支付> | 强相关 | <订单支付> | <wechat_app_id=""> |
| <例如：对象存储> | 弱相关 | <头像/商品图> | <oss_provider=local> |
| ... | ... | ... | ... |

### 🏢 后台管理模块清单（用户勾选）

> ⚠️ **传给 /sabackend**：sabackend Phase 2 生成的 Admin 接口将基于本清单实现；后台管理员账号的初始化权限也会按本清单生成。

| 后台模块 | 优先级 | 用途 | 默认路由前缀 |
|--------|--------|------|-----------|
| <例如：用户管理> | 基础 | <用户列表/封禁> | `/api/v1/admin/users` |
| <例如：数据统计> | 基础 | <实时看板/营收报表> | `/api/v1/admin/stats` |
| ... | ... | ... | ... |

### 🏷 项目元信息（与 sainit 保持一致）

> ⚠️ 本节由 saapi 启动时从 `STEPS.md` 读取（若已存在），sabackend 也会读取；如未读取到则在 saapi 阶段询问用户补全。

| 字段 | 值 | 来源 |
|------|------|------|
| 项目名（英文） | `<kebab-case>` | 沿用 sainit-* |
| 项目名（中文） | `<用户填>` | 沿用 sainit-* |
| 项目类型 | <dating \| shop \| blog \| tool> | 沿用 sainit-* |
| 业务功能清单 | <列表> | 沿用 sainit-* |
| UI 风格 | <A/B/C/D/E> | 沿用 sainit-* |

> 📌 **sabackend 在 Step 1 中读取本节**，项目名/中文名不再重复询问（仅在缺失时才询问）。

### ✅ API 设计状态

- [x] api/openapi.yaml 已生成
- [x] api/API.md 已生成
- [x] api/mock-data.json 已生成
- [x] STEPS.md 已记录本阶段关键决策
- [x] 项目元信息已与 sainit 同步
- 后端实现：⏭ 未开始
- 前后端接通：⏭ 未开始

### 📝 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| YYYY-MM-DD HH:mm | API 设计 | 初始化 /api/openapi.yaml + API.md + mock-data.json |
| ... | ... | ... |
```

#### 8.5.3 项目元信息回填逻辑

```bash
# 1. 读取 STEPS.md 中「项目元信息」节
# 2. 若不存在：询问用户「项目名（中文）」+「项目类型」（不询问风格与功能——这些由 sainit 决定）
# 3. 若存在：直接沿用，仅在缺失项时询问
```

**询问话术**（仅在元信息缺失时）：

> 🔍 检测到 STEPS.md 中缺少项目元信息（可能未运行 /sainit-*），请补全：
> - **项目名（中文）**：<必填，用于 sabackend 推导数据库表前缀>
> - **项目类型**：<dating / shop / blog / tool>

#### 8.5.4 验收标准

- [ ] `api/` 目录下 3 个文件已生成
- [ ] `STEPS.md` 已包含「API 设计」章节
- [ ] 5 个表格全部填充（指纹、栈偏好、接口统计、SDK 清单、后台模块清单）
- [ ] 项目元信息已就位或已补全
- [ ] 修改记录已追加

> ⚠️ **若 STEPS.md 写入失败，sabackend 会丢失上下文**：agent 必须在 Step 8.5 完成后再输出最终结果。

## 关键技术约束

- ⚠️ **3 类路径前缀**：
  - 业务接口 → `/api/v1/<resource>`
  - 第三方对接 → `/api/v1/sdk/<name>/<action>`
  - 后台管理 → `/api/v1/admin/<resource>`
- ⚠️ **认证差异化**：
  - 普通接口用 `bearerAuth`（用户 JWT）
  - 后台接口用 `adminAuth`（管理员 JWT，独立登录）
- ⚠️ **错误响应统一格式**：`{ code: number, message: string }`
- ⚠️ **时间字段用 ISO 8601**：`2024-01-15T10:30:00Z`
- ⚠️ **分页参数统一**：`page`、`pageSize`（默认 20）
- ⚠️ **OpenAPI 3.0.3**（最新稳定版）
- ⚠️ **SDK 代理原则**：前端永远不直接调第三方，必须走自家后端代理

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-06-29-1 | 初始化「修改记录（skill 自身演进）」section；约定时间格式为「年-月-日-当天变动次数」；AI 写入前必须用 PowerShell `Get-Date -Format "yyyy-MM-dd"` 校准北京时间；变动次数 N 按「该 skill 文件落地次数」自增（同一天多次改动依次为 1,2,3...） |

---

## 关联 Skill

- `sainit-*` — 前置（生成 prototype + 写入 STEPS.md「项目元信息」节）
- `safrontend` — 可并行（已生成的代码会作为接口发现来源；STEPS.md 由 safrontend 创建）
- `sabackend` — 后续（基于 OpenAPI 生成后端业务代码；**读取本 skill 写入的「后端技术栈偏好」「SDK 清单」「后台模块清单」作为默认推荐**）
- `saadmin` — 后续（基于 admin API 生成后台管理界面）
- `sadeploy` — 后续部署（含 API mock 服务）
