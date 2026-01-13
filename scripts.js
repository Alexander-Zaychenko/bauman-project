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
      { id: 1, firstName: 'Иван', lastName: 'Иванов', name: 'Иванов Иван', email: 'ivan@test.ru', password: '123456', age: '', city: '', schoolClass: '', avgGrade: '', gender: '', bio: '', profileConfigured: false }
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

function registerUser(data) {
  const users = getUsers();
  const exists = users.find(u => u.email === data.email);
  if (exists) {
    return { success: false, message: 'Пользователь с таким email уже существует' };
  }

  const id = getNextUserId();
  const name = (data.lastName || '') + (data.firstName ? (' ' + data.firstName) : '');
  const profileConfigured = Boolean(data.age && data.city && data.avgGrade && data.gender && data.bio);
  const newUser = {
    id,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    name: name.trim() || (data.firstName || data.lastName || ''),
    email: data.email,
    password: data.password,
    schoolClass: data.schoolClass || '',
    age: data.age || '',
    city: data.city || '',
    avgGrade: data.avgGrade || '',
    gender: data.gender || '',
    bio: data.bio || '',
    profileConfigured: profileConfigured
  };
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

function renderRequests(containerId, subject) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';
  let items = getRequests().slice().reverse();
  if (subject) {
    items = items.filter(it => String(it.subject || '') === String(subject));
  }
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
    // profile extra fields
    const bioEl = document.getElementById('userBio');
    if (bioEl) bioEl.textContent = user.bio || 'Здесь вы можете добавить информацию о себе.';
    const ageEl = document.getElementById('userAge'); if (ageEl) ageEl.textContent = user.age || '—';
    const classEl = document.getElementById('userClass'); if (classEl) classEl.textContent = user.schoolClass || '—';
    const cityEl = document.getElementById('userCity'); if (cityEl) cityEl.textContent = user.city || '—';
    const avgEl = document.getElementById('userAvg'); if (avgEl) avgEl.textContent = user.avgGrade || '—';
    const genderEl = document.getElementById('userGender'); if (genderEl) {
      if (user.gender === 'male') genderEl.textContent = 'Мужской';
      else if (user.gender === 'female') genderEl.textContent = 'Женский';
      else genderEl.textContent = '—';
    }
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
      const firstName = (document.getElementById('registerFirstName') || {}).value || '';
      const lastName = (document.getElementById('registerLastName') || {}).value || '';
      const email = (document.getElementById('registerEmail') || {}).value || '';
      const pass = (document.getElementById('registerPassword') || {}).value || '';
      const age = (document.getElementById('registerAge') || {}).value || '';
      const city = (document.getElementById('registerCity') || {}).value || '';
      const schoolClass = (document.getElementById('registerClass') || {}).value || '';
      let avgGrade = (document.getElementById('registerAvg') || {}).value || '';
      const gender = (document.getElementById('registerGender') || {}).value || '';
      const bio = (document.getElementById('registerBio') || {}).value || '';
      // validate avgGrade if provided
      if (avgGrade) {
        const n = parseFloat(String(avgGrade).replace(',', '.'));
        if (isNaN(n) || n < 2 || n > 5) {
          const msg = document.getElementById('registerMessage');
          if (msg) {
            msg.textContent = 'Ошибка: средний балл должен быть числом от 2 до 5';
            msg.className = 'message error'; msg.style.display = 'block';
          } else alert('Средний балл должен быть числом от 2 до 5');
          return;
        }
        avgGrade = String(n);
      }
      // gender must be male or female
      if (!['male', 'female'].includes(gender)) {
        const msg = document.getElementById('registerMessage');
        if (msg) { msg.textContent = 'Ошибка: выберите пол (Мужской или Женский)'; msg.className = 'message error'; msg.style.display = 'block'; }
        return;
      }

      const res = registerUser({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password: pass, age: age.trim(), city: city.trim(), schoolClass: schoolClass.trim(), avgGrade: avgGrade.trim(), gender: gender.trim(), bio: bio.trim() });
      const msg = document.getElementById('registerMessage');
      if (msg) {
        msg.textContent = res.message;
        msg.className = 'message ' + (res.success ? 'success' : 'error');
        msg.style.display = 'block';
      }
      if (res.success) setTimeout(() => { window.location.href = 'profile.html'; }, 700);
    });
  }

  // Edit profile page
  const editForm = document.getElementById('editProfileForm');
  if (editForm) {
    const user = checkAuth();
    if (!user) { window.location.href = 'login.html'; return; }
    // prefill
    (document.getElementById('editFirstName') || {}).value = user.firstName || '';
    (document.getElementById('editLastName') || {}).value = user.lastName || '';
    (document.getElementById('editEmail') || {}).value = user.email || '';
    (document.getElementById('editAge') || {}).value = user.age || '';
    (document.getElementById('editCity') || {}).value = user.city || '';
    (document.getElementById('editClass') || {}).value = user.schoolClass || '';
    (document.getElementById('editAvg') || {}).value = user.avgGrade || '';
    (document.getElementById('editGender') || {}).value = user.gender || '';
    (document.getElementById('editBio') || {}).value = user.bio || '';

    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const firstName = (document.getElementById('editFirstName') || {}).value || '';
      const lastName = (document.getElementById('editLastName') || {}).value || '';
      const email = (document.getElementById('editEmail') || {}).value || '';
      const age = (document.getElementById('editAge') || {}).value || '';
      const city = (document.getElementById('editCity') || {}).value || '';
      const schoolClass = (document.getElementById('editClass') || {}).value || '';
      let avgGrade = (document.getElementById('editAvg') || {}).value || '';
      const gender = (document.getElementById('editGender') || {}).value || '';
      const bio = (document.getElementById('editBio') || {}).value || '';

      // validate avgGrade if provided
      if (avgGrade) {
        const n = parseFloat(String(avgGrade).replace(',', '.'));
        if (isNaN(n) || n < 2 || n > 5) { alert('Средний балл должен быть числом от 2 до 5'); return; }
        avgGrade = String(n);
      }
      // validate gender
      if (!['male', 'female'].includes(gender)) { alert('Выберите пол: Мужской или Женский'); return; }

      const users = getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx === -1) return;
      const updated = Object.assign({}, users[idx], {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: (lastName.trim() + (firstName.trim() ? (' ' + firstName.trim()) : '')).trim() || users[idx].name,
        email: email.trim(),
        schoolClass: schoolClass.trim(),
        age: age.trim(),
        city: city.trim(),
        avgGrade: avgGrade.trim(),
        gender: gender.trim(),
        bio: bio.trim(),
        profileConfigured: Boolean(age.trim() && city.trim() && avgGrade.trim() && gender.trim() && bio.trim())
      });
      users[idx] = updated;
      saveUsers(users);
      localStorage.setItem('currentUser', JSON.stringify(updated));
      window.location.href = 'profile.html';
    });
  }

  // All-requests page
  const reqForm = document.getElementById('requestForm');
  // helper to read query param
  function getQueryParam(name) {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(name);
    } catch (e) { return null; }
  }
  const initialSubject = getQueryParam('subject');
  if (reqForm) {
    // subject buttons on all-requests (only initialize on this page)
    const subjectButtons = document.querySelectorAll('.class-grid .class-card');
    if (subjectButtons && subjectButtons.length) {
      subjectButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const s = btn.getAttribute('data-subject') || btn.textContent.trim();
          const sel = document.getElementById('reqSubject');
          if (sel) sel.value = s;
          renderRequests('requestsList', s);
          // update URL without reload
          try { history.replaceState(null, '', '?subject=' + encodeURIComponent(s)); } catch (e) {}
        });
      });
    }
    // if we have subject in query, preselect
    if (initialSubject) {
      const sel = document.getElementById('reqSubject'); if (sel) sel.value = initialSubject;
    }

    renderRequests('requestsList', initialSubject);
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
      renderRequests('requestsList', subject);
    });
  }
});
