---
name: "sadeploy-desktop"
description: "桌面应用打包构建：基于 /sadesktop 生成的桌面端项目，生成 Windows .exe、macOS .dmg、Linux .deb/.AppImage 安装包构建脚本。Invoke when 用户输入 /sadeploy-desktop 或 sadesktop 完成后需要打包桌面应用。"
---

# /sadeploy-desktop — 桌面应用打包构建

## 什么是桌面端打包？

Electron / Tauri 项目开发完成后，需要编译成各平台可安装的格式：
- Windows → `.exe`（NSIS 安装包）或 `.msi`
- macOS → `.dmg`（拖拽安装）或 `.pkg`
- Linux → `.deb`（Debian/Ubuntu）、`.rpm`（Fedora）、`.AppImage`（通用）

这个 skill 的工作就是：**生成对应平台的构建脚本，一键打包出可分发的桌面安装包。**

## 触发条件

- 用户输入 `/sadeploy-desktop` 或 `/sadeploy-desktop <项目目录>`
- **自动触发**：sadesktop 完成后，询问用户下一步时选「打包构建」
- **前置条件**：
  - `desktop/` 已存在（来自 `/sadesktop`）
  - `STEPS.md` 已存在（项目元信息）

## 核心原则

1. **读取项目上下文**：从 `STEPS.md` 获取桌面端框架类型（Electron / Tauri）
2. **仅打包安装包**：不涉及代码签名、自动更新配置、分发渠道
3. **生成脚本**：按框架生成对应的构建命令
4. **步骤追踪**：写入 `STEPS.md`

## 工作流程

### Step 0：读取项目上下文

从 `STEPS.md` 和 `desktop/package.json` 提取桌面端框架信息：

| 框架 | 检测方式 | 构建命令 |
|------|---------|---------|
| Electron | `desktop/package.json` 含 `electron` 或 `electron-builder` | `npm run build` |
| Tauri | `desktop/` 含 `src-tauri/` 目录 | `npm run tauri build` |

### Step 1：生成构建脚本

根据检测到的框架，生成 `desktop/build.sh` 和 `desktop/build.ps1`：

#### Electron

```bash
#!/bin/bash
# desktop/build.sh — Electron 打包脚本

echo "💻 <项目中文名> 桌面应用打包..."

# 安装依赖
npm install

# 构建前端
cd ../frontend && npm run build && cd ../desktop

# 打包各平台
echo "📦 打包 Windows (.exe)..."
npm run build:win    # 需要 wine 或 Windows 环境

echo "📦 打包 macOS (.dmg)..."
npm run build:mac    # 需要 macOS 环境

echo "📦 打包 Linux (.deb/.AppImage)..."
npm run build:linux

echo "✅ 打包完成！"
echo "  产物在 desktop/dist/ 目录"
```

```json
// desktop/package.json 中的构建脚本
{
  "scripts": {
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.<project-name>.app",
    "productName": "<项目中文名>",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": ["nsis"],
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": ["deb", "AppImage"],
      "icon": "assets/icon.png"
    }
  }
}
```

#### Tauri

```bash
#!/bin/bash
# desktop/build.sh — Tauri 打包脚本

echo "💻 <项目中文名> 桌面应用打包..."

# 安装依赖
npm install

# 构建前端
cd ../frontend && npm run build && cd ../desktop

# 打包各平台
echo "📦 打包 Windows (.exe/.msi)..."
npm run tauri build -- --target x86_64-pc-windows-msvc

echo "📦 打包 macOS (.dmg)..."
npm run tauri build -- --target x86_64-apple-darwin

echo "📦 打包 Linux (.deb/.AppImage)..."
npm run tauri build -- --target x86_64-unknown-linux-gnu

echo "✅ 打包完成！"
echo "  产物在 desktop/src-tauri/target/release/bundle/"
```

### Step 2：写入 STEPS.md

```markdown
---

## 💻 桌面端打包构建（基于 /sadeploy-desktop skill）

> 构建时间：YYYY-MM-DD HH:mm
> 框架：<Electron / Tauri>
> 产出目录：`desktop/dist/`

### 📁 构建脚本

| 文件 | 用途 |
|------|------|
| `desktop/build.sh` | macOS/Linux 构建脚本 |
| `desktop/build.ps1` | Windows 构建脚本 |

### 📦 产物清单

| 平台 | 格式 | 路径 |
|------|------|------|
| Windows | .exe (NSIS) | `desktop/dist/<ProjectName>-Setup.exe` |
| macOS | .dmg | `desktop/dist/<ProjectName>.dmg` |
| Linux | .deb / .AppImage | `desktop/dist/<ProjectName>.deb` |

### ✅ 构建状态

- [x] 构建脚本已生成
- 首次构建：⏭ 待执行

### 📝 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| YYYY-MM-DD HH:mm | 桌面端打包 | 生成构建脚本 |
```

### Step 3：输出结果

```
✅ 桌面端打包脚本已生成！

📁 文件：
   • desktop/build.sh（macOS/Linux）
   • desktop/build.ps1（Windows）

🚀 下一步：
   cd desktop
   ./build.sh    # 执行打包

📦 产物位置：
   Windows：desktop/dist/<ProjectName>-Setup.exe
   macOS：desktop/dist/<ProjectName>.dmg
   Linux：desktop/dist/<ProjectName>.deb / .AppImage

⚠️ 注意事项：
   - Windows 打包需在 Windows 环境或使用 wine
   - macOS 打包需在 macOS 环境 + Xcode
   - 代码签名需额外配置证书
```

## 关联 Skill

- `sadesktop` — 前置（生成桌面端项目）

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-08-06-1 | 初版：支持 Electron 和 Tauri 两种框架的打包脚本生成，覆盖 Windows/macOS/Linux 三平台 |