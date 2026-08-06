---
name: "sadeploy-mobile"
description: "移动 App 打包构建：基于 /sacrossplatform 生成的移动端项目，生成 Android .apk 和 iOS .ipa 构建脚本。Invoke when 用户输入 /sadeploy-mobile 或 sacrossplatform 完成后需要打包移动 App。"
---

# /sadeploy-mobile — 移动 App 打包构建

## 什么是移动端打包？

跨平台框架（React Native / Expo / uni-app / Taro）开发完成后，需要编译成手机能安装的安装包：
- Android → `.apk`（可直接安装）或 `.aab`（上传 Google Play）
- iOS → `.ipa`（通过 TestFlight 或 App Store 分发）

这个 skill 的工作就是：**生成对应平台的构建脚本，一键打包出可安装的 App。**

## 触发条件

- 用户输入 `/sadeploy-mobile` 或 `/sadeploy-mobile <项目目录>`
- **自动触发**：sacrossplatform 完成后，询问用户下一步时选「打包构建」
- **前置条件**：
  - `mobile/` 已存在（来自 `/sacrossplatform`）
  - `STEPS.md` 已存在（项目元信息）

## 核心原则

1. **读取项目上下文**：从 `STEPS.md` 获取移动端框架类型
2. **仅打包构建**：不涉及应用商店上架、代码签名等
3. **生成脚本**：按框架生成对应的构建命令
4. **步骤追踪**：写入 `STEPS.md`

## 工作流程

### Step 0：读取项目上下文

从 `STEPS.md` 提取移动端框架信息：

| 框架 | 检测方式 | 构建命令 |
|------|---------|---------|
| React Native | `mobile/package.json` 含 `react-native` | `npx react-native build` |
| Expo | `mobile/package.json` 含 `expo` | `eas build` |
| uni-app | `mobile/package.json` 含 `@dcloudio/uni-app` | `npm run build:app-plus` |
| Taro | `mobile/package.json` 含 `@tarojs/cli` | `npm run build:weapp` 等 |

### Step 1：生成构建脚本

根据检测到的框架，生成 `mobile/build.sh` 和 `mobile/build.ps1`：

#### React Native

```bash
#!/bin/bash
# mobile/build.sh — React Native 打包脚本

echo "📱 <项目中文名> Android 打包..."
cd android
./gradlew assembleRelease
echo "✅ APK 输出：android/app/build/outputs/apk/release/app-release.apk"

echo "📱 <项目中文名> iOS 打包..."
cd ../ios
# iOS 需要在 macOS 上使用 Xcode 构建
xcodebuild -workspace <ProjectName>.xcworkspace -scheme <ProjectName> -configuration Release archive -archivePath ./build/<ProjectName>.xcarchive
# 导出 .ipa 需要 Apple Developer 账号
echo "⚠️ iOS 打包请在 Xcode 中完成 Archive → Distribute App"
```

#### Expo

```bash
#!/bin/bash
# mobile/build.sh — Expo 打包脚本

echo "📱 <项目中文名> Expo 打包..."

# Android
echo "📦 构建 Android..."
npx eas build --platform android --profile production

# iOS
echo "📦 构建 iOS..."
npx eas build --platform ios --profile production

echo "✅ 构建完成！请在 Expo Dashboard 查看构建结果"
```

#### uni-app

```bash
#!/bin/bash
# mobile/build.sh — uni-app 打包脚本

echo "📱 <项目中文名> uni-app 打包..."

# H5
echo "📦 构建 H5..."
npm run build:h5

# Android（需要 HbuilderX 或离线打包）
echo "📦 构建 Android..."
npm run build:app-plus

# 微信小程序
echo "📦 构建微信小程序..."
npm run build:mp-weixin

echo "✅ 构建完成！"
echo "  H5：dist/build/h5/"
echo "  Android：dist/build/app-plus/"
echo "  微信小程序：dist/build/mp-weixin/"
```

#### Taro

```bash
#!/bin/bash
# mobile/build.sh — Taro 打包脚本

echo "📱 <项目中文名> Taro 打包..."

echo "📦 构建 H5..."
npm run build:h5

echo "📦 构建微信小程序..."
npm run build:weapp

echo "✅ 构建完成！"
echo "  H5：dist/"
echo "  微信小程序：dist/"
```

### Step 2：写入 STEPS.md

```markdown
---

## 📱 移动端打包构建（基于 /sadeploy-mobile skill）

> 构建时间：YYYY-MM-DD HH:mm
> 框架：<React Native / Expo / uni-app / Taro>
> 产出目录：`mobile/build/`

### 📁 构建脚本

| 文件 | 用途 |
|------|------|
| `mobile/build.sh` | macOS/Linux 构建脚本 |
| `mobile/build.ps1` | Windows 构建脚本 |

### ✅ 构建状态

- [x] 构建脚本已生成
- 首次构建：⏭ 待执行

### 📝 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| YYYY-MM-DD HH:mm | 移动端打包 | 生成构建脚本 |
```

### Step 3：输出结果

```
✅ 移动端打包脚本已生成！

📁 文件：
   • mobile/build.sh（macOS/Linux）
   • mobile/build.ps1（Windows）

🚀 下一步：
   cd mobile
   ./build.sh    # 执行打包

📦 产物位置：
   Android：mobile/build/android/
   iOS：mobile/build/ios/（需在 macOS + Xcode 完成）
```

## 关联 Skill

- `sacrossplatform` — 前置（生成移动端项目）
- `sanative-bridge` — 前置（原生能力封装）

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-08-06-1 | 初版：支持 React Native / Expo / uni-app / Taro 四种框架的打包脚本生成 |