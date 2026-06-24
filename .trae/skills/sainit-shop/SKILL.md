---
name: "sainit-shop"
description: "初始化一个电商/商城类软件项目的产品原型。Invoke when /sainit 路由到 shop 类型，或用户直接调用 /sainit-shop。会创建 prototype/ 目录、按功能生成多页 HTML 原型（含商品浏览、详情、购物车、订单等电商专属页面）。"
---

# /sainit-shop — 电商类项目初始化

## 触发条件

- 由 `/sainit` 主 skill 路由而来（识别到"商城/电商/购物/商店/订单"等关键词）
- 用户直接调用：`/sainit-shop <项目描述>`

## 工作流程

### Step 1：解析项目描述 & 创建项目目录

1. 提取项目关键词 → kebab-case 英文名
2. 创建结构：
   ```
   <project-name>/
   ├── README.md
   └── prototype/
       ├── index.html              # 启动 + 登录一体页
       ├── home.html               # 首页（Tab，含分类入口）
       └── <其他功能页面>.html
       └── assets/{css,js,img}/
   ```

### Step 2：反问 UI 风格（5 选 1）

| 选项 | 风格 | 典型色系 |
|------|------|---------|
| A | 简约清新风 | 白底 + 淡橙/淡蓝 |
| B | 赛博朋克风 | 黑底 + 霓虹紫/青 |
| C | 温馨治愈风 | 米色 + 暖橙 |
| D | 商务专业风（推荐） | 深蓝 + 灰白 |
| E | 复古文艺风 | 莫兰迪绿/灰粉 |

### Step 3：反问功能需求（多选）

**核心功能**（必选）：
1. 用户注册 / 登录
2. 商品浏览（分类、搜索）
3. 商品详情
4. 购物车
5. 下单 / 支付
6. 我的订单

**增值功能**（可选）：
7. 个人中心（地址、收藏）
8. 优惠券 / 活动
9. 客服 / 售后
10. 商品评价

### Step 4：功能 → 页面映射

| 选中功能 | 生成页面 | Tab |
|---------|---------|-----|
| 注册/登录 | `index.html`（内含登录表单） | ❌ |
| 商品浏览 | `home.html`（分类入口 + 推荐流） | ✅ |
| 商品详情 | `product.html` | ❌ |
| 购物车 | `cart.html` | ✅ |
| 下单/支付 | `checkout.html` | ❌ |
| 我的订单 | `orders.html` | ❌ |
| 个人中心 | `me.html` | ✅ |
| 优惠券 | `coupons.html` | ❌ |
| 客服 | `support.html` | ❌ |
| 商品评价 | `review.html` | ❌ |

**Tab 配置**：首页 / 购物车 / 我的（3 个；若选客服则 4 个）

### Step 4.5：页面 & 按钮完整性自检

生成文件前，对照 Step 4 映射表逐项确认：

- [ ] 每个选中功能都有对应页面
- [ ] 每个页面的入口按钮 / 链接已规划
- [ ] 每个入口都指向已生成的页面
- [ ] Tab 配置覆盖所有 Tab 页面
- [ ] 无悬空入口 / 死链

### Step 5：生成文件

#### 5.0 完整性铁律（贯穿所有页面）

- 每个按钮必有行为：onclick / href / 提交，必有其一。
- 每个交互必有反馈：loading、toast、状态切换，必有其一。
- 每条数据必有闭环：新增 → 展示 → 编辑 → 删除，全链路通。
- 每个页面必有结构：标题区、主体区、操作区、底部 Tab（如适用）。
- 每个跳转必有目标：href 指向已生成的 HTML，不留死链。

#### 5.1 `assets/css/tokens.css`（电商默认偏 D 商务风）

```css
:root {
  /* 默认：D 商务专业风 */
  --primary: #FF4D2E;          /* 电商强调色（橙红/品牌色） */
  --primary-soft: #FFE9E3;
  --accent: #2563EB;           /* 信任蓝 */
  --accent-soft: #DBEAFE;
  --bg: #F8FAFC; --surface: #FFFFFF;
  --text: #0F172A; --text-sub: #64748B; --border: #E2E8F0;
  --price: #FF4D2E;            /* 价格专用红色 */
  --radius-sm: 4px; --radius: 8px; --radius-lg: 16px;
  --shadow: 0 2px 8px rgba(0,0,0,0.06);
}
```

#### 5.2 `assets/css/components.css`

通用组件 + 电商专属：`.product-card`、`.product-grid`、`.price`、`.price-original`、`.badge`、`.cart-item`、`.qty-stepper`、`.checkout-summary`、`.address-card`、`.order-status`、`.tab-bar-cart-badge`

#### 5.3 `assets/js/common.js`

同 dating 子 skill（Store / requireLogin / currentUser / logout / highlightTab）

#### 5.4 localStorage 键名（电商专属）

| 键名 | 类型 | 用途 | 写入页 | 读取页 |
|------|------|------|--------|--------|
| `<name>:user` | Object | 当前登录用户 | `index.html` | 全站 |
| `<name>:token` | String | 登录态 | `index.html` | 全站 |
| `<name>:cart` | Array | 购物车 | `product.html` | `cart.html`、`checkout.html` |
| `<name>:orders` | Array | 订单历史 | `checkout.html` | `orders.html` |
| `<name>:addresses` | Array | 收货地址 | `me.html` | `checkout.html` |
| `<name>:favorites` | Array | 收藏商品 | `product.html` | `me.html` |
| `<name>:coupons` | Array | 优惠券 | `coupons.html` | `checkout.html` |

#### 5.5 index.html 设计（启动+登录一体）

Hero 区用商品/品牌视觉（如 logo + slogan "好物触手可及"），表单含手机号 + 验证码 + 协议 + 登录按钮。

#### 5.6 【必填】关键页面要点

**【必填】home.html（首页）**：
- 顶部搜索栏（跳转 `search.html`）
- 分类宫格（4x2 入口，跳各分类页或直接锚定 home 的 section）
- 轮播 Banner（自动 3s 切换）
- 推荐商品瀑布流（`<a href="product.html?id=X">`）
- 底部 Tab

**【必填】product.html（商品详情）**：
- 商品主图轮播
- 标题、价格、销量、评分
- 规格选择（颜色、尺寸）
- 评价摘要
- 底部固定栏：[加入购物车] [立即购买]
- `<a href="cart.html">` 跳转购物车

**【必填】cart.html（购物车）**：
- 列表项：勾选 + 商品图 + 名称 + 价格 + 数量步进器（+/-）
- 底部固定栏：合计金额 + [去结算] → `checkout.html`

**【必填】checkout.html（结算）**：
- 收货地址选择
- 商品清单
- 优惠券选择
- 支付方式（微信/支付宝/信用卡）
- 提交订单 → `orders.html`

**【必填】orders.html（订单）**：
- Tab 切换：全部 / 待付款 / 待发货 / 待收货 / 已完成
- 订单卡片：商品缩略图 + 状态 + 金额 + 操作按钮

**【必填】me.html（我的）**：
- 顶部用户卡（头像/昵称/会员等级）
- 订单快捷入口（4 个图标：待付款/待发货/待收货/全部）
- 功能列表：地址管理、收藏、优惠券、客服、设置

#### 5.7 占位数据

- 商品图：`https://picsum.photos/seed/<sku>/400/400`
- 商品名：贴合项目主题（如服装类、3C类、美妆类）
- 价格：随机 ¥9.9 - ¥9999.0
- 销量：100+、500+ 等
- 评价数：3-50 条示例

#### 5.8 链接可达性扫描（生成后必跑）

1. 收集所有已生成的 HTML 文件名清单
2. 遍历每个 HTML 中的 `<a href="*.html">` 与 `location.href = '*.html'`
3. 凡是目标不在清单内的 → 修复 href 或补建缺失页面
4. 输出扫描报告：`✅ X 个链接全部可达` / `❌ 缺失：xxx.html`

### Step 6：生成 README.md

```markdown
# <项目名>

> <一句话定位>

## 页面清单

| 页面 | 文件 |
|------|------|
| 启动 + 登录 | `prototype/index.html` |
| 首页 | `prototype/home.html` |
| 商品详情 | `prototype/product.html` |
| 购物车 | `prototype/cart.html` |
| 结算 | `prototype/checkout.html` |
| 订单 | `prototype/orders.html` |
| 我的 | `prototype/me.html` |
...（按 Step 4 选中的功能展开）

## 本地预览

双击 `prototype/index.html`
```

### Step 7：输出最终回复

```
✅ 项目「<name>」已初始化完成！

📁 目录：<abs-path>
🎨 风格：商务专业风（电商推荐）
🧩 功能：商品浏览、详情、购物车、结算、订单...

📄 已生成页面（共 N 个）：
   • index.html（启动 + 登录）
   • home.html（首页 Tab）
   • product.html（商品详情）
   • cart.html（购物车 Tab）
   • checkout.html（结算）
   • orders.html（订单）
   • me.html（我的 Tab）
   ...

🚀 打开 prototype/index.html 开始体验。
```

## 注意事项

- ⚠️ **价格统一用 `var(--price)` 变量**，便于换主题
- ⚠️ **购物车数量改动要实时同步 `Store.set('cart', ...)`**
- ⚠️ **订单提交后清空购物车**（`Store.set('cart', [])`）
- ⚠️ **结算页必须先检查 `requireLogin()`**

## 关联 Skill

- `frontend-design` — 高保真 UI
- `color-font-skill` — 配色字体