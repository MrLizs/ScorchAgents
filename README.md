# ScorchAgents

基于 Skill 体系的 AI Agent 全栈项目开发工具链。

## 核心链路

从零到完整 Web 应用，只需 5 步：

```
/sainit-*  ──►  /safrontend  ──►  /saapi  ──►  /sabackend  ──►  /saapi-connect
  原型            Web 前端         API 设计        后端实现         前后端接通
```

| 步骤 | Skill | 功能 | 产出 |
|------|-------|------|------|
| 1 | `/sainit-*` | 生成可交互的 HTML 原型，确定 UI 风格、功能清单、页面结构 | `prototype/` + `STEPS.md` |
| 2 | `/safrontend` | 原型转为 Vue 3 / React 18 前端项目，含路由、状态管理、API 脚手架 | `frontend/` |
| 3 | `/saapi` | 扫描前端代码 + 原型反推接口，生成 OpenAPI 3.0 规范 | `api/openapi.yaml` + `api/API.md` |
| 4 | `/sabackend` | 按 OpenAPI 规范实现后端服务，含数据库建表、业务逻辑 | `backend/` + `sql/init.sql` |
| 5 | `/saapi-connect` | 替换 mock 认证为真实后端调用，注入 JWT、全局错误处理、Vite proxy + CORS | 修改 `frontend/src/api/`、`frontend/.env` |

> 核心链路跑完 = 一个完整的 Web 应用（前端 + 后端 + 数据库），可直接部署上线。

### 初始化类型

`/sainit` 根据项目描述自动路由到对应的子 skill：

| 关键词 | 类型 | 子 Skill |
|--------|------|---------|
| 交友 / 社交 / 聊天 / 匹配 | dating | `/sainit-dating` |
| 商城 / 电商 / 购物 / 订单 | shop | `/sainit-shop` |
| 博客 / 文章 / 资讯 / 笔记 | blog | `/sainit-blog` |
| 待办 / 记账 / 工具 / 效率 | tool | `/sainit-tool` |
| SaaS / API 平台 / 开发者平台 | saas | `/sainit-saas` |
| 未匹配 / 跨类型 | other | `/sainit-other` |

### 设计迭代（可选，在 Step 1 和 Step 2 之间）

原型生成后，可用以下设计 skill 优化视觉风格，**可链式循环**：

- `frontend-design` — 高保真 UI 重做
- `color-font-skill` — 配色 + 字体调优
- `ui-ux-pro-max` — UI/UX 设计智能
- `frontend-dev` — 全栈前端（含 motion + 媒体）
- `design-style-skill` — PPT/视觉风格统一

## 扩展链路

### API 平台扩展

```
/saapi-platform  ──►  /sainference
  平台级 API             AI 模型推理集成
```

- `/saapi-platform` — API Key 管理、SSE 流式响应、按量计费、OpenAI 兼容端点
- `/sainference` — 对接阿里云百炼 / 硅基流动 / DeepSeek / OpenAI 等 AI 供应商

### 跨平台交付

```
/sacrossplatform  ──►  /sanative-bridge
  iOS + Android         原生能力封装

/sadesktop  ──►  /sanative-bridge
  Win + Mac + Linux     原生能力封装
```

- `/sacrossplatform` — Web 前端 → React Native / Expo / uni-app / Taro 移动 App
- `/sadesktop` — Web 前端 → Electron / Tauri 桌面应用
- `/sanative-bridge` — 相机、推送、定位、文件系统、生物识别等原生能力封装

## 完整全景图

```
                    ┌─ frontend-design ──────┐
                    ├─ color-font-skill ─────┤
/sainit-* ──Step 7─►├─ ui-ux-pro-max ────────┼──► /safrontend ──► /saapi ──► /sabackend ──► /saapi-connect
  原型              ├─ frontend-dev ─────────┤     Web 前端       API 设计    后端实现      前后端接通
                    ├─ design-style-skill ───┘
                    └─ F. 直接进 safrontend ─┘
                                                               │
                                    ┌──────────────────────────┼──────────────────────────┐
                                    ▼                          ▼                          ▼
                            /saapi-platform              /sacrossplatform             /sadesktop
                            平台级 API                   移动 App (iOS+Android)      桌面应用 (Win+Mac+Linux)
                                    │                          │                          │
                                    ▼                          ▼                          ▼
                            /sainference                /sanative-bridge           /sanative-bridge
                            AI 模型集成                  原生能力封装                 原生能力封装
```

## 项目目录结构

```
<project-name>/
├── README.md
├── STEPS.md                 # 步骤追踪（所有 skill 共用）
├── prototype/               # 原型设计（/sainit-* 产出）
├── frontend/                # 前端代码（/safrontend 产出）
├── api/                     # API 规范（/saapi 产出）
│   ├── openapi.yaml
│   └── API.md
├── backend/                 # 后端服务（/sabackend 产出）
│   ├── sql/
│   │   └── init.sql
│   └── src/
├── mobile/                  # 移动 App（/sacrossplatform 产出，可选）
├── desktop/                 # 桌面应用（/sadesktop 产出，可选）
└── inference/               # AI 推理集成（/sainference 产出，可选）
```

## 安装与使用

1. 克隆本仓库
2. 在对话中输入 `/sainit <项目描述>` 开始
3. 按上述核心链路逐步执行

## 参与贡献

1. Fork 本仓库
2. 创建 Feat 分支
3. 提交代码
4. 新建 Pull Request