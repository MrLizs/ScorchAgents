---
name: saapi
description: 从原型和前端代码反推项目需要哪些接口，生成 OpenAPI 3.0 规范、人话接口文档和 mock 数据。适合前后端开工前先把接口约定写清楚的时候使用。
---

# saapi — 接口设计

## 目标

看一遍 `prototype/` 和 `frontend/`，把页面里的表单、列表、登录、详情等行为翻译成一份接口清单，写成机器能读的 OpenAPI 规范 + 人能读的说明文档 + 测试用的假数据。

## 输入

- 必需：`prototype/` 和/或 `frontend/`（至少有一个，否则无从反推）。
- 可选：`STEPS.md`（项目名、类型、功能清单）、用户补充的接口需求（第三方 SDK、后台模块等）。

## 产出

- `api/openapi.yaml`：OpenAPI 3.0 规范。
- `api/API.md`：人话接口文档。
- `api/mock-data.json`：示例数据。
- `STEPS.md`：追加"API 设计"节，记录接口统计、技术栈偏好、后台模块清单。

## 硬性底线

- 接口路径统一以 `/api/v1/` 开头，风格用 REST（GET/POST/PUT/PATCH/DELETE），认证用 JWT（access + refresh）。这几条是下游 `sabackend` / `saapi-connect` 的约定，不要改。
- 只写 `api/` 下这三个文件，不改动其他目录。
- 接口要覆盖前端实际用到的数据操作；发现遗漏时以页面行为为准补上。
- `STEPS.md` 里记下项目中文名和英文名——`sabackend` 要用中文名推导数据库表前缀。

## 交接

- 下游是 `sabackend`（按本卡产出的 `openapi.yaml` 实现后端）和 `saadmin`（按 Admin 接口生成后台）。
- API 平台类项目可再叠 `saapi-platform`，在 `api/` 下追加平台级规范文件。

## 自由发挥

- **接口怎么拆、资源怎么命名、字段怎么设计**：从页面推导，自己定。
- **基础 URL、API 标题、要不要第三方集成、要不要管理后台接口**：问用户或直接判断均可。
- **文档详略、示例数据内容、错误码设计**：自己决定。
- **`STEPS.md` 里的具体小节标题和表格样式**：只要字段语义在，格式随意。
