---
name: "sadesktop"
description: "将已有的 Web 前端代码打包为桌面应用程序（Windows / macOS / Linux），基于 Electron 或 Tauri 提供原生窗口、系统托盘、自动更新、本地文件访问等桌面能力。Invoke when 用户输入 /sadesktop 或要求将 Web 项目打包为 PC 桌面应用。"
---

# /sadesktop — Web 转桌面应用

## 什么是桌面应用？

Web 前端（`safrontend` 产出）只能通过浏览器访问。桌面应用的优势：
- 🖥️ **独立窗口**：像 Word/微信一样有独立的窗口，不在浏览器里
- 📦 **安装包分发**：.exe / .dmg / .deb 安装包，用户双击即用
- 🔔 **系统通知**：原生桌面通知，而非浏览器 Notification
- 📁 **本地文件访问**：读写用户电脑文件
- 🔄 **自动更新**：推送新版本，用户一键升级

这个 skill 的工作就是：**给已有的 Web 前端套上一个桌面壳层（Electron 或 Tauri），生成可分发的桌面安装包。**

## 触发条件

- 用户输入 `/sadesktop` 或 `/sadesktop <项目目录>`
- **前置条件**：
  - `frontend/` 已存在（来自 `/safrontend`），且已构建出 `frontend/dist/`
  - `backend/` 已存在（来自 `/sabackend`），或用户选择纯前端桌面应用
  - `api/openapi.yaml` 已存在（来自 `/saapi`），用于桌面端 API 连接配置

## 与其他 skill 的关系

```
/sainit-* ──► /safrontend ──► /saapi ──► /sabackend ──► /saapi-connect
   原型         Web 前端       API 规范     后端实现       前后端接通
                                                           │
                              /sadesktop（本 skill）◄──────┘
                                    │
                              生成 Windows + macOS + Linux 桌面应用
```

> 📌 **本 skill 依赖 `frontend/dist/`（已构建的 Web 产物）和 `api/openapi.yaml`（API 连接配置）**。

## 核心原则

1. **壳层模式**：Web 前端作为内容渲染，桌面壳层提供原生窗口 + 系统能力
2. **框架选择**：Electron（成熟稳定）vs Tauri（轻量高性能）
3. **存放位置**：`desktop/` 目录，与 `frontend/`、`backend/`、`mobile/` 平级
4. **API 复用**：桌面应用内前端直接调用后端 API（同 safrontend 的 API 客户端），JWT token 存储在系统安全存储中
5. **后端可选嵌入**：可选将 backend/ 打包进桌面应用（单机模式），也可连接远程服务器（CS 模式）
6. **步骤追踪**：在项目根目录 `STEPS.md` 追加「桌面应用」章节

## 产出文件结构

```
<project-name>/
├── frontend/                      ← /safrontend 产出
│   └── dist/                      ← npm run build 产物（桌面壳层加载此目录）
├── desktop/                       ← 本 skill 产出
│   ├── package.json
│   ├── electron-builder.yml      （Electron 打包配置）
│   │   或 tauri.conf.json        （Tauri 打包配置）
│   ├── src/
│   │   ├── main.ts               主进程（窗口管理、系统托盘、菜单、IPC）
│   │   ├── preload.ts            预加载脚本（安全暴露 API 给渲染进程）
│   │   └── updater.ts            自动更新逻辑
│   ├── icons/                    应用图标（.ico / .icns / .png）
│   ├── resources/                额外资源（安装包背景图等）
│   └── dist/                     打包输出（.exe / .dmg / .deb / .AppImage）
└── STEPS.md
```

---

## 工作流程（严格按顺序）

### Step 0：前置检查

#### 0.1 读取项目元信息

从 `STEPS.md` 提取：

| 字段 | 用途 |
|------|------|
| 项目名（中/英文） | 桌面应用名称、窗口标题、安装包文件名 |
| UI 风格 | 窗口背景色、标题栏样式 |
| 后端端口 | 桌面应用内 API baseURL 配置 |

#### 0.2 检查前置条件

1. `frontend/dist/` 是否存在 → 不存在则执行 `cd frontend && npm run build`
2. `api/openapi.yaml` 是否存在 → 用于生成桌面端 API 连接配置
3. 读取 `backend/config.yaml` 端口配置（如后端存在）

输出确认：
```
🔍 读取项目信息：
   • 项目名：<中文名>
   • 前端构建产物：frontend/dist/ ✅
   • 后端端口：3000（来自 backend/config.yaml）
   ✅ 前置条件满足，开始生成桌面应用
```

### Step 1：选择桌面框架

使用 `AskUserQuestion`：

#### 1.1 框架对比

| 维度 | **Electron** | **Tauri** |
|------|------------|----------|
| **大白话** | 用 Chromium 内核 + Node.js 做桌面应用 | 用系统自带 WebView + Rust 后端做桌面应用 |
| **安装包大小** | ~80 MB（内置 Chromium） | ~5 MB（复用系统 WebView） |
| **内存占用** | 较高（每个窗口跑一个 Chromium） | 低（系统级 WebView 共享） |
| **性能** | 一般（JS 主进程） | 优秀（Rust 主进程） |
| **开发语言** | JavaScript / TypeScript（主进程也是 JS） | Rust（主进程）+ JS（前端） |
| **生态成熟度** | ⭐⭐⭐⭐⭐（VS Code、Slack、Discord 都用） | ⭐⭐⭐（较新，发展快） |
| **Windows 7 兼容** | ✅ | ❌（需 Windows 10+） |
| **自动更新** | `electron-updater`（成熟） | Tauri updater（内置） |
| **适用场景** | 需要 Node.js 能力、兼容旧系统 | 追求小体积、低内存、Rust 生态 |

#### 1.2 提问话术

> 请选择桌面框架：
> - **A. Electron**（推荐，最成熟稳定，VS Code / Slack / Discord 同款）
>   - 大白话：把网站包进一个独立浏览器窗口，加上桌面才有的功能
>   - 适合：需要兼容 Windows 7、团队主要是前端开发者
>   - 安装包大小：~80 MB
> - **B. Tauri**（推荐，轻量高性能，新一代桌面框架）
>   - 大白话：用系统自带的浏览器内核渲染，体积小到只有几 MB
>   - 适合：追求小体积、低内存、新项目、需要 Rust 性能
>   - 安装包大小：~5 MB
>   - ⚠️ 主进程用 Rust 编写，需了解基本 Rust 语法

#### 1.3 追问后端部署模式

> 后端如何部署？
> - **A. 远程服务器**（默认）：桌面应用通过网络连接后端 API，与 Web 版一致
> - **B. 嵌入桌面应用**：把 backend/ 也打包进桌面应用，启动时自动运行（单机可离线使用）
>   - ⚠️ 选 B 仅推荐小型项目或工具类应用（后端数据库需一起打包）

**📝 本步完成后立即写入 STEPS.md**：
```markdown
| YYYY-MM-DD | Step 1：桌面框架选择 | ✅ |
  - 选定：<Electron | Tauri>
  - 后端模式：<远程服务器 | 嵌入桌面应用>
  - 目标平台：<Windows + macOS + Linux>
```

### Step 2：初始化 `desktop/` 项目

#### 2.1 Electron 脚手架

```bash
mkdir desktop && cd desktop
npm init -y
npm install electron electron-builder electron-updater
npm install -D @types/node typescript

# 生成目录
mkdir -p src icons resources
```

**`desktop/package.json` 关键字段**：
```json
{
  "name": "<project-name>-desktop",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "dev": "electron .",
    "build": "tsc && electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.<company>.<project>",
    "productName": "<项目中文名>",
    "directories": { "output": "dist" },
    "files": ["dist/**/*", "../frontend/dist/**/*"],
    "win": { "target": ["nsis"], "icon": "icons/icon.ico" },
    "mac": { "target": ["dmg"], "icon": "icons/icon.icns" },
    "linux": { "target": ["AppImage", "deb"], "icon": "icons/icon.png" }
  }
}
```

#### 2.2 Tauri 脚手架

```bash
# 需先安装 Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install tauri-cli
mkdir desktop && cd desktop
npm init -y
npm install @tauri-apps/cli @tauri-apps/api
npx tauri init
```

**`desktop/tauri.conf.json` 关键字段**：
```json
{
  "build": {
    "devPath": "http://localhost:5173",
    "distDir": "../frontend/dist",
    "beforeBuildCommand": "cd ../frontend && npm run build"
  },
  "tauri": {
    "bundle": {
      "identifier": "com.<company>.<project>",
      "icon": ["icons/icon.ico", "icons/icon.icns", "icons/icon.png"]
    },
    "windows": [{
      "title": "<项目中文名>",
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600
    }]
  }
}
```

**📝 本步完成后立即写入 STEPS.md**

### Step 3：主进程开发（窗口 + 系统能力）

#### 3.1 Electron 主进程（`desktop/src/main.ts`）

```ts
import { app, BrowserWindow, Menu, Tray, Notification, ipcMain } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '<项目中文名>',
    backgroundColor: '<--bg from tokens.css>',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,    // 安全：隔离渲染进程
      nodeIntegration: false,    // 安全：禁止渲染进程访问 Node.js
    },
  });

  // 加载前端构建产物
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ===== 系统托盘 =====
function createTray() {
  tray = new Tray(path.join(__dirname, '../icons/tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => mainWindow?.show() },
    { label: '退出', click: () => app.quit() },
  ]);
  tray.setToolTip('<项目中文名>');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow?.show());
}

// ===== 自动更新 =====
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-available', '有新版本可用');
  });
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded', '更新已下载，重启后生效');
  });
  // 每小时检查一次更新
  setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000);
}

// ===== 原生通知 =====
ipcMain.handle('show-notification', (_, { title, body }) => {
  new Notification({ title, body }).show();
});

// ===== 文件对话框 =====
ipcMain.handle('open-file-dialog', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'All Files', extensions: ['*'] }],
  });
  return result.filePaths;
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
```

#### 3.2 Electron 预加载脚本（`desktop/src/preload.ts`）

安全地暴露有限 API 给渲染进程（前端页面）：

```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopAPI', {
  // 原生通知
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  // 文件对话框
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // 自动更新
  onUpdateAvailable: (callback: (info: string) => void) =>
    ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on('update-downloaded', () => callback()),

  // 平台信息
  platform: process.platform,  // 'win32' | 'darwin' | 'linux'
});
```

#### 3.3 Tauri 主进程（`desktop/src-tauri/src/main.rs`）

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
fn show_notification(title: String, body: String, app: tauri::AppHandle) {
    // Tauri 通知（需 notification 插件）
    // app.emit_all("notification", ...);
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 系统托盘
            let _tray = app.tray_handle();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_notification])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**📝 本步完成后立即写入 STEPS.md**

### Step 4：API 连接配置

桌面应用的 API 连接与 Web 版有以下差异：

| 场景 | Web 版 | 桌面版 |
|------|--------|--------|
| API baseURL | `VITE_API_BASE_URL` 环境变量 | 桌面端配置文件 `desktop/config.json` |
| Token 存储 | `localStorage` | `electron-store` / `tauri-plugin-store`（加密存储） |
| 网络请求 | `axios`（浏览器 fetch） | 同上（渲染进程也是浏览器环境） |
| CORS | 需要后端配置 CORS | Electron: 可以关闭 webSecurity（不推荐）/ Tauri: 需后端 CORS |
| 离线模式 | 不可用 | 可选本地 SQLite 缓存 |

**生成 `desktop/config.json`**：
```json
{
  "apiBaseURL": "https://api.example.com",
  "apiPrefix": "/api/v1",
  "autoUpdate": true,
  "updateServer": "https://update.example.com",
  "minimizeToTray": true,
  "startOnBoot": false
}
```

**📝 本步完成后立即写入 STEPS.md**

### Step 5：前端适配（桌面端特有 UI）

> 📌 **只生成增量代码，不重写 frontend/。**

在 `frontend/src/` 中追加以下文件：

#### 5.1 桌面端 API 桥接层

```ts
// frontend/src/utils/desktopBridge.ts
// 判断是否运行在桌面环境中
export const isDesktop = () => {
  return typeof window !== 'undefined' && 'desktopAPI' in window;
};

// 桌面通知（降级到浏览器 Notification）
export const showNotification = (title: string, body: string) => {
  if (isDesktop()) {
    (window as any).desktopAPI.showNotification(title, body);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};
```

#### 5.2 窗口控制组件（可选）

```tsx
// frontend/src/components/desktop/TitleBar.tsx
// 桌面端自定义标题栏（替代系统默认标题栏）
// 仅当 isDesktop() 时渲染
```

**📝 本步完成后立即写入 STEPS.md**

### Step 6：打包与分发

#### 6.1 Electron 打包

```bash
cd desktop

# Windows (.exe NSIS 安装包)
npm run build:win
# 输出：desktop/dist/<项目名> Setup 1.0.0.exe

# macOS (.dmg)
npm run build:mac
# 输出：desktop/dist/<项目名>-1.0.0.dmg

# Linux (.AppImage + .deb)
npm run build:linux
# 输出：desktop/dist/<项目名>-1.0.0.AppImage
```

#### 6.2 Tauri 打包

```bash
cd desktop

# Windows
npx tauri build --target x86_64-pc-windows-msvc

# macOS
npx tauri build --target x86_64-apple-darwin

# Linux
npx tauri build --target x86_64-unknown-linux-gnu
```

#### 6.3 代码签名（生产环境）

| 平台 | 要求 | 费用 |
|------|------|------|
| Windows | EV Code Signing Certificate | ~$300/年 |
| macOS | Apple Developer ID + Notarization | $99/年 |
| Linux | 不强制（部分商店要求 GPG 签名） | 免费 |

> ⚠️ **未签名的应用在 Windows 上会触发 SmartScreen 警告，macOS 上会被 Gatekeeper 阻止。** 分发前务必签名。

**📝 本步完成后立即写入 STEPS.md**

### Step 7：验证与汇总

```bash
echo "🖥️ 桌面应用验证清单："
echo "  ☐ 双击安装包 → 安装成功"
echo "  ☐ 启动应用 → 窗口正常显示"
echo "  ☐ 前端页面正常渲染（与 Web 版一致）"
echo "  ☐ 登录接口连通（Token 持久化）"
echo "  ☐ 系统托盘图标显示 + 右键菜单"
echo "  ☐ 原生通知弹窗正常"
echo "  ☐ 关闭窗口 → 最小化到托盘（如配置）"
echo "  ☐ 自动更新：检测 → 下载 → 安装"
echo "  ☐ 文件对话框：选择文件正常"
echo "  ☐ Windows：安装路径、卸载、注册表清理"
echo "  ☐ macOS：.dmg 拖拽到 Applications"
echo "  ☐ Linux：.AppImage 可执行 + .deb 安装"
```

在 `STEPS.md` 追加「桌面应用」章节。

---

## 失败 / 边界处理

| 场景 | 处理 |
|------|------|
| frontend/dist/ 不存在 | 自动执行 `cd frontend && npm run build` |
| 用户选 Tauri 但未安装 Rust | 提示安装 Rust：`curl https://sh.rustup.rs -sSf \| sh` |
| Windows 7 兼容需求 | 选 Electron（Tauri 不支持 Win7） |
| macOS 公证失败 | 检查 Apple Developer 账号 + App-Specific Password |
| Linux AppImage 无执行权限 | 打包后自动 `chmod +x` |
| 前端路由在 Electron 中 404 | Electron 用 `loadFile` 时需确保 Vue Router / React Router 使用 hash 模式 |
| 嵌入后端模式：数据库连接失败 | 桌面应用首次启动时运行 init.sql + 引导用户配置数据库连接 |
| 自动更新服务器未配置 | 跳过自动更新，在 config.json 中标记 `autoUpdate: false` |

## 关键约定速查

| 项目 | 约定 |
|------|------|
| 代码目录 | `desktop/`（与 frontend/ backend/ mobile/ 平级） |
| 前端来源 | `frontend/dist/`（npm run build 产物） |
| 窗口标题 | `<项目中文名>`（来自 STEPS.md） |
| API baseURL | `desktop/config.json`（生产）/ `localhost:3000`（开发） |
| Token 存储 | Electron: `electron-store` 加密；Tauri: `tauri-plugin-store` |
| 安装包格式 | Windows: .exe (NSIS)；macOS: .dmg；Linux: .AppImage + .deb |
| 步骤追踪 | `STEPS.md` 追加「桌面应用」章节 |

## 修改记录

| 时间 | 改动 |
|------|------|
| 2026-07-14-1 | 初版：基于 safrontend 构建产物 + saapi 接口规范，将 Web 前端打包为桌面应用；支持 Electron / Tauri 双框架；7 步流程（前置检查 → 框架选择 → 脚手架 → 主进程开发 → API 配置 → 前端适配 → 打包分发 → 验证）；覆盖 Windows / macOS / Linux 三平台 |
