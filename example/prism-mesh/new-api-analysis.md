# New API 项目全面功能分析文档

> 分析日期：2026-08-06  
> 项目路径：`D:\Codes\new-api`  
> 项目类型：AI API 中转站 / 多模型聚合平台  
> 技术栈：Go 1.22+ (Gin) + PostgreSQL (默认) / SQLite / MySQL + Redis + React 19  

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构总览](#2-技术架构总览)
3. [权限管理系统](#3-权限管理系统)
4. [API 密钥管理体系](#4-api-密钥管理体系)
5. [请求转发与路由系统](#5-请求转发与路由系统)
6. [通道/渠道管理](#6-通道渠道管理)
7. [模型管理](#7-模型管理)
8. [流量控制与限流](#8-流量控制与限流)
9. [计费与配额系统](#9-计费与配额系统)
10. [日志系统](#10-日志系统)
11. [监控与告警](#11-监控与告警)
12. [缓存机制](#12-缓存机制)
13. [多 AI 供应商适配](#13-多-ai-供应商适配)
14. [配置管理](#14-配置管理)
15. [OAuth 第三方登录](#15-oauth-第三方登录)
16. [支付集成](#16-支付集成)
17. [订阅系统](#17-订阅系统)
18. [国际化 (i18n)](#18-国际化-i18n)
19. [完整 API 端点清单](#19-完整-api-端点清单)
20. [环境变量配置](#20-环境变量配置)
21. [部署架构](#21-部署架构)

---

## 1. 项目概述

New API 是一个开源的 **AI API 网关/代理平台**（Go 1.22+ + Gin），核心功能是：

- **统一接入**：将 40+ 个 AI 服务供应商（OpenAI、Claude、Gemini、Azure、AWS Bedrock、DeepSeek 等）的 API 统一封装为 OpenAI 兼容格式
- **多租户管理**：支持用户注册、角色分级、分组管理
- **API Key 分发**：为下游用户生成 API Key，统一管理调用权限和配额
- **计费与配额**：支持按 Token 计费、按次计费、订阅制、预扣费/后结算、层级定价
- **流量调度**：多通道负载均衡、自动故障转移、重试机制

**代码仓库**: `github.com/QuantumNous/new-api`（基于 `Calcium-Ion/new-api` 的分支）
**许可证**: MIT  
**入口文件**: `main.go:48`  
**项目约定**: `AGENTS.md`（详见下方项目约定章节）  

---

## 2. 技术架构总览

### 2.1 技术栈

| 组件 | 技术选型 | 关键文件 |
|------|----------|----------|
| 语言 | Go 1.22+ | `go.mod:1` |
| Web 框架 | Gin | `main.go:36` |
| ORM | GORM v2 | `main.go:35` |
| 数据库 | **PostgreSQL 15** (默认) / SQLite / MySQL 8.2 (均支持) | `docker-compose.yml:29,77` |
| 日志数据库 | PostgreSQL / ClickHouse (可选) | `docker-compose.yml:31-32` |
| 缓存 | Redis + 内存缓存 | `common/redis.go` |
| 权限控制 | Casbin (GORM 适配器) | `service/authz/enforcer.go` |
| 前端 | React 19 + TypeScript + Rsbuild + Base UI + Tailwind CSS | `web/` |
| 前端包管理 | Bun | `AGENTS.md:16` |
| 国际化 | go-i18n (后端) + i18next (前端) | `i18n/`, `web/src/i18n/` |
| 容器化 | Docker / Docker Compose | `docker-compose.yml` |

### 2.2 数据库兼容性要求

**文件**: `AGENTS.md:82-94`, `common/database.go:6-10`

项目**必须同时兼容三种数据库**：SQLite、MySQL >= 5.7.8、PostgreSQL >= 9.6。

关键规则：
- 优先使用 GORM 方法，避免原始 SQL
- 使用 `lockForUpdate(tx)` 替代直接 `FOR UPDATE`（SQLite 不支持）
- 使用 `commonGroupCol`/`commonKeyCol` 处理保留字列名
- 使用 `commonTrueVal`/`commonFalseVal` 处理布尔值
- 迁移必须兼容三种数据库，SQLite 使用 `ADD COLUMN` 而非 `ALTER COLUMN`
- 避免 `gorm:"default:true"` 布尔默认值标签（MySQL/PostgreSQL 行为不一致）

### 2.3 项目目录结构

```
new-api/
├── main.go                  # 入口：资源初始化、服务启动、定时任务
├── router/                  # 路由注册
│   ├── main.go              # 总路由入口
│   ├── api-router.go        # Dashboard API 路由
│   ├── relay-router.go      # AI 转发路由（/v1/*）
│   ├── channel-router.go    # 通道管理路由
│   ├── authz-router.go      # 权限管理路由
│   ├── dashboard.go         # 前端页面路由
│   ├── web-router.go        # Web 静态资源路由
│   └── video-router.go      # 视频相关路由
├── controller/              # 控制器层（HTTP 请求处理）
├── service/                 # 业务逻辑层
│   ├── authz/               # Casbin 权限控制
│   └── passkey/             # WebAuthn 通行密钥
├── model/                   # 数据模型层（GORM）
├── middleware/               # 中间件（认证、限流、缓存等）
├── relay/                   # AI 转发核心
│   ├── channel/             # 30+ 供应商适配器
│   ├── common/              # 转发公共结构
│   ├── constant/            # 转发模式常量
│   └── helper/              # 转发辅助函数
├── relaykit/                # 转发工具包（请求/响应格式定义）
├── common/                  # 公共工具（Redis、常量、加密等）
├── constant/                # 全局常量
├── dto/                     # 数据传输对象
├── setting/                 # 配置模块（运行时设置）
├── types/                   # 类型定义
├── oauth/                   # OAuth 第三方登录
├── logger/                  # 日志组件
├── i18n/                    # 国际化
├── pkg/                     # 独立包
│   ├── cachex/              # 混合缓存
│   └── perf_metrics/        # 性能指标
├── web/                     # 前端 React 应用
├── docs/                    # 文档
└── .env.example             # 配置模板
```

### 2.3 启动流程

`main.go:48-239` 中的启动流程：

```
1. InitResources() → 加载 .env → 初始化 Logger → 数据库 → Redis → 权限
2. 初始化通道缓存 (InitChannelCache)
3. 预热定价数据 (GetPricing)
4. 启动后台任务：
   - SyncChannelCache    — 定时同步通道缓存
   - SyncOptions          — 定时同步配置选项
   - StartPolicySync      — 定时同步 Casbin 权限策略
   - UpdateQuotaData      — 定时更新配额看板数据
   - AutomaticallyUpdateChannels — 自动更新通道状态
   - Codex credential refresh     — Codex 凭证自动刷新
   - SubscriptionQuotaResetTask   — 订阅配额重置
   - SystemInstanceReporter       — 多实例节点上报
   - SystemTaskRunner             — 系统定时任务
5. 启动 HTTP Server (Gin)
6. 优雅关闭 (SIGINT/SIGTERM)
```

---

## 3. 权限管理系统

### 3.1 角色体系

**文件**: `common/constants.go:178-183`

```go
RoleGuestUser  = 0   // 游客
RoleCommonUser = 1   // 普通用户
RoleAdminUser  = 10  // 管理员
RoleRootUser   = 100 // 超级管理员
```

### 3.2 Casbin 权限控制

**文件**: `service/authz/enforcer.go:19-31`

项目使用 **Casbin** 实现细粒度的基于角色的访问控制 (RBAC)：

- **Casbin 模型**: `service/authz/enforcer.go:19-31` — 定义了 `sub/obj/act` 策略模型
- **策略存储**: GORM 适配器 (MySQL)，`service/authz/adapter.go`
- **策略同步**: `service/authz/enforcer.go:84-94` — 定时从数据库重新加载策略，保证多节点部署一致性
- **权限检查**: `service/authz/enforcer.go` — `Can(userID, role, permission)` 函数

**内置角色**: `service/authz/role.go:19-36`

| 角色 | Key | 说明 |
|------|-----|------|
| Root | `root` | 超级用户，所有权限 |
| Admin | `admin` | 管理员，不含超级用户权限 |

### 3.3 权限资源

**文件**: `service/authz/registry.go`

将系统操作分解为细粒度权限：

| 资源 | 权限动作 | 说明 |
|------|----------|------|
| `channel` | `read`, `write`, `sensitive_write`, `operate` | 通道管理 |
| `user` | `read`, `write`, `sensitive_write` | 用户管理 |
| `token` | `read`, `write`, `sensitive_write` | Token 管理 |
| `log` | `read` | 日志查看 |
| `option` | `read`, `write` | 配置选项 |

### 3.4 认证中间件

**文件**: `middleware/auth.go`

| 中间件 | 行号 | 功能 | 最低角色 |
|--------|------|------|----------|
| `UserAuth()` | 92-96 | 用户认证 | RoleCommonUser |
| `AdminAuth()` | 98-102 | 管理员认证 | RoleAdminUser |
| `RootAuth()` | 104-108 | 超级管理员认证 | RoleRootUser |
| `TryUserAuth()` | 78-90 | 尝试认证（可选） | 无 |
| `TokenAuth()` | 352-483 | API Token 认证 (relay) | 无 |
| `TokenAuthReadOnly()` | 279-350 | 只读 Token 认证 | 无 |
| `TokenOrUserAuth()` | 248-273 | Token 或 Session 认证 | 无 |
| `RequirePermission()` | 226-239 | 细粒度权限检查 | 按权限 |

### 3.5 认证流程

**Dashboard 认证** (`middleware/auth.go:139-178`):

1. 从 `Authorization` Header 提取 Bearer Token
2. 尝试解析为 Dashboard Access Token (JWT)
3. 如果成功 → 验证 Login Session → 返回 User 信息
4. 如果失败 → 尝试作为 Personal Access Token (PAT) 验证
5. 验证用户状态 (`UserStatusEnabled`)
6. 验证角色等级 (`user.Role >= minRole`)

**API Token 认证** (`middleware/auth.go:352-483`):

1. 支持多种 Token 传递方式：
   - Bearer Header（标准 OpenAI 格式）
   - `x-api-key` Header（Claude 格式）
   - `x-goog-api-key` Header（Gemini 格式）
   - URL Query `?key=`（Gemini 格式）
   - WebSocket `Sec-WebSocket-Protocol`（实时通信）
   - `mj-api-secret` Header（Midjourney 格式）
2. Token 格式: `sk-{key}` 或 `{key}`
3. 验证 Token 状态、用户状态
4. 检查 IP 白名单限制 (`token.GetIpLimits()`)
5. 检查分组权限 (`tokenGroup` 与 `userGroup` 匹配)
6. 设置上下文信息（用户ID、TokenID、配额信息等）

---

## 4. API 密钥管理体系

### 4.1 Token 数据模型

**文件**: `model/token.go:14-33`

```go
type Token struct {
    Id                 int            // 主键
    UserId             int            // 所属用户
    Key                string         // 密钥值 (唯一索引)
    Status             int            // 状态: 1=启用, 2=禁用, 3=过期, 4=耗尽
    Name               string         // 名称
    CreatedTime        int64          // 创建时间
    AccessedTime       int64          // 最后访问时间
    ExpiredTime        int64          // 过期时间 (-1=永不过期)
    RemainQuota        int            // 剩余配额
    UnlimitedQuota     bool           // 无限配额
    ModelLimitsEnabled bool           // 模型限制开关
    ModelLimits        string         // 模型限制 (JSON)
    AllowIps           *string        // IP 白名单
    UsedQuota          int            // 已用配额
    Group              string         // 所属分组
    CrossGroupRetry    bool           // 跨分组重试
    AutoGroups         string         // 自动分组 (JSON 数组)
    DeletedAt          gorm.DeletedAt // 软删除
}
```

### 4.2 Token 状态

**文件**: `common/constants.go:230-235`

| 状态 | 常量 | 值 | 说明 |
|------|------|---|------|
| 启用 | `TokenStatusEnabled` | 1 | 正常使用 |
| 禁用 | `TokenStatusDisabled` | 2 | 手动禁用 |
| 过期 | `TokenStatusExpired` | 3 | 超过有效期 |
| 耗尽 | `TokenStatusExhausted` | 4 | 配额用尽 |

### 4.3 Token 生成

**文件**: `controller/token.go`

- `AddToken` — 创建新 Token
- 使用 `common.GenerateKey()` 生成唯一密钥
- 支持设置名称、过期时间、配额、分组、IP 限制、模型限制等

### 4.4 Token 生命周期

| 操作 | 端点 | 说明 |
|------|------|------|
| 创建 | `POST /api/token/` | 生成新 API Key |
| 查看列表 | `GET /api/token/` | 获取用户所有 Token |
| 查看详情 | `GET /api/token/:id` | 查看单个 Token |
| 查看密钥 | `POST /api/token/:id/key` | 安全验证后查看完整 Key |
| 更新 | `PUT /api/token/` | 修改 Token 配置 |
| 删除 | `DELETE /api/token/:id` | 单个删除 |
| 批量删除 | `POST /api/token/batch` | 批量删除 |
| 批量查看密钥 | `POST /api/token/batch/keys` | 批量获取 Key |
| 搜索 | `GET /api/token/search` | 搜索 Token |

### 4.5 Token 安全机制

**文件**: `middleware/auth.go:427-441`

1. **IP 白名单**: 通过 `AllowIps` 字段限制访问来源 IP
2. **模型限制**: 通过 `ModelLimits` 限制可调用的模型
3. **分组隔离**: 通过 `Group` 字段限制用户可访问的分组
4. **自动分组**: 通过 `AutoGroups` 实现自动分组切换
5. **密钥掩码**: 返回时自动掩码处理 (`MaskTokenKey()`)
6. **安全二次验证**: 查看完整 Key 需要密码确认

### 4.6 兑换码系统

**文件**: `model/redemption.go`, `controller/redemption.go`

| 状态 | 值 | 说明 |
|------|---|------|
| 启用 | 1 | 可兑换 |
| 禁用 | 2 | 手动禁用 |
| 已使用 | 3 | 已被兑换 |

- 管理员创建兑换码，设定配额
- 用户兑换后配额直接充值到账户
- 支持过期时间
- 并发安全的兑换（使用数据库行锁）

---

## 5. 请求转发与路由系统

### 5.1 转发路由

**文件**: `router/relay-router.go`

所有 AI 请求通过 `/v1/*` 路径接收，统一转发到上游 AI 服务：

| 路径 | 格式 | 用途 |
|------|------|------|
| `POST /v1/chat/completions` | OpenAI | 对话补全 |
| `POST /v1/completions` | OpenAI | 文本补全 |
| `POST /v1/messages` | Claude | Claude 消息 |
| `POST /v1/responses` | OpenAI | Responses API |
| `POST /v1/images/generations` | OpenAI | 图像生成 |
| `POST /v1/embeddings` | OpenAI | 嵌入向量 |
| `POST /v1/audio/transcriptions` | OpenAI | 语音转文字 |
| `POST /v1/audio/translations` | OpenAI | 语音翻译 |
| `POST /v1/audio/speech` | OpenAI | 文字转语音 |
| `POST /v1/rerank` | Rerank | 重排序 |
| `GET /v1/realtime` | WebSocket | 实时通信 |
| `POST /v1/models/*path` | Gemini | Gemini 模型 |
| `POST /v1beta/models/*path` | Gemini | Gemini API |

### 5.2 转发核心流程

**文件**: `controller/relay.go:71-256`

```
1. 升级 WebSocket（如需要）
2. 获取并验证请求体
3. 生成 RelayInfo（转发上下文）
4. 敏感词检查（可选）
5. Token 估算与定价计算
6. 预扣费（PreConsumeBilling）
7. 重试循环:
   a. 获取最优通道（getChannel）
   b. 选择适配器（GetAdaptor）
   c. 通过适配器转发请求
   d. 失败时判断是否重试、是否自动禁用通道
8. 结算（SettleBilling）
9. 记录日志
```

### 5.3 转发模式

**文件**: `relay/constant/relay_mode.go`

| 模式 | 说明 |
|------|------|
| `RelayModeChatCompletions` | 对话补全 |
| `RelayModeCompletions` | 文本补全 |
| `RelayModeImagesGenerations` | 图像生成 |
| `RelayModeImagesEdits` | 图像编辑 |
| `RelayModeEmbeddings` | 嵌入向量 |
| `RelayModeAudioSpeech` | 语音合成 |
| `RelayModeAudioTranscription` | 语音识别 |
| `RelayModeAudioTranslation` | 语音翻译 |
| `RelayModeRerank` | 重排序 |
| `RelayModeResponses` | Responses API |
| `RelayModeMidjourney*` | Midjourney 系列 |

### 5.4 重试机制

**文件**: `controller/relay.go:331-361`

- 重试次数由 `RetryTimes` 配置（环境变量 `RETRY_TIMES`）
- 自动跳过已失败的通道
- 通道错误自动重试，客户端错误（4xx）不重试
- 支持跨分组重试（`CrossGroupRetry`）
- 失败通道可自动禁用（`AutoBan`）

### 5.5 适配器模式

**文件**: `relay/relay_adaptor.go:56-134`

通过 `GetAdaptor(apiType)` 根据通道类型返回对应的适配器，实现适配器模式：

```go
func GetAdaptor(apiType int) channel.Adaptor {
    switch apiType {
    case constant.APITypeOpenAI:    return &openai.Adaptor{}
    case constant.APITypeAnthropic: return &claude.Adaptor{}
    case constant.APITypeGemini:    return &gemini.Adaptor{}
    // ... 30+ 适配器
    }
}
```

每个适配器实现 `channel.Adaptor` 接口：
- `Init()` — 初始化适配器
- `GetRequestURL()` — 构建请求 URL
- `SetupRequestHeader()` — 设置请求头
- `ConvertRequest()` — 请求转换（OpenAI 格式 → 供应商格式）
- `DoResponse()` — 响应处理（供应商格式 → OpenAI 格式）
- `GetModelList()` — 获取模型列表
- `GetChannelName()` — 获取通道名称

### 5.6 请求格式支持

**文件**: `relaykit/types/`

支持的请求/响应格式：

| 格式 | 说明 |
|------|------|
| `RelayFormatOpenAI` | OpenAI 标准格式 |
| `RelayFormatClaude` | Anthropic Claude 格式 |
| `RelayFormatGemini` | Google Gemini 格式 |
| `RelayFormatOpenAIRealtime` | OpenAI WebSocket 实时 |
| `RelayFormatOpenAIResponses` | OpenAI Responses API |
| `RelayFormatOpenAIImage` | OpenAI 图像 |
| `RelayFormatOpenAIAudio` | OpenAI 音频 |
| `RelayFormatEmbedding` | 嵌入向量 |
| `RelayFormatRerank` | 重排序 |
| `RelayFormatMjProxy` | Midjourney |

---

## 6. 通道/渠道管理

### 6.1 通道数据模型

**文件**: `model/channel.go:23-60`

```go
type Channel struct {
    Id                 int         // 主键
    Type               int         // 通道类型（供应商类型）
    Key                string      // API Key
    Status             int         // 状态
    Name               string      // 名称
    Weight             *uint       // 权重（负载均衡）
    BaseURL            *string     // 自定义 Base URL
    Models             string      // 支持的模型列表
    Group              string      // 分组
    Priority           *int64      // 优先级
    AutoBan            *int        // 自动禁用
    Balance            float64     // 余额
    ModelMapping       *string     // 模型名称映射
    StatusCodeMapping  *string     // 状态码映射
    ParamOverride      *string     // 参数覆盖
    HeaderOverride     *string     // 请求头覆盖
    ChannelInfo        ChannelInfo // 多 Key 配置
    Tag                *string     // 标签
    Setting            *string     // 额外设置
}
```

### 6.2 通道状态

**文件**: `common/constants.go:243-248`

| 状态 | 常量 | 值 | 说明 |
|------|------|---|------|
| 未知 | `ChannelStatusUnknown` | 0 | 初始状态 |
| 启用 | `ChannelStatusEnabled` | 1 | 正常使用 |
| 手动禁用 | `ChannelStatusManuallyDisabled` | 2 | 管理员禁用 |
| 自动禁用 | `ChannelStatusAutoDisabled` | 3 | 系统自动禁用 |

### 6.3 多 Key 模式

**文件**: `model/channel.go:62-70`

支持多 Key 轮询/故障转移：
- `IsMultiKey` — 是否多 Key 模式
- `MultiKeySize` — Key 数量
- `MultiKeyStatusList` — 各 Key 状态
- `MultiKeyDisabledReason` — 禁用原因
- `MultiKeyPollingIndex` — 轮询索引
- `MultiKeyMode` — 轮询模式

### 6.4 通道管理 API

**文件**: `router/channel-router.go:39-78`

| 端点 | 权限 | 说明 |
|------|------|------|
| `GET /api/channel/` | ChannelRead | 通道列表 |
| `GET /api/channel/search` | ChannelRead | 搜索通道 |
| `GET /api/channel/:id` | ChannelRead | 通道详情 |
| `POST /api/channel/` | ChannelSensitiveWrite | 创建通道 |
| `PUT /api/channel/` | ChannelWrite | 更新通道 |
| `DELETE /api/channel/:id` | ChannelSensitiveWrite | 删除通道 |
| `GET /api/channel/test/:id` | ChannelOperate | 测试通道 |
| `GET /api/channel/update_balance/:id` | ChannelOperate | 更新余额 |
| `POST /api/channel/:id/status` | ChannelOperate | 更新状态 |
| `POST /api/channel/fix` | ChannelOperate | 修复通道能力 |
| `POST /api/channel/copy/:id` | ChannelSensitiveWrite | 复制通道 |
| `POST /api/channel/multi_key/manage` | ChannelOperate | 管理多 Key |

### 6.5 通道缓存

**文件**: `model/channel_cache.go`

- 启动时加载所有通道到内存缓存
- 定时同步（`channel_cache.go`）
- 支持 Redis 缓存
- 通道选择时从缓存读取，避免频繁查库

### 6.6 通道选择策略

**文件**: `service/channel_select.go`

- 根据分组、模型名称、优先级筛选可用通道
- 支持权重负载均衡
- 支持通道亲和性（Channel Affinity）— 同一用户/Token 尽量使用相同通道
- 自动跳过禁用/失败的通道

---

## 7. 模型管理

### 7.1 模型数据模型

**文件**: `model/model.go`

管理平台支持的模型元数据，包括：
- 模型名称、描述、标签
- 所属供应商
- 价格配置（输入/输出 Token 价格）
- 是否启用
- 模型能力（对话、图像、嵌入等）

### 7.2 模型管理 API

**文件**: `router/api-router.go:344-356`

| 端点 | 说明 |
|------|------|
| `GET /api/models/` | 模型列表 |
| `GET /api/models/search` | 搜索模型 |
| `GET /api/models/:id` | 模型详情 |
| `POST /api/models/` | 创建模型 |
| `PUT /api/models/` | 更新模型 |
| `DELETE /api/models/:id` | 删除模型 |
| `GET /api/models/sync_upstream/preview` | 预览上游同步 |
| `POST /api/models/sync_upstream` | 执行上游同步 |
| `GET /api/models/missing` | 缺失模型检测 |

### 7.3 模型定价

**文件**: `model/price.go`, `service/price.go`

- 支持按 Token 计费（输入/输出分开定价）
- 支持按次计费（图像生成等）
- 支持缓存命中折扣
- 支持分组倍率（GroupRatio）和模型倍率（ModelRatio）
- 支持层级定价（Tiered Billing）

---

## 8. 流量控制与限流

### 8.1 限流策略

**文件**: `middleware/rate-limit.go`

| 限流类型 | 标记 | 默认值 | 说明 |
|----------|------|--------|------|
| 全局 API 限流 | `GA` | 可配置 | 基于 IP |
| 全局 Web 限流 | `GW` | 可配置 | 基于 IP |
| 关键操作限流 | `CT` | 20次/20分钟 | 基于 IP |
| 上传限流 | `UP` | 10次/分钟 | 基于 IP |
| 下载限流 | `DW` | 10次/分钟 | 基于 IP |
| 搜索限流 | `SR` | 10次/分钟 | 基于用户 ID |
| 模型请求限流 | — | 可配置 | 基于 Token |

### 8.2 限流实现

**文件**: `middleware/rate-limit.go:17-36`

- **Redis 模式**: 使用 Lua 脚本实现固定窗口计数器，原子性 INCR + EXPIRE
- **内存模式**: 基于 `InMemoryRateLimiter` 的本地内存计数器
- 超限返回 HTTP 429 + `Retry-After` 头

### 8.3 限流 Lua 脚本

```lua
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[2])
end
-- 检查是否超限
if count > tonumber(ARGV[1]) then
  return {0, count, ttl}
end
return {1, count, ttl}
```

### 8.4 请求体大小限制

- `middleware/AnonymousRequestBodyLimit()` — 未认证请求体大小限制
- 超大请求体返回 HTTP 413 (Request Entity Too Large)

### 8.5 并发处理

- 使用 Go 协程池 (`github.com/bytedance/gopkg/util/gopool`)
- 池化数据库连接（`SQL_MAX_IDLE_CONNS` / `SQL_MAX_OPEN_CONNS`）
- HTTP 客户端连接池复用（`relay_max_idle_conns`）

---

## 9. 计费与配额系统

### 9.1 计费流程

**文件**: `service/billing.go`, `service/billing_session.go`

```
1. PreConsumeBilling (预扣费)
   ├── 创建 BillingSession
   ├── 根据定价计算预扣配额
   └── 从用户账户/订阅扣除

2. 请求执行...

3. SettleBilling (后结算)
   ├── 计算实际消耗 vs 预扣差额
   ├── 多退少补
   └── 发送配额通知
```

### 9.2 计费来源

**文件**: `service/billing.go:13-16`

| 来源 | 常量 | 说明 |
|------|------|------|
| 钱包余额 | `BillingSourceWallet` | 从账户余额扣除 |
| 订阅 | `BillingSourceSubscription` | 从订阅配额扣除 |

### 9.3 配额计算

**文件**: `service/quota.go`, `service/text_quota.go`

- 文本模型：按 Token 数 × 价格倍率
- 图像模型：按尺寸/分辨率 × 图片倍率
- 音频模型：按秒数 × 音频倍率
- 嵌入模型：按 Token 数 × 倍率

### 9.4 配额服务

**文件**: `service/quota.go`

- `PreConsumeQuota` — 预扣配额
- `PostConsumeQuota` — 后结算配额
- 多级扣费优先级：Token 独立配额 → 用户配额 → 订阅配额
- 自动发送配额不足通知

### 9.5 层级定价

**文件**: `service/tiered_settle.go`

支持按用量阶梯定价：
- 不同的使用量级别对应不同的价格倍率
- 自动根据分组选择对应的定价层级

### 9.6 违规费用

**文件**: `service/violation_fee.go`

- 对于敏感内容或违规请求，收取违规费用
- 防止滥用

---

## 10. 日志系统

### 10.1 日志类型

**文件**: `logger/logger.go`, `model/log.go`

| 日志类型 | 说明 |
|----------|------|
| 请求日志 | 记录每一次 API 调用 |
| 错误日志 | 记录转发失败、通道错误 |
| 系统日志 | 服务运行状态 |
| 审计日志 | 管理员操作审计 |

### 10.2 日志记录

**文件**: `controller/relay.go:363-408`

每条日志包含：
- 用户 ID、Token ID、Token 名称
- 通道 ID、通道名称、通道类型
- 模型名称
- 请求路径
- 错误类型、错误码、HTTP 状态码
- 使用时间
- 是否流式请求
- 管理员信息（使用的通道列表、多 Key 信息）

### 10.3 日志存储

- 支持独立日志数据库（`LOG_SQL_DSN`）
- 支持 MySQL 存储
- 错误日志开关（`ERROR_LOG_ENABLED`）

### 10.4 日志 API

| 端点 | 说明 |
|------|------|
| `GET /api/log/` | 管理员查看所有日志 |
| `GET /api/log/stat` | 日志统计 |
| `GET /api/log/self` | 用户查看自己的日志 |
| `GET /api/log/self/stat` | 用户日志统计 |
| `GET /api/log/self/search` | 用户搜索日志 |
| `GET /api/log/search` | 管理员搜索日志 |
| `GET /api/log/token` | 通过 Token 查看日志 |

### 10.5 日志清理

- 系统任务 `CreateLogCleanupSystemTask` 自动清理过期日志
- 支持手动清理日志文件

---

## 11. 监控与告警

### 11.1 系统监控

**文件**: `common/system_monitor.go`

- CPU、内存、磁盘使用率监控
- 性能指标采集 (`pkg/perf_metrics/`)
- Pyroscope 持续性能分析

### 11.2 性能指标

**文件**: `pkg/perf_metrics/metrics.go`

- 记录每次转发的性能数据
- 响应时间统计
- 成功率统计
- 通道响应时间排行

**API 端点**:
- `GET /api/perf-metrics/summary` — 性能摘要
- `GET /api/perf-metrics` — 详细性能指标

### 11.3 系统信息

**文件**: `service/system_instance.go`

- 多节点实例上报
- 节点身份标识
- 实例存活检测

**API 端点**:
- `GET /api/system-info/instances` — 查看活跃实例
- `DELETE /api/system-info/stale-instances` — 清理过期实例

### 11.4 通道自动管理

**文件**: `service/channel.go`

- 自动禁用失败通道（`AutomaticDisableChannelEnabled`）
- 自动启用恢复通道（`AutomaticEnableChannelEnabled`）
- 通道失败阈值（`ChannelDisableThreshold`）
- 定时通道测试

### 11.5 通知机制

**文件**: `service/user_notify.go`, `service/notify-limit.go`

- 配额不足通知
- 订阅即将到期通知
- 邮件通知（SMTP）
- 配额阈值提醒（`QuotaRemindThreshold`）

### 11.6 排名系统

**文件**: `service/rankings.go`

- 用户使用量排名
- 模型使用量排名
- API 端点: `GET /api/rankings`

---

## 12. 缓存机制

### 12.1 多级缓存架构

| 缓存层 | 技术 | 用途 |
|--------|------|------|
| 内存缓存 | Go Map + sync | 通道信息、配置、用户信息 |
| Redis 缓存 | Redis Hash | Token 缓存、用户缓存、限流计数 |
| 磁盘缓存 | 本地文件 | 请求响应缓存 |
| 混合缓存 | pkg/cachex | 内存 + Redis 双层缓存 |

### 12.2 内存缓存

**文件**: `common/constants.go:91` — `MemoryCacheEnabled`

- 通道缓存：`model/channel_cache.go` — 启动时加载，定时同步
- 用户缓存：`model/user_cache.go` — 用户信息缓存
- Token 缓存：`model/token_cache.go` — Token 验证缓存
- 同步频率：`SYNC_FREQUENCY`（默认 60 秒）

### 12.3 Redis 缓存

**文件**: `common/redis.go`

- 连接池配置（`REDIS_POOL_SIZE`）
- 支持 Hash 存储（`RedisHSetObj` / `RedisHGetObj`）
- 支持原子递增（`RedisIncr` / `RedisHIncrBy`）
- 支持 Pipeline 事务

### 12.4 磁盘缓存

**文件**: `common/disk_cache.go`

- 本地文件缓存请求响应
- 支持缓存清理
- 启动时自动清理过期缓存文件

### 12.5 缓存中间件

**文件**: `middleware/cache.go`

- 请求结果缓存
- 缓存键生成策略
- 缓存失效策略

### 12.6 通道亲和性缓存

**文件**: `service/channel_affinity.go`

- 记录用户/Token 与通道的绑定关系
- 提升连续请求的通道命中率
- 减少通道切换带来的延迟

---

## 13. 多 AI 供应商适配

### 13.1 支持的供应商

**文件**: `relay/relay_adaptor.go:56-134`, `common/api_type.go`

| 供应商 | 适配器路径 | 通道类型 |
|--------|-----------|----------|
| OpenAI | `relay/channel/openai/` | `ChannelTypeOpenAI` |
| Anthropic Claude | `relay/channel/claude/` | `ChannelTypeAnthropic` |
| Google Gemini | `relay/channel/gemini/` | `ChannelTypeGemini` |
| Google Vertex AI | `relay/channel/vertex/` | `ChannelTypeVertexAi` |
| DeepSeek | `relay/channel/deepseek/` | `ChannelTypeDeepSeek` |
| 阿里通义千问 | `relay/channel/ali/` | `ChannelTypeAli` |
| 百度文心一言 | `relay/channel/baidu/` | `ChannelTypeBaidu` |
| 智谱 GLM | `relay/channel/zhipu/` | `ChannelTypeZhipu` |
| 讯飞星火 | `relay/channel/xunfei/` | `ChannelTypeXunfei` |
| 腾讯混元 | `relay/channel/tencent/` | `ChannelTypeTencent` |
| Moonshot | `relay/channel/moonshot/` | `ChannelTypeMoonshot` |
| MiniMax | `relay/channel/minimax/` | `ChannelTypeMiniMax` |
| 火山引擎 | `relay/channel/volcengine/` | `ChannelTypeVolcEngine` |
| 硅基流动 | `relay/channel/siliconflow/` | `ChannelTypeSiliconFlow` |
| 即梦 | `relay/channel/jimeng/` | `ChannelTypeJimeng` |
| Mistral | `relay/channel/mistral/` | `ChannelTypeMistral` |
| Cohere | `relay/channel/cohere/` | `ChannelTypeCohere` |
| Perplexity | `relay/channel/perplexity/` | `ChannelTypePerplexity` |
| Replicate | `relay/channel/replicate/` | `ChannelTypeReplicate` |
| Ollama | `relay/channel/ollama/` | `ChannelTypeOllama` |
| Dify | `relay/channel/dify/` | `ChannelTypeDify` |
| Coze | `relay/channel/coze/` | `ChannelTypeCoze` |
| Jina | `relay/channel/jina/` | `ChannelTypeJina` |
| Cloudflare | `relay/channel/cloudflare/` | `ChannelCloudflare` |
| xAI (Grok) | `relay/channel/xai/` | `ChannelTypeXai` |
| AWS Bedrock | `relay/channel/aws/` | `ChannelTypeAws` |
| Codex | `relay/channel/codex/` | `ChannelTypeCodex` |
| SubModel | `relay/channel/submodel/` | `ChannelTypeSubmodel` |
| Sub2API | `relay/channel/sub2api/` | `ChannelTypeSub2API` |
| NewAPI | `relay/channel/newapi/` | `ChannelTypeNewAPI` |
| AdvancedCustom | `relay/channel/advancedcustom/` | `ChannelTypeAdvancedCustom` |

### 13.2 任务型供应商

支持异步任务型 API（如视频生成、音乐生成）：

| 供应商 | 适配器 | 能力 |
|--------|--------|------|
| Suno | `task/suno` | 音乐生成 |
| 阿里 | `task/ali` | 视频生成 |
| Kling | `task/kling` | 视频生成 |
| 即梦 | `task/jimeng` | 视频生成 |
| Vidu | `task/vidu` | 视频生成 |
| 豆包 | `task/doubao` | 视频生成 |
| Sora | `task/sora` | 视频生成 |
| Gemini | `task/gemini` | 视频生成 |
| Vertex | `task/vertex` | 视频生成 |
| Hailuo | `task/hailuo` | 视频生成 |

### 13.3 协议转换

每个适配器负责：
- **请求转换**: 将 OpenAI 格式的请求转换为供应商原生格式
- **响应转换**: 将供应商原生响应转换为 OpenAI 格式
- **SSE 流式处理**: 支持 Server-Sent Events 流式响应
- **错误码映射**: 将供应商错误码映射为统一格式

---

## 14. 配置管理

### 14.1 配置系统

**文件**: `setting/config/config.go`

统一配置管理器 `ConfigManager`：
- 支持多模块配置注册
- 从数据库动态加载配置
- 支持热更新（定时同步）
- 配置导出为扁平结构

### 14.2 配置模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 通用设置 | `setting/` | 系统基础配置 |
| 操作设置 | `setting/operation_setting/` | 重试策略、错误码映射 |
| 倍率设置 | `setting/ratio_setting/` | 分组倍率、模型倍率 |
| 性能设置 | `setting/performance_setting/` | 性能优化参数 |

### 14.3 配置热更新

**文件**: `main.go:109`

```go
go model.SyncOptions(common.SyncFrequency)
```

定时从数据库同步配置到内存，实现不重启更新配置。

---

## 15. OAuth 第三方登录

### 15.1 支持的 OAuth 提供商

**文件**: `oauth/`

| 提供商 | 路由 |
|--------|------|
| GitHub | `GET /api/oauth/github` |
| LinuxDO | 通过统一路由 |
| 微信 | `GET /api/oauth/wechat` |
| Telegram | `GET /api/oauth/telegram/login` |
| 自定义 OIDC | `GET /api/oauth/:provider` |

### 15.2 自定义 OAuth 提供商

**文件**: `controller/oauth.go`, `router/api-router.go:207-217`

- 支持动态添加自定义 OAuth 提供商
- 支持 OIDC Discovery
- 管理 API: `GET/POST/PUT/DELETE /api/custom-oauth-provider/`

### 15.3 OAuth 绑定

- 用户可绑定/解绑多个 OAuth 账号
- 支持邮箱绑定 (`POST /api/oauth/email/bind`)

---

## 16. 支付集成

### 16.1 支持的支付方式

**文件**: `router/api-router.go`

| 支付方式 | 相关路由 |
|----------|----------|
| 余额支付 | `POST /api/user/self/pay` |
| 易支付 | `POST /api/user/self/pay` + `POST /api/user/epay/notify` |
| Stripe | `POST /api/user/self/stripe/pay` + `POST /api/stripe/webhook` |
| Creem | `POST /api/user/self/creem/pay` + `POST /api/creem/webhook` |
| Waffo | `POST /api/user/self/waffo/pay` + `POST /api/waffo/webhook` |
| Waffo Pancake | `POST /api/user/self/waffo-pancake/pay` + webhook |

### 16.2 充值流程

1. 用户选择充值金额
2. 创建支付订单
3. 跳转支付页面
4. 支付回调验证
5. 充值到账

---

## 17. 订阅系统

### 17.1 订阅数据模型

**文件**: `router/api-router.go:156-184`

- 订阅计划管理（管理员）
- 用户订阅购买
- 多种支付方式

### 17.2 订阅 API

| 端点 | 说明 |
|------|------|
| `GET /api/subscription/plans` | 获取订阅计划 |
| `GET /api/subscription/self` | 获取自己的订阅 |
| `POST /api/subscription/balance/pay` | 余额购买订阅 |
| `POST /api/subscription/epay/pay` | 易支付购买订阅 |
| `POST /api/subscription/stripe/pay` | Stripe 购买订阅 |

### 17.3 订阅管理 (管理员)

| 端点 | 说明 |
|------|------|
| `GET /api/subscription/admin/plans` | 计划列表 |
| `POST /api/subscription/admin/plans` | 创建计划 |
| `PUT /api/subscription/admin/plans/:id` | 更新计划 |
| `POST /api/subscription/admin/bind` | 绑定订阅 |
| `POST /api/subscription/admin/plans/:id/subscriptions/reset` | 重置计划订阅 |

### 17.4 订阅配额重置

**文件**: `service/subscription_reset_task.go`

- 定时任务自动重置订阅配额
- 支持日/周/月/自定义重置周期

---

## 18. 国际化 (i18n)

### 18.1 后端 i18n

**文件**: `i18n/`, `AGENTS.md:44-46`

- 库：`nicksnyder/go-i18n/v2`
- 支持语言：en, zh
- 中间件：`middleware.I18n()` (`main.go:192`)
- 用户语言懒加载：`i18n.SetUserLangLoader(model.GetUserLanguage)` (`main.go:356`)

### 18.2 前端 i18n

**文件**: `AGENTS.md:48-53`, `web/src/i18n/`

- 库：`i18next` + `react-i18next` + `i18next-browser-languagedetector`
- 支持语言：en (基准), zh (回退), zh-TW, fr, ru, ja, vi
- 翻译文件：`web/src/i18n/locales/{lang}.json` — 扁平 JSON，键为英文源字符串
- 用法：`useTranslation()` hook，在组件中调用 `t('English key')`
- CLI 工具：`bun run i18n:sync`（从 `web/` 目录执行）

### 18.3 翻译消息键

**文件**: `middleware/auth.go`, 使用 `i18n.Msg*` 常量

关键消息键：
- `MsgAuthUserBanned` — 用户被禁用
- `MsgAuthInsufficientPrivilege` — 权限不足
- `MsgAuthNotLoggedIn` — 未登录
- `MsgAuthAccessTokenInvalid` — Token 无效
- `MsgTokenNotProvided` — 未提供 Token
- `MsgTokenInvalid` — Token 无效
- `MsgDatabaseError` — 数据库错误

---

## 19. 完整 API 端点清单

### 19.1 Dashboard API (`/api/`)

**系统**:
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/setup` | 无 | 获取系统初始化状态 |
| POST | `/api/setup` | 无 | 系统初始化 |
| GET | `/api/status` | 无 | 获取系统状态 |
| GET | `/api/notice` | 无 | 获取公告 |
| GET | `/api/about` | 无 | 关于页面 |
| GET | `/api/pricing` | 可选 | 获取定价 |
| GET | `/api/home_page_content` | 无 | 首页内容 |
| GET | `/api/ratio_config` | 限流 | 倍率配置 |

**用户认证**:
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/register` | 注册 |
| POST | `/api/user/login` | 登录 |
| POST | `/api/user/login/2fa` | 2FA 登录 |
| POST | `/api/user/auth/refresh` | 刷新 Token |
| POST | `/api/user/auth/logout` | 登出 |
| GET | `/api/user/self` | 获取个人信息 |
| PUT | `/api/user/self` | 更新个人信息 |
| DELETE | `/api/user/self` | 删除账号 |
| GET | `/api/user/token` | 生成 Access Token |

**Passkey (WebAuthn)**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/self/passkey` | Passkey 状态 |
| POST | `/api/user/self/passkey/register/begin` | 开始注册 |
| POST | `/api/user/self/passkey/register/finish` | 完成注册 |
| DELETE | `/api/user/self/passkey` | 删除 Passkey |

**2FA**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/self/2fa/status` | 2FA 状态 |
| POST | `/api/user/self/2fa/setup` | 设置 2FA |
| POST | `/api/user/self/2fa/enable` | 启用 2FA |
| POST | `/api/user/self/2fa/disable` | 禁用 2FA |

**Token 管理**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/token/` | Token 列表 |
| POST | `/api/token/` | 创建 Token |
| GET | `/api/token/:id` | Token 详情 |
| PUT | `/api/token/` | 更新 Token |
| DELETE | `/api/token/:id` | 删除 Token |
| POST | `/api/token/batch` | 批量删除 |

**Redemption 兑换码 (管理员)**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/redemption/` | 兑换码列表 |
| POST | `/api/redemption/` | 创建兑换码 |
| PUT | `/api/redemption/` | 更新兑换码 |
| DELETE | `/api/redemption/:id` | 删除兑换码 |

**用户管理 (管理员)**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/` | 用户列表 |
| GET | `/api/user/search` | 搜索用户 |
| GET | `/api/user/:id` | 用户详情 |
| POST | `/api/user/` | 创建用户 |
| PUT | `/api/user/` | 更新用户 |
| DELETE | `/api/user/:id` | 删除用户 |

**通道管理 (管理员)**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/channel/` | 通道列表 |
| POST | `/api/channel/` | 创建通道 |
| PUT | `/api/channel/` | 更新通道 |
| DELETE | `/api/channel/:id` | 删除通道 |
| GET | `/api/channel/test/:id` | 测试通道 |

**模型管理 (管理员)**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/models/` | 模型列表 |
| POST | `/api/models/` | 创建模型 |
| PUT | `/api/models/` | 更新模型 |
| DELETE | `/api/models/:id` | 删除模型 |

**配置选项 (Root)**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/option/` | 获取配置 |
| PUT | `/api/option/` | 更新配置 |

**性能 (Root)**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/performance/stats` | 性能统计 |
| DELETE | `/api/performance/disk_cache` | 清理磁盘缓存 |
| POST | `/api/performance/gc` | 强制 GC |

**日志**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/log/` | 所有日志 (管理员) |
| GET | `/api/log/stat` | 日志统计 |
| GET | `/api/log/self` | 个人日志 |
| GET | `/api/log/self/search` | 搜索个人日志 |

**数据看板**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data/` | 配额数据 (管理员) |
| GET | `/api/data/self` | 个人配额数据 |
| GET | `/api/data/flow` | 流量数据 (管理员) |

### 19.2 Relay 转发 API (`/v1/`)

| 方法 | 路径 | 格式 | 说明 |
|------|------|------|------|
| GET | `/v1/models` | OpenAI | 模型列表 |
| GET | `/v1/models/:model` | OpenAI | 模型详情 |
| POST | `/v1/chat/completions` | OpenAI | 对话补全 |
| POST | `/v1/completions` | OpenAI | 文本补全 |
| POST | `/v1/messages` | Claude | Claude 消息 |
| POST | `/v1/responses` | OpenAI | Responses API |
| POST | `/v1/images/generations` | OpenAI | 图像生成 |
| POST | `/v1/images/edits` | OpenAI | 图像编辑 |
| POST | `/v1/embeddings` | OpenAI | 嵌入向量 |
| POST | `/v1/audio/transcriptions` | OpenAI | 语音转文字 |
| POST | `/v1/audio/translations` | OpenAI | 语音翻译 |
| POST | `/v1/audio/speech` | OpenAI | 文字转语音 |
| POST | `/v1/rerank` | Rerank | 重排序 |
| POST | `/v1/moderations` | OpenAI | 内容审核 |
| GET | `/v1/realtime` | WebSocket | 实时通信 |
| POST | `/v1/alpha/search` | OpenAI | Alpha 搜索 |
| POST | `/v1/models/*path` | Gemini | Gemini 模型 |

---

## 20. 环境变量配置

**文件**: `.env.example`

### 20.1 核心配置

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `GIN_MODE` | Gin 模式 | release |
| `DEBUG` | 调试模式 | false |
| `NODE_TYPE` | 节点类型 | master |

### 20.2 数据库

| 环境变量 | 说明 |
|----------|------|
| `SQL_DSN` | 主数据库连接字符串 |
| `LOG_SQL_DSN` | 日志数据库连接字符串 |
| `SQLITE_PATH` | SQLite 路径 |
| `SQL_MAX_IDLE_CONNS` | 最大空闲连接 (100) |
| `SQL_MAX_OPEN_CONNS` | 最大打开连接 (1000) |
| `SQL_MAX_LIFETIME` | 连接最大生命周期 (60s) |

### 20.3 缓存

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `REDIS_CONN_STRING` | Redis 连接字符串 | 无 |
| `REDIS_POOL_SIZE` | Redis 连接池 | 10 |
| `SYNC_FREQUENCY` | 缓存同步频率(秒) | 60 |
| `MEMORY_CACHE_ENABLED` | 内存缓存 | true |

### 20.4 限流

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `GLOBAL_API_RATE_LIMIT` | 全局 API 限流 | 无 |
| `GLOBAL_WEB_RATE_LIMIT` | 全局 Web 限流 | 无 |
| `CRITICAL_RATE_LIMIT` | 关键操作限流 | 20/20分钟 |
| `UPLOAD_RATE_LIMIT` | 上传限流 | 10/分钟 |
| `DOWNLOAD_RATE_LIMIT` | 下载限流 | 10/分钟 |

### 20.5 转发

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `RELAY_TIMEOUT` | 转发超时(秒) | 0(不限制) |
| `RELAY_IDLE_CONN_TIMEOUT` | 空闲连接超时 | 90 |
| `STREAMING_TIMEOUT` | 流式超时 | 300 |
| `RETRY_TIMES` | 重试次数 | 0 |
| `TLS_INSECURE_SKIP_VERIFY` | 跳过 TLS 验证 | false |

### 20.6 安全

| 环境变量 | 说明 |
|----------|------|
| `SESSION_SECRET` | 会话密钥 |
| `CRYPTO_SECRET` | 加密密钥 |
| `SESSION_COOKIE_SECURE` | 安全 Cookie |
| `TRUSTED_PROXIES` | 可信代理 |
| `TRUSTED_REDIRECT_DOMAINS` | 可信重定向域名 |

---

## 21. 部署架构

### 21.1 Docker Compose

**文件**: `docker-compose.yml`

支持的服务（默认）：
- `new-api` — 主应用
- `postgres` — PostgreSQL 15 数据库
- `redis` — 缓存
- `mysql` (已注释) — 可选 MySQL 8.2
- `clickhouse` (已注释) — 可选 ClickHouse 日志库

### 21.2 多节点部署

**文件**: `main.go:117-153`

- 通过 `NODE_TYPE=master` 标识主节点
- 主节点负责：
  - 数据库迁移
  - 配置种子数据初始化
  - 系统定时任务
- 从节点：
  - 仅处理 API 请求
  - 定时同步策略和配置
- 节点身份上报（`service/system_instance.go`）

### 21.3 优雅关闭

**文件**: `main.go:222-238`

- 监听 SIGINT/SIGTERM 信号
- 等待 SSE 流完成（`SHUTDOWN_TIMEOUT_SECONDS`，默认 120 秒）
- 保存看板数据到数据库
- 关闭数据库连接

---

## 22. AGENTS.md 项目约定与编码规范

**文件**: `D:\Codes\new-api\AGENTS.md`（完整项目约定文档）

### 22.1 relaykit 模块独立性

`relaykit/` Go 模块必须保持独立可构建：
- 不得导入 `new-api` 根模块的包
- 不得依赖根模块配置、生成文件或 workspace 连接
- 任何改动需验证：`cd relaykit && GOWORK=off go build ./...`

### 22.2 JSON 操作规范

所有 JSON 序列化/反序列化必须使用 `common/json.go` 包装函数：
- `common.Marshal(v any) ([]byte, error)`
- `common.Unmarshal(data []byte, v any) error`
- `common.UnmarshalJsonStr(data string, v any) error`
- `common.DecodeJson(reader io.Reader, v any) error`
- 禁止在业务代码中直接调用 `encoding/json`

### 22.3 转发与供应商行为

- 新通道需确认是否支持 `StreamOptions`，若支持则加入 `streamSupportedChannels`
- 请求结构体中可选标量字段必须使用指针类型 + `omitempty`（`*int`, `*uint`, `*float64`, `*bool`）
- 保留显式零值：客户端 JSON 缺失字段 → `nil`（省略），显式 `0`/`false` → 非 `nil`（发送上游）
- 避免非指针标量 + `omitempty`（零值会被静默丢弃）

### 22.4 计费安全不变量

**文件**: `AGENTS.md:105-114`

- 计费代码**不得**因算术溢出或未验证输入产生负数扣费
- 所有用户控制的数量（图片 `n`、视频 `duration`、分辨率倍率等）必须在请求验证阶段限制上界
- 配额转换统一使用 `common/quota_math.go`：`QuotaFromFloat`（截断）/ `QuotaRound`（四舍五入）/ `QuotaFromDecimal`
- 禁止裸 `int(float64(quota) * ratio)` 转换
- 饱和事件必须通过 `*Checked` 变体审计，记录到 `admin_info.quota_saturation`
- 倍率映射通过 `types.PriceData.AddOtherRatio` 添加（拒绝非正数/NaN/+Inf）
- 预扣费和结算双重安全：超大配额必须触发"配额不足"而非静默溢出

### 22.5 层级定价表达式系统

**文件**: `AGENTS.md:103`, `pkg/billingexpr/expr.md`

涉及层级/动态计费时，必须先阅读 `pkg/billingexpr/expr.md`，了解表达式语言、架构、Token 标准化规则和版本控制。

### 22.6 后端测试质量

- 测试必须保护实际行为、API 合约、计费/会计不变量、数据兼容性或回归路径
- 禁止仅为覆盖率添加测试、伪模糊测试、重复测试
- 优先使用确定性表驱动测试（显式输入 + 精确预期输出）
- 新测试使用 `testify/require`（致命断言）和 `testify/assert`（非致命检查）

### 22.7 前端规范

- 包管理器：**Bun**（优于 npm/yarn/pnpm）
- 技术栈：React 19 + TypeScript + Rsbuild + Base UI + Tailwind CSS
- 所有 UI 文本必须支持 i18n（`i18next`/`react-i18next`）
- 详细前端规范见 `web/AGENTS.md`

### 22.8 受保护项目信息

**文件**: `AGENTS.md:143-150`

以下项目信息严格受保护，**不得修改、删除或替换**：
- **new-api** 项目名称/身份的引用
- **QuantumNous** 组织/作者身份的引用
- 包括 README、许可证头、版权声明、包元数据、HTML 标题、meta 标签、页脚、Go 模块路径、Docker 镜像名、CI/CD 引用等

---

## 总结

New API 是一个功能完备的 AI API 中转平台，具备以下核心能力：

1. **多供应商聚合**: 支持 40+ AI 供应商，统一 OpenAI 格式输出
2. **完整的权限体系**: 四级角色（游客/用户/管理员/超级管理员）+ Casbin 细粒度权限
3. **灵活的 API Key 管理**: 支持配额、过期、IP 限制、模型限制、分组隔离
4. **智能路由与负载均衡**: 多通道权重选择、自动故障转移、重试机制
5. **多级限流策略**: IP 级别、用户级别、全局级别，支持 Redis/内存两种实现
6. **完善的计费系统**: 预扣费/后结算、多级定价、订阅制、多种支付方式
7. **全面的日志审计**: 请求日志、错误日志、管理员操作审计
8. **高性能缓存**: 内存 + Redis 双层缓存，定时同步
9. **多节点部署**: 支持主从模式，配置/策略自动同步
10. **国际化支持**: 多语言 UI 和错误消息