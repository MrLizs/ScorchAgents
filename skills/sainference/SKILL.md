---
name: sainference
description: 为 API 平台接入大模型能力：对接第三方 AI 供应商或自建推理引擎，配置模型注册表、路由和容灾。适合平台要真正能调模型的时候使用。
---

# sainference — AI 模型接入

## 目标

让平台的推理端点能真正调到模型：接好上游供应商（或自建引擎），建一张模型注册表（模型 ID → 供应商 → 定价），配好路由和多供应商容灾，把上游配置同步给网关。

## 输入

- 必需：`api/gateway-spec.yaml`（由 `saapi-platform` 产出；本卡会往里填 upstreams）。
- 可选：`STEPS.md`、用户指定的供应商和模型。

## 产出

- `inference/.env.example`：上游 API Key 环境变量模板。
- `inference/models/registry.yaml`：模型注册表。
- `inference/router/config.yaml`：模型路由表。
- `inference/README.md`：接入说明。
- 回填 `api/gateway-spec.yaml` 的 upstreams 部分。
- `STEPS.md`：追加"AI 模型接入"节。

## 硬性底线

- **默认对接第三方供应商**（省 GPU），自建 vLLM / Ollama 只作为可选模式。
- **上游 Key 放环境变量**（`.env`），不硬编码、不提交 Git；模板里只放占位符。
- **兼容 OpenAI 格式的上游直接透传**，网关不解包、不改格式，SSE 流式直接 pipe 到客户端；非兼容的上游用一层轻量适配。
- **同一模型可配多供应商**：主供应商挂了自动切备用，用优先级字段标注（数字越小越先）。
- **改动网关规格时只填 upstreams 部分**，不重写 `saapi-platform` 的其他定义。

## 交接

- 上游是 `saapi-platform`（提供网关规格），下游是 `sabackend`（实现网关时读取这些配置）。

## 自由发挥

- **接哪些供应商、哪些模型、定价、超时时间、容灾策略**：按项目需要和用户意愿定，原卡的供应商清单只是举例。
- **自建推理的部署方式**、**适配层怎么写**：自行决定。
- **配置文件结构和命名**：语义清楚即可。
