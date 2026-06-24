---
name: "sainit"
description: "项目初始化路由器：识别用户描述的项目类型，并路由到对应的子 skill（sainit-dating / sainit-shop / sainit-blog / sainit-tool）。Invoke when 用户输入 /sainit 且未指定具体类型。"
---

# /sainit — 项目初始化路由器

## 触发条件

- 用户输入 `/sainit <项目描述>`（**未指定类型**）
- 例：`/sainit 我想要一个交友项目`
- 例：`/sainit 做一个在线商城`

> 💡 如果用户已明确类型，直接调用子 skill：
> - `/sainit-dating` — 交友类
> - `/sainit-shop` — 电商类
> - `/sainit-blog` — 博客类
> - `/sainit-tool` — 工具类

## 工作流程（仅路由，不做实质工作）

### Step 1：解析项目描述

从用户输入中提取**项目关键词**，去掉前缀（"我想要一个/做一个"等）。

### Step 2：识别项目类型

按以下关键词映射表识别：

| 关键词 | 类型 | 目标子 skill |
|--------|------|------------|
| 交友 / 相亲 / 社交 / 聊天 / 匹配 / 找对象 | **dating** | `sainit-dating` |
| 商城 / 电商 / 购物 / 商店 / 订单 / 商品 | **ecommerce** | `sainit-shop` |
| 博客 / 文章 / 资讯 / 笔记 / 阅读 / 专栏 | **blog** | `sainit-blog` |
| 待办 / 记账 / 工具 / 效率 / 提醒 / 清单 | **tool** | `sainit-tool` |

#### 识别结果处理

**情况 A：明确匹配到一种类型**
1. 告诉用户：「识别到「<类型>」类项目，正在切换到 `/sainit-<type>` 子 skill...」
2. **加载并执行** `.trae/skills/sainit-<type>/SKILL.md` 的全部工作流程
3. 后续不再由本 skill 处理，由子 skill 接管

**情况 B：匹配到多个类型（如"社交电商"）**
1. 用 `AskUserQuestion` 让用户选择主要类型
2. 根据选择加载对应子 skill

**情况 C：未匹配到任何类型**
1. 用 `AskUserQuestion` 展示 4 个类型供用户选择（含"其他"）
2. 若选"其他"，按以下通用模板生成：
   - 目录结构：`prototype/index.html` + `home.html` + `list.html` + `detail.html` + `me.html`
   - Tab：首页 / 我的
   - localStorage 通用键：`user` / `token` / `settings`

### Step 3：传递项目上下文

将以下信息传递给子 skill：
- 项目描述原文
- 已提取的项目名（如未提取，提示用户在子 skill 中确认）

子 skill 负责后续所有工作：
- UI 风格选择
- 功能清单确认
- 页面映射与生成
- 输出最终结果

## 输出示例

```
🔍 识别项目类型...

✅ 识别到「交友」类项目

📦 正在切换到 /sainit-dating 子 skill...
```

随后由子 skill 接管，输出完整的项目初始化结果。

## 注意事项

- ⚠️ **本 skill 只做路由**：识别类型后立即移交，不做任何风格/功能/生成工作
- ⚠️ **关键词匹配失败**：必须用 AskUserQuestion 让用户选，不要猜
- ⚠️ **子 skill 完整自包含**：所有通用模板（CSS、JS、HTML 结构）都在子 skill 内，不需要回头读本 skill
- ⚠️ **新增类型**：要新增类型时，建一个 `sainit-<type>/SKILL.md` 子 skill，并在上方映射表中加一行即可

## 已支持的子 skill

| 子 skill | 类型 | 状态 |
|---------|------|------|
| `/sainit-dating` | 交友/社交 | ✅ |
| `/sainit-shop` | 电商/商城 | ✅ |
| `/sainit-blog` | 博客/内容 | ✅ |
| `/sainit-tool` | 工具/效率 | ✅ |

## 关联 Skill

- `sainit-dating` / `sainit-shop` / `sainit-blog` / `sainit-tool` — 子 skill
- `frontend-design` — 高保真 UI（子 skill 内部使用）
- `color-font-skill` — 配色字体（子 skill 内部使用）