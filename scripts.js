/* Shared site scripts for SkillUp
   - user storage (localStorage)
   - auth helpers (login/register/check/logout)
   - requests (all-requests page)
   - page initializers (auto-detect forms/elements)
*/

// --- Users / Auth ---
function initDatabase() {
  if (!localStorage.getItem('users')) {
    const initialUsers = [
      { id: 1, name: 'Иванов Иван', email: 'ivan@test.ru', password: '123456' }
    ];
    localStorage.setItem('users', JSON.stringify(initialUsers));
    localStorage.setItem('nextUserId', '2');
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function getNextUserId() {
  return parseInt(localStorage.getItem('nextUserId') || '1', 10);
}

function setNextUserId(n) {
  localStorage.setItem('nextUserId', String(n));
}

function registerUser(name, email, password) {
  const users = getUsers();
  const exists = users.find(u => u.email === email);
  if (exists) {
    return { success: false, message: 'Пользователь с таким email уже существует' };
  }

  const id = getNextUserId();
  const newUser = { id, name, email, password };
  users.push(newUser);
  saveUsers(users);
  setNextUserId(id + 1);
  // auto-login
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  return { success: true, message: 'Регистрация прошла успешно!', user: newUser };
}

function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { success: false, message: 'Неверный email или пароль' };
  localStorage.setItem('currentUser', JSON.stringify(user));
  return { success: true, message: 'Авторизация прошла успешно!', user };
}

function checkAuth() {
  const u = localStorage.getItem('currentUser');
  return u ? JSON.parse(u) : null;
}

function logout() {
  localStorage.removeItem('currentUser');
}

// --- Requests (all-requests page) ---
function getRequests() {
  return JSON.parse(localStorage.getItem('requests') || '[]');
}

function saveRequests(list) {
  localStorage.setItem('requests', JSON.stringify(list));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Render header auth widget: shows login/register or "Привет, {name}" link
function renderAuthWidget() {
  try {
    const user = checkAuth();
    const nodes = document.querySelectorAll('.auth');
    nodes.forEach(el => {
      if (user) {
        const name = escapeHtml(user.name || 'Пользователь');
        el.innerHTML = '<a href="profile.html">Привет, ' + name + '</a>';
      } else {
        el.innerHTML = '<a href="login.html">Войти</a> <a href="register.html">Регистрация</a>';
      }
    });
  } catch (err) {
    console.error('renderAuthWidget error', err);
  }
}

function renderRequests(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';
  const items = getRequests().slice().reverse();
  if (items.length === 0) {
    wrap.innerHTML = '<div style="color:#6b7280">Запросов пока нет.</div>';
    return;
  }
  items.forEach(it => {
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'popular-card';
    a.innerHTML = '<div class="title">' + escapeHtml(it.title) + '</div>' +
                  '<div class="meta">' + escapeHtml(it.subject) + ' — ' + escapeHtml(it.text) + '</div>';
    wrap.appendChild(a);
  });
}

// --- Auto-init per page ---
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  // update header auth links/greeting
  renderAuthWidget();

  // Profile page
  const profileName = document.getElementById('userName');
  if (profileName) {
    const user = checkAuth();
    if (!user) { window.location.href = 'login.html'; return; }
    document.getElementById('userName').textContent = user.name || 'Пользователь';
    const emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = user.email || '';
    const initials = (user.name || 'SU').split(' ').map(s => s[0]).slice(0, 2).join('');
    const avatar = document.getElementById('avatar');
    if (avatar) avatar.textContent = initials.toUpperCase();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); window.location.href = 'index.html'; });
  }

  // Login page
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const current = checkAuth();
    if (current) { window.location.href = 'profile.html'; }
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = (document.getElementById('loginEmail') || {}).value || '';
      const pass = (document.getElementById('loginPassword') || {}).value || '';
      const res = loginUser(email.trim(), pass);
      const msg = document.getElementById('loginMessage');
      if (msg) {
        msg.textContent = res.message;
        msg.className = 'message ' + (res.success ? 'success' : 'error');
        msg.style.display = 'block';
      }
      if (res.success) setTimeout(() => { window.location.href = 'profile.html'; }, 700);
    });
  }

  // Register page
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const current = checkAuth();
    if (current) { window.location.href = 'profile.html'; }
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = (document.getElementById('registerName') || {}).value || '';
      const email = (document.getElementById('registerEmail') || {}).value || '';
      const pass = (document.getElementById('registerPassword') || {}).value || '';
      const res = registerUser(name.trim(), email.trim(), pass);
      const msg = document.getElementById('registerMessage');
      if (msg) {
        msg.textContent = res.message;
        msg.className = 'message ' + (res.success ? 'success' : 'error');
        msg.style.display = 'block';
      }
      if (res.success) setTimeout(() => { window.location.href = 'profile.html'; }, 700);
    });
  }

  // All-requests page
  const reqForm = document.getElementById('requestForm');
  if (reqForm) {
    renderRequests('requestsList');
    reqForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const title = (document.getElementById('reqTitle') || {}).value || '';
      const subject = (document.getElementById('reqSubject') || {}).value || '';
      const text = (document.getElementById('reqText') || {}).value || '';
      if (!title.trim()) return;
      const list = getRequests();
      list.push({ id: Date.now(), title: title.trim(), subject, text: text.trim() });
      saveRequests(list);
      reqForm.reset();
      renderRequests('requestsList');
    });
  }
});
