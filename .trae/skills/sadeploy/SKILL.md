---
name: "sadeploy"
description: "全栈一键部署：根据项目技术栈和用户选择的操作系统，生成部署脚本（含前端+后端+数据库+Redis+Nginx+SSL）。支持原生部署和容器部署，支持宝塔/1Panel 面板。Invoke when 用户输入 /sadeploy 或 saapi-connect 完成后需要部署项目。"
---

# /sadeploy — 全栈部署

## 什么是部署？

部署就是把开发完的项目搬到服务器上，让全世界的人都能访问。包括：
- 前端静态文件放 Nginx
- 后端服务跑起来
- 数据库建表
- 配置域名 + HTTPS 证书
- 设置自动更新流程

这个 skill 的工作就是：**根据你的项目技术栈和目标服务器，生成一套完整的部署脚本，一键执行就能上线。**

## 触发条件

- 用户输入 `/sadeploy` 或 `/sadeploy <项目目录>`
- **自动触发**：saapi-connect 完成后，询问用户下一步时选「直接部署」
- **前置条件**：
  - `frontend/` 已存在且可构建（来自 `/safrontend`）
  - `backend/` 已存在（来自 `/sabackend`）
  - `api/openapi.yaml` 已存在（来自 `/saapi`）
  - `STEPS.md` 已存在（项目元信息）

## 核心原则

1. **读取项目上下文**：从 `STEPS.md` 和 `backend/` 获取技术栈、端口、数据库信息
2. **全栈覆盖**：前端 + 后端 + 数据库 + Redis + Nginx + SSL
3. **按 OS 生成脚本**：Windows(.ps1) / macOS(.sh) / Ubuntu(.sh) / Debian(.sh) / CentOS(.sh)
4. **两种部署方式**：原生部署 / 容器部署（Docker + docker-compose）
5. **面板集成**：支持宝塔(BT) / 1Panel 面板命令
6. **步骤追踪**：每步完成后立即写入 `STEPS.md`

## 工作流程

### Step 0：读取项目上下文

#### 0.1 读取 STEPS.md

提取项目元信息和技术栈：

| 字段 | 用途 |
|------|------|
| 项目名（英文） | 目录名、容器名 |
| 项目名（中文） | Nginx 配置注释 |
| 前端框架 | 构建命令（npm run build） |
| 后端语言/框架 | 启动命令、运行环境 |
| 数据库类型 | 数据库安装/连接配置 |

#### 0.2 读取后端配置

从 `backend/config.yaml` 或 `.env` 提取：

| 配置项 | 用途 |
|--------|------|
| 数据库 host/port/dbname/user | 部署脚本数据库连接 |
| 后端端口 | Nginx 反向代理目标 |
| Redis 配置 | 缓存服务配置 |

#### 0.3 前置检查

```
🔍 读取项目上下文：
   • 项目名：<英文>（中文：<中文>）
   • 前端：<Vue 3 / React 18>，构建：npm run build，输出：frontend/dist/
   • 后端：<Node.js / Python / Go>，端口：<port>
   • 数据库：<MySQL / PostgreSQL / SQLite>
   ✅ 上下文读取完毕
```

### Step 1：询问部署配置

使用 `AskUserQuestion` 逐步询问：

#### 1.1 目标服务器 OS

> 请选择目标服务器的操作系统：
> - **A. Ubuntu**（推荐，最常用）
> - **B. Debian**
> - **C. CentOS / RHEL**
> - **D. macOS**（本地部署）
> - **E. Windows Server**

#### 1.2 部署方式

> 请选择部署方式：
> - **A. 原生部署**（直接在服务器安装 Node/Python/Go + 编译运行）
> - **B. 容器部署**（Docker + docker-compose，推荐）

#### 1.3 是否使用面板

> 是否使用服务器管理面板？
> - **A. 不使用面板**（纯命令行，推荐）
> - **B. 宝塔面板（BT）**（适合国内服务器，图形化管理）
> - **C. 1Panel**（开源面板，Docker 管理友好）

#### 1.4 域名与 SSL

> 请输入以下信息（如暂不确定可跳过）：
> - **域名**（如 `example.com`，API 将使用 `api.example.com`）
> - **是否启用 SSL**（HTTPS 证书，推荐开启）

### Step 2：生成部署脚本

根据用户选择，生成对应 OS 的脚本文件到 `deploy/` 目录。

#### 2.1 目录结构

```
deploy/
├── <os>/                      # 按 OS 分目录
│   ├── deploy.sh/.ps1        # 一键部署
│   ├── update.sh/.ps1        # 一键更新
│   ├── rollback.sh/.ps1      # 回滚
│   ├── nginx.conf            # Nginx 配置
│   ├── docker-compose.yml    # 容器编排（选容器时）
│   └── README.md             # 部署说明
```

#### 2.2 脚本模板

##### deploy.sh（Ubuntu/Debian 原生部署）

```bash
#!/bin/bash
set -e

echo "========================================="
echo "  <项目中文名> 一键部署脚本"
echo "  目标：Ubuntu/Debian"
echo "========================================="

# ===== 配置变量 =====
PROJECT_NAME="<project-name>"
PROJECT_DIR="/opt/$PROJECT_NAME"
BACKEND_PORT=<port>
FRONTEND_DIR="$PROJECT_DIR/frontend/dist"
BACKEND_DIR="$PROJECT_DIR/backend"
NGINX_CONF_DIR="/etc/nginx"

# ===== 1. 环境检查 =====
echo "🔍 检查环境..."
command -v node >/dev/null 2>&1 || { echo "❌ 请先安装 Node.js 18+"; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo "❌ 请先安装 Nginx"; exit 1; }

# ===== 2. 拉取代码 =====
echo "📦 拉取最新代码..."
if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR" && git pull
else
  git clone <repo-url> "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

# ===== 3. 安装依赖 =====
echo "📦 安装后端依赖..."
cd "$BACKEND_DIR"
npm install --production

echo "📦 安装前端依赖并构建..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# ===== 4. 数据库初始化 =====
echo "🗄️ 初始化数据库..."
mysql -u root -p"<password>" < "$BACKEND_DIR/sql/init.sql"

# ===== 5. 配置 Nginx =====
echo "🌐 配置 Nginx..."
cp "$PROJECT_DIR/deploy/ubuntu/nginx.conf" "$NGINX_CONF_DIR/sites-available/$PROJECT_NAME"
ln -sf "$NGINX_CONF_DIR/sites-available/$PROJECT_NAME" "$NGINX_CONF_DIR/sites-enabled/"
nginx -t && systemctl reload nginx

# ===== 6. 启动后端 =====
echo "🚀 启动后端服务..."
pm2 delete "$PROJECT_NAME-backend" 2>/dev/null || true
pm2 start "$BACKEND_DIR/src/index.js" --name "$PROJECT_NAME-backend"
pm2 save

# ===== 7. 配置 SSL（如需要） =====
if [ -n "<domain>" ]; then
  echo "🔒 配置 SSL 证书..."
  certbot --nginx -d "<domain>" -d "api.<domain>" --non-interactive --agree-tos -m "<email>"
fi

echo "========================================="
echo "  ✅ 部署完成！"
echo "  前端：https://<domain>"
echo "  API：https://api.<domain>"
echo "========================================="
```

##### deploy.sh（Docker 部署）

```bash
#!/bin/bash
set -e

echo "========================================="
echo "  <项目中文名> Docker 部署脚本"
echo "========================================="

PROJECT_NAME="<project-name>"
PROJECT_DIR="/opt/$PROJECT_NAME"

# 拉取代码
cd "$PROJECT_DIR" && git pull

# 构建并启动
docker-compose -f deploy/ubuntu/docker-compose.yml up -d --build

echo "✅ Docker 部署完成！"
```

##### docker-compose.yml（容器部署）

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ../frontend/dist:/usr/share/nginx/html
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

  backend:
    build: ../backend
    ports:
      - "<port>:<port>"
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=<dbname>
      - DB_USER=<dbuser>
      - DB_PASSWORD=<dbpassword>
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: <root_password>
      MYSQL_DATABASE: <dbname>
    volumes:
      - mysql_data:/var/lib/mysql
      - ../backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

##### deploy.ps1（Windows Server）

```powershell
# <项目中文名> Windows 部署脚本
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  <项目中文名> 一键部署脚本" -ForegroundColor Green
Write-Host "  目标：Windows Server" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$ProjectName = "<project-name>"
$ProjectDir = "C:\apps\$ProjectName"

# 1. 检查环境
Write-Host "🔍 检查环境..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "请先安装 Node.js" }

# 2. 拉取代码
Write-Host "📦 拉取最新代码..." -ForegroundColor Yellow
if (Test-Path $ProjectDir) {
  Set-Location $ProjectDir; git pull
} else {
  git clone <repo-url> $ProjectDir
  Set-Location $ProjectDir
}

# 3. 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Yellow
Set-Location "$ProjectDir\backend"; npm install --production
Set-Location "$ProjectDir\frontend"; npm install; npm run build

# 4. 配置 IIS 或 Nginx
# （根据用户选择生成）

# 5. 启动后端
Write-Host "🚀 启动后端服务..." -ForegroundColor Yellow
# 使用 pm2 或 Windows Service

Write-Host "✅ 部署完成！" -ForegroundColor Green
```

##### update.sh（一键更新）

```bash
#!/bin/bash
set -e

PROJECT_NAME="<project-name>"
PROJECT_DIR="/opt/$PROJECT_NAME"

echo "📦 更新 <项目中文名>..."

cd "$PROJECT_DIR"
git pull

# 后端更新
cd "$PROJECT_DIR/backend"
npm install --production
pm2 restart "$PROJECT_NAME-backend"

# 前端更新
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# 重载 Nginx
nginx -t && systemctl reload nginx

echo "✅ 更新完成！"
```

##### rollback.sh（回滚）

```bash
#!/bin/bash
set -e

PROJECT_NAME="<project-name>"
PROJECT_DIR="/opt/$PROJECT_NAME"

echo "⏪ 回滚 <项目中文名> 到上一个版本..."

cd "$PROJECT_DIR"
git log --oneline -5

read -p "请输入要回滚到的 commit hash: " COMMIT_HASH
git reset --hard "$COMMIT_HASH"

# 重新构建
cd "$PROJECT_DIR/backend" && npm install --production && pm2 restart "$PROJECT_NAME-backend"
cd "$PROJECT_DIR/frontend" && npm install && npm run build

nginx -t && systemctl reload nginx

echo "✅ 回滚完成！"
```

##### nginx.conf（Nginx 反向代理）

```nginx
server {
    listen 80;
    server_name <domain>;

    # 前端静态文件
    root /opt/<project-name>/frontend/dist;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:<port>;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后台管理
    location /admin/ {
        alias /opt/<project-name>/admin/dist/;
        try_files $uri $uri/ /admin/index.html;
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # SSL 配置（certbot 自动填充）
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
}
```

#### 2.3 宝塔面板集成

若用户选择宝塔面板，生成面板操作命令而非脚本：

```bash
# ===== 宝塔面板部署步骤 =====

# 1. 添加站点
#    面板 → 网站 → 添加站点 → 域名：<domain>

# 2. 配置反向代理
#    站点设置 → 反向代理 → 添加：
#    代理名称：API
#    目标 URL：http://127.0.0.1:<port>
#    发送域名：$host

# 3. 部署前端
cd /www/wwwroot/<domain>
git clone <repo-url> .
cd frontend && npm install && npm run build
# 站点目录设置为：/www/wwwroot/<domain>/frontend/dist

# 4. 部署后端
cd /www/wwwroot/<domain>/backend
npm install --production
pm2 start src/index.js --name "<project-name>-backend"

# 5. SSL 证书
#    面板 → 网站 → SSL → Let's Encrypt 申请
```

#### 2.4 1Panel 集成

```bash
# ===== 1Panel 部署步骤 =====

# 1. 创建网站
#    1Panel → 网站 → 创建网站 → 域名：<domain>

# 2. 配置反向代理
#    网站设置 → 反向代理 → 添加：
#    名称：API 代理
#    匹配规则：^/api/
#    代理地址：http://127.0.0.1:<port>

# 3. 部署前端
cd /opt/1panel/apps/openresty/<domain>/www
git clone <repo-url> .
cd frontend && npm install && npm run build

# 4. 部署后端（Docker 方式）
cd /opt/1panel/apps/openresty/<domain>/www/backend
docker build -t <project-name>-backend .
docker run -d --name <project-name>-backend -p <port>:<port> <project-name>-backend

# 5. 申请 SSL
#    1Panel → 网站 → SSL → 申请证书
```

### Step 3：生成部署说明文档

```deploy/README.md```：

```markdown
# <项目中文名> 部署说明

## 环境要求

- 操作系统：<Ubuntu 22.04 / Debian 12 / CentOS 8 / ...>
- Node.js ≥ 18.0.0
- <数据库类型> <版本>
- Nginx 1.18+
- Redis 6.0+（如需要）

## 快速部署

### 一键部署

\`\`\`bash
chmod +x deploy/<os>/deploy.sh
./deploy/<os>/deploy.sh
\`\`\`

### 一键更新

\`\`\`bash
./deploy/<os>/update.sh
\`\`\`

### 回滚

\`\`\`bash
./deploy/<os>/rollback.sh
\`\`\`

## 目录结构

\`\`\`
/opt/<project-name>/
├── frontend/dist/     # 前端构建产物
├── backend/           # 后端代码
├── admin/dist/        # 后台管理面板（如有）
└── deploy/            # 部署脚本
\`\`\`

## 服务端口

| 服务 | 端口 |
|------|------|
| Nginx | 80 / 443 |
| 后端 API | <port> |
| 数据库 | 3306 / 5432 |
| Redis | 6379 |
```

### Step 4：写入 STEPS.md

在项目根目录 `STEPS.md` 追加「部署」章节：

```markdown
---

## 🚀 部署（基于 /sadeploy skill）

> 部署时间：YYYY-MM-DD HH:mm
> 目标 OS：<Ubuntu / Debian / CentOS / macOS / Windows>
> 部署方式：<原生部署 / Docker 容器>
> 面板：<无 / 宝塔 / 1Panel>
> 域名：<domain>
> SSL：<已启用 / 未启用>

### 📁 部署文件清单

| 文件 | 用途 |
|------|------|
| `deploy/<os>/deploy.sh` | 一键部署 |
| `deploy/<os>/update.sh` | 一键更新 |
| `deploy/<os>/rollback.sh` | 回滚 |
| `deploy/<os>/nginx.conf` | Nginx 配置 |
| `deploy/<os>/docker-compose.yml` | 容器编排（如选容器） |
| `deploy/README.md` | 部署说明 |

### ✅ 部署状态

- [x] 部署脚本已生成
- [x] Nginx 配置已生成
- [x] 部署说明已生成
- 首次部署：⏭ 待执行

### 📝 修改记录

| 时间 | 阶段 | 改动内容 |
|------|------|---------|
| YYYY-MM-DD HH:mm | 部署 | 生成部署脚本（<OS> + <部署方式>） |
```

### Step 5：输出最终结果

```
✅ 部署脚本已生成！

📁 目录：deploy/<os>/
📄 文件：
   • deploy.sh / deploy.ps1（一键部署）
   • update.sh / update.ps1（一键更新）
   • rollback.sh / rollback.ps1（回滚）
   • nginx.conf（Nginx 配置）
   • docker-compose.yml（容器编排，如选容器）
   • README.md（部署说明）

🚀 下一步：
   1. 将代码推送到服务器
   2. 执行 deploy/<os>/deploy.sh 一键部署
   3. 配置域名 DNS 解析到服务器 IP
   4. 如启用 SSL，运行 certbot 申请证书

📋 详细说明见 deploy/README.md
```

## 关联 Skill

- `saapi-connect` — 前置（前后端接通后）
- `saadmin` — 前置（后台管理面板，如有）
- `sacrossplatform` — 平级（移动端部署用 `/sadeploy-mobile`）
- `sadesktop` — 平级（桌面端部署用 `/sadeploy-desktop`）

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| 2026-08-06-1 | 初版：支持 Ubuntu/Debian/CentOS/macOS/Windows 全平台，原生部署 + Docker 容器两种方式，宝塔/1Panel 面板集成，生成 deploy.sh/update.sh/rollback.sh/nginx.conf/docker-compose.yml |