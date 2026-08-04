/* ===== PrismCore Common JavaScript ===== */

const APP_PREFIX = 'prismcore:';
const LS_KEYS = {
  user: APP_PREFIX + 'user',
  token: APP_PREFIX + 'token',
  settings: APP_PREFIX + 'settings',
};

// Toast
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

// Confirm dialog
function showConfirm(title, message) {
  const overlay = document.getElementById('confirm-overlay');
  if (!overlay) {
    const html = `
      <div class="modal-overlay" id="confirm-overlay">
        <div class="modal">
          <div class="modal-title" id="confirm-title"></div>
          <p id="confirm-message" style="color:var(--text-sub);margin-bottom:var(--spacing-md);"></p>
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

// Auth check
function checkAuth() {
  const token = localStorage.getItem(LS_KEYS.token);
  if (!token && !window.location.pathname.endsWith('index.html')) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// Get user
function getUser() {
  try { return JSON.parse(localStorage.getItem(LS_KEYS.user)) || null; }
  catch { return null; }
}

// Get settings
function getSettings() {
  try { return JSON.parse(localStorage.getItem(LS_KEYS.settings)) || {}; }
  catch { return {}; }
}

// Save settings
function saveSettings(settings) {
  localStorage.setItem(LS_KEYS.settings, JSON.stringify(settings));
}

// Theme
function initTheme() {
  const settings = getSettings();
  const theme = settings.theme || 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const settings = getSettings();
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  settings.theme = next;
  saveSettings(settings);
  showToast('已切换为' + (next === 'dark' ? '深色' : '浅色') + '模式', 'success');
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// Format currency
function formatCurrency(amount) {
  return '¥' + Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Generate ID
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Tab highlight
function initTabs() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.tab-item').forEach(tab => {
    const href = tab.getAttribute('data-href') || tab.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (href === currentPage) tab.classList.add('active');
    else tab.classList.remove('active');
  });
}

// Go to page
function goTo(page) {
  window.location.href = page;
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已复制到剪贴板', 'success');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已复制到剪贴板', 'success');
  });
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initTabs();
});
