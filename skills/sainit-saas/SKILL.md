---
name: sainit-saas
description: 生成 SaaS / API 平台类 Web 产品原型（落地页 + 控制台 + 管理后台等）。适合用户想做开发者平台、AI 模型平台、开放平台并先看原型的时候使用。
---

# sainit-saas — SaaS/API 平台项目初始化

## 目标

根据用户描述，产出一个能点、能跳的 HTML 原型，覆盖平台类产品的典型角色和页面：公众落地页、开发者控制台、Playground、API Key 管理、计费、文档、管理后台等。

同族的卡还有 `sainit-dating` / `sainit-shop` / `sainit-blog` / `sainit-tool` / `sainit-other`；这张带平台类产品的常见页面底子。

## 输入

- 必需：项目描述。
- 可选：用户点名的角色、功能、风格偏好。

## 产出

- `prototype/`（单角色）或 `prototype-web/`、`prototype-console/`、`prototype-admin/`（多角色），每个工程有页面和 `assets/`。
- `README.md`：项目说明 + 页面清单 + 怎么预览。
- `STEPS.md`：写入项目元信息，多角色时记下"工程清单/目录映射"（见"交接"）。

## 硬性底线

- 每个按钮和链接点了必须有反应——跳页面、弹提示、或切换状态，不要死链。
- 平台主流程要能走通：注册 → 控制台 → 创建 Key → 调用/Playground → 看用量计费，哪怕用 localStorage 模拟。
- 不同角色看到的页面完全不同时（不同导航、功能、登录方式），按角色拆成独立工程目录，并在 `STEPS.md` 记"工程清单"和"目录映射"；下游卡按这个映射逐工程生成代码。
- `STEPS.md` 必须写"项目元信息"节，至少包含：项目名（中英文）、项目类型（saas）、功能清单、页面清单、Tab 配置。字段是下游卡的共同输入，名字不要改。

## 交接

- 写完 `STEPS.md` 后，下游通常是 `safrontend`（按工程清单逐工程生成）；之后可叠 `saapi-platform`（平台级 API）和 `sainference`（模型接入）。
- `safrontend` / `saapi` / `sabackend` / `saapi-connect` 都从 `STEPS.md` 读元信息和工程映射。

## 自由发挥

- **UI 风格**：不设固定 5 选 1。自己按平台调性定，或问用户。
- **功能取舍**：落地页、控制台、Playground、API Key、计费、文档、模型管理等等，从描述推导或商量，不必套预设清单。
- **是否拆工程、怎么拆**：按角色自行判断，不套固定反问。
- **页面划分、Tab、导航、技术细节、要不要问用户**：全部自行判断。
