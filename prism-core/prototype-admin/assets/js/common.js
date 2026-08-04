/* ========================================================================
   PrismCore Admin Common JavaScript
   后台管理系统公共逻辑
   ======================================================================== */

const ADMIN_PREFIX = 'prismcore-admin:';
const ADMIN_KEYS = {
  user: ADMIN_PREFIX + 'user',
  token: ADMIN_PREFIX + 'token',
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
function requireAdminLogin(redirect = 'index.html') {
  const token = localStorage.getItem(ADMIN_KEYS.token);
  if (!token) {
    window.location.href = redirect;
    return false;
  }
  return true;
}

function getAdmin() {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEYS.user)) || null; }
  catch { return null; }
}

function adminLogin(user) {
  localStorage.setItem(ADMIN_KEYS.user, JSON.stringify(user));
  localStorage.setItem(ADMIN_KEYS.token, 'admin-token-' + Date.now());
}

function adminLogout() {
  localStorage.removeItem(ADMIN_KEYS.token);
  localStorage.removeItem(ADMIN_KEYS.user);
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

function formatCurrency(amount) {
  return '¥' + Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(num) {
  return Number(num || 0).toLocaleString('zh-CN');
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return minutes + ' 分钟前';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' 小时前';
  const days = Math.floor(hours / 24);
  if (days < 30) return days + ' 天前';
  return formatDate(new Date(timestamp).toISOString());
}

/* ------------------------------------------------------------------ */
/*  Navigation helpers                                                */
/* ------------------------------------------------------------------ */
function goTo(page) {
  window.location.href = page;
}

function initAdminNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'overview.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === currentPage);
  });
}

function toggleSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.classList.toggle('show');
}

/* ------------------------------------------------------------------ */
/*  Init                                                              */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
  initAdminNav();
});
