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

### Step 4：多源 API 发现（核心步骤）

并行执行 3 个发现流程，结果合并：

#### 4.1 源 A：扫描 frontend/ 代码

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

**结果记录**到内存中的端点列表（标记来源 = `code`）。

#### 4.2 源 B：扫描 prototype/ HTML

**前提**：`prototype/` 目录存在

读取每个 HTML 文件，识别数据需求：

| prototype 中识别到的内容 | 推断 API |
|------------------------|---------|
| 商品列表（cards 数组） | `GET /api/v1/products` |
| 单个商品详情 | `GET /api/v1/products/{id}` |
| 用户头像+昵称+token | `POST /api/v1/auth/login` |
| 消息列表 | `GET /api/v1/messages` |
| 提交表单按钮 | 对应 `POST/PUT` 端点 |
| 搜索框 | `GET /api/v1/search?q=` |
| 分类筛选 Tab | `GET /api/v1/products?category=X` |

**结果记录**到端点列表（标记来源 = `prototype`）。

#### 4.3 源 C：让用户手动补充/修改

使用 `AskUserQuestion` 展示已发现的端点，让用户：
- 确认保留
- 添加遗漏
- 修改/删除
- 调整路径

> 已发现 N 个端点（X from code, Y from prototype），请确认：
> - **A. 全部保留，继续生成**
> - **B. 我要手动调整**（输入修改）
> - **C. 我要添加更多端点**（逐个输入）

如果是 B 或 C，引导用户列出端点：
```
请输入端点（每行一个），格式：
  METHOD PATH | 用途说明
  POST /api/v1/auth/login | 用户登录
  GET  /api/v1/users/me | 获取当前用户
  ...
```

### Step 5：生成 OpenAPI 3.0 规范（`api/openapi.yaml`）

#### 5.1 基础结构

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

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # 共用数据模型
    User:
      type: object
      properties:
        id: { type: integer }
        nickname: { type: string }
        avatar: { type: string, format: uri }
        phone: { type: string }
        createdAt: { type: string, format: date-time }
    
    Error:
      type: object
      properties:
        code: { type: integer }
        message: { type: string }
    
    # ... 按 prototype 提取的所有数据模型

security:
  - bearerAuth: []

paths:
  # 每个端点一个 path
  /api/v1/auth/login:
    post:
      tags: [认证]
      summary: 用户登录
      security: []  # 公开端点
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [phone, code]
              properties:
                phone: { type: string, example: "13800138000" }
                code: { type: string, example: "123456" }
      responses:
        '200':
          description: 登录成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  token: { type: string }
                  refreshToken: { type: string }
                  user: { $ref: '#/components/schemas/User' }
        '401':
          description: 验证码错误
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }

  # ... 其他端点
```

#### 5.2 端点生成规则

对每个端点：
1. **路径**：自动添加 `/api/v1/` 前缀（如果没有）
2. **Method**：根据 HTTP 语义推断
   - 创建资源 → POST
   - 获取列表 → GET
   - 获取单个 → GET
   - 更新 → PUT（全量）/ PATCH（部分）
   - 删除 → DELETE
3. **认证**：默认需要 `bearerAuth`，登录/注册等公开端点除外
4. **Request/Response schemas**：从 frontend TypeScript 类型或 prototype 数据结构推断
5. **错误响应**：每个端点至少包含 401（未认证）、403（无权限）、404（不存在）、500（服务器错误）

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
   • 共 N 个端点（X from code, Y from prototype, Z from manual）
   • 共 M 个数据模型
   • 公开端点：A 个
   • 需认证端点：B 个

🚀 下一步建议：
   1. 用 Swagger UI 查看 openapi.yaml：
      npx @apidevtools/swagger-cli serve api/openapi.yaml
      
   2. 用 Apifox / Postman 导入 openapi.json 调试
      
   3. 后端实现时参考 API.md：
      - Node: nestjs / express + prisma
      - Python: fastapi + sqlalchemy
      
   4. /sabackend 一键生成后端代码（含 mock 实现）

💡 提示：
   - 修改 API 后可重新运行 /saapi 增量更新
   - 让前端开发者直接看 API.md，无需读 openapi.yaml
```

## 关键技术约束

- ⚠️ **路径必须 `/api/v1/` 前缀**，避免未来升级 breaking change
- ⚠️ **认证用 JWT Bearer Token**，登录接口返回 token + refreshToken
- ⚠️ **错误响应统一格式**：`{ code: number, message: string }`
- ⚠️ **时间字段用 ISO 8601**：`2024-01-15T10:30:00Z`
- ⚠️ **分页参数统一**：`page`、`pageSize`（默认 20）
- ⚠️ **OpenAPI 3.0.3**（最新稳定版）

## 关联 Skill

- `sainit-*` — 前置（生成 prototype）
- `safrontend` — 可并行（已生成的代码会作为 API 发现来源）
- `sabackend` — 后续（基于 OpenAPI 生成后端代码）
- `sadeploy` — 后续部署（含 API mock 服务）