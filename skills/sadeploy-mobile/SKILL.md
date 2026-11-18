---
name: sadeploy-mobile
description: 把移动端工程打包成安装包（Android .apk、iOS .ipa），生成构建脚本和签名配置说明。适合移动 App 开发完成要出包的时候使用。
---

# sadeploy-mobile — 移动 App 打包

## 目标

根据 `mobile/` 用的框架，生成能出安装包的构建脚本（Android 和/或 iOS），说明需要哪些环境和签名材料。

## 输入

- 必需：`mobile/`（由 `sacrossplatform` 产出）。
- 可选：`STEPS.md`（框架和平台配置）。

## 产出

- `mobile/build.sh`（或对应平台的脚本）：构建脚本。
- `STEPS.md`：追加"移动端打包"节，记录产物清单和状态。

## 硬性底线

- 脚本要说明平台限制——比如 iOS 打包必须在 macOS + Xcode 上、需要开发者账号，别给出在 Windows 上无法执行的假方案。
- 签名密钥、账号密码等敏感信息不写死在脚本里，用环境变量或占位符。

## 交接

- 这是移动端链路的终点。上游是 `sacrossplatform`。

## 自由发挥

- **打包哪些平台、用什么脚本**：按用户需要定，原卡按框架列死的脚本模板已删除。
- **输出路径、版本号、签名方式**：按项目决定。
