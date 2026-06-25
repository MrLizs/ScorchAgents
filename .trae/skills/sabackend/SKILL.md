---
name: "sabackend"
description: "基于 /saapi 生成的 OpenAPI 规范，按用户选择的技术栈与架构生成后端骨架，再逐接口实现并完善业务逻辑，最后审核完整性并生成 SQL 初始化文件。Invoke when 用户输入 /sabackend 或要求把 API 接口落地为可运行的后端服务。"
---

# /sabackend — 接口落地的后端服务

## 什么是后端服务？

前端（用户看到的页面）所有"数据从哪里来"、"提交到哪里去"，都要靠**后端服务**来回答。后端就是跑在服务器上的程序，负责：
- 接住前端的请求（登录、下单、看列表…）
- 去数据库里读 / 写数据
- 把结果按约定格式返回给前端

这个 skill 的工作就是：**按 API 接口规范，把后端服务一站式搭起来**，并保证每个接口都被实现、被记录、可追溯。

## 触发条件

- 用户输入 `/sabackend` 或 `/sabackend <项目目录>`
- **前置条件**：项目目录已有 `api/openapi.yaml`（由 `/saapi` 生成）

## 核心原则

1. **接口规范来源**：读取 `api/openapi.yaml` + `api/API.md`（由 saapi 产出）
2. **技术栈选择**：每次启动时由用户选择（4 预设 + 自定义）
3. **架构选择**：每次启动时由用户选择（用大白话 + 专业术语并排展示）
4. **存放位置**：`backend/` 目录，与 `prototype/`、`frontend/`、`api/` 平级
5. **配置文件**：`backend/config.yaml` 只放**数据库连接**配置
6. **初始化数据**：`backend/sql/init.sql` 放 DDL + 初始数据（含 JWT secret 等运行参数默认值）
7. **步骤追踪**：在项目根目录维护 `STEPS.md`（与 safrontend 的 STEPS.md 合并存在）
8. **完整性**：最后一步必须核对 OpenAPI 中的每一个接口都在 STEPS.md 与代码中有映射
9. **SQL 可重入**：每次执行 init.sql 会先清理表数据再插入初始数据（幂等）

## 与其他 skill 的关系

```
/sainit-* ──► /safrontend ──► /saapi ──► /sabackend（本 skill）
   原型          前端代码        接口规范       后端实现
```

**典型调用顺序**：
1. `/sainit-shop` 生成 prototype/
2. `/safrontend` 把 prototype 转成前端代码
3. `/saapi` 从前端代码 + prototype 反推生成 OpenAPI 规范
4. `/sabackend` 按 OpenAPI 规范落地后端

> 四步可并行，但 sabackend 必须在 saapi 之后执行。

## 产出文件结构

```
<project-name>/
├── prototype/
├── frontend/
├── api/
│   ├── openapi.yaml                ← /saapi 产出，本 skill 只读
│   └── API.md                      ← /saapi 产出，本 skill 只读
├── backend/                        ← 本 skill 产出
│   ├── config.yaml                 数据库连接配置（仅此一项）
│   ├── sql/
│   │   └── init.sql                表结构 + 初始数据 + 运行参数
│   ├── src/                        源码（根据技术栈不同而不同）
│   ├── tests/                      测试（按需）
│   ├── package.json / go.mod / requirements.txt / ...
│   ├── tsconfig.json / .env.example / ...
│   └── README.md                   启动说明
└── STEPS.md                        后端开发步骤追踪（与 safrontend 共用）
```

> 💡 **为什么 DB 配置单独放 yaml，而运行参数放 SQL？**
> - `config.yaml`：环境敏感（开发 / 测试 / 生产可能不同），由运维维护
> - `init.sql`：包含 `system_config(key, value)` 表，**默认参数**（JWT secret、站点名、上传域名…）以 INSERT 写入；后续可通过后台管理页面修改，无需改文件

## 工作流程（严格按顺序）

### Step 0：前置检查

> 📂 **接口规范路径（固定）**：`<项目根>/api/`，由 `/saapi` skill 生成。本项目**只有这一个 api 目录**，不支持多 api / 子项目。
> - `api/openapi.yaml` — 机器可读的 OpenAPI 3.0 规范（**主要来源**，本 skill 解析此文件生成所有接口）
> - `api/API.md` — 人类可读的接口说明（参考用，遇到 yaml 字段歧义时查阅）
> - `api/mock-data.json` — saapi 提取的示例数据（Phase 2 通过**路径引用**，不复制）
>
> ⚠️ 本 skill **绝不修改** `api/` 目录下的任何文件——那是 `/saapi` 的领域。

1. **固定路径检查**（不询问、不支持自定义）：
   - `<项目根>/api/openapi.yaml` 是否存在？
   - 不存在 → 提示「请先运行 `/saapi` 生成接口规范」并终止
2. 检查 `api/` 目录完整度（`API.md` / `mock-data.json` 至少存在 `openapi.yaml`）
3. 读取 `api/openapi.yaml`，统计 `paths` 节点下的接口数量 → N
4. **计算指纹**（用于后续变更检测）：
   - `sha256(api/openapi.yaml)` → H1
   - `sha256(api/API.md)` → H2（可选）
   - `sha256(api/mock-data.json)` → H3（可选）
   - `mtime` → T1 / T2 / T3
   - 写入 STEPS.md 顶部「API 来源指纹」表格
5. 检查 `backend/` 是否已存在 → 存在则询问「继续开发 / 重建 / 取消」
6. 询问用户**是否在已有 STEPS.md 上追加**（默认追加），避免覆盖前端开发记录

**指纹变更检测（每次重新启动 sabackend 时自动执行）**：
```bash
# 对比当前 hash 与 STEPS.md 记录的 hash
if [ "$(sha256sum api/openapi.yaml)" != "<STEPS.md 记录的 H1>" ]; then
  echo "⚠️ /saapi 已更新 openapi.yaml（hash 变化），请确认是否要重新生成受影响接口"
  # 不自动重写，由用户决定
fi
```

输出确认：
```
🔍 检测到 API 规范来源：<项目根>/api/ 文件夹（由 /saapi 生成，路径固定）
   • api/openapi.yaml     ✅ 已找到（机器规范）
   • api/API.md           ✅ 已找到（人类文档）
   • api/mock-data.json   ✅ 已找到（示例数据）
   • 统计接口数：N 个
🔐 已记录指纹：openapi.yaml sha256=abc123... mtime=2026-06-25 10:00
🆕 将创建 backend/ 目录
📝 将在 STEPS.md 追加「后端开发」章节
```

---

### Step 1：选择技术栈与架构 → 生成骨架

#### 1.1 询问技术栈（单选 + 自定义）

使用 `AskUserQuestion`，**每个选项都用大白话 + 专业术语**，让小白也能选：

> 请选择后端技术栈：
> - **A. Node.js + Express + TypeScript（推荐）**
>   - 大白话：跟前端一样用 JS，能直接复用前端类型；上手最快
>   - 适合：中小项目、快速迭代、前端出身的开发者
> - **B. Node.js + NestJS + TypeScript**
>   - 大白话：企业级 Express，自带模块化、依赖注入、装饰器，开箱即用
>   - 适合：中大型项目、团队协作、长期维护
> - **C. Python + FastAPI**
>   - 大白话：写最少代码搞定接口，自动生成文档，跟 AI 生态天然打通
>   - 适合：AI / 数据相关项目、快速原型
> - **D. Go + Gin**
>   - 大白话：性能怪兽，编译成单个二进制直接跑，配置天然用 yaml
>   - 适合：高并发、追求性能、部署简单
> - **E. 其他（请说明）**
>   - 例：Java + Spring Boot、PHP + Laravel、Rust + Actix、.NET Core 等
>   - 选择后 AI 会再追问关键信息（ORM、中间件生态等）

> 选定后必须立即追问：**ORM / 数据库驱动**：
> - Node.js：Prisma（推荐） / TypeORM / Sequelize / Knex / 原生 mysql2
> - Python：SQLAlchemy（推荐） / Tortoise ORM / 原生 aiomysql
> - Go：GORM（推荐） / sqlx / 原生 database/sql

> 再追问：**数据库类型（主存储 + 缓存）**：

> **主存储**（业务数据，4 选 1 + 不明白 + 其它）：
> - **A. MySQL**（推荐，国内主流，社区成熟）
>   - 大白话：互联网项目最常用的关系型数据库
> - **B. PostgreSQL**（推荐，特性最强）
>   - 大白话：功能最强的开源关系型数据库，支持 JSON、地理信息、全文检索等
> - **C. MongoDB**（文档型 NoSQL）
>   - 大白话：不用建表，数据以 JSON 文档存储，适合字段经常变化的业务
> - **D. 我不太明白 / 让 AI 推荐**
>   - 默认：PostgreSQL 最新版本（特性全、扩展强、开箱即用）
> - **E. 其他**（请说明，如：SQLite / Oracle / SQL Server / TiDB / OceanBase…）

> **缓存**（可选，是否启用 Redis）：
> - **A. 启用 Redis**（推荐，用于 Session、限流、热点缓存、消息队列）
> - **B. 不启用**（单实例 / 极简项目可跳过）

> 选定后根据组合生成 `config.yaml` 字段：
> - 仅 MySQL/PostgreSQL → `database:` 块
> - 含 Redis → 追加 `redis:` 块
> - MongoDB → `database:` 块换为 `mongodb:`（URI 形式）

#### 1.2 询问部署架构（单选，默认单体）

> 请选择后端**部署架构**（影响运行时结构与配置文件分布）：
> - **A. 单体 Monolith（默认推荐）** ✅
>   - 大白话：所有功能打包成一个服务，一个进程跑全部业务
>   - 优点：简单、部署一次搞定、适合中小项目和 MVP
>   - 适用：90% 的项目从这里起步
> - **B. 模块化单体 Modular Monolith**
>   - 大白话：代码按模块严格隔离（如用户模块、订单模块互不直接依赖），但仍部署为一个进程
>   - 优点：未来可平滑拆微服务
> - **C. 微服务 Microservices**
>   - 大白话：每个领域独立部署、独立进程、独立数据库（gateway / auth-service / order-service…）
>   - 优点：故障隔离、独立伸缩
>   - 缺点：复杂度高、需要服务发现 / 链路追踪
> - **D. Serverless（按调用计费）**
>   - 大白话：函数即服务（AWS Lambda / 阿里云函数计算 / Vercel Functions…）
>   - 适用：流量波动大、追求极致成本
> - **E. 其他（请说明）**

#### 1.3 询问代码组织架构（单选，每次必问）

> 请选择**代码组织架构**（影响目录划分与职责边界，与部署架构正交）：
> - **A. 分层架构 Controller → Service → Repository（推荐新手）**
>   - 大白话：把代码按"接请求 / 写业务 / 读数据库"分成三层，每层只管自己那摊事
>   - 优点：最经典、最容易懂、与 RESTful 接口一一对应
>   - 目录：`controllers/` `services/` `repositories/` `models/`
> - **B. DDD 领域驱动设计**
>   - 大白话：按"业务领域"切分代码（用户域、订单域、商品域…），每域自包含
>   - 优点：业务复杂时最可维护
>   - 目录：`domain/user/` `domain/order/` ... 每个域内含 `controller.ts` `service.ts` `repository.ts`
> - **C. Clean Architecture 清洁架构**
>   - 大白话：依赖倒置，外圈依赖内圈，业务规则不沾框架
>   - 优点：替换框架 / 数据库无痛；缺点：样板代码多
>   - 目录：`domain/` `application/` `infrastructure/` `interfaces/`
> - **D. MVC 模型-视图-控制器**
>   - 大白话：传统 Web 三层（注：API 项目里 View 层实际为 Response DTO）
>   - 适合：习惯 Laravel / Django / Spring MVC 的开发者
> - **E. NestJS 模块化（仅 NestJS 可选）**
>   - 大白话：NestJS 官方风格，按 Module 组织（UserModule / OrderModule…）
>   - 目录：`modules/user/` 每个 module 含 controller / service / module / dto
> - **F. 其他（请说明）**

#### 1.4 询问命名规范（单选，决定表名 / 控制器 / 模块前缀）

> 请选择数据库表与代码文件的**命名规范**（影响 init.sql 中所有表名、controller 文件名）：
> - **A. 项目拼音前缀 + 功能（默认）** ✅
>   - 大白话：用项目中文名的拼音首字母做统一前缀，避免和其它项目冲突
>   - 示例：项目「好物触手」商城 → 前缀 `hwcs_` → 账号表 `hwcs_accounts`、商品表 `hwcs_products`
> - **B. 业务模块前缀 + 功能**
>   - 大白话：每个业务模块有自己的前缀（账号模块 `acc_`、订单模块 `ord_`…）
>   - 示例：`acc_users`、`ord_orders`、`pay_payments`
> - **C. 纯功能名（无前缀）**
>   - 大白话：直接用 `users` / `products` / `orders`，最简洁
>   - 缺点：多项目共享一个数据库时容易冲突
> - **D. 完整英文 + 功能**
>   - 大白话：用项目英文名全称做前缀（适合英文项目或跨国团队）
>   - 示例：项目 `fashion-shop` → 前缀 `fashion_` → `fashion_accounts`
> - **E. 我不太明白 / 让 AI 决定**
>   - 默认规则：**自动取项目中文名拼音首字母（最多 4 位）作为前缀**，加上功能名
>   - 示例：项目「好物触手」→ 前缀 `hwcs_` → `hwcs_<功能>`
>   - 实施时 AI 会先询问用户项目中文名再生成
> - **F. 其他（请说明）**

> 选定后在 init.sql 与代码中**全局生效**，例如：
> ```sql
> -- 选 A 且项目「好物触手」
> CREATE TABLE hwcs_accounts (...);
> CREATE TABLE hwcs_products (...);
>
> -- 选 D 且项目英文名 fashion-shop
> CREATE TABLE fashion_accounts (...);
> CREATE TABLE fashion_products (...);
> ```

> AI 自动推导项目中文名：
> 1. 从项目根目录的 `package.json` / `README.md` 中读取项目名
> 2. 若为英文名（如 `fashion-shop`），先询问用户其中文含义，再生成拼音前缀
> 3. 若用户选 E 且未提供中文名，使用项目名首字母（去元音）作为兜底

#### 1.5 生成 `backend/` 目录与配置文件

**1.5.1 创建目录骨架**

按所选技术栈 + 架构生成对应目录结构：

**示例 1：Node + Express + TS + 分层架构**
```
backend/
├── config.yaml
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── sql/
│   └── init.sql
└── src/
    ├── index.ts                  入口
    ├── app.ts                    Express 实例
    ├── config/
    │   └── index.ts              读取 config.yaml
    ├── middlewares/
    │   ├── auth.ts               JWT 校验
    │   ├── error.ts              全局错误处理
    │   └── logger.ts             请求日志
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   └── ...
    ├── services/
    │   ├── auth.service.ts
    │   └── ...
    ├── repositories/
    │   ├── user.repository.ts
    │   └── ...
    ├── models/                   ORM 模型
    ├── dto/                      请求 / 响应类型
    ├── routes/
    │   └── index.ts              统一挂载 /api/v1/*
    ├── utils/
    └── db/
        └── client.ts             Prisma / 数据库客户端单例
```

**示例 2：Go + Gin + 分层架构**
```
backend/
├── config.yaml
├── go.mod
├── main.go
├── sql/
│   └── init.sql
├── config/
│   └── config.go                读取 config.yaml（viper）
├── internal/
│   ├── handler/                 Controller
│   ├── service/
│   ├── repository/
│   ├── model/
│   ├── middleware/
│   └── router/
└── pkg/
    ├── database/                GORM 初始化
    └── jwt/
```

（其他栈与架构的目录按相同原则生成，详细模板在 §1.5.5）

**1.5.2 生成 `backend/config.yaml`（仅数据库配置）**

```yaml
# 数据库连接配置
# 注意：JWT secret、站点名等运行参数请在 sql/init.sql 的 system_config 表中维护
database:
  host: localhost
  port: 3306
  username: root
  password: ""                # 首次安装留空，启动后通过 .env 或后台修改
  name: app_db
  charset: utf8mb4
  timezone: "+08:00"
  pool:
    min: 2
    max: 20

# 可选：Redis（如使用）
redis:
  host: localhost
  port: 6379
  password: ""
  db: 0
```

> ⚠️ **此文件仅放 DB 连接**。运行参数（JWT secret、上传域名、短信 key…）写入 `system_config` 表。

**1.5.3 生成 `backend/sql/init.sql`（DDL + 初始数据）**

> ⚠️ **本节所有表名都必须套用 §1.4 选定的命名规范前缀**：
> - 选 A（如 `hwcs_`）→ `hwcs_users`、`hwcs_products`、`hwcs_orders`...
> - 选 C（无前缀）→ `users`、`products`、`orders`...
> - 选 D（如 `fashion_`）→ `fashion_users`...
>
> 示例（项目「好物触手」选 A）：
> ```sql
> DROP TABLE IF EXISTS hwcs_order_items;
> DROP TABLE IF EXISTS hwcs_orders;
> DROP TABLE IF EXISTS hwcs_products;
> DROP TABLE IF EXISTS hwcs_accounts;
> ...
> CREATE TABLE hwcs_accounts (...);
> CREATE TABLE hwcs_products (...);
> ```
>
> 系统通用表（roles / system_config）**不套业务前缀**，保留通用命名以便跨项目复用。

按 OpenAPI 中出现的所有 model（schema）生成对应表。规则：

1. **DROP + CREATE 模式**（保证幂等、可重入）：
   ```sql
   -- 每个表按外键依赖倒序 DROP
   DROP TABLE IF EXISTS order_items;
   DROP TABLE IF EXISTS orders;
   DROP TABLE IF EXISTS products;
   DROP TABLE IF EXISTS users;
   DROP TABLE IF EXISTS system_config;
   DROP TABLE IF EXISTS roles;

   -- 再按正序 CREATE
   CREATE TABLE roles (...) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
   CREATE TABLE users (...) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
   ...
   ```

2. **必须包含的通用表**：
   - `roles`（角色表）：admin / user 等
   - `users`（用户表）：含 `password_hash`、`role_id`、`status` 等
   - `system_config`（KV 配置表）：
     ```sql
     CREATE TABLE system_config (
       `key`   VARCHAR(64)  NOT NULL PRIMARY KEY,
       `value` TEXT         NOT NULL,
       `desc`  VARCHAR(255),
       `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

     INSERT INTO system_config (`key`, `value`, `desc`) VALUES
       ('jwt_secret',           'CHANGE_ME_AFTER_FIRST_RUN', 'JWT 签名密钥，首次启动后必须修改'),
       ('jwt_expire_seconds',   '7200',                        'Access Token 有效期（秒）'),
       ('refresh_expire_seconds','2592000',                    'Refresh Token 有效期（秒）'),
       ('site_name',            'My App',                      '站点名称'),
       ('upload_domain',        'https://cdn.example.com',     '文件访问域名'),
       ('sms_provider',         'mock',                        '短信服务商：mock/aliyun/tencent'),
       ('oss_provider',         'local',                       '对象存储：local/aliyun/tencent/qiniu'),
       ('wechat_app_id',        '',                            '微信 AppID'),
       ('wechat_app_secret',    '',                            '微信 AppSecret');
     ```

3. **业务表 DDL**：从 OpenAPI 的 schema 推断（**表名套用 §1.4 选定的前缀**）：
   | OpenAPI schema | 表名（含 §1.4 前缀） | 字段映射 |
   |---------------|------|---------|
   | User / Account | `<prefix>accounts` 或 `<prefix>users` | id, username, password_hash, phone, email, avatar, role_id, status, created_at, updated_at |
   | Product | `<prefix>products` | id, name, description, price, stock, images(JSON), category_id, status, created_at, updated_at |
   | Order | `<prefix>orders` | id, user_id, total_amount, status, address(JSON), created_at, updated_at |
   | OrderItem | `<prefix>order_items` | id, order_id, product_id, quantity, unit_price |
   | ... | ... | ... |

4. **初始数据 INSERT**：
   - 默认角色：`('admin','超级管理员')`, `('user','普通用户')`
   - 默认管理员账号：`admin / 123456`（密码 bcrypt 哈希值由 skill 模板预生成）
   - 字典数据 / 状态枚举：按 OpenAPI enum 生成
   - 演示数据：见用户在 saapi 阶段勾选的内容决定是否插入

5. **末尾追加幂等提示注释**：
   ```sql
   -- ============================================
   -- 重新执行本文件会：
   --   1. 删除并重建所有业务表（数据会丢失！）
   --   2. 重新插入初始数据
   --   3. 重新生成 system_config 默认值
   -- 生产环境执行前请先备份！
   -- ============================================
   ```

**1.5.4 关键脚手架代码模板**

| 技术栈 | 入口文件 | 关键依赖 |
|-------|---------|---------|
| Node + Express + TS | `src/index.ts` + `src/app.ts` | express, cors, helmet, jsonwebtoken, bcryptjs, prisma/@prisma/client, js-yaml, pino |
| Node + NestJS + TS | `src/main.ts` + `src/app.module.ts` | @nestjs/core, @nestjs/jwt, @nestjs/passport, prisma, class-validator |
| Python + FastAPI | `main.py` + `app/` | fastapi, uvicorn, sqlalchemy[asyncio], pyjwt, passlib[bcrypt], pyyaml, alembic |
| Go + Gin | `main.go` + `internal/router/` | gin, gorm, viper, golang-jwt/jwt, bcrypt, zap |

**1.5.5 「其他」技术栈**

若用户选 E（如 Java Spring Boot），AI 必须继续追问：
- 构建工具：Maven / Gradle
- ORM：MyBatis / MyBatis-Plus / Spring Data JPA / Hibernate
- 鉴权：Spring Security / Sa-Token / Shiro / 自研 JWT

追问完毕后，按该生态标准目录生成（如 Spring Boot 的 `src/main/java/com/example/{controller,service,repository,entity,dto,config}/`）。

#### 1.6 安装依赖

根据所选栈自动执行：
- Node：`cd backend && npm install`
- Python：`pip install -r requirements.txt`
- Go：`go mod tidy`
- Java：`mvn install -DskipTests` 或 `gradle build -x test`

> **不强制启动服务**（仅装依赖、生成文件），由用户在 Step 4 后自行启动验证。

---

### Step 2：按 OpenAPI 生成接口（核心）

**目标**：把 OpenAPI 中**每一个接口**都映射到具体的 controller 方法 + route 路径，并写入 STEPS.md。

#### 2.1 解析 OpenAPI（从项目根的 `api/` 目录读取）

> 📂 **读取范围**：仅读取项目根目录下 `api/` 文件夹内由 `/saapi` 生成的文件。本 skill 不读其他任何目录。

**读取顺序**：

1. **主要来源** `api/openapi.yaml`：
   - 解析 `paths.<path>.<method>` 节点，遍历所有接口
   - 提取每个接口的：
     - HTTP method（GET / POST / PUT / PATCH / DELETE）
     - URL path（含 `{id}` 等路径参数）
     - 请求参数：`requestBody.content.application/json.schema`、query / path / header 参数
     - 响应 schema：`responses.200.content.application/json.schema`
     - 鉴权要求：`security` 字段（`bearerAuth` / `adminAuth` / 无）
     - tag：决定归属哪个控制器
     - `operationId`（如存在）：作为控制器方法名
   - 解析 `components.schemas`：所有 model 定义，用于生成 init.sql 表 DDL
   - 解析 `components.securitySchemes`：确认 JWT 方案

2. **参考** `api/API.md`：
   - 遇到 yaml 字段歧义或描述缺失时，查阅 API.md 中的人工说明
   - 不强制依赖（若 yaml 自描述已足够可跳过）

3. **引用** `api/mock-data.json`（**严格规则：禁止任何形式的拷贝**）：
   - ❌ **禁止**：把 `api/mock-data.json` 复制到 `backend/src/mock/` 下
   - ❌ **禁止**：在 `backend/` 内重新生成同结构数据
   - ❌ **禁止**：在 init.sql 里 INSERT 演示数据
   - ✅ **必须**：Phase 2 在 `backend/src/mock/index.ts` 内通过**相对路径直接 import** 源文件

   **实现示例**（Node + TS）：
   ```ts
   // backend/src/mock/index.ts
   // ⚠️ 此文件不持有数据，只做路径转发
   import mockData from '../../../api/mock-data.json';   // ← 直接指向 saapi 产出

   export default mockData;
   ```

   **实现示例**（Python）：
   ```python
   # backend/app/mock.py
   # ⚠️ 路径指向项目根的 api/mock-data.json（与 backend 同级）
   import json, pathlib
   _MOCK_PATH = pathlib.Path(__file__).resolve().parents[2] / 'api' / 'mock-data.json'
   mock_data = json.loads(_MOCK_PATH.read_text(encoding='utf-8'))
   ```

   **实现示例**（Go）：
   ```go
   // backend/internal/mock/mock.go
   // 用 go:embed 嵌入（在编译期读取源文件，仍是单一来源）
   //go:embed ../../../api/mock-data.json
   var mockData []byte
   ```

   **运行时验证**：后端启动时若 `api/mock-data.json` 不存在，Phase 2 接口应**直接报错**而非降级：
   ```
   Error: mock-data.json not found at <项目根>/api/mock-data.json
   → 请先运行 /saapi 生成 mock 数据
   ```

**解析产物**（内存中的接口清单）：

| 字段 | 示例 | 来源 |
|------|------|------|
| `id` | 1 | 自增序号 |
| `method` | POST | `paths./auth/login.post` |
| `path` | `/api/v1/auth/login` | 同上 |
| `operationId` | `login` 或 `authLogin` | `paths./auth/login.post.operationId` |
| `tag` | `Auth` | `paths./auth/login.post.tags[0]` |
| `auth` | `bearerAuth` / `adminAuth` / `none` | `paths./auth/login.post.security` |
| `requestSchema` | `{ username, password }` | `paths./auth/login.post.requestBody...` |
| `responseSchema` | `{ code, data: { token, user } }` | `paths./auth/login.post.responses.200...` |
| `openapiPointer` | `paths./auth/login.post` | 用于 STEPS.md 反查 |
| `mockDataKey` | `auth.login` | `mock-data.json` 的 key |

#### 2.2 接口归类与命名

| tag | 控制器命名 | 路径前缀 |
|-----|----------|---------|
| Auth / 认证 | AuthController | `/api/v1/auth` |
| User / 用户 | UserController | `/api/v1/users` |
| Product / 商品 | ProductController | `/api/v1/products` |
| Order / 订单 | OrderController | `/api/v1/orders` |
| SDK.* | SdkController | `/api/v1/sdk` |
| Admin.* | *AdminController | `/api/v1/admin/<module>` |
| 其他 | 按 tag 名 | `/api/v1/<tag-lowercase>` |

#### 2.3 生成接口代码（最简骨架）

每个接口生成"**接住请求 → 返回 mock 数据**"的最小可用实现：

**示例：Express + 分层架构**

`src/controllers/product.controller.ts`：
```ts
import { Request, Response } from 'express';
import productService from '../services/product.service';

export const list = async (req: Request, res: Response) => {
  const result = await productService.list(req.query);
  res.json({ code: 0, data: result });
};

export const detail = async (req: Request, res: Response) => {
  const result = await productService.detail(Number(req.params.id));
  res.json({ code: 0, data: result });
};

export const create = async (req: Request, res: Response) => {
  const result = await productService.create(req.body);
  res.json({ code: 0, data: result });
};
```

`src/services/product.service.ts`：
```ts
// Phase 2 阶段：仅返回 mock 数据，不连数据库
// Phase 3 阶段：在此实现真实业务逻辑
import { mockProducts } from '../mock/products';

export default {
  async list(query: any) {
    return { items: mockProducts, total: mockProducts.length };
  },
  async detail(id: number) {
    return mockProducts.find(p => p.id === id);
  },
  async create(body: any) {
    return { id: Date.now(), ...body };
  },
};
```

> ⚠️ **Phase 2 不写业务逻辑**，只生成"能跑通"的骨架，让前端能立刻联调。

#### 2.4 询问用户：是否完全按 OpenAPI 创建？

使用 `AskUserQuestion`：

> 已根据 OpenAPI 共识别 **N 个接口**，将全部按规范创建（路径 / 方法 / 请求 / 响应与 OpenAPI 一致）。
>
> - **A. 完全按 API 创建**（推荐，确保与 saapi 规范 1:1 对齐）
> - **B. 部分调整**（请告知哪些接口要调整、改成什么）
> - **C. 跳过某些接口**（列出暂时不实现的接口，后续追加）

#### 2.5 写入 STEPS.md（**关键**）

在项目根目录的 `STEPS.md` 中追加「后端开发」章节，**每个接口都要记录**：

```markdown
---

## 🔧 后端开发（基于 /saapi 接口规范）

> 技术栈：Node.js + Express + TypeScript
> 架构：分层架构 Controller → Service → Repository
> 代码目录：`backend/`
> 配置：`backend/config.yaml` + `backend/sql/init.sql`
> 创建时间：YYYY-MM-DD
> 接口来源：`<项目根>/api/openapi.yaml`（路径固定，由 /saapi 生成）

### 🔐 API 来源指纹（变更检测用）

> ⚠️ 每次重新启动 `/sabackend` 时自动比对下方 hash；不一致则提示「saapi 已更新，是否重新生成受影响接口」。

| 文件 | SHA-256（启动时计算） | mtime（启动时计算） | 当前状态 |
|------|---------------------|--------------------|---------|
| `<项目根>/api/openapi.yaml`    | `abc123def456...` | `2026-06-25 10:00:00` | ✅ 与首次一致 |
| `<项目根>/api/API.md`          | `789ghi012jkl...` | `2026-06-25 10:00:00` | ✅ 与首次一致 |
| `<项目根>/api/mock-data.json`  | `345mno678pqr...` | `2026-06-25 10:00:00` | ✅ 与首次一致 |

> 📌 **状态说明**：
> - ✅ 与首次一致 — 文件未变
> - 🟡 hash 变化 — `/saapi` 已重新生成，**需人工确认**是否要重生成后端受影响接口
> - ❌ 文件缺失 — saapi 产出被删除，需立即重新运行 `/saapi`

### 🎯 接口映射清单（来源：项目根目录 `api/openapi.yaml`，由 `/saapi` 生成）

| # | Method | Path | 鉴权 | OpenAPI 定位 | Tag | 控制器.方法 | 服务.方法 | 数据访问 | Mock 来源 | 状态 |
|---|--------|------|------|------------|-----|-----------|----------|---------|----------|------|
| 1 | POST   | /api/v1/auth/login        | -    | openapi.yaml: `paths./api/v1/auth/login.post`            | Auth | auth.controller.ts:login           | auth.service.ts:login           | userRepo.findByUsername | mock-data.json: `auth.login` | ✅ |
| 2 | POST   | /api/v1/auth/register     | -    | openapi.yaml: `paths./api/v1/auth/register.post`         | Auth | auth.controller.ts:register        | auth.service.ts:register        | userRepo.create          | mock-data.json: `auth.register` | ✅ |
| 3 | POST   | /api/v1/auth/refresh      | JWT  | openapi.yaml: `paths./api/v1/auth/refresh.post`          | Auth | auth.controller.ts:refresh         | auth.service.ts:refresh         | -                       | mock-data.json: `auth.refresh` | ✅ |
| 4 | GET    | /api/v1/users/me          | JWT  | openapi.yaml: `paths./api/v1/users/me.get`               | User | user.controller.ts:me             | user.service.ts:me             | userRepo.findById       | mock-data.json: `users.me` | ✅ |
| 5 | GET    | /api/v1/products          | -    | openapi.yaml: `paths./api/v1/products.get`               | Product | product.controller.ts:list         | product.service.ts:list         | productRepo.findMany     | mock-data.json: `products.list` | ✅ |
| 6 | GET    | /api/v1/products/{id}     | -    | openapi.yaml: `paths./api/v1/products/{id}.get`          | Product | product.controller.ts:detail       | product.service.ts:detail       | productRepo.findById     | mock-data.json: `products.detail` | ✅ |
| 7 | POST   | /api/v1/products          | Admin| openapi.yaml: `paths./api/v1/products.post`              | Product | product.controller.ts:create       | product.service.ts:create       | productRepo.create       | mock-data.json: `products.create` | ✅ |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**总计**：N 个接口 / M 个已实现 ✅

> 📌 **列说明**：
> - **OpenAPI 定位**：精确指向 `api/openapi.yaml` 中的节点路径，方便反查/核对/排错
> - **Mock 来源**：Phase 2 直接 `import` `api/mock-data.json` 对应 key，**不复制数据**
> - **Tag**：来自 yaml 的 `tags[0]`，决定控制器归属（§2.2）
> - **状态**：⬜ 待实现 / 🟡 骨架完成 / ✅ 功能完善 / ❌ 暂不实现

### 🚧 Phase 1：脚手架（agent 自动完成）

> 技术栈：<所选栈>　部署架构：<单体/微服务/...>　代码架构：<分层/DDD/...>
> 命名规范：<§1.4 选定方案 → 前缀 `<prefix>_`>　数据库：<MySQL/PostgreSQL/MongoDB> + <Redis/无>

- [ ] Step 1.1：创建 backend/ 目录
- [ ] Step 1.2：选定命名规范 → 推导项目拼音前缀（如 `hwcs_`）
- [ ] Step 1.3：生成 package.json / tsconfig.json
- [ ] Step 1.4：生成 config.yaml（数据库连接 + Redis）
- [ ] Step 1.5：生成 sql/init.sql（DDL + 初始数据 + system_config 默认值，**表名套 §1.4 前缀**）
- [ ] Step 1.6：生成 sql/migrations/ 目录与迁移文件（Flyway 风格，详见 §4.4）
- [ ] Step 1.7：生成入口与中间件骨架
- [ ] Step 1.8：依赖安装（npm/pip/go mod/maven）

### 🚧 Phase 2：接口骨架（agent 批量完成）

> 每个接口生成 controller + service + repo 的"接住请求 → 返回 mock"最小骨架

- [x] POST   /api/v1/auth/login    → `backend/src/controllers/auth.controller.ts:login`
- [x] POST   /api/v1/auth/register → `backend/src/controllers/auth.controller.ts:register`
- [x] POST   /api/v1/auth/refresh  → `backend/src/controllers/auth.controller.ts:refresh`
- [x] GET    /api/v1/users/me      → `backend/src/controllers/user.controller.ts:me`
- [x] GET    /api/v1/products      → `backend/src/controllers/product.controller.ts:list`
- [x] GET    /api/v1/products/{id} → `backend/src/controllers/product.controller.ts:detail`
- [x] POST   /api/v1/products      → `backend/src/controllers/product.controller.ts:create`
- [ ] ...（N 个接口逐一列出，未勾选 = 待 Phase 3 完善业务）

### 🚧 Phase 3：完善功能（agent 按用户勾选范围完成）

> 由用户在 Phase 2 完成后勾选本阶段范围：业务逻辑 / 数据校验 / 中间件 / 测试

- [ ] （待勾选）

### 🚧 Phase 4：完整性审核 + SQL 生成（agent 自动完成）

- [ ] 比对 STEPS.md 与 openapi.yaml 接口数是否一致
- [ ] 检查每个接口的文件路径 / 方法名是否能在代码中找到
- [ ] 生成 sql/init.sql（已包含在 Phase 1，此处复核）

### ✅ 后端项目状态

- 接口骨架：M / N ☑
- 功能完善：0 / 待勾选
- 完整性审核：⏳ 未开始
- SQL 初始化：✅ 已生成
```

> 📌 **「状态」列的语义**：
> - ⬜ 待实现
> - 🟡 已生成骨架（Phase 2）
> - ✅ 已完善功能（Phase 3）
> - ❌ 暂不实现

#### 2.6 进度可视化

每完成一批接口（按 controller），更新一次 STEPS.md 的「状态」列。

> ⚠️ **AI 必须逐接口开发，不能跳步**：先实现 #1，再 #2… 每完成一个立即更新 STEPS.md。

---

### Step 3：完善功能（业务逻辑 + 校验 + 中间件 + 测试）

#### 3.1 询问用户：完善哪些方面？

使用 `AskUserQuestion`（多选）：

> Phase 2 已生成 M 个接口的骨架，现在进入 Phase 3 完善功能。请勾选范围：
> - **A. 业务逻辑**（推荐）：在 Service 层实现真实业务，如订单状态流转、库存扣减、用户匹配
> - **B. 数据校验与异常处理**：Request DTO 校验、参数边界、统一错误响应（400/401/403/404/500）
> - **C. 中间件**：JWT 鉴权 / Refresh Token / 请求日志 / IP 限流 / CORS
> - **D. 单元 / 集成测试**：为 Service 和 Controller 补充最小可运行测试
> - **E. 其他**（请说明）

> 选定后 AI 再追问：「**一次性全部完成** 还是 **逐接口完成（每完成一个让你确认）**？」
> - 一次性：开发快、但中途不好调整
> - 逐接口：稳健、可控（推荐）

#### 3.2 按所选范围执行

**业务逻辑（按 OpenAPI 推断）**：

| 接口示例 | Service 需实现的业务规则 |
|---------|---------------------|
| POST /auth/login | 校验账号密码 → 查 user → bcrypt 比对 → 生成 access + refresh token |
| POST /products (下单相关) | 检查库存 → 扣减 → 创建订单 → 返回结果（事务） |
| GET /products | 支持分页 / 搜索 / 分类筛选 / 排序 |
| POST /orders/{id}/pay | 校验订单归属 → 调用支付 SDK → 更新订单状态 → 触发后续动作 |
| GET /admin/stats/dashboard | 聚合查询：今日订单数 / 营收 / 用户数 |

**数据校验与异常处理**：

| 栈 | 工具 | 模板 |
|---|------|------|
| Node Express | zod / class-validator | 在 service 入口做 schema 校验 |
| NestJS | class-validator + ValidationPipe | 自动 |
| Python FastAPI | pydantic | 自动 |
| Go Gin | go-playground/validator | binding tag |

**中间件（按需）**：

| 中间件 | 作用 | 默认开关 |
|-------|------|---------|
| cors | 跨域 | ✅ 开启 |
| helmet | 安全头 | ✅ 开启 |
| logger | 请求日志 | ✅ 开启 |
| auth | JWT 校验 | ✅ 开启 |
| rateLimit | IP 限流 | ✅ 开启 |
| errorHandler | 全局异常 | ✅ 开启 |

**测试（按需）**：

| 栈 | 测试框架 | 模板位置 |
|---|---------|---------|
| Node | Jest / Vitest | `tests/**/*.test.ts` |
| NestJS | Jest（默认） | `src/**/*.spec.ts` |
| Python | pytest | `tests/test_*.py` |
| Go | testing + testify | `*_test.go` 与源码同目录 |

#### 3.3 进度更新

每完成一个接口的 Phase 3 工作，立即更新 STEPS.md：
- 该接口的状态从 🟡 → ✅
- 追加修改记录

> 📌 **AI 必须严格按 STEPS.md 的接口顺序逐个完成**，避免遗漏。

---

### Step 4：完整性审核 + 生成 SQL 初始化文件

#### 4.1 完整性审核

**目标**：确保 OpenAPI 中**每一个接口**在代码 + STEPS.md 中都有对应实现。

执行：

```bash
# 1. 解析 OpenAPI 提取所有 (method, path)
# 2. 扫描 STEPS.md 表格中的接口
# 3. 扫描 backend/src 目录中的路由定义
# 4. 三者对比
```

审核报告模板：

```markdown
## 🔍 完整性审核报告

| 检查项 | OpenAPI | STEPS.md | 代码路由 | 差异 |
|-------|--------|---------|---------|------|
| 接口总数 | N | N | N | ✅ 一致 |
| 已实现 ✅ | - | N | N | ✅ |
| 仅骨架 🟡 | - | 0 | - | - |
| 未实现 ⬜ | - | 0 | 0 | - |
| 路径不一致 | - | 0 | 0 | ✅ |
| 方法缺失 | - | 0 | 0 | ✅ |
| 鉴权缺失 | - | - | 0 | ✅ |

### 检查结果：✅ 通过 / ❌ 不通过

（如不通过，列出缺失项，由用户决定补齐或确认忽略）
```

#### 4.2 生成 `backend/sql/init.sql`（已完成则复核）

如果 Step 1 已生成 init.sql，本阶段：
- 复核所有业务表 DDL 与 OpenAPI schema 一致
- 复核外键 / 索引完整
- 复核 system_config 默认值齐全
- 复核初始数据（admin / 角色 / 字典）完整
- 复核幂等性（DROP IF EXISTS + CREATE）

> 📌 **init.sql 必须满足**：删除后重跑可完整重建整个数据库 + 默认配置 + 初始数据。

#### 4.3 生成 `backend/README.md`

包含：
- 技术栈说明
- 启动命令（按栈）
- 环境变量（虽然 DB 走 yaml，但 JWT secret 等运行参数说明）
- 目录结构图
- 接口调试示例（curl）
- 数据库初始化步骤（`mysql -u root -p < sql/init.sql`）

#### 4.4 API 版本管理（迁移文件 Flyway 风格）

**目标**：业务迭代时 schema 会演进（加字段、加索引、加表），用版本化迁移文件管理，每次变更可追溯、可回滚。

**目录结构**：
```
backend/sql/
├── init.sql                    ← 全量初始化（首次部署使用，含 DROP + CREATE + INSERT）
└── migrations/                 ← 增量迁移（迭代使用，从 V2 开始累加）
    ├── V1__init_schema.sql              ← 由 init.sql 自动拆分生成（或与 init.sql 内容一致）
    ├── V2__add_user_avatar.sql          ← 后续：给 users 加 avatar 字段
    ├── V3__add_product_sku_index.sql    ← 后续：给 products 加联合索引
    └── ...
```

**命名规范**：`V<版本号>__<描述>.sql`，版本号单调递增，描述用下划线分隔的英文短语。

**自动生成规则（Phase 1）**：
1. **V1 文件**：由 init.sql 拆分得到（schema 部分，不含 seed data）
   ```sql
   -- V1__init_schema.sql
   -- 由 /sabackend 自动生成，对应 init.sql 的建表部分
   -- ⚠️ 此文件**不含** TRUNCATE / DROP，迁移工具自带版本管理

   CREATE TABLE hwcs_accounts (
     id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
     ...
   );
   ...
   ```
2. **空目录占位**：创建 `migrations/V1__init_schema.sql` 与 `.gitkeep`

**迁移工具（按栈选配）**：

| 技术栈 | 工具 | 启动命令 | 说明 |
|-------|------|---------|------|
| Node + Express | `node-pg-migrate` / `umzug` / 自研 Flyway 容器 | 启动时自动执行 | 跟踪 `schema_migrations` 表 |
| NestJS | `@nestjs/typeorm` migrations | `npm run migration:run` | TypeORM 风格 |
| Python + FastAPI | `alembic` | `alembic upgrade head` | 自动生成版本号 |
| Go + Gin | `golang-migrate/migrate` | `migrate up` | 主流方案 |
| Java Spring | `Flyway` | 自动随 Spring Boot 启动 | 工业标准 |

**与 init.sql 的关系**：

| 场景 | 用 init.sql | 用 migrations/ |
|------|-----------|---------------|
| 首次部署（开发/测试） | ✅ | ❌ |
| 全新部署（生产） | ✅ | ❌ |
| 后续迭代（加字段/索引） | ❌ | ✅ 生成 V2__xxx.sql |
| 数据修正（迁移数据） | ❌ | ✅ 生成 V2__xxx.sql |
| 重置开发环境 | ✅ | ❌（migrate down 或重建） |

**配置 `config.yaml` 中新增迁移段**：
```yaml
migrations:
  enabled: true
  directory: ./sql/migrations
  table: schema_migrations       # 迁移工具自带的版本跟踪表
  on_startup: true               # 启动时自动执行 pending 迁移
```

**ST 表新增迁移执行步骤**（由 agent 在每次接口 / 功能完善完成后追加）：
```
| 2025-XX-XX | V2 | hwcs_accounts 加 avatar 字段 | ALTER TABLE hwcs_accounts ADD COLUMN avatar VARCHAR(255) DEFAULT NULL; |
```

#### 4.5 生成 CI/CD 与部署模板

**目标**：让项目具备开箱即用的容器化部署能力。

**目录结构**：
```
backend/
├── Dockerfile                   ← 多阶段构建，最终镜像小、安全
├── docker-compose.yml           ← 本地一键启动（含 DB + Redis + 后端）
├── docker-compose.prod.yml      ← 生产环境编排（含 Nginx 反代）
├── .dockerignore
├── .github/                     ← GitHub Actions（可选）
│   └── workflows/
│       ├── ci.yml               ← 跑测试 + 构建镜像
│       └── cd.yml               ← 推送镜像到 Registry
└── deploy/
    ├── nginx.conf               ← 反向代理 + HTTPS
    └── systemd/
        └── backend.service      ← 传统部署（非 Docker）
```

**Dockerfile 模板（按栈）**：

| 技术栈 | 模板要点 |
|-------|---------|
| Node | 多阶段：`node:20-alpine` 构建 → `node:20-alpine` 运行；非 root 用户；`npm ci --only=prod` |
| NestJS | 同上 + `npm run build` 编译 dist/ |
| Python | 多阶段：`python:3.12-slim` 构建 wheel → `python:3.12-slim` 运行；非 root 用户 |
| Go | **单阶段即可**：`golang:1.22-alpine` 构建 → `gcr.io/distroless/static` 运行（CGO 关闭）；最终镜像 ~20MB |
| Java | 多阶段：`maven:3.9-eclipse-temurin-21` 构建 → `eclipse-temurin:21-jre-alpine` 运行 |

**docker-compose.yml 模板**：
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: app_db
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data
    ports:
      - "6379:6379"

  backend:
    build: .
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_started }
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      REDIS_HOST: redis
    ports:
      - "3000:3000"
    volumes:
      - ./backend/config.yaml:/app/config.yaml:ro
      - ./backend/sql:/app/sql:ro
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

> 📌 **注意**：`config.yaml` 与 `sql/` 通过 volume 挂载而非 COPY，方便部署时改配置不改镜像。

**GitHub Actions ci.yml 模板**：
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: test_db, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 5s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm test
      - run: docker build -t backend:${{ github.sha }} .
```

**询问用户是否生成**：
- 默认全部生成（Dockerfile + compose + Actions）
- 用户可选择性跳过（如只用传统部署）

#### 4.6 询问用户启动验证

> 🎉 后端服务已开发完毕！
>
> 请执行以下命令启动验证：
> ```bash
> # Node
> cd backend && npm run dev
>
> # Python
> cd backend && uvicorn main:app --reload
>
> # Go
> cd backend && go run main.go
> ```
>
> 测试通过后请回复「测试完成」或具体问题。

#### 4.7 Phase 4 完成判定 + 标记后端接口生成完毕

**判定条件（必须全部满足）**：

| # | 条件 | 检查方式 |
|---|------|---------|
| 1 | OpenAPI 中所有接口在 STEPS.md 接口映射清单均有对应行 | §4.1 完整性审核通过 |
| 2 | 所有接口状态列均为 ✅（或用户确认的 ❌ 暂不实现） | 扫描清单表格 |
| 3 | Phase 3 用户勾选的范围全部完成 | 业务 / 校验 / 中间件 / 测试 |
| 4 | `backend/sql/init.sql` 存在且可被 mysql/postgres 执行 | 文件存在 + 语法检查 |
| 5 | 后端启动命令可成功启动（用户已确认「测试完成」） | 用户反馈 |

**满足后执行**：

1. **更新 STEPS.md 后端章节末尾**：
   ```markdown
   ### 🎉 后端开发已完成

   - 后端接口：N / N ✅（全部实现完毕）
   - 功能完善：A / A ✅（业务/校验/中间件/测试按用户勾选完成）
   - SQL 初始化：✅ init.sql 已生成
   - API 完整性审核：✅ 通过
   - **完成时间**：YYYY-MM-DD
   ```

2. **追加后端完成日志**：
   ```markdown
   | YYYY-MM-DD | 后端完成 | 全部接口 ✅，后端开发阶段结束，可启动前端接入 |
   ```

#### 4.8 询问用户：是否开始前端接入？（触发 `/saapi-connect`）

**触发条件**：§4.7 全部满足后，**强制弹出**此询问（不询问则流程不闭环）。

使用 `AskUserQuestion`：

> 🎉 **后端所有接口已实现完毕！**
>
> 现在可以把前端代码（`/safrontend` 生成的 `frontend/`）接入到真实后端，完成最后一步「前后端接通」。
>
> 是否开始？
>
> - **A. 立即开始前端接入**（推荐）
>   - 自动跳转 `/saapi-connect`
>   - 该 skill 会：替换 baseURL、注入 JWT、替换 mock 认证、配置 Vite proxy + CORS、验证接通
> - **B. 暂时跳过，我稍后手动运行 `/saapi-connect`**
>   - sabackend 流程结束
>   - 后续可随时运行 `/saapi-connect` 完成接入
> - **C. 我要先修改 API 接口**
>   - 返回 §Step 2 修改 OpenAPI（需先重新运行 `/saapi` 再回到本 skill）

**用户选 A 后**：
1. agent 输出交接清单：
   ```
   🚀 启动 /saapi-connect

   📦 后端交接信息：
   - 后端基址：http://localhost:<port>（来自 backend/config.yaml）
   - API 前缀：/api/v1
   - 鉴权方案：JWT（access + refresh）
   - CORS 状态：待 /saapi-connect 添加前端域名
   - 接口总数：N 个
   - 完成的接口清单：见 STEPS.md 后端章节「接口映射清单」

   📦 前端需就位：
   - frontend/ 已存在（由 /safrontend 生成）
   - API 客户端脚手架已生成（client.ts / auth.ts / errorHandler.ts / .env.example）
   - 待 /saapi-connect 填充真实值

   🔐 API 指纹：openapi.yaml sha256=<hash>（与本 skill 记录一致 ✅）
   ```
2. agent 自动调用 `/saapi-connect` skill（等价于用户输入 `/saapi-connect`）
3. saapi-connect 完成后再回到本 skill 末尾输出最终总结

**用户选 B 后**：
- 输出：
  ```
  ✅ 后端开发已完成
  
  📝 后续步骤（用户自行执行）：
  1. 启动后端：cd backend && npm run dev
  2. 启动前端：cd frontend && npm run dev
  3. 接入前端：/saapi-connect
  
  📄 完整进度见：项目根目录 STEPS.md
  ```
- sabackend 流程结束

**用户选 C 后**：
- 提示：「请先修改 `api/openapi.yaml`（或重跑 `/saapi`），完成后再次运行 `/sabackend` 继续」
- sabackend 流程暂停

#### 4.9 整体闭环总结（最终输出）

无论用户选 A / B / C，sabackend 最终输出：

```
🎊 /sabackend 流程完成

✅ 已完成：
- 技术栈：<栈>
- 部署架构：<单体/...>
- 代码架构：<分层/...>
- 命名规范：前缀 <prefix>_
- 数据库：<DB> + <缓存>
- 接口实现：N / N ✅
- 功能完善：A / A ✅
- SQL 初始化：✅
- 完整性审核：✅
- CI/CD 模板：✅（如生成）

📊 项目完整度：
- /sainit-*     原型        ✅
- /safrontend   前端代码    ✅
- /saapi        接口规范    ✅
- /sabackend    后端实现    ✅
- /saapi-connect 前后端接通 <待办 / 进行中 / 已完成>

📂 产出目录：
- frontend/    前端代码
- backend/     后端代码 + Dockerfile + CI/CD
- api/         接口规范（saapi 产出）
- prototype/   原型（sainit 产出）
- STEPS.md     全流程进度
```

---

## 关键约定速查

| 项目 | 约定 |
|------|------|
| 后端目录 | `backend/` |
| 配置目录 | `backend/config.yaml`（仅 DB + Redis 连接）+ `backend/sql/init.sql`（其余） |
| 步骤追踪 | 项目根目录 `STEPS.md` |
| 接口规范来源 | 项目根目录 `api/openapi.yaml`（**由 `/saapi` 生成，本 skill 只读不写**） |
| API 文档参考 | `api/API.md`（saapi 产出，人类阅读） |
| Mock 数据 | `api/mock-data.json`（saapi 产出，**Phase 2 通过相对路径 import，禁止任何形式拷贝**） |
| 路径前缀 | `/api/v1/` |
| 鉴权 | JWT（Access + Refresh） |
| 业务表 DDL | 从 OpenAPI schema 推断，**表名套用 §1.4 命名规范前缀** |
| 命名规范 | 默认拼音前缀（如 `hwcs_`），其它主流选项见 §1.4 |
| 部署架构 | 默认单体（Monolith），可选模块化单体 / 微服务 / Serverless |
| 代码架构 | 默认分层（Controller→Service→Repository），其它见 §1.3 |
| 数据库 | 主存储：MySQL / PostgreSQL / MongoDB；缓存：Redis（可选） |
| 数据库驱动默认 | 用户选"不明白" → PostgreSQL 最新版本 |
| 初始管理员 | `admin / 123456`（首登后强制改密） |
| 运行参数存储 | `system_config(key, value)` 表 |
| 响应格式 | `{ code: 0, data: ..., message: '' }`，code 非 0 视为错误 |
| API 版本管理 | `backend/sql/migrations/V<版本>__<描述>.sql`（Flyway 风格），详见 §4.4 |
| CI/CD | Dockerfile + docker-compose.yml + GitHub Actions（ci/cd.yml），详见 §4.5 |
| 闭环 | 后端完成后自动询问是否启动 `/saapi-connect`（前端接入），详见 §4.7 / §4.8 |

## 与 safrontend STEPS.md 的关系

`STEPS.md` 是项目级单一文件：
- 上半部：`safrontend` 写入的前端开发记录
- 下半部：`sabackend` 追加的后端开发记录（以 `## 🔧 后端开发` 分隔）

两个 skill 都遵守「写一格、勾一格、绝不跳步」的原则。

## 失败 / 边界处理

| 场景 | 处理 |
|------|------|
| 项目根目录无 `api/openapi.yaml` | 提示用户先运行 `/saapi` 生成接口规范，本 skill 不自动生成 |
| `api/` 目录文件不完整（缺 API.md / mock-data.json） | 警告但继续，仅依赖 `openapi.yaml` 即可工作 |
| `backend/` 已存在 | 询问「继续开发 / 重建（清空）/ 取消」 |
| OpenAPI 解析失败 | 提示具体错误行，请用户修复后重试 |
| 选「其他」技术栈但缺信息 | 继续追问 ORM / 构建工具 / 鉴权方案等 |
| init.sql 执行时报外键错 | 按依赖倒序 DROP、修正建表顺序 |
| 用户中途打断 | 当前接口完成后停止，更新 STEPS.md 进度，不丢失已完成工作 |
| `api/openapi.yaml` hash 变化 | 重新计算 sha256 与 STEPS.md 比对，不一致时标记 STEPS.md 指纹表为 🟡，询问「是否重生成受影响接口」（**不自动重写**） |
| `api/mock-data.json` 被删除 | Phase 2 启动时**直接报错**，提示用户重跑 `/saapi`，不降级为空数据 |
| 检测到 backend 内拷贝了 mock-data.json | 警告「违反单一来源原则」，要求改为相对路径 import |

## 修改记录（skill 自身演进）

| 时间 | 改动 |
|------|------|
| YYYY-MM-DD | 初版：四步流程、技术栈 4 选 1 + 自定义、架构每次询问、config.yaml 仅 DB、init.sql 放初始数据 |
| YYYY-MM-DD v2 | 新增 §1.4 命名规范（主流 4 选 + 其它 + 不明白默认拼音前缀）；§1.2 拆分为「部署架构（默认单体）」与 §1.3「代码架构」；数据库选项扩充为 MySQL/PostgreSQL/MongoDB + Redis 缓存 + 不明白默认 PostgreSQL；新增 §4.4 Flyway 风格迁移与 §4.5 CI/CD（Dockerfile/compose/Actions）模板 |
| YYYY-MM-DD v3 | 强化与 `/saapi` 的边界：Step 0 / 2.1 明确「只读 `api/` 目录（saapi 产出）」；接口映射清单新增「OpenAPI 定位」列与「Mock 来源」列；新增 `api/openapi.yaml` 外部修改检测与提示 |
| YYYY-MM-DD v4 | 锁定 `api/` 路径固定（项目根，不支持多 api）；Step 0 增加 sha256 + mtime 指纹记录到 STEPS.md，启动时自动比对变更；mock-data.json 严格禁止拷贝，改为相对路径 import；新增三栈（Node/Python/Go）import 示例 |
| YYYY-MM-DD v5 | 新增 §4.7 完成判定（5 项必备）+ §4.8 自动询问启动 `/saapi-connect`（闭环前端接入）+ §4.9 全流程总结；与新建的 `saapi-connect` skill 形成 `/sainit-* → /safrontend → /saapi → /sabackend → /saapi-connect` 五段闭环 |