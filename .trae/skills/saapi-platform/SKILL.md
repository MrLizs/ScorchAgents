---
name: "saapi-platform"
description: "为 API 平台类项目（如硅基流动、OpenAI 等 MaaS 平台）设计平台级 API：API Key 管理体系、SSE 流式响应规范、按量计费/订阅、OpenAI 兼容端点、API Gateway 中间件架构、模型管理。Invoke when 用户输入 /saapi-platform 或构建 AI API 平台/SaaS 产品时需要设计开发者接口。"
---

# /saapi-platform — API 平台接口设计

## 什么是 API 平台接口？

普通项目（`/saapi` 负责）的接口是 **"APP 用户 ↔ 后端"**——用户登录、浏览、下单。

API 平台（本 skill 负责）的接口有两层：
1. **"外部开发者 ↔ 平台"** — 开发者注册、拿 API Key、查用量、充值、调模型
2. **"平台内部 ↔ 推理引擎"** — 平台后端将开发者请求转发给 GPU 上的模型，流式返回结果

```
外部开发者 ──► API Gateway ──► 模型推理引擎（GPU）
                │    │
                │    ├── API Key 验证
                │    ├── 限流/配额检查
                │    ├── 用量计量（token 计数）
                │    └── 计费扣费
                │
    内部运营 ──► 后台管理 ──► 用户管理 / 模型管理 / 账单
```

这个 skill 就是：**把 API 平台特有的两层接口 + 中间件架构全部规划清楚。**

## 触发条件

- 用户输入 `/saapi-platform` 或 `/saapi-platform <项目目录>`
- **前置条件**：
  - `api/openapi.yaml` 已存在（来自 `/saapi`，包含消费者端接口规范）
  - `STEPS.md` 已存在（项目元信息）

## 与 /saapi 的关系

| 维度 | `/saapi`（消费者端） | `/saapi-platform`（本 skill，平台端） |
|------|---------------------|----------------------------------|
| **接口视角** | APP 用户 ↔ 后端 | 外部开发者 ↔ API 平台 |
| **认证方式** | 用户 JWT（登录态） | **API Key**（`sk-xxx` 格式） + 用户 JWT（控制台） |
| **路径前缀** | `/api/v1/` | `/api/v1/`（控制台）+ **`/v1/`**（OpenAI 兼容端点） |
| **响应格式** | JSON（一次性返回） | JSON + **SSE 流式**（`text/event-stream`） |
| **计费模型** | 商品 × 数量（电商） | **按 token / 按调用次数 / 按时长** |
| **产出目录** | `api/openapi.yaml` | `api/platform-openapi.yaml` |
| **安全等级** | 标准 JWT | API Key（可独立撤销）+ 请求签名（可选） |

## 推荐执行顺序

```
/sainit-* → /safrontend → /saapi → /sabackend → /saapi-connect
                                                    │
                                    /saapi-platform（本 skill）← 在此之后执行
                                                    │
                                    /sabackend（再次运行，实现平台接口）
```

> 📌 **为什么在 sabackend 之后？** 因为 API 平台的"控制台"本身也是一个 Web 应用——开发者注册、登录、查看用量这些功能，底层依赖 sabackend 的用户系统。本 skill 在此基础上增加平台专属层。

## 核心原则

1. **双鉴权体系**：用户 JWT（控制台登录） + API Key（开发者程序调用），两套独立
2. **OpenAI API 兼容**：推理端点对标 OpenAI 格式（`/v1/chat/completions` 等），降低开发者迁移成本
3. **SSE 流式优先**：AI 输出天然是流式的，所有推理端点必须同时支持 `stream: true/false`
4. **按量计费**：精确到 token 级别的计量，支持预充值余额扣费 + 套餐订阅双模式
5. **API Gateway 中间件链**：Key 验证 → 限流 → 配额 → 计量 → 计费 → 路由，可插拔
6. **存放位置**：`api/platform-openapi.yaml`（机器读）+ `api/PLATFORM_API.md`（人读）+ `api/platform-mock-data.json`
7. **安全**：API Key 存储哈希值（sha256），仅创建时展示一次明文；支持 IP 白名单、调用频率限制
8. **步骤追踪**：在 `STEPS.md` 追加「API 平台接口」章节

## 产出文件结构

```
<project-name>/
├── api/                              ← /saapi 产出 + 本 skill 扩展
│   ├── openapi.yaml                  消费者端接口（/saapi，本 skill 只读）
│   ├── API.md                        消费者端文档（/saapi，本 skill 只读）
│   ├── platform-openapi.yaml         平台端接口规范 🆕
│   ├── PLATFORM_API.md               平台端人读文档 🆕
│   ├── platform-mock-data.json       平台端 Mock 数据 🆕
│   └── streaming-extensions.yaml     SSE 流式 OpenAPI 扩展定义 🆕
└── STEPS.md                          追加「API 平台接口」章节
```

---

## 工作流程（严格按顺序）

### Step 0：前置检查

#### 0.1 读取项目上下文

从 `STEPS.md` 获取：

| 字段 | 用途 |
|------|------|
| 项目名（中/英文） | 平台名称、API Key 前缀 |
| 项目类型 | 判断是否 AI 平台（sainit-other 需追问确认） |
| 后端技术栈 | API Gateway 实现语言 |
| 命名规范（表前缀） | API Key 表、用量表命名 |

#### 0.2 确认平台定位

使用 `AskUserQuestion`：

> 请确认你的 API 平台定位：
> - **A. AI 模型 API 平台**（如硅基流动、OpenAI、Groq）— 对外提供 LLM/图片/语音模型推理 API
> - **B. 通用 SaaS API 平台**（如 Twilio、Stripe）— 提供非 AI 的 API 服务
> - **C. 混合型**（既有 AI 推理也有其他 API）
> - **D. 内部 API 网关**（仅团队内部使用，不对外商业化）

输出确认：
```
🔍 读取项目元信息：
   • 项目名：<中文名>（英文：<en>）
   • 平台定位：<AI 模型 API 平台>
   • 后端技术栈：<Node.js + Express>
   • 命名规范前缀：<xy_>
   ✅ 上下文已加载
```

### Step 1：API Key 体系设计

> 📌 **这是 API 平台最核心的基础设施**。没有它，后续计费/限流/用量都无从谈起。

#### 1.1 API Key 数据模型

**`init.sql` 追加表**（与 sabackend 的命名规范一致）：

```sql
-- API Key 表
CREATE TABLE <prefix>_api_keys (
    f_id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    f_user_id       BIGINT NOT NULL COMMENT '所属用户 ID',
    f_key_hash      VARCHAR(128) NOT NULL COMMENT 'sha256(api_key)',
    f_key_prefix    VARCHAR(12) NOT NULL COMMENT 'sk- 后的前 8 位，用于识别',
    f_key_name      VARCHAR(64) DEFAULT '' COMMENT 'Key 备注名（用户自定义）',
    f_scopes        JSON DEFAULT '["*"]' COMMENT '权限范围',
    f_ip_whitelist  JSON DEFAULT '[]' COMMENT 'IP 白名单',
    f_rate_limit_rpm INT DEFAULT 60 COMMENT '每分钟最大请求数',
    f_quota_total   BIGINT DEFAULT 0 COMMENT '总额度（token 数，0=无限）',
    f_quota_used    BIGINT DEFAULT 0 COMMENT '已用额度',
    f_is_active     TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    f_last_used_at  DATETIME NULL COMMENT '最后一次使用时间',
    f_expires_at    DATETIME NULL COMMENT '过期时间（NULL=永不过期）',
    f_created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    f_updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (f_user_id),
    UNIQUE INDEX idx_hash (f_key_hash)
) COMMENT='API Key 管理表';
```

#### 1.2 API Key 生命周期接口

在 `api/platform-openapi.yaml` 中定义：

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|:---:|
| `POST` | `/api/v1/console/api-keys` | 创建新 Key（返回完整 Key 仅此一次） | 用户 JWT |
| `GET` | `/api/v1/console/api-keys` | 列出我的所有 Key（只显示前缀+名称+状态，不显示完整 Key） | 用户 JWT |
| `GET` | `/api/v1/console/api-keys/{id}` | 查看单个 Key 详情（用量/限流/白名单） | 用户 JWT |
| `PATCH` | `/api/v1/console/api-keys/{id}` | 修改名称/限流/IP 白名单/额度 | 用户 JWT |
| `DELETE` | `/api/v1/console/api-keys/{id}` | 删除 Key（立即失效） | 用户 JWT |
| `POST` | `/api/v1/console/api-keys/{id}/rotate` | 轮换 Key（返回新 Key，旧 Key 24h 后失效） | 用户 JWT |

#### 1.3 API Key 格式规范

```
sk-<random_48_chars_base64url>

示例：sk-a1B2c3D4e5F6g7H8i9J0kL1mN2oP3qR4sT5uV6wX7yZ8
      ^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      前缀  48 字符随机串（crypto.randomBytes(36).toString('base64url')）
```

- **前缀 `sk-`**：遵循 OpenAI/硅基流动行业惯例
- **仅创建时返回明文**：之后数据库只存 `sha256(key)`，无法找回
- **控制台显示**：`sk-a1B2...yZ8`（前 4 + 后 4，中间省略）

#### 1.4 API Key 验证中间件（Gateway 层）

```
请求到达 /v1/*（OpenAI 兼容端点）
  │
  ▼
① 提取 Authorization: Bearer sk-xxx
  │
  ▼
② sha256(sk-xxx) → 查 <prefix>_api_keys 表
  │
  ├─ 找不到 → 401 {"error": "Invalid API Key"}
  ├─ f_is_active=0 → 403 {"error": "Key disabled"}
  ├─ f_expires_at < NOW() → 403 {"error": "Key expired"}
  └─ 找到 ✅ → 继续
  │
  ▼
③ IP 白名单检查（如配置了）
  │
  ▼
④ 限流检查（Redis 滑动窗口）
  │
  ▼
⑤ 配额检查（f_quota_used < f_quota_total 或 0=无限）
  │
  ▼
⑥ 注入 ctx.user_id + ctx.api_key_id → 传递给业务层
```

**📝 本步完成后立即写入 STEPS.md**

### Step 2：OpenAI 兼容端点设计

> 📌 **行业标准**。OpenAI 的 API 格式已成为事实标准，兼容它意味着开发者无需改代码即可切换到你平台。

#### 2.1 Chat Completions 端点

**`POST /v1/chat/completions`**（对标 OpenAI）

**请求体**（OpenAPI 3.0 + SSE 扩展）：

```yaml
/v1/chat/completions:
  post:
    tags: [Inference]
    summary: 对话补全（OpenAI 兼容）
    security:
      - apiKeyAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [model, messages]
            properties:
              model:
                type: string
                description: 模型 ID（如 deepseek-ai/DeepSeek-V3）
                example: "deepseek-ai/DeepSeek-V3"
              messages:
                type: array
                items:
                  type: object
                  required: [role, content]
                  properties:
                    role: { type: string, enum: [system, user, assistant, tool] }
                    content: { type: string }
              temperature: { type: number, minimum: 0, maximum: 2, default: 0.7 }
              top_p: { type: number, minimum: 0, maximum: 1, default: 0.9 }
              max_tokens: { type: integer, minimum: 1, default: 1024 }
              stream: { type: boolean, default: false, description: "是否流式返回" }
              stop: { type: array, items: { type: string } }
              tools: { type: array, description: "Function Calling 工具定义" }
    responses:
      '200':
        description: 成功（非流式）
        content:
          application/json:
            schema: { $ref: '#/components/schemas/ChatCompletionResponse' }
      '200-Stream':
        description: 成功（流式 SSE）
        content:
          text/event-stream:
            schema: { $ref: '#/components/schemas/ChatCompletionStreamChunk' }
```

**📌 流式响应格式（SSE）**：

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1720000000,"model":"deepseek-ai/DeepSeek-V3","choices":[{"index":0,"delta":{"role":"assistant","content":"你好"}}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1720000000,"model":"deepseek-ai/DeepSeek-V3","choices":[{"index":0,"delta":{"content":"！"}}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1720000000,"model":"deepseek-ai/DeepSeek-V3","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":25,"total_tokens":35}}

data: [DONE]
```

#### 2.2 其他 OpenAI 兼容端点

| 端点 | 对标 | 说明 |
|------|------|------|
| `GET /v1/models` | OpenAI List Models | 返回可用模型列表 + 定价 |
| `GET /v1/models/{model}` | OpenAI Retrieve Model | 单个模型详情 |
| `POST /v1/embeddings` | OpenAI Embeddings | 文本向量化 |
| `POST /v1/images/generations` | OpenAI Images | 图片生成（如有） |
| `POST /v1/audio/transcriptions` | OpenAI Whisper | 语音转文字（如有） |

#### 2.3 平台特有扩展端点

除 OpenAI 兼容外，平台还可提供差异化端点：

| 端点 | 说明 |
|------|------|
| `GET /v1/account` | 查询当前 API Key 的账户余额/用量 |
| `GET /v1/usage` | 查询当前 API Key 的用量明细（按天/按模型） |

**📝 本步完成后立即写入 STEPS.md**

### Step 3：SSE 流式规范设计

> 📌 **AI 平台最关键的差异化能力**。流式响应是 AI API 区别于传统 RESTful API 的核心特征。

#### 3.1 OpenAPI SSE 扩展定义

生成 `api/streaming-extensions.yaml`：

```yaml
# SSE 流式响应的 OpenAPI 扩展
# 标准 OpenAPI 3.0 不支持 text/event-stream，通过 x- 扩展字段描述

x-sse-stream:
  description: "Server-Sent Events 流式响应规范"
  format: "text/event-stream"
  event_types:
    - name: "data"
      description: "数据块（delta）"
      schema: "#/components/schemas/ChatCompletionStreamChunk"
    - name: "error"
      description: "流式错误（中断时发送）"
      schema: "#/components/schemas/StreamError"
    - name: "done"
      description: "流结束标记"
      value: "[DONE]"
  reconnection:
    enabled: true
    retry_ms: 3000
  heartbeat:
    enabled: true
    interval_ms: 15000
    comment: ": heartbeat"
```

#### 3.2 流式数据块结构

```yaml
ChatCompletionStreamChunk:
  type: object
  required: [id, object, created, model, choices]
  properties:
    id: { type: string, description: "本次请求唯一 ID" }
    object: { type: string, enum: [chat.completion.chunk] }
    created: { type: integer, description: "Unix 时间戳" }
    model: { type: string }
    choices:
      type: array
      items:
        type: object
        properties:
          index: { type: integer }
          delta:
            type: object
            properties:
              role: { type: string }
              content: { type: string }
              tool_calls: { type: array }
          finish_reason: { type: string, enum: [stop, length, tool_calls, content_filter], nullable: true }
    usage:
      type: object
      nullable: true
      description: "仅在最后一个 chunk 中包含"
      properties:
        prompt_tokens: { type: integer }
        completion_tokens: { type: integer }
        total_tokens: { type: integer }
```

#### 3.3 SSE 错误处理

```
// 流式进行中发生错误时，发送 error 事件
event: error
data: {"error": {"type": "server_error", "message": "GPU out of memory"}}

// 然后正常结束（不发送 [DONE]）
```

```
// 客户端超时/断开时
// 后端检测到 response.destroyed → 中止推理 → 记录已生成 token 数并计费
```

**📝 本步完成后立即写入 STEPS.md**

### Step 4：按量计费系统设计

> 📌 **API 平台的商业模式核心**。与传统电商的"下单→支付→发货"模式完全不同。

#### 4.1 计费模型

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **预充值按量扣费** | 用户充值余额 → 每次 API 调用按 token 数扣费 → 余额不足时停服 | 大部分 AI API 平台 |
| **套餐订阅** | 月付/年付，包含固定 token 额度 + 超额按量 | 个人开发者/小型团队 |
| **按调用次数** | 每次 API 调用固定价格（无视 token 数） | Simple API（非 AI） |
| **按时间** | 按 GPU 运行时长计费（如 GPU 租用） | 训练/微调场景 |

本 skill 默认实现 **预充值按量扣费 + 可选套餐订阅**。

#### 4.2 计费相关数据表

```sql
-- 用户余额表
CREATE TABLE <prefix>_user_balance (
    f_user_id       BIGINT PRIMARY KEY,
    f_balance       DECIMAL(12,4) DEFAULT 0 COMMENT '余额（元），精度到 0.0001',
    f_frozen        DECIMAL(12,4) DEFAULT 0 COMMENT '冻结金额',
    f_total_recharge DECIMAL(12,4) DEFAULT 0 COMMENT '累计充值',
    f_total_consume  DECIMAL(12,4) DEFAULT 0 COMMENT '累计消费',
    f_updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='用户余额表';

-- 模型定价表
CREATE TABLE <prefix>_model_pricing (
    f_id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    f_model_id      VARCHAR(64) NOT NULL COMMENT '模型唯一标识',
    f_model_name    VARCHAR(128) NOT NULL COMMENT '模型显示名',
    f_unit          ENUM('token', 'call', 'second') DEFAULT 'token',
    f_price_per_unit DECIMAL(12,8) NOT NULL COMMENT '单价（元/token 或 元/次）',
    f_currency      VARCHAR(8) DEFAULT 'CNY',
    f_is_active     TINYINT(1) DEFAULT 1,
    f_created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='模型定价表';

-- 消费明细表
CREATE TABLE <prefix>_bill_record (
    f_id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    f_user_id       BIGINT NOT NULL,
    f_api_key_id    BIGINT NOT NULL,
    f_model_id      VARCHAR(64) NOT NULL,
    f_request_id    VARCHAR(64) NOT NULL COMMENT '请求唯一 ID',
    f_prompt_tokens  INT DEFAULT 0,
    f_completion_tokens INT DEFAULT 0,
    f_total_tokens   INT DEFAULT 0,
    f_cost          DECIMAL(12,8) NOT NULL COMMENT '本次费用',
    f_balance_before DECIMAL(12,4) COMMENT '扣费前余额',
    f_balance_after  DECIMAL(12,4) COMMENT '扣费后余额',
    f_status        ENUM('success', 'failed', 'refunded') DEFAULT 'success',
    f_created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_time (f_user_id, f_created_at),
    INDEX idx_key (f_api_key_id)
) COMMENT='消费明细/账单表';

-- 套餐/订阅表
CREATE TABLE <prefix>_subscription (
    f_id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    f_user_id       BIGINT NOT NULL,
    f_plan_id       VARCHAR(32) NOT NULL COMMENT '套餐 ID（如 free/pro/enterprise）',
    f_plan_name     VARCHAR(64) NOT NULL,
    f_token_quota   BIGINT NOT NULL COMMENT '包含 token 数',
    f_token_used    BIGINT DEFAULT 0 COMMENT '已用 token',
    f_price         DECIMAL(10,2) COMMENT '套餐价格',
    f_billing_cycle ENUM('monthly', 'yearly', 'lifetime') DEFAULT 'monthly',
    f_started_at    DATETIME NOT NULL,
    f_expires_at    DATETIME NOT NULL,
    f_is_active     TINYINT(1) DEFAULT 1,
    f_auto_renew    TINYINT(1) DEFAULT 0,
    f_created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='套餐订阅表';
```

#### 4.3 扣费流程（Gateway 中间件链）

```
请求完成（拿到 prompt_tokens + completion_tokens）
  │
  ▼
① 查 <prefix>_model_pricing → 获取该模型单价
  │
  ▼
② 计算费用：cost = (prompt_tokens × prompt_price) + (completion_tokens × completion_price)
  │
  ▼
③ 检查余额 → 余额不足 → 返回 402 Payment Required
  │
  ▼
④ 原子扣费（SELECT ... FOR UPDATE 防并发）
   UPDATE balance SET balance = balance - cost WHERE user_id = ? AND balance >= cost
  │
  ▼
⑤ 写入 bill_record + 更新 api_key quota_used + 更新 subscription token_used
```

#### 4.4 计费相关 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/console/billing/balance` | 查询余额 |
| `GET` | `/api/v1/console/billing/records` | 消费明细列表（分页+筛选） |
| `POST` | `/api/v1/console/billing/recharge` | 创建充值订单（调微信/支付宝） |
| `GET` | `/api/v1/console/billing/plans` | 套餐列表 |
| `POST` | `/api/v1/console/billing/subscribe` | 订阅套餐 |
| `GET` | `/api/v1/console/billing/subscription` | 我的订阅 |

**📝 本步完成后立即写入 STEPS.md**

### Step 5：API Gateway 中间件架构

> 📌 **不同于普通 Web 应用的中间件**。API Gateway 是独立的一层，负责将外部开发者的请求安全地路由到内部服务。

#### 5.1 中间件链（按顺序）

```
                    ┌─────────────┐
  外部请求 ──────►  │ API Gateway │
  /v1/chat/...      │             │
                    │ ① Key Auth  │──► sha256(Key) → 查表 → 注入 ctx
                    │ ② IP 白名单  │──► 匹配 ctx.api_key.ip_whitelist
                    │ ③ Rate Limit│──► Redis 滑动窗口（per Key / per IP）
                    │ ④ Quota     │──► quota_used < quota_total?
                    │ ⑤ Model Route│──► 选择最优 GPU 节点
                    │ ⑥ Proxy     │──► 转发到推理引擎
                    │ ⑦ Metering  │──► 统计 token 数
                    │ ⑧ Billing   │──► 扣费
                    │ ⑨ Logging   │──► 写入审计日志
                    └─────────────┘
```

#### 5.2 各层配置（system_config 表）

```sql
INSERT INTO <prefix>_system_config VALUES
-- 限流配置
('api_rate_limit_enabled',   'true',      '是否启用 API 限流'),
('api_rate_limit_default_rpm','60',        '默认每分钟请求数'),
('api_rate_limit_redis_url', 'redis://localhost:6379/1', '限流 Redis 连接'),
-- 配额配置
('api_quota_default_tokens', '1000000',   '新 Key 默认 token 额度（0=无限）'),
-- 模型路由
('api_model_route_strategy', 'round_robin', '路由策略：round_robin / least_conn / random'),
-- 流式配置
('api_stream_timeout_ms',   '120000',     'SSE 流式超时（毫秒）'),
('api_stream_chunk_delay_ms','50',        '流式块间隔（毫秒）'),
('api_stream_heartbeat_ms',  '15000',      'SSE 心跳间隔（毫秒）');
```

#### 5.3 Gateway 实现指引（传递给 sabackend）

本 skill 不生成 Gateway 代码（那是 sabackend 的领域），但生成实现规格：

```yaml
# api/gateway-spec.yaml（中间件规格，sabackend 按此实现）
gateway:
  name: "<project-name> API Gateway"
  port: 8080
  middleware_chain:
    - name: KeyAuthMiddleware
      order: 1
      config:
        header: "Authorization"
        prefix: "Bearer "
        key_format: "sk-*"
        hash_algorithm: sha256
        cache_ttl_seconds: 60
    - name: IPWhitelistMiddleware
      order: 2
      enabled: false   # 默认关闭，用户可在控制台开启
    - name: RateLimitMiddleware
      order: 3
      algorithm: sliding_window
      storage: redis
      per_key: true
      per_ip: true
    - name: QuotaMiddleware
      order: 4
    - name: ModelRouter
      order: 5
      strategy: round_robin
      upstreams: []  # sabackend 实现时填充
    - name: ProxyMiddleware
      order: 6
      timeout_ms: 120000
    - name: MeteringMiddleware
      order: 7   # 后置中间件（响应返回后执行）
      fields: [prompt_tokens, completion_tokens, total_tokens]
    - name: BillingMiddleware
      order: 8   # 后置中间件
      atomic: true
    - name: LoggingMiddleware
      order: 9   # 后置中间件
      output: stdout  # 或 Elasticsearch/Kafka
```

**📝 本步完成后立即写入 STEPS.md**

### Step 6：模型管理接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|:---:|
| `GET` | `/v1/models` | 公开：可用模型列表（含定价） | API Key |
| `GET` | `/v1/models/{id}` | 公开：单个模型详情 | API Key |
| `GET` | `/api/v1/admin/models` | 后台：模型列表 | Admin JWT |
| `POST` | `/api/v1/admin/models` | 后台：上架新模型 | Admin JWT |
| `PATCH` | `/api/v1/admin/models/{id}` | 后台：修改定价/状态 | Admin JWT |
| `DELETE` | `/api/v1/admin/models/{id}` | 后台：下架模型 | Admin JWT |

**📝 本步完成后立即写入 STEPS.md**

### Step 7：安全加固规范

#### 7.1 API Key 安全

| 措施 | 说明 |
|------|------|
| 哈希存储 | 数据库仅存 `sha256(key)`，明文永不落盘 |
| 仅展示一次 | 创建 Key 时返回明文，之后不可查看 |
| 传输加密 | 全站 HTTPS（拒绝 HTTP 请求） |
| 日志脱敏 | 日志中 Key 只输出 `sk-****...****`（首尾各 4 位） |
| 异常检测 | 短时间内大量 401 → 告警（可能有人在暴力破解 Key） |

#### 7.2 请求安全

| 措施 | 说明 |
|------|------|
| HTTPS Only | Gateway 层强制 HTTPS，HTTP 请求返回 403 |
| 请求体大小限制 | 默认 10MB（防止恶意大请求） |
| 请求签名（可选） | HMAC-SHA256 签名，防止中间人篡改 |
| CORS | Gateway 层统一处理，允许 `*`（API 平台的特征） |

**📝 本步完成后立即写入 STEPS.md**

### Step 8：生成最终产出文件

#### 8.1 `api/platform-openapi.yaml`

完整的 OpenAPI 3.0 规范，包含 Step 1~6 所有接口定义。结构：

```yaml
openapi: 3.0.3
info:
  title: "<项目名> Platform API"
  version: 1.0.0
  description: "面向开发者的 API 平台接口"
servers:
  - url: https://api.<project>.com
    description: 生产环境
  - url: http://localhost:8080
    description: 本地开发
tags:
  - name: Inference
    description: 模型推理 API（OpenAI 兼容）
  - name: Console
    description: 开发者控制台 API（API Key、用量、计费）
  - name: Admin
    description: 后台管理 API
components:
  securitySchemes:
    apiKeyAuth:
      type: http
      scheme: bearer
      bearerFormat: "sk-<48 chars>"
      description: "API Key 鉴权（用于 /v1/* 推理端点）"
    userAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: "用户 JWT 鉴权（用于 /api/v1/console/* 控制台）"
    adminAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: "管理员 JWT 鉴权（用于 /api/v1/admin/* 后台）"
paths:
  # ...Step 1~6 所有接口
```

#### 8.2 `api/PLATFORM_API.md`

人类可读的文档，含：
- 快速开始（注册 → 获取 Key → 第一次调用）
- 认证说明（API Key vs JWT 的区别）
- 所有端点列表（按类别分组）
- 计费规则说明
- 错误码对照表
- SSE 流式接入示例（curl / Python / Node.js）

#### 8.3 `api/platform-mock-data.json`

Mock 数据，含：
- 示例 API Key（`sk-test-...`，测试用，不可用于生产）
- 示例模型列表（3-5 个模型 + 定价）
- 示例余额/用量数据

### Step 9：验证与汇总

```bash
echo "📋 API 平台接口验收清单："
echo "  ☐ platform-openapi.yaml 中定义了 API Key CRUD 6 个接口"
echo "  ☐ 推理端点 /v1/chat/completions 同时支持 stream: true/false"
echo "  ☐ SSE 流式扩展定义完整（x-sse-stream）"
echo "  ☐ 计费表 4 张（balance / pricing / bill_record / subscription）"
echo "  ☐ Gateway 中间件链 9 层定义完整"
echo "  ☐ 安全规范 7 项措施覆盖"
echo "  ☐ PLATFORM_API.md 包含 curl/Python/Node.js 示例"
echo "  ☐ 三个 securityScheme 定义（apiKeyAuth / userAuth / adminAuth）"
```

在 `STEPS.md` 追加「API 平台接口」章节。

---

## 与其他 skill 的关系

```
/sainit-* ──► /safrontend ──► /saapi ──► /sabackend ──► /saapi-connect
   原型         Web 前端      消费者 API    后端实现       前后端接通
                                                           │
                              /saapi-platform（本 skill）◄──┘
                                    │
                          api/platform-openapi.yaml
                          api/PLATFORM_API.md
                          api/streaming-extensions.yaml
                          api/gateway-spec.yaml
                                    │
                                    ▼
                          /sabackend（再次运行，实现平台接口 + Gateway）
                                    │
                                    ▼
                          /safrontend（开发者控制台前端）
```

| 上游 skill | 本 skill 依赖其产出 |
|-----------|-------------------|
| `/saapi` | `api/openapi.yaml`（消费者端接口，作为参考） |
| `/sabackend` | 用户系统、`system_config` 表、命名规范 |
| `/sainit-*` | `STEPS.md` 项目元信息 |

| 下游 skill | 如何使用本 skill 产出 |
|-----------|-------------------|
| `/sabackend`（再次运行） | 读取 `platform-openapi.yaml` + `gateway-spec.yaml` 实现平台接口 |
| `/safrontend`（再次运行） | 读取平台接口生成开发者控制台页面（API Key 管理、用量看板、计费页） |

## 关键约定速查

| 项目 | 约定 |
|------|------|
| 产出目录 | `api/platform-openapi.yaml` + `api/PLATFORM_API.md` |
| API Key 格式 | `sk-` + 48 字符 base64url 随机串 |
| Key 存储 | 数据库仅存 `sha256(key)`，创建时返回明文仅一次 |
| 鉴权体系 | 三套独立：API Key（推理端点）、用户 JWT（控制台）、Admin JWT（后台） |
| 推理端点路径 | `/v1/chat/completions`（OpenAI 兼容，无 `/api` 前缀） |
| 控制台路径 | `/api/v1/console/*`（用户 JWT） |
| 后台路径 | `/api/v1/admin/*`（Admin JWT） |
| 流式格式 | SSE（`text/event-stream`），data + error + done 三类事件 |
| 计费精度 | token 级，金额精度到 0.0001 元（小数点后 4 位） |
| 步骤追踪 | `STEPS.md` 追加「API 平台接口」章节 |

## 失败 / 边界处理

| 场景 | 处理 |
|------|------|
| 项目非 API 平台类型 | 提示「当前项目可能不需要 API 平台接口，请确认」，但允许继续 |
| `api/openapi.yaml` 不存在 | 提示先运行 `/saapi` 生成消费者端接口 |
| 用户选 A（AI 平台）但无 GPU 推理方案 | 建议先部署模型推理引擎（vLLM/TGI/Ollama）或对接第三方 AI 供应商 |
| 余额扣费并发冲突 | `SELECT ... FOR UPDATE` 行锁 + 重试 3 次 |
| SSE 流式中客户端断开 | 后端检测 `response.destroyed` → 中止推理 → 已生成 token 仍计入费用 |
| API Key 泄露（用户申诉） | 立即调用 rotate 接口，旧 Key 24h 后自动失效；紧急情况可手动 `UPDATE SET f_is_active=0` |

## 修改记录

| 时间 | 改动 |
|------|------|
| 2026-07-14-1 | 初版：API 平台完整接口设计体系；涵盖 API Key 管理（6 接口 + 中间件）、OpenAI 兼容端点（Chat/Models/Embeddings）、SSE 流式规范（OpenAPI 扩展 + 心跳 + 错误处理）、按量计费系统（4 张表 + 原子扣费）、API Gateway 9 层中间件链、模型管理、安全加固 7 项措施；产出 4 个文件（platform-openapi.yaml / PLATFORM_API.md / streaming-extensions.yaml / gateway-spec.yaml） |
