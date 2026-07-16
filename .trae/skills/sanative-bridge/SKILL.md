---
name: "sanative-bridge"
description: "为跨平台项目封装原生能力桥接层：相机、相册、推送、定位、文件系统、生物识别、分享、地图等。生成平台无关的调用接口，由 sacrossplatform 或 sadesktop 在 Step 6 触发。Invoke when 用户输入 /sanative-bridge 或需要为 App/桌面应用添加原生功能。"
---

# /sanative-bridge — 原生能力桥接

## 什么是原生桥接？

Web 前端运行在浏览器沙箱里，无法直接访问设备的相机、GPS、推送通知等原生能力。跨平台框架（React Native / uni-app / Electron 等）通过"桥接"机制让 JS 代码可以调用原生 API。

这个 skill 的工作就是：**根据项目类型和用户选的功能，生成一套统一的原生能力调用接口，屏蔽不同框架的差异，让上层业务代码只需 `import { takePhoto } from '@/native/camera'` 即可。**

## 触发条件

- 用户输入 `/sanative-bridge` 或 `/sanative-bridge <项目目录>`
- **自动触发**：`sacrossplatform` 或 `sadesktop` 的 Step 6（原生能力集成）可自动跳转
- **前置条件**：
  - 项目已有跨平台框架（`mobile/` 来自 sacrossplatform 或 `desktop/` 来自 sadesktop）
  - `STEPS.md` 中已记录项目类型与功能清单

## 核心原则

1. **统一接口，多端实现**：同一套 `@/native/*` 接口，按平台自动切换实现
2. **按需加载**：仅生成用户选中的功能对应的桥接模块
3. **降级优雅**：原生能力不可用时（如 Web 端），自动降级到 Web API 或给出友好提示
4. **权限声明自动生成**：iOS Info.plist / AndroidManifest.xml / Electron 权限自动追加
5. **存放位置**：在 `mobile/src/native/` 或 `desktop/src/native/` 中生成

## 产出文件结构

```
mobile/src/native/                 ← sacrossplatform 场景
│   ├── index.ts                   统一导出
│   ├── camera.ts                  拍照/录像/扫码
│   ├── gallery.ts                 相册选择
│   ├── location.ts                定位
│   ├── push.ts                    推送通知
│   ├── file.ts                    文件系统
│   ├── biometric.ts               指纹/面容识别
│   ├── share.ts                   分享
│   ├── map.ts                     地图
│   └── platform.ts                平台检测工具

desktop/src/native/                ← sadesktop 场景
│   ├── index.ts
│   ├── notification.ts            原生桌面通知
│   ├── fileDialog.ts              文件对话框
│   ├── shell.ts                   打开外部链接/文件夹
│   ├── updater.ts                 自动更新
│   └── tray.ts                    系统托盘
```

---

## 工作流程（严格按顺序）

### Step 0：前置检查

#### 0.1 确定场景

```bash
# 检测目标平台
if [ -d mobile/ ]; then
  TARGET="mobile"
  FRAMEWORK=$(grep "框架" mobile/package.json | ... )  # Expo / uni-app / Taro / Flutter
elif [ -d desktop/ ]; then
  TARGET="desktop"
  FRAMEWORK=$(grep "electron\|tauri" desktop/package.json | ... )
else
  echo "❌ 未检测到 mobile/ 或 desktop/ 目录，请先运行 sacrossplatform 或 sadesktop"
  exit 1
fi
```

#### 0.2 读取功能清单

从 `STEPS.md` 读取项目功能清单，推断需要的原生能力：

| 选中功能 | 需要的原生能力 |
|---------|-------------|
| 头像上传 | 📷 camera / 🖼️ gallery |
| 附近的人 | 📍 location |
| 即时聊天 | 🔔 push |
| 实名认证 | 📷 camera + 🖼️ gallery（证件拍照） |
| 扫一扫 | 📷 camera（扫码） |
| 文件上传/下载 | 📁 file |
| 分享内容 | 📤 share |
| VIP/支付 | 🔐 biometric（指纹支付） |
| 地图展示 | 🗺️ map |

输出确认：
```
🔍 检测到目标：<mobile (Expo) | desktop (Electron)>
📋 从 STEPS.md 读取功能清单：
   • 头像上传 → 需要 camera + gallery
   • 附近的人 → 需要 location
   • 即时聊天 → 需要 push
   ✅ 共需生成 4 个原生桥接模块
```

### Step 1：生成平台检测工具

所有桥接模块的共同依赖——判断当前运行环境：

**`mobile/src/native/platform.ts`**：
```ts
// 平台检测工具
export const PlatformOS = {
  isIOS: typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent),
  isAndroid: typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent),
  isWeb: typeof navigator !== 'undefined' && !/iPhone|iPad|iPod|Android/.test(navigator.userAgent),
  isDesktop: typeof window !== 'undefined' && 'desktopAPI' in window,
};

export const isNative = () => PlatformOS.isIOS || PlatformOS.isAndroid;
export const isWeb = () => PlatformOS.isWeb;
export const isDesktop = () => PlatformOS.isDesktop;

// 能力检测：某项原生能力是否可用
export const canUse = {
  camera: () => isNative(),
  biometric: () => PlatformOS.isIOS || (PlatformOS.isAndroid && /* API level >= 23 */ true),
  push: () => isNative() || ('Notification' in window),
  location: () => isNative() || ('geolocation' in navigator),
};
```

### Step 2：按需生成桥接模块

#### 2.1 相机模块（`camera.ts`）

```ts
// mobile/src/native/camera.ts
import { PlatformOS, isNative } from './platform';

export interface CameraOptions {
  type?: 'photo' | 'video' | 'qr';  // 拍照 / 录像 / 扫码
  quality?: number;                   // 0-1
  front?: boolean;                    // 前置摄像头
}

export interface CameraResult {
  uri: string;       // 本地路径
  width: number;
  height: number;
  type: 'image' | 'video';
}

/**
 * 拍照 / 录像 / 扫码
 * - Expo: expo-camera / expo-barcode-scanner
 * - uni-app: uni.chooseImage({ sourceType: ['camera'] })
 * - Taro: Taro.chooseImage({ sourceType: ['camera'] })
 * - Web: <input type="file" capture="environment">
 */
export async function takePhoto(options: CameraOptions = {}): Promise<CameraResult> {
  if (isNative()) {
    // Expo 实现
    // const { status } = await ImagePicker.requestCameraPermissionsAsync();
    // const result = await ImagePicker.launchCameraAsync({ ... });
    // return result;
    throw new Error('请先运行 sacrossplatform 生成具体框架实现');
  }
  // Web 降级：使用 <input type="file" capture>
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        resolve({
          uri: URL.createObjectURL(file),
          width: 0, height: 0, type: 'image',
        });
      } else {
        reject(new Error('用户取消'));
      }
    };
    input.click();
  });
}

/**
 * 扫码（QR Code / Bar Code）
 */
export async function scanCode(): Promise<string> {
  if (isNative()) {
    // Expo: BarCodeScanner
    // uni-app: uni.scanCode()
    throw new Error('请先运行 sacrossplatform 生成具体框架实现');
  }
  // Web 不支持扫码（可集成 jsQR 等纯前端方案）
  throw new Error('扫码功能在 Web 端不可用，请使用移动端');
}
```

#### 2.2 相册模块（`gallery.ts`）

```ts
// mobile/src/native/gallery.ts
import { isNative } from './platform';

export interface GalleryOptions {
  maxCount?: number;      // 最多选几张
  mediaType?: 'image' | 'video' | 'all';
  crop?: boolean;         // 是否裁剪
}

export interface GalleryResult {
  uris: string[];
}

/**
 * 从相册选择图片/视频
 * - Expo: ImagePicker.launchImageLibraryAsync()
 * - uni-app: uni.chooseImage({ sourceType: ['album'] })
 * - Web: <input type="file" multiple>
 */
export async function pickFromGallery(options: GalleryOptions = {}): Promise<GalleryResult> {
  if (isNative()) {
    throw new Error('请先运行 sacrossplatform 生成具体框架实现');
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.mediaType === 'video' ? 'video/*' : 'image/*';
    input.multiple = (options.maxCount ?? 1) > 1;
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files || []);
      resolve({ uris: files.map((f: any) => URL.createObjectURL(f)) });
    };
    input.click();
  });
}
```

#### 2.3 定位模块（`location.ts`）

```ts
// mobile/src/native/location.ts
import { isNative } from './platform';

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;      // 逆地理编码地址
}

/**
 * 获取当前位置
 * - Expo: Location.getCurrentPositionAsync()
 * - uni-app: uni.getLocation()
 * - Web: navigator.geolocation.getCurrentPosition()
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  if (isNative()) {
    throw new Error('请先运行 sacrossplatform 生成具体框架实现');
  }
  // Web 降级
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
```

#### 2.4 推送模块（`push.ts`）

```ts
// mobile/src/native/push.ts

export interface PushTokenResult {
  token: string;       // 推送服务 token（FCM / APNs / uni-push）
  platform: 'ios' | 'android' | 'web';
}

/**
 * 注册推送通知
 * - Expo: Notifications.getExpoPushTokenAsync()
 * - uni-app: uni.onPush() / uni.getPushClientId()
 * - Web: navigator.serviceWorker.register() + PushManager
 */
export async function registerPush(): Promise<PushTokenResult> {
  throw new Error('请先运行 sacrossplatform 生成具体框架实现');
}

/**
 * 监听推送消息（App 在前台时）
 */
export function onPushReceived(callback: (payload: any) => void): () => void {
  // 返回取消监听的函数
  return () => {};
}
```

#### 2.5 文件系统模块（`file.ts`）

```ts
// mobile/src/native/file.ts

/**
 * 下载文件到本地
 * - Expo: FileSystem.downloadAsync()
 * - uni-app: uni.downloadFile()
 * - Web: <a download> 或 fetch + blob
 */
export async function downloadFile(url: string, filename: string): Promise<string> {
  // Web 降级
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  return url;
}

/**
 * 获取文件本地路径（用于上传）
 */
export async function getFileInfo(uri: string): Promise<{ size: number; name: string }> {
  throw new Error('请先运行 sacrossplatform 生成具体框架实现');
}
```

#### 2.6 生物识别模块（`biometric.ts`）

```ts
// mobile/src/native/biometric.ts

/**
 * 指纹/面容认证
 * - Expo: LocalAuthentication.authenticateAsync()
 * - uni-app: uni.startSoterAuthentication()
 * - Web: WebAuthn API（有限支持）
 */
export async function authenticate(prompt: string = '验证身份'): Promise<boolean> {
  throw new Error('请先运行 sacrossplatform 生成具体框架实现');
}

/**
 * 检查设备是否支持生物识别
 */
export async function isBiometricAvailable(): Promise<{
  available: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'none';
}> {
  throw new Error('请先运行 sacrossplatform 生成具体框架实现');
}
```

#### 2.7 分享模块（`share.ts`）

```ts
// mobile/src/native/share.ts

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  imageUrl?: string;
}

/**
 * 分享内容到系统分享面板
 * - Expo: Sharing.shareAsync()
 * - uni-app: uni.share()
 * - Web: navigator.share() or fallback to clipboard
 */
export async function shareContent(options: ShareOptions): Promise<void> {
  // Web 降级
  if (navigator.share) {
    await navigator.share({ title: options.title, text: options.text, url: options.url });
  } else {
    // Fallback: 复制链接到剪贴板
    await navigator.clipboard.writeText(options.url || options.text || '');
    alert('链接已复制到剪贴板');
  }
}
```

### Step 3：权限声明生成

根据生成的桥接模块，自动追加平台权限声明：

#### 3.1 iOS（Info.plist 追加）

```xml
<!-- 自动检测到 camera + gallery + location 模块后生成 -->
<key>NSCameraUsageDescription</key>
<string>用于拍照上传头像和扫码</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>用于从相册选择图片</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>用于推荐附近的人</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>用于后台位置共享</string>
```

#### 3.2 Android（AndroidManifest.xml 追加）

```xml
<!-- 自动检测到 camera + location 模块后生成 -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

#### 3.3 Electron（主进程权限）

```ts
// desktop/src/main.ts 追加
// 自动检测到 fileDialog + notification 后生成
```

### Step 4：生成统一导出

**`mobile/src/native/index.ts`**：
```ts
export { takePhoto, scanCode } from './camera';
export { pickFromGallery } from './gallery';
export { getCurrentLocation } from './location';
export { registerPush, onPushReceived } from './push';
export { downloadFile, getFileInfo } from './file';
export { authenticate, isBiometricAvailable } from './biometric';
export { shareContent } from './share';
export { PlatformOS, isNative, canUse } from './platform';
```

### Step 5：集成到业务代码

为每个使用原生能力的业务页面生成调用示例：

```tsx
// mobile/src/screens/EditProfileScreen.tsx 示例
import { takePhoto, pickFromGallery } from '@/native';

function EditProfileScreen() {
  const handleChangeAvatar = async () => {
    // 弹出选择：拍照 / 从相册选
    const action = await showActionSheet(['拍照', '从相册选择', '取消']);
    try {
      if (action === '拍照') {
        const photo = await takePhoto({ type: 'photo' });
        await uploadAvatar(photo.uri);
      } else if (action === '从相册选择') {
        const { uris } = await pickFromGallery({ maxCount: 1, crop: true });
        await uploadAvatar(uris[0]);
      }
    } catch (err) {
      // 用户取消或权限被拒
      console.log('用户取消选择');
    }
  };

  return (/* ... */);
}
```

**📝 本步完成后立即写入 STEPS.md**

### Step 6：验证

```bash
echo "🔗 原生桥接验证清单："
echo "  ☐ 每个桥接模块导出函数可正常 import"
echo "  ☐ 原生端（App）权限弹窗正常"
echo "  ☐ Web 端降级方案正常（不报错）"
echo "  ☐ 权限被拒时有友好提示（不闪退）"
echo "  ☐ iOS Info.plist 权限描述完整"
echo "  ☐ Android Manifest 权限声明完整"
```

在 `STEPS.md` 追加「原生桥接」章节。

---

## 各框架实现对照表

| 能力 | Expo | uni-app | Taro | Electron | Web 降级 |
|------|------|---------|------|----------|---------|
| 拍照 | `ImagePicker.launchCameraAsync` | `uni.chooseImage` | `Taro.chooseImage` | — | `<input capture>` |
| 相册 | `ImagePicker.launchImageLibrary` | `uni.chooseImage` | `Taro.chooseImage` | `dialog.showOpenDialog` | `<input>` |
| 扫码 | `BarCodeScanner` | `uni.scanCode` | `Taro.scanCode` | — | jsQR |
| 定位 | `Location.getCurrentPosition` | `uni.getLocation` | `Taro.getLocation` | — | `navigator.geolocation` |
| 推送 | `Notifications.getExpoPushToken` | `uni.onPush` | `Taro.onPush` | `Notification` | Web Push |
| 文件 | `FileSystem` | `uni.downloadFile` | `Taro.downloadFile` | `dialog.showSaveDialog` | `<a download>` |
| 生物识别 | `LocalAuthentication` | `uni.startSoterAuth` | — | — | WebAuthn |
| 分享 | `Sharing.shareAsync` | `uni.share` | `Taro.share` | — | `navigator.share` |
| 桌面通知 | — | — | — | `new Notification()` | `new Notification()` |
| 自动更新 | — | — | — | `electron-updater` | — |

## 关键约定速查

| 项目 | 约定 |
|------|------|
| 代码目录 | `mobile/src/native/` 或 `desktop/src/native/` |
| 接口风格 | 统一 async 函数 + options 参数对象 |
| 权限声明 | 自动根据生成模块追加到平台配置文件 |
| Web 降级 | 每个模块必须有 Web 降级实现（不可用时友好报错） |
| 步骤追踪 | `STEPS.md` 追加「原生桥接」章节 |

## 修改记录

| 时间 | 改动 |
|------|------|
| 2026-07-14-1 | 初版：统一原生能力接口，覆盖 camera / gallery / location / push / file / biometric / share / map 8 大模块；自动生成平台权限声明；支持 Expo / uni-app / Taro / Electron + Web 降级 |
