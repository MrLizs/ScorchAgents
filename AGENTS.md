# AGENTS — Scorch Agents 项目说明

## 项目概述

本项目是一个 **AI Agent 多智能体应用**的初始形态。项目的核心理念是：构建一个"虚拟团队"，其中包含不同领域、不同职能的 AI 员工（Agent），每个 Agent 都是经过精心设计的专业角色，具备明确的人格、工作流程和交付物标准。

## 目录结构

```
scorch-agents/
├── AGENTS                  # 本文件：项目整体说明
├── README.md               # 项目中文说明
├── README.en.md            # 项目英文说明
├── .gitmodules             # Git 子模块配置
├── .gitignore
└── agency-agents/          # 员工库（子模块）：所有 AI Agent 的定义文件
    ├── README.md           # 员工库详细说明（英文原版）
    ├── academic/           # 学术部门（人类学、地理学、历史学、叙事学、心理学）
    ├── design/             # 设计部门（UI/UX、品牌、视觉、图像提示词等）
    ├── engineering/        # 工程部门（前后端、AI、DevOps、移动端、数据库等 30+ 角色）
    ├── examples/           # 使用示例（多 Agent 协作场景）
    ├── finance/            # 财务部门（记账、分析、税务、投资研究）
    ├── game-development/   # 游戏开发部门（Unity、Unreal、Godot、Blender、Roblox）
    ├── gis/                # GIS 地理信息部门（分析、开发、3D、无人机测绘等）
    ├── integrations/       # 多工具集成支持（Claude Code、Cursor、Copilot 等）
    ├── marketing/          # 市场营销部门（社交媒体、SEO、短视频、直播电商等 30+ 角色）
    ├── paid-media/         # 付费媒体部门（PPC、广告创意、程序化购买等）
    ├── product/            # 产品部门（产品经理、趋势研究、反馈分析等）
    ├── project-management/ # 项目管理部（项目经理、工作室运营、Jira 流程等）
    ├── sales/              # 销售部门（外拓、交易策略、销售工程师等）
    ├── scripts/            # 安装/转换/检查脚本
    ├── security/           # 安全部门（渗透测试、威胁情报、合规审计等）
    ├── spatial-computing/  # 空间计算部门（visionOS、WebXR、XR 接口等）
    ├── specialized/        # 特色部门（客服、法务、HR、翻译、医疗等 40+ 角色）
    ├── strategy/           # 策略文档（剧本、手册、协调模板）
    ├── support/            # 支持部门（客服、分析、财务追踪、合规等）
    └── testing/            # 测试部门（证据收集、性能测试、可访问性审计等）
```

## agency-agents 员工库说明

本项目通过 Git 子模块引用了 [agency-agents](https://github.com/msitarzewski/agency-agents) 作为员工库。该库包含 **232 名 AI 专家**，分布在 **16 个部门**中。

### 各部门简介

| 部门 | 说明 | Agent 数量 |
|------|------|-----------|
| **engineering（工程）** | 前端、后端、AI、DevOps、移动端、数据库、代码审查、SRE 等 | 30+ |
| **marketing（市场营销）** | 社交媒体、短视频、直播电商、SEO、小红书/微信/抖音/知乎/B站等 | 30+ |
| **specialized（特色部门）** | 客服、法务、HR、翻译、医疗、房地产、供应链、企培等 | 40+ |
| **game-development（游戏开发）** | Unity、Unreal、Godot、Blender、Roblox、游戏设计等 | 20+ |
| **design（设计）** | UI、UX、品牌、视觉叙事、图像提示词等 | 9 |
| **security（安全）** | 渗透测试、安全架构、威胁情报、合规审计、区块链安全等 | 10 |
| **testing（测试）** | 证据收集、性能测试、API 测试、可访问性审计等 | 8 |
| **project-management（项目管理）** | 项目经理、工作室运营、Jira 流程、会议纪要等 | 7 |
| **sales（销售）** | 外拓策略、交易策略、销售工程师、提案策略等 | 9 |
| **paid-media（付费媒体）** | PPC、广告创意、程序化购买、追踪测量等 | 7 |
| **product（产品）** | 产品经理、趋势研究、反馈分析、行为助推等 | 5 |
| **support（支持）** | 客服、分析报告、财务追踪、合规检查等 | 6 |
| **finance（财务）** | 记账、财务分析、税务策略、投资研究 | 5 |
| **academic（学术）** | 人类学、地理学、历史学、叙事学、心理学 | 5 |
| **spatial-computing（空间计算）** | visionOS、WebXR、XR 接口、终端集成等 | 6 |
| **gis（GIS 地理信息）** | 空间数据分析、3D 场景、无人机测绘、Web GIS 等 | 13 |

### 每个 Agent 的结构

每个 Agent 文件（`.md`）通常包含以下内容：
- **身份与人格**：角色定位、沟通风格、个性特征
- **核心使命**：Agent 的职责范围与工作目标
- **关键规则**：领域特定的约束与原则
- **技术交付物**：具体产出物与代码示例
- **工作流程**：经过验证的逐步执行过程
- **成功指标**：可量化的质量标准

### 策略与剧本

`agency-agents/strategy/` 目录包含：
- **playbooks/**：7 阶段项目剧本（发现 → 策略 → 基础 → 构建 → 强化 → 发布 → 运营）
- **runbooks/**：场景化运行手册（企业功能、事件响应、营销活动、创业 MVP）
- **coordination/**：Agent 激活提示词与交接模板

更多详细信息请参阅 [agency-agents/README.md](agency-agents/README.md)。

## 当前状态

本项目处于**初始形态**，核心能力包括：
1. 完整的 Agent 角色库（232 名专家，16 个部门）
2. 多 Agent 协作场景示例（见 `agency-agents/examples/`）
3. 多种 AI 编码工具集成支持

后续将在此基础上构建 Agent 编排调度、任务分发、协作管理等核心能力。
