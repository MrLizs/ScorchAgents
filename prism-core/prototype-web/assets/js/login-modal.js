/* ========================================================================
   PrismCore Login/Register Modal
   共享登录弹窗组件 — 供 index.html / home.html 等页面复用
   ======================================================================== */

(function () {
  'use strict';

  var injected = false;

  /* ------------------------------------------------------------------ */
  /*  Modal HTML                                                        */
  /* ------------------------------------------------------------------ */
  function getModalHTML() {
    return '' +
      '<div class="modal-overlay" id="auth-modal-overlay" onclick="if(event.target===this)closeAuthModal()">' +
        '<div class="modal auth-modal" role="dialog" aria-modal="true" aria-label="登录">' +
          '<button type="button" class="auth-close" onclick="closeAuthModal()" aria-label="关闭">✕</button>' +
          '<div class="auth-title">欢迎使用 PrismCore</div>' +
          '<div class="auth-subtitle">登录后即可调用 100+ 优质 AI 模型</div>' +

          '<div class="form-tabs">' +
            '<button type="button" class="form-tab active" id="auth-tab-login" onclick="switchAuthForm(\'login\')">登录</button>' +
            '<button type="button" class="form-tab" id="auth-tab-register" onclick="switchAuthForm(\'register\')">注册</button>' +
          '</div>' +

          /* ---------- 登录表单 ---------- */
          '<form id="auth-login-form" onsubmit="submitLogin(event)">' +
            '<div class="form-group">' +
              '<label class="form-label" for="auth-login-email">邮箱地址</label>' +
              '<input class="form-input" id="auth-login-email" type="email" placeholder="请输入邮箱地址" required autocomplete="email">' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="auth-login-password">密码</label>' +
              '<div class="password-input-wrap">' +
                '<input class="form-input" id="auth-login-password" type="password" placeholder="请输入密码" required autocomplete="current-password">' +
                '<button type="button" class="toggle-pwd" onclick="toggleAuthPassword(\'auth-login-password\',this)" tabindex="-1">👁</button>' +
              '</div>' +
            '</div>' +
            '<div class="forgot-link">' +
              '<span onclick="showToast(\'密码重置功能即将上线\',\'info\')">忘记密码？</span>' +
            '</div>' +
            '<button type="submit" class="btn btn-primary btn-block btn-lg">登 录</button>' +
            '<div class="auth-footer-text">' +
              '还没有账号？<a onclick="switchAuthForm(\'register\')">立即注册</a>' +
            '</div>' +
          '</form>' +

          /* ---------- 注册表单 ---------- */
          '<form id="auth-register-form" class="form-hidden" onsubmit="submitRegister(event)">' +
            '<div class="form-group">' +
              '<label class="form-label" for="auth-reg-name">用户名</label>' +
              '<input class="form-input" id="auth-reg-name" type="text" placeholder="请输入用户名" required autocomplete="name">' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="auth-reg-email">邮箱地址</label>' +
              '<input class="form-input" id="auth-reg-email" type="email" placeholder="请输入邮箱地址" required autocomplete="email">' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="auth-reg-password">密码</label>' +
              '<div class="password-input-wrap">' +
                '<input class="form-input" id="auth-reg-password" type="password" placeholder="至少 8 位密码" required minlength="8" autocomplete="new-password">' +
                '<button type="button" class="toggle-pwd" onclick="toggleAuthPassword(\'auth-reg-password\',this)" tabindex="-1">👁</button>' +
              '</div>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="auth-reg-confirm">确认密码</label>' +
              '<div class="password-input-wrap">' +
                '<input class="form-input" id="auth-reg-confirm" type="password" placeholder="再次输入密码" required minlength="8" autocomplete="new-password">' +
                '<button type="button" class="toggle-pwd" onclick="toggleAuthPassword(\'auth-reg-confirm\',this)" tabindex="-1">👁</button>' +
              '</div>' +
            '</div>' +
            '<button type="submit" class="btn btn-primary btn-block btn-lg">注 册</button>' +
            '<div class="auth-footer-text">' +
              '已有账号？<a onclick="switchAuthForm(\'login\')">立即登录</a>' +
            '</div>' +
            '<div class="auth-footer-text">' +
              '注册即表示同意 <a onclick="showToast(\'服务条款即将上线\',\'info\')">服务条款</a> 和 ' +
              '<a onclick="showToast(\'隐私政策即将上线\',\'info\')">隐私政策</a>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';
  }

  function injectModal() {
    if (injected) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = getModalHTML();
    document.body.appendChild(wrapper.firstElementChild);
    injected = true;

    /* ESC 关闭 */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAuthModal();
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                      */
  /* ------------------------------------------------------------------ */
  window.openAuthModal = function () {
    injectModal();
    var overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
      switchAuthForm('login');
      setTimeout(function () {
        var input = document.getElementById('auth-login-email');
        if (input) input.focus();
      }, 200);
    }
  };

  window.closeAuthModal = function () {
    var overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Form switching                                                    */
  /* ------------------------------------------------------------------ */
  window.switchAuthForm = function (type) {
    var loginForm = document.getElementById('auth-login-form');
    var registerForm = document.getElementById('auth-register-form');
    var tabLogin = document.getElementById('auth-tab-login');
    var tabRegister = document.getElementById('auth-tab-register');
    if (!loginForm || !registerForm) return;

    if (type === 'login') {
      loginForm.classList.remove('form-hidden');
      registerForm.classList.add('form-hidden');
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
    } else {
      loginForm.classList.add('form-hidden');
      registerForm.classList.remove('form-hidden');
      tabLogin.classList.remove('active');
      tabRegister.classList.add('active');
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Password visibility                                               */
  /* ------------------------------------------------------------------ */
  window.toggleAuthPassword = function (inputId, btn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁';
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Save session & redirect                                           */
  /* ------------------------------------------------------------------ */
  function saveSession(user) {
    localStorage.setItem(LS_KEYS.user, JSON.stringify(user));
    localStorage.setItem(LS_KEYS.token, 'demo-token-' + Date.now());
  }

  function afterAuthSuccess(message) {
    showToast(message, 'success');
    closeAuthModal();
    setTimeout(function () {
      var page = window.location.pathname.split('/').pop();
      if (page === 'index.html' || page === '') {
        window.location.href = 'home.html';
      } else {
        window.location.reload();
      }
    }, 600);
  }

  /* ------------------------------------------------------------------ */
  /*  Login submit                                                      */
  /* ------------------------------------------------------------------ */
  window.submitLogin = function (e) {
    e.preventDefault();
    var email = document.getElementById('auth-login-email').value.trim();
    var password = document.getElementById('auth-login-password').value;

    if (!email) {
      showToast('请输入邮箱地址', 'error');
      return;
    }
    if (!password) {
      showToast('请输入密码', 'error');
      return;
    }
    var name = email.split('@')[0];
    saveSession({
      id: genId(),
      email: email,
      name: name,
      avatar: name.charAt(0).toUpperCase(),
      joinedAt: new Date().toISOString()
    });
    afterAuthSuccess('登录成功，欢迎回来！');
  };

  /* ------------------------------------------------------------------ */
  /*  Register submit                                                   */
  /* ------------------------------------------------------------------ */
  window.submitRegister = function (e) {
    e.preventDefault();
    var name = document.getElementById('auth-reg-name').value.trim();
    var email = document.getElementById('auth-reg-email').value.trim();
    var password = document.getElementById('auth-reg-password').value;
    var confirm = document.getElementById('auth-reg-confirm').value;

    if (!name) {
      showToast('请输入用户名', 'error');
      return;
    }
    if (!email) {
      showToast('请输入邮箱地址', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('密码长度至少 8 位', 'error');
      return;
    }
    if (password !== confirm) {
      showToast('两次密码输入不一致', 'error');
      return;
    }
    saveSession({
      id: genId(),
      email: email,
      name: name,
      avatar: name.charAt(0).toUpperCase(),
      joinedAt: new Date().toISOString()
    });
    afterAuthSuccess('注册成功，欢迎加入 PrismCore！');
  };
})();
