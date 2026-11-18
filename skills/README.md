# Skills — 软件开发任务卡

这是一套**自包含的任务卡**，不是操作手册。每张卡只讲清楚四件事：**要做什么、吃什么输入、交出什么、哪些底线不能破**。至于具体怎么做、用什么风格、选什么技术细节——由执行的模型自己判断。

## 怎么用

1. 把 `skills/<名字>/SKILL.md` 的内容交给任意大模型（作为 system prompt、上下文文件、或直接粘贴都行）。
2. 模型读完后就知道这一环的目标、输入、产出和底线，不需要先读过别的卡。
3. 卡与卡之间只通过项目目录里的文件交接，**不依赖模型记住上一轮对话**。

## 设计原则

- **自包含**：每张卡独立可读，谁拿到都能开工。
- **不绑工具**：没有斜杠命令、没有特定工具的弹窗 API、没有固定话术。触发方式由使用者自己决定。
- **留白**：卡片明确写出"哪些由你自行判断"，不替模型做设计决策。
- **有底线**：真正影响安全、一致性、协作的规矩保留，其余一刀砍掉。

## 任务卡结构

```markdown
---
name: <skill 名>
description: <一句话说明用途和何时使用，不含 "Invoke when" 或斜杠命令>
---

# <skill 名> — <一句话定位>

## 目标
<2-4 句说清这一环要达成什么>

## 输入
<这一环开工前需要什么；标出必需/可选，以及从哪来>

## 产出
<这一环结束后多出/改掉哪些文件>

## 硬性底线
<不可破的规矩，逐条列出；没有就写「无」>

## 交接
<往 STEPS.md 写什么字段、下游是谁>

## 自由发挥
<明确列出哪些由执行者自行判断>
```

## 项目目录约定

所有卡共用同一个项目目录结构（这是唯一不许各写各的地方）：

```
<project>/
├── STEPS.md          # 跨环节共享记忆：项目信息、各阶段决策、修改记录
├── README.md
├── prototype/        # HTML 原型（sainit-* 产出）
├── frontend/         # Web 前端（safrontend 产出）
├── admin/            # 管理后台（saadmin 产出）
├── api/              # 接口规范（saapi 产出）
├── backend/          # 后端服务（sabackend 产出）
├── mobile/           # 移动 App（sacrossplatform 产出，可选）
├── desktop/          # 桌面应用（sadesktop 产出，可选）
└── inference/        # AI 推理接入（sainference 产出，可选）
```

多角色项目可拆分为 `prototype-web/`、`prototype-console/`、`prototype-admin/` 等，对应 `frontend-*`、`backend-*`。`STEPS.md` 里记一笔"工程清单"和"目录映射"，下游照着读即可。

## 链路全景

```
sainit ──► sainit-*（原型）──► safrontend ──► saapi ──► sabackend ──► saadmin ──► saapi-connect
  路由          │                                                                        │
               └─► 设计迭代（视觉/配色/交互，可选，可反复）                                    │
                                                                                         ▼
                                                              ┌──────────────────────────┼──────────────┐
                                                              ▼                          ▼              ▼
                                                         sadeploy                 sacrossplatform    sadesktop
                                                         (Web 部署)                    │                 │
                                                                                       ▼                 ▼
                                                                              sadeploy-mobile   sadeploy-desktop
                                                                                 (打包 .apk)       (打包 .exe)

扩展：saapi-platform（平台级 API）──► sainference（模型接入）
辅助：sanative-bridge（相机/定位/推送等原生能力）
```

## 卡片清单

| 卡 | 定位 | 前置 | 主要产出 |
|----|------|------|---------|
| `sainit` | 项目类型识别与分流 | 用户的一句话描述 | 路由建议 |
| `sainit-dating` | 交友/社交原型 | 项目描述 | `prototype/`、`STEPS.md` |
| `sainit-shop` | 电商/商城原型 | 项目描述 | `prototype/`、`STEPS.md` |
| `sainit-blog` | 博客/内容原型 | 项目描述 | `prototype/`、`STEPS.md` |
| `sainit-tool` | 工具/效率原型 | 项目描述 | `prototype/`、`STEPS.md` |
| `sainit-saas` | SaaS/API 平台原型 | 项目描述 | `prototype-*/`、`STEPS.md` |
| `sainit-other` | 通用原型兜底 | 项目描述 | `prototype/`、`STEPS.md` |
| `safrontend` | 原型转前端代码 | `prototype/` | `frontend/` |
| `saapi` | 接口设计 | `prototype/`、`frontend/` | `api/` |
| `sabackend` | 接口落地为后端 | `api/openapi.yaml` | `backend/` |
| `saadmin` | 管理后台 | `api/` 中的 Admin 接口 | `admin/` |
| `saapi-connect` | 前后端接通 | `frontend/`、`admin/`、`backend/` | 改写三端配置文件 |
| `saapi-platform` | 平台级 API 设计 | API 平台类项目 | `api/platform-*.yaml` |
| `sainference` | AI 模型接入 | `api/gateway-spec.yaml` | `inference/` |
| `sacrossplatform` | Web 转移动 App | `frontend/` | `mobile/` |
| `sadesktop` | Web 转桌面应用 | `frontend/` | `desktop/` |
| `sanative-bridge` | 原生能力封装 | `mobile/` 或 `desktop/` | `*/src/native/` |
| `sadeploy` | Web 全栈部署 | 完整 Web 项目 | `deploy/` |
| `sadeploy-mobile` | App 打包 | `mobile/` | 构建脚本 |
| `sadeploy-desktop` | 桌面应用打包 | `desktop/` | 构建脚本 |

## 关于 STEPS.md

`STEPS.md` 是整套流程的**共享记忆**——不同模型、不同工具接力时，靠它传递项目名、技术选型、功能清单、改动记录。每张相关卡片都会在"交接"一节写明自己往里写什么、从里读什么。格式不强制固定表格，但**字段语义要保持一致**，下游才读得懂。
