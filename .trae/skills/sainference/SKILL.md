---
name: "sainference"
description: "将 AI 模型能力接入 API 平台：对接阿里云百炼 / 硅基流动 / DeepSeek / OpenAI / 百度千帆等第三方 AI 供应商，配置模型路由与多供应商容灾，透传 OpenAI 兼容端点的请求与 SSE 流式响应。也支持自建 vLLM / Ollama 推理（高级模式）。Invoke when 用户输入 /sainference 或需要为 API 平台接入大模型能力。"
---

# /sainference — AI 模型能力接入

## 是什么？为什么？

`saapi-platform` 已经设计好了 API Key 鉴权、SSE 流式、按量计费——但这些是"平台骨架"。平台需要**真正能回答问题的 AI 模型**。

你不是 AI 公司，不需要自己买 GPU 训练模型。**你只需要把请求转发给已经有大模型的平台**——阿里云百炼、硅基流动、DeepSeek 官方、OpenAI……它们都有 OpenAI 兼容的 API。

```
                         你的平台                        上游 AI 供应商
                  ┌──────────────────┐              ┌──────────────────┐
你的开发者用户 ──► API Gateway ───────► 模型路由 ──► 阿里云百炼（通义千问）
                  │  • Key 验证       │              │ DeepSeek 官方      │
                  │  • 限流/配额      │              │ 硅基流动           │
                  │  • 按量计费       │              │ OpenAI            │
                  │  • SSE 流式透传   │              │ 百度千帆           │
                  └──────────────────┘              └──────────────────┘
```

这个 skill 的工作就是：**配置你的平台对接哪些 AI 供应商、每个模型走哪个供应商、API Key 怎么注入、请求怎么转发、出问题怎么切换备用供应商。**

> 💡 **你不需要 GPU，不需要 Docker，不需要下载模型。** 只需要在上游供应商注册账号、拿到 API Key，配到这里就行。

## 触发条件

- 用户输入 `/sainference` 或 `/sainference <项目目录>`
- **前置条件**：
  - `api/platform-openapi.yaml` 已存在（来自 `/saapi-platform`）
  - `api/gateway-spec.yaml` 已存在（来自 `/saapi-platform`，含 upstreams 占位符）

## 核心原则

1. **集成优先，不自建**：默认且推荐对接第三方 AI 供应商，自建 vLLM/Ollama 仅作为高级可选模式
2. **OpenAI 兼容透传**：上游几乎都是 OpenAI 格式，Gateway 不解包不改格式，直接透传（包括 SSE 流式）
3. **多供应商容灾**：同一模型可配多个供应商，主供应商挂了自动切备用（failover）
4. **API Key 安全**：上游 Key 存储在环境变量中，不硬编码，不提交 Git
5. **存放位置**：`inference/` 目录，与 `frontend/`、`backend/` 平级
6. **步骤追踪**：在 `STEPS.md` 追加「AI 模型接入」章节

## 产出文件结构

```
<project-name>/
├── api/
│   ├── platform-openapi.yaml       ← /saapi-platform 产出
│   └── gateway-spec.yaml           ← /saapi-platform 产出（本 skill 填 upstreams）
├── inference/                      ← 本 skill 产出
│   ├── .env.example                所有需要的上游 API Key 环境变量模板
│   ├── models/
│   │   └── registry.yaml           模型注册表（模型 ID → 供应商 → 定价）
│   ├── router/
│   │   └── config.yaml             模型路由表（填入 gateway-spec.yaml）
│   └── README.md                   接入说明
└── STEPS.md
```

---

## 工作流程（严格按顺序）

### Step 0：前置检查

#### 0.1 读取上游规格

从 `api/gateway-spec.yaml` 提取 `ModelRouter.upstreams`（待填充）和 `ProxyMiddleware.timeout_ms`。

从 `STEPS.md` 提取项目元信息（项目名、项目类型）。

输出确认：
```
🔍 前置检查：
   • gateway-spec.yaml ✅（upstreams 待填充）
   • 项目类型：<saas（AI 平台）>
   • 接入模式：对接第三方 AI 供应商（推荐）
```

### Step 1：选择 AI 供应商

> 📌 **默认推荐：对接第三方 AI 供应商**。自建推理引擎见附录 A（仅高级用户）。

使用 `AskUserQuestion`，**多选**：

> 请选择要对接的 AI 供应商（多选，可在不同供应商之间做容灾）：
>
> **国内平台**
> - **A. 阿里云百炼**（通义千问 Qwen 系列 / DeepSeek 系列，国内最全）
> - **B. 硅基流动 SiliconFlow**（DeepSeek / Qwen / SD / GLM 等，生成式 AI 超级工厂）
> - **C.  DeepSeek 官方 API**（DeepSeek-V3 / R1，性价比极高）
> - **D. 百度千帆**（文心一言 ERNIE 系列）
> - **E. 讯飞星火**（Spark 系列）
> - **F. 智谱 AI**（GLM 系列 / ChatGLM）
> - **G. 月之暗面 Moonshot**（Kimi 系列，超长上下文）
>
> **国际平台**
> - **H. OpenAI**（GPT-4o / GPT-4o-mini）
> - **I. Anthropic**（Claude 系列）
> - **J. Groq**（超快推理，开源模型）
> - **K. Together AI**（开源模型托管平台）

> 📌 推荐组合：**阿里云百炼（主力）+ DeepSeek 官方（性价比）+ 硅基流动（备份）**

**📝 本步完成后立即写入 STEPS.md**

### Step 2：供应商配置（按所选生成）

#### 2.1 阿里云百炼（Alibaba Cloud Bailian）

| 配置项 | 值 |
|--------|-----|
| **Base URL** | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| **API Key 环境变量** | `DASHSCOPE_API_KEY` |
| **获取 Key** | [阿里云百炼控制台](https://bailian.console.aliyun.com/) → API Key 管理 |
| **OpenAI 兼容** | ✅ 原生支持 `/v1/chat/completions` |
| **可用模型** | `qwen-turbo` / `qwen-plus` / `qwen-max` / `qwen2.5-72b-instruct` / `deepseek-v3` / `deepseek-r1` |
| **计费方式** | 按 token（输入/输出分别计价） |
| **文档** | https://help.aliyun.com/zh/model-studio/ |

#### 2.2 硅基流动 SiliconFlow

| 配置项 | 值 |
|--------|-----|
| **Base URL** | `https://api.siliconflow.cn/v1` |
| **API Key 环境变量** | `SILICONFLOW_API_KEY` |
| **获取 Key** | [硅基流动控制台](https://siliconflow.cn/account/ak) → API Key |
| **OpenAI 兼容** | ✅ 原生支持 |
| **可用模型** | `deepseek-ai/DeepSeek-V3` / `deepseek-ai/DeepSeek-R1` / `Qwen/Qwen2.5-72B-Instruct` / `Qwen/Qwen2.5-7B-Instruct` / `THUDM/glm-4-9b-chat` / `stabilityai/stable-diffusion-3` |
| **计费方式** | 按 token |
| **文档** | https://docs.siliconflow.cn/ |

#### 2.3 DeepSeek 官方 API

| 配置项 | 值 |
|--------|-----|
| **Base URL** | `https://api.deepseek.com/v1` |
| **API Key 环境变量** | `DEEPSEEK_API_KEY` |
| **获取 Key** | [DeepSeek 平台](https://platform.deepseek.com/api_keys) |
| **OpenAI 兼容** | ✅ 原生支持 |
| **可用模型** | `deepseek-chat`（V3）/ `deepseek-reasoner`（R1） |
| **计费方式** | 按 token（极低价格: 输入 ¥1/百万token, 输出 ¥2/百万token） |
| **文档** | https://api-docs.deepseek.com/ |

#### 2.4 OpenAI

| 配置项 | 值 |
|--------|-----|
| **Base URL** | `https://api.openai.com/v1` |
| **API Key 环境变量** | `OPENAI_API_KEY` |
| **可用模型** | `gpt-4o` / `gpt-4o-mini` / `gpt-3.5-turbo` |
| **文档** | https://platform.openai.com/docs/ |

#### 2.5 百度千帆

| 配置项 | 值 |
|--------|-----|
| **Base URL** | `https://qianfan.baidubce.com/v2`（需 OpenAI 兼容适配层） |
| **API Key 环境变量** | `QIANFAN_ACCESS_KEY` + `QIANFAN_SECRET_KEY`（双 Key 模式） |
| **获取 Key** | [百度千帆控制台](https://console.bce.baidu.com/qianfan/) |
| **可用模型** | `ernie-4.0-8k` / `ernie-3.5-8k` / `ernie-speed-8k` |
| **注意** | ⚠️ 百度千帆不是 OpenAI 原生兼容，需要一个小适配层（本 skill 在 Step 5 生成） |

#### 2.6 Anthropic Claude

| 配置项 | 值 |
|--------|-----|
| **Base URL** | `https://api.anthropic.com/v1` |
| **API Key 环境变量** | `ANTHROPIC_API_KEY` |
| **可用模型** | `claude-3-5-sonnet-20241022` / `claude-3-opus-20240229` |
| **注意** | ⚠️ 非 OpenAI 兼容格式，需要适配层（本 skill 在 Step 5 生成） |

**📝 本步完成后立即写入 STEPS.md**

### Step 3：生成环境变量模板

`inference/.env.example`：

```bash
# ===== AI 供应商 API Key（按需填写） =====
# 阿里云百炼
DASHSCOPE_API_KEY=sk-

# 硅基流动
SILICONFLOW_API_KEY=sk-

# DeepSeek 官方
DEEPSEEK_API_KEY=sk-

# OpenAI
OPENAI_API_KEY=sk-

# 百度千帆（双 Key 模式）
QIANFAN_ACCESS_KEY=
QIANFAN_SECRET_KEY=

# Anthropic Claude
ANTHROPIC_API_KEY=sk-

# ===== 安全提醒 =====
# ⚠️ 此文件为模板，请复制为 .env 并填入真实 Key
# ⚠️ .env 已加入 .gitignore，切勿提交到 Git
```

**📝 本步完成后立即写入 STEPS.md**

### Step 4：模型注册表 + 路由表（核心）

#### 4.1 模型注册表

`inference/models/registry.yaml`：

```yaml
# 模型注册表 —— 平台对外提供的所有模型
# 每个模型可配多个供应商（主 + 备），Gateway 自动 failover

models:
  # ===== DeepSeek V3（主力模型） =====
  - id: "deepseek-ai/DeepSeek-V3"
    display_name: "DeepSeek V3"
    type: "chat"
    max_context_length: 65536
    supports_streaming: true
    supports_function_calling: true
    # 平台对外定价（可在上游成本基础上加价）
    pricing:
      prompt_per_1m_tokens: 2.0      # 元/百万 token
      completion_per_1m_tokens: 4.0
    parameters:
      temperature: { default: 0.7, min: 0, max: 2.0 }
      top_p: { default: 0.9, min: 0, max: 1.0 }
      max_tokens: { default: 4096, min: 1, max: 65536 }

  - id: "deepseek-ai/DeepSeek-R1"
    display_name: "DeepSeek R1（推理增强）"
    type: "chat"
    max_context_length: 65536
    supports_streaming: true
    # R1 仅支持 temperature=0.6（reasoning 模式）
    parameters:
      temperature: { default: 0.6 }
      max_tokens: { default: 4096, max: 65536 }
    pricing:
      prompt_per_1m_tokens: 4.0
      completion_per_1m_tokens: 16.0

  # ===== 通义千问系列 =====
  - id: "qwen-max"
    display_name: "通义千问 Max"
    type: "chat"
    max_context_length: 32768
    supports_streaming: true
    pricing:
      prompt_per_1m_tokens: 20.0
      completion_per_1m_tokens: 60.0

  - id: "qwen-plus"
    display_name: "通义千问 Plus（性价比）"
    type: "chat"
    max_context_length: 131072
    supports_streaming: true
    pricing:
      prompt_per_1m_tokens: 2.0
      completion_per_1m_tokens: 6.0

  - id: "qwen-turbo"
    display_name: "通义千问 Turbo（极速廉价）"
    type: "chat"
    max_context_length: 1000000    # 百万 token 上下文！
    supports_streaming: true
    pricing:
      prompt_per_1m_tokens: 0.3
      completion_per_1m_tokens: 0.6

  # ===== OpenAI =====
  - id: "gpt-4o"
    display_name: "GPT-4o"
    type: "chat"
    max_context_length: 128000
    supports_streaming: true
    pricing:
      prompt_per_1m_tokens: 35.0
      completion_per_1m_tokens: 105.0

  - id: "gpt-4o-mini"
    display_name: "GPT-4o Mini（经济型）"
    type: "chat"
    max_context_length: 128000
    supports_streaming: true
    pricing:
      prompt_per_1m_tokens: 1.0
      completion_per_1m_tokens: 3.0
```

#### 4.2 路由表（核心！每个模型 → 哪个供应商）

`inference/router/config.yaml`：

```yaml
# 模型路由表 —— 本文件由 sainference 生成，自动同步到 gateway-spec.yaml
# 策略：同一模型可配多个上游，primary 优先，fallback 容灾

router:
  strategy: "priority"          # priority: 优先走 primary，挂了走 fallback

upstreams:
  # ============================
  # DeepSeek V3：3 条路线（阿里云百炼为主 + DeepSeek官方 + 硅基流动备用）
  # ============================
  - model_id: "deepseek-ai/DeepSeek-V3"
    routes:
      - provider: "aliyun-bailian"
        priority: 1              # 主（阿里云百炼上的 DeepSeek V3）
        endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1"
        auth_header: "Authorization: Bearer ${DASHSCOPE_API_KEY}"
        timeout_ms: 120000
        health_check: "https://dashscope.aliyuncs.com/compatible-mode/v1/models"

      - provider: "deepseek-official"
        priority: 2              # 备 1（DeepSeek 官方，价格更低）
        endpoint: "https://api.deepseek.com/v1"
        auth_header: "Authorization: Bearer ${DEEPSEEK_API_KEY}"
        timeout_ms: 120000

      - provider: "siliconflow"
        priority: 3              # 备 2（硅基流动）
        endpoint: "https://api.siliconflow.cn/v1"
        auth_header: "Authorization: Bearer ${SILICONFLOW_API_KEY}"
        timeout_ms: 120000

  # ============================
  # 通义千问系列：走阿里云百炼
  # ============================
  - model_id: "qwen-max"
    routes:
      - provider: "aliyun-bailian"
        priority: 1
        endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1"
        auth_header: "Authorization: Bearer ${DASHSCOPE_API_KEY}"
        timeout_ms: 120000

  - model_id: "qwen-plus"
    routes:
      - provider: "aliyun-bailian"
        priority: 1
        endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1"
        auth_header: "Authorization: Bearer ${DASHSCOPE_API_KEY}"
        timeout_ms: 120000

      - provider: "siliconflow"    # 备选：硅基流动也提供 Qwen
        priority: 2
        endpoint: "https://api.siliconflow.cn/v1"
        auth_header: "Authorization: Bearer ${SILICONFLOW_API_KEY}"
        timeout_ms: 120000

  - model_id: "qwen-turbo"
    routes:
      - provider: "aliyun-bailian"
        priority: 1
        endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1"
        auth_header: "Authorization: Bearer ${DASHSCOPE_API_KEY}"
        timeout_ms: 120000

  # ============================
  # DeepSeek R1：DeepSeek 官方（R1 最稳定在官方）
  # ============================
  - model_id: "deepseek-ai/DeepSeek-R1"
    routes:
      - provider: "deepseek-official"
        priority: 1
        endpoint: "https://api.deepseek.com/v1"
        auth_header: "Authorization: Bearer ${DEEPSEEK_API_KEY}"
        timeout_ms: 300000       # R1 推理时间较长

      - provider: "siliconflow"
        priority: 2
        endpoint: "https://api.siliconflow.cn/v1"
        auth_header: "Authorization: Bearer ${SILICONFLOW_API_KEY}"
        timeout_ms: 300000

  # ============================
  # OpenAI 系列
  # ============================
  - model_id: "gpt-4o"
    routes:
      - provider: "openai"
        priority: 1
        endpoint: "https://api.openai.com/v1"
        auth_header: "Authorization: Bearer ${OPENAI_API_KEY}"
        timeout_ms: 120000

  - model_id: "gpt-4o-mini"
    routes:
      - provider: "openai"
        priority: 1
        endpoint: "https://api.openai.com/v1"
        auth_header: "Authorization: Bearer ${OPENAI_API_KEY}"
        timeout_ms: 120000
```

#### 4.3 同步到 gateway-spec.yaml

将路由表**自动填入** `api/gateway-spec.yaml` 的 `ModelRouter.upstreams` 字段，sabackend 实现 Gateway 时直接读取。

**📝 本步完成后立即写入 STEPS.md**

### Step 5：非 OpenAI 兼容供应商的适配层

> 📌 仅当选了百度千帆、Anthropic 等非 OpenAI 原生兼容的供应商时才生成。

大多数国内平台（阿里云百炼、硅基流动、DeepSeek）都是 OpenAI 兼容的，**无需适配**，直接透传即可。少数平台需要一小段格式转换代码。

`inference/router/adapters.yaml`：

```yaml
# 非 OpenAI 原生格式的供应商适配声明
# 在 Gateway 的 Proxy 中间件之前插入一个轻量适配

adapters:
  # 百度千帆：需要 IAM 签名 + 格式转换
  - provider: "qianfan"
    type: "preprocess"                    # 在转发前修改请求
    transform:
      # 百度千帆的 /v2/chat/completions 与 OpenAI 有细微差异
      headers:
        add:
          # 百度千帆用 IAM 签名，非简单 Bearer token
          # 需在 Gateway 层实现签名逻辑（约 30 行代码）
      body:
        # messages 格式与 OpenAI 一致，无需转换
        # model 名需要映射：gpt-4o → ernie-4.0-8k（在路由表中配 model_alias）
        model_alias: true

  # Anthropic Claude：Messages API 格式不同
  - provider: "anthropic"
    type: "preprocess"
    transform:
      headers:
        add:
          "x-api-key": "${ANTHROPIC_API_KEY}"
          "anthropic-version": "2023-06-01"
        remove: ["Authorization"]          # Anthropic 用 x-api-key 而非 Bearer
      body:
        # OpenAI messages → Anthropic messages（格式几乎相同）
        # OpenAI "system" role → Anthropic top-level "system" param
        map_system_role: true
      endpoint_rewrite:
        "/v1/chat/completions" → "/v1/messages"   # Anthropic 端点不同

  # 其他平台若已是 OpenAI 兼容格式 → 无需适配
  - provider: "aliyun-bailian"
    type: "passthrough"                  # 透传，无需适配
  - provider: "siliconflow"
    type: "passthrough"
  - provider: "deepseek-official"
    type: "passthrough"
  - provider: "openai"
    type: "passthrough"
```

> 💡 **绝大多数情况你不需要看上面这段**——阿里云百炼、硅基流动、DeepSeek 都是 OpenAI 格式，直接透传即可。

**📝 本步完成后立即写入 STEPS.md**

### Step 6：接入验证

```bash
echo "🧪 AI 模型接入验证清单："
echo "  ☐ 各供应商控制台已创建 API Key"
echo "  ☐ inference/.env 已填入真实 Key"
echo "  ☐ 直连测试：curl 上游供应商 /v1/chat/completions 正常返回"
echo "  ☐ 直连测试：curl 上游供应商 stream=true SSE 流式正常"
echo "  ☐ Gateway 通过 ModelRouter 转发请求到上游 → 正常返回"
echo "  ☐ Gateway SSE 流式透传正常（不截断、不缓存）"
echo "  ☐ 模拟主供应商故障 → 自动切换到备用供应商"
echo "  ☐ 计费中间件从响应中正确提取 token 用量"
echo "  ☐ gateway-spec.yaml upstreams 已从 router/config.yaml 同步"
echo ""
echo "💡 直连测试命令（替换 <KEY>）："
echo "  curl https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \\"
echo "    -H 'Authorization: Bearer <KEY>' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"model\":\"qwen-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"你好\"}]}'"
```

在 `STEPS.md` 追加「AI 模型接入」章节。

---

## 附录 A：自建推理引擎（高级模式）

> ⚠️ **仅当你需要跑私有/微调模型，且拥有 GPU 服务器时才需要。** 绝大多数场景用 Step 1-6 的集成模式即可。

自建模式简要流程：
1. 选引擎：vLLM（高吞吐，推荐）/ Ollama（轻量，本地开发）
2. `docker compose up` 启动推理服务
3. 模型注册表中 `provider` 填写自建引擎的内网地址
4. 健康检查走 `/health` 端点
5. 冷启动处理：返回 202 + 预估等待时间

详见 `inference/engines/` 目录下的部署脚本（仅在选自建模式时生成）。

---

## 与其他 skill 的关系

```
/sainit-saas → /safrontend → /saapi → /saapi-platform → /sabackend
  SaaS 原型      Web 前端     消费者 API   平台 API          后端
                                                           │
                                    /sainference ◄─────────┤
                                    模型接入（本 skill）     │
                                                           │
                                    /saapi-connect ◄───────┘
                                    前后端接通
```

| 上游 skill | 本 skill 依赖 |
|-----------|-------------|
| `/saapi-platform` | `gateway-spec.yaml`（upstreams 占位符） |

| 下游 skill | 如何使用 |
|-----------|---------|
| `/sabackend`（再次运行） | 根据填好的 `gateway-spec.yaml` 实现 ModelRouter + Proxy 中间件 |

## 关键约定速查

| 项目 | 约定 |
|------|------|
| 代码目录 | `inference/` |
| 默认模式 | 对接第三方 AI 供应商（无 GPU 需求） |
| API Key 存储 | 环境变量（`.env`），不提交 Git |
| 模型路由 | `inference/router/config.yaml` → 同步到 `api/gateway-spec.yaml` |
| 多供应商容灾 | priority 字段，数字越小越优先 |
| 透传策略 | OpenAI 兼容的直接透传；非兼容的用轻量适配层 |
| 流式处理 | Gateway 不解包 SSE，直接 pipe 到客户端 |
| 超时时间 | 默认 120s（R1 等推理模型 300s） |
| 步骤追踪 | `STEPS.md` 追加「AI 模型接入」章节 |

## 修改记录

| 时间 | 改动 |
|------|------|
| 2026-07-14-1 | 初版：自建推理引擎为主（vLLM/TGI/Ollama/Triton），第三方供应商为可选 |
| 2026-07-14-2 | **重大重构：改为集成优先模式**——默认对接第三方 AI 供应商（阿里云百炼/硅基流动/DeepSeek/OpenAI/百度千帆等）；多供应商容灾路由；自建模式降级为附录 A 高级模式；新增 OpenAI 兼容透传 + 非兼容平台轻量适配层；简化产出结构（无需 Docker/docker-compose） |

