/* ========================================================================
   PrismMesh Enterprise Common JavaScript
   企业后台公共逻辑 — 企业客户自助管理 API Key / 用量 / 审计
   ======================================================================== */

const ENT_PREFIX = 'prismmesh-ent:';
const ENT_KEYS = {
  user: ENT_PREFIX + 'user',
  token: ENT_PREFIX + 'token',
  org: ENT_PREFIX + 'org',
};

/* ------------------------------------------------------------------ */
/*  Toast                                                            */
/* ------------------------------------------------------------------ */
function showToast(message, type = 'info') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = 'toast toast-' + type + ' show';
  toast.textContent = message;
  setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

/* ------------------------------------------------------------------ */
/*  Confirm dialog                                                    */
/* ------------------------------------------------------------------ */
function showConfirm(title, message) {
  const overlay = document.getElementById('confirm-overlay');
  if (!overlay) {
    const html = `
      <div class="modal-overlay" id="confirm-overlay">
        <div class="modal" style="max-width:400px;">
          <div class="modal-title" id="confirm-title"></div>
          <p id="confirm-message" style="color:var(--text-sub);margin-bottom:var(--space-5);"></p>
          <div class="modal-actions">
            <button class="btn btn-outline" onclick="document.getElementById('confirm-overlay').classList.remove('show');window._confirmResult=false;">取消</button>
            <button class="btn btn-danger" onclick="document.getElementById('confirm-overlay').classList.remove('show');window._confirmResult=true;">确认</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-overlay').classList.add('show');
  return new Promise((resolve) => {
    window._confirmResult = false;
    const check = setInterval(() => {
      if (!document.getElementById('confirm-overlay').classList.contains('show')) {
        clearInterval(check);
        resolve(window._confirmResult);
      }
    }, 100);
  });
}

/* ------------------------------------------------------------------ */
/*  Auth                                                              */
/* ------------------------------------------------------------------ */
function requireEntLogin(redirect = 'index.html') {
  const token = localStorage.getItem(ENT_KEYS.token);
  if (!token) {
    window.location.href = redirect;
    return false;
  }
  return true;
}

function getEntUser() {
  try { return JSON.parse(localStorage.getItem(ENT_KEYS.user)) || null; }
  catch { return null; }
}

function getEntOrg() {
  try { return JSON.parse(localStorage.getItem(ENT_KEYS.org)) || null; }
  catch { return null; }
}

function entLogin(user, org) {
  localStorage.setItem(ENT_KEYS.user, JSON.stringify(user));
  localStorage.setItem(ENT_KEYS.org, JSON.stringify(org));
  localStorage.setItem(ENT_KEYS.token, 'ent-token-' + Date.now());
}

function entLogout() {
  localStorage.removeItem(ENT_KEYS.token);
  localStorage.removeItem(ENT_KEYS.user);
  localStorage.removeItem(ENT_KEYS.org);
  window.location.href = 'index.html';
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function formatCurrency(amount) {
  return '¥' + Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(num) {
  return Number(num || 0).toLocaleString('zh-CN');
}

function formatTokens(num) {
  const n = Number(num || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/* ------------------------------------------------------------------ */
/*  Navigation helpers                                                */
/* ------------------------------------------------------------------ */
function goTo(page) {
  window.location.href = page;
}

function initEntNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'overview.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === currentPage);
  });
}

function toggleSidebar() {
  document.getElementById('ent-sidebar').classList.toggle('open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.classList.toggle('show');
}

/* ------------------------------------------------------------------ */
/*  Demo data (shared across enterprise pages)                        */
/* ------------------------------------------------------------------ */
const ENT_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', type: '对话', desc: '多模态旗舰模型' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', type: '对话', desc: '轻量快速' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', type: '对话', desc: '长上下文推理' },
  { id: 'deepseek-v3', name: 'DeepSeek-V3', type: '对话', desc: '高性价比 MoE' },
  { id: 'text-embedding-3', name: 'text-embedding-3', type: '向量', desc: '768 维向量化' },
];

const ENT_KEYS_DATA = [
  { id: 'k_01', name: '生产环境-主Key', prefix: 'sk-ent-a3f8****', perm: '读写', models: ['gpt-4o', 'claude-3-5-sonnet', 'deepseek-v3'], status: '启用', created: '2026-05-12', last: '2026-08-04 09:28', ip: '白名单 2 条', owner: '陈志远' },
  { id: 'k_02', name: '测试环境', prefix: 'sk-ent-7c2e****', perm: '读写', models: ['gpt-4o-mini', 'deepseek-v3'], status: '启用', created: '2026-06-01', last: '2026-08-04 08:11', ip: '未限制', owner: '林晓宇' },
  { id: 'k_03', name: '数据团队-向量化', prefix: 'sk-ent-d91b****', perm: '只读', models: ['text-embedding-3'], status: '启用', created: '2026-06-22', last: '2026-08-03 22:05', ip: '白名单 1 条', owner: '张明轩' },
  { id: 'k_04', name: '遗留-临时Key', prefix: 'sk-ent-4e6a****', perm: '读写', models: ['gpt-4o'], status: '禁用', created: '2026-03-15', last: '2026-07-20 16:45', ip: '未限制', owner: '陈志远' }
];

/* keyId -> { modelId -> { calls, tokens, cost } } */
const ENT_USAGE = {
  'k_01': {
    'gpt-4o': { calls: 1247, tokens: 856300, cost: 68.42 },
    'claude-3-5-sonnet': { calls: 386, tokens: 412800, cost: 57.10 },
    'deepseek-v3': { calls: 2093, tokens: 1284300, cost: 21.38 }
  },
  'k_02': {
    'gpt-4o-mini': { calls: 3211, tokens: 902100, cost: 9.03 },
    'deepseek-v3': { calls: 1540, tokens: 486200, cost: 7.12 }
  },
  'k_03': {
    'text-embedding-3': { calls: 5216, tokens: 128800, cost: 6.44 }
  },
  'k_04': {
    'gpt-4o': { calls: 152, tokens: 96400, cost: 6.08 }
  }
};

const ENT_AUDIT = [
  { id: 'a_01', keyId: 'k_01', time: '2026-08-04 09:28:31', model: 'gpt-4o', action: 'chat.completions', method: 'POST', tokens: 1245, cost: 0.082, status: '成功', ip: '114.92.118.7', latency: '1.2s' },
  { id: 'a_02', keyId: 'k_01', time: '2026-08-04 09:27:58', model: 'deepseek-v3', action: 'chat.completions', method: 'POST', tokens: 860, cost: 0.014, status: '成功', ip: '114.92.118.7', latency: '0.8s' },
  { id: 'a_03', keyId: 'k_02', time: '2026-08-04 09:25:12', model: 'gpt-4o-mini', action: 'chat.completions', method: 'POST', tokens: 312, cost: 0.003, status: '成功', ip: '10.24.3.18', latency: '0.6s' },
  { id: 'a_04', keyId: 'k_01', time: '2026-08-04 09:22:44', model: 'claude-3-5-sonnet', action: 'chat.completions', method: 'POST', tokens: 4201, cost: 0.531, status: '成功', ip: '114.92.118.7', latency: '3.4s' },
  { id: 'a_05', keyId: 'k_03', time: '2026-08-04 09:20:05', model: 'text-embedding-3', action: 'embeddings.create', method: 'POST', tokens: 2400, cost: 0.012, status: '成功', ip: '172.16.8.33', latency: '0.4s' },
  { id: 'a_06', keyId: 'k_02', time: '2026-08-04 09:15:30', model: 'deepseek-v3', action: 'chat.completions', method: 'POST', tokens: 1580, cost: 0.026, status: '成功', ip: '10.24.3.18', latency: '1.1s' },
  { id: 'a_07', keyId: 'k_04', time: '2026-08-04 09:08:19', model: 'gpt-4o', action: 'chat.completions', method: 'POST', tokens: 0, cost: 0, status: '失败', ip: '45.77.120.2', latency: '0.0s' },
  { id: 'a_08', keyId: 'k_01', time: '2026-08-04 08:56:02', model: 'gpt-4o', action: 'chat.completions', method: 'POST', tokens: 902, cost: 0.059, status: '成功', ip: '114.92.118.7', latency: '1.0s' },
  { id: 'a_09', keyId: 'k_03', time: '2026-08-04 08:41:27', model: 'text-embedding-3', action: 'embeddings.create', method: 'POST', tokens: 6000, cost: 0.030, status: '成功', ip: '172.16.8.33', latency: '0.5s' },
  { id: 'a_10', keyId: 'k_02', time: '2026-08-04 08:33:51', model: 'gpt-4o-mini', action: 'chat.completions', method: 'POST', tokens: 1080, cost: 0.011, status: '成功', ip: '10.24.3.18', latency: '0.7s' },
  { id: 'a_11', keyId: 'k_01', time: '2026-08-04 08:20:14', model: 'deepseek-v3', action: 'chat.completions', method: 'POST', tokens: 2240, cost: 0.037, status: '成功', ip: '114.92.118.7', latency: '1.3s' },
  { id: 'a_12', keyId: 'k_03', time: '2026-08-04 08:05:40', model: 'text-embedding-3', action: 'embeddings.create', method: 'POST', tokens: 3600, cost: 0.018, status: '成功', ip: '172.16.8.33', latency: '0.4s' }
];

/* Dialogue audit data — AI-classified project + feature tags per conversation */
const ENT_DIALOGUES = [
  // ---- k_01: 生产环境-主Key（声明：设计+工程混合使用）----
  { id: 'd_01', keyId: 'k_01', time: '2026-08-04 09:28:31', model: 'gpt-4o', userQuestion: '帮我设计一个电商App的首页Banner布局，要求现代简约风格，主色调蓝色', completionPreview: '以下是电商App首页Banner的设计方案：采用深浅蓝渐变背景，左侧放置品牌Slogan与CTA按钮...', tokens: 1245, cost: 0.082,
    auditProject: '电商App', auditFeature: '首页Banner设计', auditRisk: 'safe',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  { id: 'd_02', keyId: 'k_01', time: '2026-08-04 09:27:58', model: 'deepseek-v3', userQuestion: '用Python写一个网页爬虫脚本，爬取微博热搜榜前50条，存到CSV文件', completionPreview: 'import requests\nfrom bs4 import BeautifulSoup\nimport csv\n\ndef fetch_weibo_hot():...', tokens: 860, cost: 0.014,
    auditProject: '个人爬虫工具', auditFeature: '微博热搜数据采集', auditRisk: 'suspicious',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  { id: 'd_03', keyId: 'k_01', time: '2026-08-04 09:22:44', model: 'claude-3-5-sonnet', userQuestion: '分析这份用户反馈数据（附件500条），提取Top 10痛点并生成可视化报表建议', completionPreview: '经过对500条用户反馈的NLP分析，Top 10痛点如下：\n1. 登录速度慢（23.6%）\n2. 搜索结果不准确（18.4%）...', tokens: 4201, cost: 0.531,
    auditProject: '电商App', auditFeature: '用户反馈分析', auditRisk: 'safe',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  { id: 'd_04', keyId: 'k_01', time: '2026-08-04 08:56:02', model: 'gpt-4o', userQuestion: '帮我写一个React组件，实现拖拽排序的列表，支持拖拽时动画效果', completionPreview: '以下是一个基于dnd-kit的拖拽排序列表组件：\n```tsx\nimport { DndContext, closestCenter } from "@dnd-kit/core";\n...', tokens: 902, cost: 0.059,
    auditProject: '个人前端练习', auditFeature: '拖拽组件开发', auditRisk: 'suspicious',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  { id: 'd_05', keyId: 'k_01', time: '2026-08-04 08:20:14', model: 'deepseek-v3', userQuestion: '请用中文写一份智能仓储管理系统的技术方案文档，包括系统架构、数据库设计和API接口设计', completionPreview: '# 智能仓储管理系统技术方案\n\n## 1. 系统架构\n采用微服务架构，主要服务包括：\n- 入库管理服务\n- 出库管理服务...', tokens: 2240, cost: 0.037,
    auditProject: '智能仓储系统', auditFeature: '技术方案文档', auditRisk: 'safe',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  // ---- k_02: 测试环境（声明：测试+轻量开发）----
  { id: 'd_06', keyId: 'k_02', time: '2026-08-04 09:25:12', model: 'gpt-4o-mini', userQuestion: '请为我们的电商App商品详情页生成5条商品描述的A/B测试文案', completionPreview: '以下是5条A/B测试文案：\nA1: "限时特惠！智能手表旗舰款，续航30天..."\nB1: "专业运动伴侣，心率血氧全天监测..."...', tokens: 312, cost: 0.003,
    auditProject: '电商App', auditFeature: 'A/B测试文案', auditRisk: 'safe',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  { id: 'd_07', keyId: 'k_02', time: '2026-08-04 09:15:30', model: 'deepseek-v3', userQuestion: '帮我写一份加密数字货币白皮书的大纲，项目叫MoonToken，主打AI+DeFi概念', completionPreview: '# MoonToken 白皮书\n\n## 摘要\nMoonToken是一个基于AI驱动的去中心化金融协议...', tokens: 1580, cost: 0.026,
    auditProject: '个人加密货币项目', auditFeature: '白皮书撰写', auditRisk: 'violation',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: true, violationNote: '该Key声明用途为\"测试\"，但被用于个人加密货币项目白皮书撰写，严重偏离申报用途' },
  { id: 'd_08', keyId: 'k_02', time: '2026-08-04 08:33:51', model: 'gpt-4o-mini', userQuestion: '写一个Node.js的单元测试用例，测试用户注册API的各种边界情况', completionPreview: '```javascript\nconst request = require("supertest");\nconst app = require("../app");\n\ndescribe("POST /api/register"...', tokens: 1080, cost: 0.011,
    auditProject: '电商App', auditFeature: '单元测试编写', auditRisk: 'safe',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  // ---- k_03: 数据团队-向量化（声明：仅向量化/Embedding）----
  { id: 'd_09', keyId: 'k_03', time: '2026-08-04 09:20:05', model: 'text-embedding-3', userQuestion: '请将以下100条商品评论转换为向量表示：[商品评论列表...]', completionPreview: '[0.023, -0.451, 0.892, ...] (100条评论的embedding向量)', tokens: 2400, cost: 0.012,
    auditProject: '电商App', auditFeature: '商品评论向量化', auditRisk: 'safe',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  { id: 'd_10', keyId: 'k_03', time: '2026-08-04 08:41:27', model: 'text-embedding-3', userQuestion: '对以下500篇用户研究论文摘要进行向量化，用于后续语义搜索', completionPreview: '[0.112, 0.783, -0.234, ...] (500篇论文摘要的embedding向量)', tokens: 6000, cost: 0.030,
    auditProject: '学术研究', auditFeature: '论文语义检索', auditRisk: 'safe',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  { id: 'd_11', keyId: 'k_03', time: '2026-08-04 08:05:40', model: 'text-embedding-3', userQuestion: '帮我写一篇2000字的公众号文章，主题是\"2024年AI行业十大趋势\"', completionPreview: '# 2024年AI行业十大趋势\n\n2024年，人工智能领域正经历前所未有的变革...', tokens: 3600, cost: 0.018,
    auditProject: '个人自媒体', auditFeature: '公众号文章撰写', auditRisk: 'suspicious',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null },
  // ---- k_04: 遗留-临时Key（已禁用，少量历史记录）----
  { id: 'd_12', keyId: 'k_04', time: '2026-08-04 09:08:19', model: 'gpt-4o', userQuestion: '用TensorFlow写一个图片分类模型的训练代码，使用CIFAR-10数据集', completionPreview: '```python\nimport tensorflow as tf\nfrom tensorflow import keras\n\n(x_train, y_train), (x_test, y_test) = keras.datasets.cifar10.load_data()...', tokens: 0, cost: 0,
    auditProject: '个人深度学习', auditFeature: '图像分类模型训练', auditRisk: 'suspicious',
    adminProject: null, adminFeature: null, adminVerified: false, flagged: false, violationNote: null }
];

/* Statistics derived from dialogues for anomaly dashboard */
function auditStats() {
  var dialogues = getEntData('dialogues') || [];
  var stats = { total: dialogues.length, safe: 0, suspicious: 0, violation: 0, flagged: 0 };
  var projects = {};
  dialogues.forEach(function (d) {
    stats[d.auditRisk] = (stats[d.auditRisk] || 0) + 1;
    if (d.flagged) stats.flagged++;
    var p = d.adminProject || d.auditProject;
    if (!projects[p]) projects[p] = { calls: 0, keys: {} };
    projects[p].calls++;
    projects[p].keys[d.keyId] = 1;
  });
  stats.projects = Object.keys(projects).map(function (p) {
    return { name: p, calls: projects[p].calls, keyCount: Object.keys(projects[p].keys).length };
  }).sort(function (a, b) { return b.calls - a.calls; });
  return stats;
}

const ENT_MEMBERS = [
  { id: 'm_01', name: '陈志远', email: 'admin@acmecorp.com', role: '企业管理员', status: '启用', lastLogin: '2026-08-04 09:10', keys: 2 },
  { id: 'm_02', name: '林晓宇', email: 'linxy@acmecorp.com', role: 'Key 管理员', status: '启用', lastLogin: '2026-08-04 08:52', keys: 1 },
  { id: 'm_03', name: '张明轩', email: 'zhangmx@acmecorp.com', role: '开发者', status: '启用', lastLogin: '2026-08-03 22:05', keys: 1 },
  { id: 'm_04', name: '王思涵', email: 'wangsh@acmecorp.com', role: '审计员', status: '启用', lastLogin: '2026-08-01 17:30', keys: 0 },
  { id: 'm_05', name: '李若曦', email: 'lirx@acmecorp.com', role: '开发者', status: '禁用', lastLogin: '2026-07-18 14:20', keys: 0 }
];

const ENT_SETTINGS = {
  orgName: 'ACME 科技有限公司',
  orgCode: 'ACME-2024001',
  contactName: '陈志远',
  contactEmail: 'admin@acmecorp.com',
  contactPhone: '138****2210',
  defaultQuota: '10M',
  ipWhitelist: '114.92.118.0/24, 172.16.8.0/24',
  notifyUsage: true,
  notifyAudit: true,
  notifyWeekly: true,
  autoRotate: false
};

function seedEntData() {
  if (!localStorage.getItem(ENT_PREFIX + 'keys')) {
    localStorage.setItem(ENT_PREFIX + 'keys', JSON.stringify(ENT_KEYS_DATA));
  }
  if (!localStorage.getItem(ENT_PREFIX + 'usage')) {
    localStorage.setItem(ENT_PREFIX + 'usage', JSON.stringify(ENT_USAGE));
  }
  if (!localStorage.getItem(ENT_PREFIX + 'audit')) {
    localStorage.setItem(ENT_PREFIX + 'audit', JSON.stringify(ENT_AUDIT));
  }
  if (!localStorage.getItem(ENT_PREFIX + 'members')) {
    localStorage.setItem(ENT_PREFIX + 'members', JSON.stringify(ENT_MEMBERS));
  }
  if (!localStorage.getItem(ENT_PREFIX + 'settings')) {
    localStorage.setItem(ENT_PREFIX + 'settings', JSON.stringify(ENT_SETTINGS));
  }
  if (!localStorage.getItem(ENT_PREFIX + 'dialogues')) {
    localStorage.setItem(ENT_PREFIX + 'dialogues', JSON.stringify(ENT_DIALOGUES));
  }
}

function getEntData(key) {
  try { return JSON.parse(localStorage.getItem(ENT_PREFIX + key)) || null; }
  catch { return null; }
}

function saveEntData(key, val) {
  localStorage.setItem(ENT_PREFIX + key, JSON.stringify(val));
}

function getModelName(id) {
  const m = ENT_MODELS.find(x => x.id === id);
  return m ? m.name : id;
}

/* ------------------------------------------------------------------ */
/*  Init                                                              */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
  seedEntData();
  initEntNav();
});
