---
name: saapi-platform
description: 为 API 平台 / MaaS 类项目补充平台级接口设计：API Key、OpenAI 兼容端点、SSE 流式、按量计费、网关中间件、模型管理。适合普通接口之外还要开放给开发者调用的时候使用。
---

# saapi-platform — 平台级 API 设计

## 目标

在 `saapi` 产出的消费者端接口之外，再设计一套给开发者用的平台级接口：申请 Key、按 OpenAI 格式调用模型、流式返回、按 token 计费、网关处理链路。

## 输入

- 必需：API 平台类项目（有对外开放的接口或模型能力）。
- 可选：`api/openapi.yaml`（消费者端接口，只读）、`STEPS.md`。

## 产出

- `api/platform-openapi.yaml`：平台端接口规范。
- `api/PLATFORM_API.md`：人读文档。
- `api/platform-mock-data.json`、`api/streaming-extensions.yaml`（流式扩展定义）、`api/gateway-spec.yaml`（网关中间件规格）。
- `STEPS.md`：追加"API 平台接口"节。

## 硬性底线

- **两套鉴权分开**：控制台登录用用户 JWT，开发者程序调用用 API Key，互不混用；有后台时再加 Admin JWT。
- **API Key 安全**：数据库只存哈希值（如 sha256），明文只在创建时返回一次；Key 格式自行定。
- **推理端点兼容 OpenAI 格式**（如 `/v1/chat/completions`），不带普通接口的 `/api` 前缀，降低开发者迁移成本。
- **推理端点同时支持流式和非流式**（`stream: true/false`），流式用 SSE（`text/event-stream`）。
- **计费精确到 token**，金额精度到小数点后 4 位；余额扣费要考虑并发（行锁或事务重试）。
- **网关链路**：Key 验证 → 限流 → 配额 → 计量 → 计费 → 路由，顺序别乱。
- **不动 `saapi` 产出的消费者端文件**，只在 `api/` 下新增平台文件。

## 交接

- 下游是 `sabackend`（按平台规范实现网关和接口）、`sainference`（填 `api/gateway-spec.yaml` 的上游供应商）。

## 自由发挥

- **Key 格式、配额策略、套餐设计、限流参数、错误码**：自己定。
- **计费模式细节**（预充值 / 订阅 / 混合）、**模型管理接口范围**：按项目需要设计。
- **文档详略、YAML 结构**：自己决定，语义清楚即可。
