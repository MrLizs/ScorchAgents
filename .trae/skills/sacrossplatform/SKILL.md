---
name: "sacrossplatform"
description: "将已有的 Web 前端代码转化为跨平台移动 App（React Native / Expo / uni-app / Taro），复用 safrontend 的 UI 设计与 saapi 的接口规范，生成 iOS + Android 双端可运行的原生应用。Invoke when 用户输入 /sacrossplatform 或要求将 Web 项目打包为 App。"
---

# /sacrossplatform — Web 转跨平台移动 App

## 什么是跨平台 App？

Web 前端（`safrontend` 产出）只能在浏览器里跑。如果你想把它变成一个**真正能上架应用商店的手机 App**（iOS + Android），就需要跨平台框架来"翻译"——用一套代码同时生成 iOS 和 Android 的原生应用。

这个 skill 的工作就是：**基于已有的 frontend/ 代码和 api/ 接口规范，选择跨平台框架，生成可打包为 .apk / .ipa 的移动应用项目。**

## 触发条件

- 用户输入 `/sacrossplatform` 或 `/sacrossplatform <项目目录>`
- **前置条件**：
  - `prototype/` 已存在（来自 `/sainit-*`）
  - `frontend/` 已存在（来自 `/safrontend`），至少用于提取 UI 风格与组件设计
  - `api/openapi.yaml` 已存在（来自 `/saapi`），用于生成 API 调用层

## 与其他 skill 的关系

```
/sainit-* ──► /safrontend ──► /saapi ──► /sabackend ──► /saapi-connect
   原型         Web 前端       API 规范     后端实现       前后端接通
                                                           │
                              /sacrossplatform（本 skill）◄─┘
                                    │
                              生成 iOS + Android App
```

> 📌 **本 skill 可与 safrontend / sabackend 并行执行**，但依赖 `api/openapi.yaml`（接口规范）和 `prototype/`（UI 风格）。

## 核心原则

1. **复用，不重写**：读取 `prototype/` 的 UI 风格（tokens.css 色系、组件样式）和 `api/openapi.yaml` 的接口定义，映射到移动端
2. **框架选择**：每次启动时由用户选择（4 预设 + 自定义）
3. **存放位置**：`mobile/` 目录，与 `frontend/`、`backend/` 平级
4. **API 层共享**：从 `api/openapi.yaml` 自动生成移动端 API 调用代码（类型安全的网络层）
5. **原生能力**：相机、相册、推送、定位、文件系统等使用框架原生桥接
6. **步骤追踪**：在项目根目录 `STEPS.md` 追加「移动端 App」章节

## 产出文件结构

```
<project-name>/
├── prototype/                     ← /sainit-* 产出（只读，提取 UI 风格）
├── frontend/                      ← /safrontend 产出（只读，提取组件设计）
├── api/                           ← /saapi 产出（只读，接口规范）
├── backend/                       ← /sabackend 产出（只读，后端服务）
└── mobile/                        ← 本 skill 产出
    ├── package.json
    ├── app.json / app.config.ts   框架配置
    ├── src/
    │   ├── App.tsx / App.vue
    │   ├── screens/               页面（对应 prototype 的 HTML）
    │   ├── components/            移动端组件（对应 safrontend 的组件）
    │   ├── api/                   从 openapi.yaml 生成的 API 调用层
    │   ├── stores/                状态管理（对应 safrontend stores）
    │   ├── navigation/            导航/Tab 配置（对应 prototype Tab）
    │   ├── theme/                 设计令牌（从 tokens.css 映射）
    │   └── utils/
    ├── ios/                       iOS 原生工程（自动生成）
    ├── android/                   Android 原生工程（自动生成）
    └── README.md
```

---

## 工作流程（严格按顺序）

### Step 0：前置检查

#### 0.1 读取项目元信息

从 `STEPS.md` 提取：

| 字段 | 来源 | 用途 |
|------|------|------|
| 项目名（中/英文） | 「项目元信息」节 | App 名称、bundle ID |
| 项目类型 | 「项目元信息」节 | 推断 App 需要的原生权限 |
| UI 风格 | 「项目元信息」节 | 设计令牌映射 |
| 生成的页面 | 「项目元信息」节 | 移动端页面清单 |
| Tab 配置 | 「项目元信息」节 | 底部导航栏 |

#### 0.2 读取前端框架信息

从 `STEPS.md` 或 `frontend/package.json` 检测：

| 检测到 | 推荐跨平台框架 | 理由 |
|-------|-------------|------|
| Vue 3 + Vant | **uni-app** | 复用 Vue 语法，生态一致 |
| Vue 3 + Element Plus | **uni-app** | 同上 |
| React 18 + Ant Design Mobile | **React Native + Expo** | 复用 React 生态 |
| React 18 + Taro UI | **Taro** | 京东出品，React 语法 + 小程序 |
| React 18 + Ant Design | **React Native + Expo** 或 **Taro** | 取决于是否需要小程序 |

输出确认：
```
🔍 读取项目信息：
   • 项目名：<中文名>（英文：<en>）
   • 前端框架：<Vue 3 | React 18>
   • UI 风格：<A/B/C/D/E>
   • 页面数：N 个，Tab 数：M 个
   ✅ 已加载，将推荐对应跨平台框架
```

### Step 1：选择跨平台框架

使用 `AskUserQuestion`，**根据 Step 0.2 检测结果动态推荐**：

#### 1.1 框架对比

| 维度 | **uni-app** | **React Native + Expo** | **Taro** | **Flutter** |
|------|-----------|----------------------|----------|------------|
| **语言** | Vue 3（也支持 React） | React / TypeScript | React / Vue 3 | Dart |
| **性能** | 接近原生（JS 桥） | 原生渲染 | 接近原生 | 原生性能 |
| **小程序支持** | ✅ 微信/支付宝/抖音… | ❌ | ✅ 微信/支付宝/抖音… | ❌ |
| **Web 端** | ✅ H5 同步输出 | ❌（需单独 Web 项目） | ✅ H5 同步输出 | ✅ Web |
| **学习曲线** | 低（Vue 开发者直接上手） | 中 | 低（React/Vue 开发者上手快） | 高（需学 Dart） |
| **国内生态** | 非常活跃（DCloud） | 一般 | 活跃（京东） | 一般（Google） |
| **热更新** | ✅ 内置 | ✅ Expo Updates | ✅ | ❌（政策受限） |
| **适用场景** | 国内项目、需要小程序 | 海外项目、纯 App | 国内项目、需要小程序 | 高要求 UI、跨全平台 |

#### 1.2 提问话术

> 📌 **AI 根据 Step 0.2 检测结果动态组织选项**，示例（检测到 Vue 3）：

> 请选择跨平台框架：
> - **A. uni-app**（推荐，你已有 Vue 3 代码，可直接复用语法与组件）
>   - 大白话：用 Vue 写 App，一键生成 iOS + Android + 小程序 + H5
>   - 适合：国内项目、需要微信小程序
> - **B. React Native + Expo**（推荐，性能接近原生，海外生态好）
>   - 大白话：用 React 写真正的原生 App，不是 WebView
>   - 适合：海外项目、不需要小程序、追求原生体验
>   - ⚠️ 你的前端是 Vue 3，选此项需要迁移到 React 语法
> - **C. Taro**（推荐，React/Vue 都支持，小程序能力强）
>   - 大白话：京东出的跨端框架，一套代码跑 App + 小程序 + H5
>   - 适合：国内项目、必须有小程序
> - **D. Flutter**（Google 官方，性能最强）
>   - 大白话：用 Dart 语言写，性能最接近原生，UI 高度自定义
>   - 适合：对性能和 UI 有极高要求的项目
>   - ⚠️ 需学新语言 Dart，与现有 Vue/React 代码无法复用
> - **E. 其他**（如 Ionic、Quasar、NativeScript，请说明）

#### 1.3 追问小程序需求

> 是否需要同时生成微信小程序？
> - **A. 是**（推荐 uni-app 或 Taro，H5 + App + 小程序一套代码）
> - **B. 否**（所有框架均可）

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| YYYY-MM-DD | Step 1：跨平台框架选择 | ✅ |
  - 选定：<uni-app | React Native + Expo | Taro | Flutter>
  - 小程序需求：<是 / 否>
  - 目标平台：<iOS + Android | iOS + Android + 微信小程序 + H5>
```

### Step 2：初始化 `mobile/` 项目

#### 2.1 按所选框架生成脚手架

**A. uni-app（Vue 3）**：
```bash
npx degit dcloudio/uni-preset-vue#vite mobile
cd mobile && npm install
# 安装跨端 API 封装
npm install @dcloudio/uni-app @dcloudio/uni-ui
```

**B. React Native + Expo**：
```bash
npx create-expo-app@latest mobile --template blank-typescript
cd mobile && npx expo install expo-router react-native-screens react-native-safe-area-context
# 安装常用原生模块
npx expo install expo-camera expo-image-picker expo-location expo-notifications expo-file-system
```

**C. Taro（React 18）**：
```bash
npm install -g @tarojs/cli
taro init mobile
# 选择 React + TypeScript 模板
cd mobile && npm install
```

**D. Flutter**：
```bash
flutter create --org com.<project> mobile
cd mobile && flutter pub add dio flutter_secure_storage go_router
```

#### 2.2 创建目录结构

按框架约定创建 `mobile/src/screens/`、`mobile/src/components/`、`mobile/src/api/`、`mobile/src/stores/`、`mobile/src/theme/`、`mobile/src/navigation/`。

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| YYYY-MM-DD | Step 2：mobile/ 项目脚手架 | ✅ |
  - 框架：<名称>@<版本>
  - 已安装原生模块：<列表>
  - 目录结构：<mobile/src/...>
```

### Step 3：设计令牌映射（prototype tokens.css → mobile 主题）

> 📌 **核心：复用它**。不重新设计色系/圆角/阴影，从 prototype 的 `tokens.css` 直接映射。

#### 3.1 读取设计令牌

从 `prototype/assets/css/tokens.css` 提取 CSS 变量，映射到目标框架：

| CSS 变量 | uni-app (Vue) | React Native | Taro | Flutter |
|----------|--------------|-------------|------|---------|
| `--primary` | `uni.scss` `$primary` | `theme.ts` `colors.primary` | `app.config.ts` | `ThemeData.primaryColor` |
| `--bg` | 同上 | `colors.background` | 同上 | `scaffoldBackgroundColor` |
| `--text` | 同上 | `colors.text` | 同上 | `textTheme` |
| `--radius` | 同上 | `borderRadius` | 同上 | `borderRadius` |
| `--shadow` | 同上 | `elevation` / `shadowColor` | 同上 | `elevation` |

#### 3.2 生成主题文件

**Expo/React Native 示例**（`mobile/src/theme/index.ts`）：
```ts
// 自动从 prototype/assets/css/tokens.css 映射生成
export const theme = {
  colors: {
    primary: '#FF6B9D',
    primarySoft: '#FFE4ED',
    accent: '#4ECDC4',
    background: '#FAFAFC',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSub: '#6B7280',
    border: '#F1F1F4',
    price: '#FF4D2E',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 16, lg: 24 },
  // 响应式断点（从 tokens.css 同步）
  breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 },
};
```

**📝 本步完成后立即写入 STEPS.md**

### Step 4：页面迁移（prototype HTML → mobile screens）

#### 4.1 页面映射规则

| prototype | mobile/ 文件 | 说明 |
|-----------|-------------|------|
| `index.html`（登录） | `screens/LoginScreen.tsx` | 登录页独立 Screen |
| `home.html`（首页+Tab） | `screens/HomeScreen.tsx` | Tab 页面 |
| `*.html`（子页面） | `screens/<PageName>Screen.tsx` | 子页面 |
| Tab 页面 | `navigation/TabNavigator.tsx` | 底部 Tab 导航 |

#### 4.2 页面生成规则

- **布局结构**：从 prototype HTML 读取 DOM 结构 → 映射为框架组件树
- **样式**：内联 style 或 className → 映射为框架的 StyleSheet / scoped style / Tailwind
- **交互**：onclick / onsubmit → 映射为 onPress / onSubmit
- **数据绑定**：localStorage 读写 → 映射为框架的 AsyncStorage / Storage API
- **弹窗/Toast**：alert() → 映射为框架的 Modal / Toast 组件

#### 4.3 导航结构生成

从 prototype 的 Tab 配置 + 页面间跳转关系生成导航：

**Expo Router 示例**（`mobile/src/app/_layout.tsx`）：
```tsx
import { Tabs } from 'expo-router';
import { IconHome, IconMessage, IconUser } from '@/components/icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: theme.colors.primary }}>
      <Tabs.Screen name="home" options={{ tabBarIcon: IconHome, title: '首页' }} />
      <Tabs.Screen name="messages" options={{ tabBarIcon: IconMessage, title: '消息' }} />
      <Tabs.Screen name="me" options={{ tabBarIcon: IconUser, title: '我的' }} />
    </Tabs>
  );
}
```

**📝 本步完成后立即写入 STEPS.md**

### Step 5：API 调用层生成（openapi.yaml → mobile API client）

> 📌 **核心：复用它**。不重写接口调用，从 `api/openapi.yaml` 自动生成类型安全的 API 客户端。

#### 5.1 生成策略

| 框架 | 生成方式 |
|------|---------|
| uni-app | 从 openapi.yaml 生成 `uni.request()` 封装 + TypeScript 类型 |
| React Native / Expo | 从 openapi.yaml 生成 `fetch`/`axios` 封装 + JWT interceptor |
| Taro | 从 openapi.yaml 生成 `Taro.request()` 封装 |
| Flutter | 从 openapi.yaml 生成 `dio` 封装 + Dart 类型 |

#### 5.2 关键适配

| Web 端（safrontend） | 移动端（sacrossplatform） |
|---------------------|------------------------|
| `axios` + `Authorization: Bearer` | 框架 HTTP 客户端 + 相同 header |
| `localStorage` token 持久化 | `AsyncStorage` / `SecureStore` |
| `VITE_API_BASE_URL` 环境变量 | `EXPO_PUBLIC_API_BASE_URL` / `app.config.ts` |
| Vite proxy 开发代理 | 直连后端（移动端无 proxy，需 CORS 或配置 baseURL） |
| Cookie 会话 | Token 存储在 SecureStore（移动端无 Cookie） |

#### 5.3 JWT 认证适配

移动端的 token 管理不同：

```ts
// Web: localStorage.getItem('token')
// Mobile: 
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('access_token', token);
const token = await SecureStore.getItemAsync('access_token');
```

**📝 本步完成后立即写入 STEPS.md**

### Step 6：原生能力集成

根据项目类型（从 STEPS.md 项目元信息读取），按需启用原生模块：

| 功能 | 触发条件 | Expo 模块 | 权限 |
|------|---------|----------|------|
| 相机/拍照 | 头像上传、扫一扫 | `expo-camera` / `expo-image-picker` | CAMERA |
| 相册选择 | 头像上传、图片选择 | `expo-image-picker` | MEDIA_LIBRARY |
| 定位 | 附近的人、收货地址 | `expo-location` | LOCATION |
| 推送通知 | 消息提醒、订单状态 | `expo-notifications` | NOTIFICATIONS |
| 文件系统 | 文件上传/下载 | `expo-file-system` | — |
| 生物识别 | 指纹/面容登录 | `expo-local-authentication` | — |
| 分享 | 内容分享到微信等 | `expo-sharing` / `react-native-wechat-lib` | — |
| 地图 | LBS 功能 | `react-native-maps` / 高德 SDK | LOCATION |

> 📌 本步骤由 `sanative-bridge` skill 详细处理，sacrossplatform 仅负责基础集成。若需要完整的原生桥接封装，请在 sacrossplatform 完成后运行 `/sanative-bridge`。

**📝 本步完成后立即写入 STEPS.md**

### Step 7：构建配置与签名

#### 7.1 iOS 配置

```bash
# app.json / app.config.ts
{
  "expo": {
    "name": "<项目中文名>",
    "slug": "<project-name>",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": { "backgroundColor": "<--bg from tokens.css>" },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.<company>.<project>",
      "infoPlist": {
        "NSCameraUsageDescription": "用于拍照上传头像",
        "NSLocationWhenInUseUsageDescription": "用于推荐附近的人"
      }
    },
    "android": {
      "adaptiveIcon": { "backgroundColor": "<--bg>" },
      "package": "com.<company>.<project>",
      "permissions": ["CAMERA", "ACCESS_FINE_LOCATION"]
    }
  }
}
```

#### 7.2 构建命令

| 框架 | Android | iOS |
|------|---------|-----|
| Expo | `npx eas build -p android` | `npx eas build -p ios` |
| uni-app | HBuilderX 云打包 或离线打包 | 同样 |
| Taro | `taro build --type weapp`（小程序） | — |
| Flutter | `flutter build apk` | `flutter build ios` |

**📝 本步完成后立即写入 STEPS.md**

### Step 8：验证与汇总

```bash
# 验证清单
echo "📱 移动端 App 验证清单："
echo "  ☐ 打开 App 首页正常渲染"
echo "  ☐ 底部 Tab 切换正常"
echo "  ☐ 登录接口连通（Token 存储到 SecureStore）"
echo "  ☐ 业务接口返回数据（与 Web 端一致）"
echo "  ☐ 401 → Token 刷新 → 失败跳登录"
echo "  ☐ 原生模块（相机/定位）权限弹窗正常"
echo "  ☐ Android 构建成功（.apk / .aab）"
echo "  ☐ iOS 构建成功（.ipa）"
```

在 `STEPS.md` 追加「移动端 App」章节。

---

## 失败 / 边界处理

| 场景 | 处理 |
|------|------|
| frontend/ 不存在 | 提示先运行 `/safrontend`，或询问「仅基于 prototype 原型直接生成 App（跳过 Web）？」 |
| api/openapi.yaml 不存在 | 提示先运行 `/saapi`，或询问「手动填写 API baseURL？」 |
| 选 Expo 但用户无 Apple 开发者账号 | iOS 构建需 Apple Developer 账号（$99/年）；Expo Go 可用于开发调试（无需付费） |
| 选 uni-app 但需要原生模块 | uni-app 支持原生插件市场，引导用户搜索对应插件 |
| 移动端 API baseURL 与 Web 不同 | 生成 `.env.mobile` 独立配置文件 |
| SecureStore 在模拟器不可用 | 降级到 AsyncStorage（开发阶段），生产强制 SecureStore |

## 关键约定速查

| 项目 | 约定 |
|------|------|
| 代码目录 | `mobile/`（与 frontend/ backend/ 平级） |
| 设计令牌来源 | `prototype/assets/css/tokens.css` → 映射为移动端主题 |
| API 规范来源 | `api/openapi.yaml` → 生成类型安全 API 层 |
| Token 存储 | SecureStore（生产）/ AsyncStorage（开发） |
| 环境变量 | `.env.mobile` / `app.config.ts` 的 `EXPO_PUBLIC_*` |
| 步骤追踪 | `STEPS.md` 追加「移动端 App」章节 |
| 命名规范 | 与 sabackend 的命名规范一致（表前缀等） |

## 修改记录

| 时间 | 改动 |
|------|------|
| 2026-07-14-1 | 初版：基于 safrontend 产出 + saapi 接口规范，将 Web 前端转化为跨平台移动 App；支持 uni-app / React Native + Expo / Taro / Flutter 四框架；8 步流程（前置检查 → 框架选择 → 脚手架 → 设计令牌映射 → 页面迁移 → API 层生成 → 原生能力集成 → 构建配置 → 验证） |
