---
name: sacrossplatform
description: 把已有的 Web 前端转成跨平台移动 App（iOS + Android）。适合 Web 版做好后要出移动端的时候使用。
---

# sacrossplatform — Web 转移动 App

## 目标

复用现有的 UI 设计和接口定义，生成一套能跑的移动端工程：页面、导航、主题、API 调用层、原生工程配置（iOS / Android）。

## 输入

- 必需：`frontend/`（前端代码）和/或 `prototype/`（原型，提取风格）；`api/openapi.yaml`（生成 API 层）。
- 可选：`STEPS.md`（项目名、工程清单）。

## 产出

- `mobile/`：移动端工程（页面、组件、主题、API 层、状态管理、导航、原生工程目录、README）。
- `STEPS.md`：追加"移动端 App"节，记录框架和平台配置。

## 硬性底线

- **复用不重写**：主题从原型的设计令牌映射，API 层从 `openapi.yaml` 生成，不要凭空另起一套。
- **Token 存安全位置**（如安全存储），生产环境不要放明文。
- **原生能力用框架桥接**，权限声明按平台自动补齐。
- 代码放 `mobile/`，和其他工程平级；多工程时按 `STEPS.md` 的映射对应。

## 交接

- 下游是 `sadeploy-mobile`（打包 .apk / .ipa）；需要相机、推送等能力时可叠 `sanative-bridge`。

## 自由发挥

- **框架选型**（React Native / Expo / uni-app / Taro / Flutter 等）：自己判断或和用户商量，原卡固定选项已删除。
- **页面迁移粒度、导航结构、组件复用程度**：自己定。
- **原生工程配置、签名、环境变量方式**：按所选框架和项目需要决定。
