/* Shared site scripts for SkillUp
   - client-side UI helpers
   - use server API (SQLite) for users/requests
*/

// Client session: stored locally only for UI session (server owns data)
function checkAuth() { const u = localStorage.getItem('currentUser'); return u ? JSON.parse(u) : null; }
function logout() { localStorage.removeItem('currentUser'); }

function escapeHtml(s) { return String(s || '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// Auth API
async function registerUser(data) {
  try { const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const j = await res.json(); if (res.ok && j.user) { localStorage.setItem('currentUser', JSON.stringify(j.user)); return { success: true, message: 'Регистрация прошла успешно!', user: j.user }; } return { success: false, message: j.error || (j.message || 'Ошибка регистрации') }; } catch (e) { return { success: false, message: 'Ошибка сети' }; }
}

async function loginUser(email, password) {
  try { const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); const j = await res.json(); if (res.ok && j.user) { localStorage.setItem('currentUser', JSON.stringify(j.user)); return { success: true, message: 'Авторизация прошла успешно!', user: j.user }; } return { success: false, message: j.error || 'Неверный email или пароль' }; } catch (e) { return { success: false, message: 'Ошибка сети' }; }
}

// Requests API
async function getRequests() { try { const res = await fetch('/api/requests'); const j = await res.json(); return j.requests || []; } catch (e) { console.error(e); return []; } }
async function getRequestById(id) { try { const res = await fetch('/api/requests/' + encodeURIComponent(id)); const j = await res.json(); return j.request || null; } catch (e) { console.error(e); return null; } }
async function createRequest(data) { try { const user = checkAuth(); const payload = Object.assign({}, data, { creator: user ? { id: user.id, name: user.name } : null }); const res = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); return await res.json(); } catch (e) { console.error(e); return { success: false }; } }
async function acceptRequestApi(id, userId) { try { const res = await fetch('/api/requests/' + encodeURIComponent(id) + '/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) }); return await res.json(); } catch (e) { console.error(e); return { success: false }; } }

// Chats API
async function getChats(userId) {
  try { const res = await fetch('/api/chats?userId=' + encodeURIComponent(userId)); const j = await res.json(); return j.chats || []; } catch (e) { console.error(e); return []; }
}

async function getChatById(id) {
  try { const res = await fetch('/api/chats/' + encodeURIComponent(id)); const j = await res.json(); return j || null; } catch (e) { console.error(e); return null; }
}

async function postChatMessage(chatId, senderId, text) {
  try { const res = await fetch('/api/chats/' + encodeURIComponent(chatId) + '/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId, text }) }); return await res.json(); } catch (e) { console.error(e); return { success: false }; }
}

async function cancelChat(chatId) {
  try { const res = await fetch('/api/chats/' + encodeURIComponent(chatId) + '/cancel', { method: 'POST', headers: {'Content-Type':'application/json'} }); return await res.json(); } catch (e) { console.error(e); return { success: false }; }
}

async function confirmChat(chatId) {
  try { const res = await fetch('/api/chats/' + encodeURIComponent(chatId) + '/confirm', { method: 'POST', headers: {'Content-Type':'application/json'} }); return await res.json(); } catch (e) { console.error(e); return { success: false }; }
}

// UI helpers
function renderAuthWidget() {
  try {
    const user = checkAuth();
    const nodes = document.querySelectorAll('.auth');
    nodes.forEach(el => {
      if (user) {
        const name = escapeHtml(user.name || 'Пользователь');
        el.innerHTML = '<a href="chats.html" class="chats-link" style="margin-right:8px;background:#eef6ff;color:#2563eb;border:1px solid #cfe6ff;padding:6px 12px;border-radius:999px;text-decoration:none">Чаты</a>' +
                       '<a href="profile.html">Привет, ' + name + '</a>';
      } else {
        el.innerHTML = '<a href="login.html">Войти</a> <a href="register.html">Регистрация</a>';
      }
    });
  } catch (err) { console.error('renderAuthWidget error', err); }
}

async function renderRequests(containerId, subject) {
  const wrap = document.getElementById(containerId); if (!wrap) return; wrap.innerHTML = '';
  let items = (await getRequests()).slice().reverse(); if (subject) items = items.filter(it => String(it.subject || '') === String(subject));
  if (!items || items.length === 0) { wrap.innerHTML = '<div style="color:#6b7280">Запросов пока нет.</div>'; return; }
  items.forEach(it => {
    const link = document.createElement('a'); link.href = 'request.html?id=' + encodeURIComponent(it.id); link.className = 'request-link';
    const typeLabel = (it.type === 'help') ? 'Хочу помочь' : 'Нужна помощь'; const typeClass = (it.type === 'help') ? 'request-type--help' : 'request-type--ask';
    link.innerHTML = '<div class="class-card request-card">' +
             '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;"><div class="class-title">' + escapeHtml(it.title) + '</div><div class="request-type ' + typeClass + '">' + escapeHtml(typeLabel) + '</div></div>' +
             '<div class="class-meta">' + escapeHtml(it.subject) + (it.classFrom && it.classTo ? ' (' + escapeHtml(it.classFrom) + '-' + escapeHtml(it.classTo) + ' класс)' : '') + '</div>' +
                     '<div class="request-preview" style="margin-top:10px;color:#374151;">' + escapeHtml((it.text || it.description || '').slice(0, 180)) + ( (it.text||it.description||'').length > 180 ? '…' : '') + '</div>' +
                     '</div>';
    wrap.appendChild(link);
  });
}

async function updateSubjectCounts() {
  try {
    const counts = {};
    (await getRequests()).forEach(r => { const s = (r.subject || '').trim(); if (!s) return; counts[s] = (counts[s] || 0) + 1; });
    const cards = document.querySelectorAll('.class-card[data-subject]');
    cards.forEach(card => { const s = (card.getAttribute('data-subject') || '').trim(); const span = card.querySelector('.class-count'); if (span) span.textContent = String(counts[s] || 0); });
  } catch (e) { console.error('updateSubjectCounts error', e); }
}

// DOM init
document.addEventListener('DOMContentLoaded', async () => {
  renderAuthWidget();
  // Profile page
  const profileName = document.getElementById('userName'); if (profileName) {
    const user = checkAuth(); if (!user) { window.location.href = 'login.html'; return; }
    document.getElementById('userName').textContent = user.name || 'Пользователь'; const emailEl = document.getElementById('userEmail'); if (emailEl) emailEl.textContent = user.email || '';
    const initials = (user.name || 'SU').split(' ').map(s => s[0]).slice(0, 2).join(''); const avatar = document.getElementById('avatar'); if (avatar) avatar.textContent = initials.toUpperCase();
    const logoutBtn = document.getElementById('logoutBtn'); if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); window.location.href = 'index.html'; });
    const bioEl = document.getElementById('userBio'); if (bioEl) bioEl.textContent = user.bio || 'Здесь вы можете добавить информацию о себе.';
    const ageEl = document.getElementById('userAge'); if (ageEl) ageEl.textContent = user.age || '—'; const classEl = document.getElementById('userClass'); if (classEl) classEl.textContent = user.schoolClass || '—';
    const cityEl = document.getElementById('userCity'); if (cityEl) cityEl.textContent = user.city || '—'; const avgEl = document.getElementById('userAvg'); if (avgEl) avgEl.textContent = user.avgGrade || '—';
    const genderEl = document.getElementById('userGender'); if (genderEl) { if (user.gender === 'male') genderEl.textContent = 'Мужской'; else if (user.gender === 'female') genderEl.textContent = 'Женский'; else genderEl.textContent = '—'; }
  }

  // Login
  const loginForm = document.getElementById('loginForm'); if (loginForm) { const current = checkAuth(); if (current) { window.location.href = 'profile.html'; }
    loginForm.addEventListener('submit', async function (e) { e.preventDefault(); const email = (document.getElementById('loginEmail') || {}).value || ''; const pass = (document.getElementById('loginPassword') || {}).value || ''; const res = await loginUser(email.trim(), pass); const msg = document.getElementById('loginMessage'); if (msg) { msg.textContent = res.message; msg.className = 'message ' + (res.success ? 'success' : 'error'); msg.style.display = 'block'; } if (res.success) setTimeout(() => { window.location.href = 'profile.html'; }, 700); }); }

  // Register
  const registerForm = document.getElementById('registerForm'); if (registerForm) { const current = checkAuth(); if (current) { window.location.href = 'profile.html'; }
    registerForm.addEventListener('submit', async function (e) { e.preventDefault(); const firstName = (document.getElementById('registerFirstName') || {}).value || ''; const lastName = (document.getElementById('registerLastName') || {}).value || ''; const email = (document.getElementById('registerEmail') || {}).value || ''; const pass = (document.getElementById('registerPassword') || {}).value || ''; const age = (document.getElementById('registerAge') || {}).value || ''; const city = (document.getElementById('registerCity') || {}).value || ''; const schoolClass = (document.getElementById('registerClass') || {}).value || ''; let avgGrade = (document.getElementById('registerAvg') || {}).value || ''; const gender = (document.getElementById('registerGender') || {}).value || ''; const bio = (document.getElementById('registerBio') || {}).value || ''; if (avgGrade) { const n = parseFloat(String(avgGrade).replace(',', '.')); if (isNaN(n) || n < 2 || n > 5) { const msg = document.getElementById('registerMessage'); if (msg) { msg.textContent = 'Ошибка: средний балл должен быть числом от 2 до 5'; msg.className = 'message error'; msg.style.display = 'block'; } else alert('Средний балл должен быть числом от 2 до 5'); return; } avgGrade = String(n); } if (!['male', 'female'].includes(gender)) { const msg = document.getElementById('registerMessage'); if (msg) { msg.textContent = 'Ошибка: выберите пол (Мужской или Женский)'; msg.className = 'message error'; msg.style.display = 'block'; } return; } const res = await registerUser({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password: pass, age: age.trim(), city: city.trim(), schoolClass: schoolClass.trim(), avgGrade: avgGrade.trim(), gender: gender.trim(), bio: bio.trim() }); const msg = document.getElementById('registerMessage'); if (msg) { msg.textContent = res.message; msg.className = 'message ' + (res.success ? 'success' : 'error'); msg.style.display = 'block'; } if (res.success) setTimeout(() => { window.location.href = 'profile.html'; }, 700); }); }

  // Edit profile
  const editForm = document.getElementById('editProfileForm'); if (editForm) { const user = checkAuth(); if (!user) { window.location.href = 'login.html'; return; } (document.getElementById('editFirstName') || {}).value = user.firstName || ''; (document.getElementById('editLastName') || {}).value = user.lastName || ''; (document.getElementById('editEmail') || {}).value = user.email || ''; (document.getElementById('editAge') || {}).value = user.age || ''; (document.getElementById('editCity') || {}).value = user.city || ''; (document.getElementById('editClass') || {}).value = user.schoolClass || ''; (document.getElementById('editAvg') || {}).value = user.avgGrade || ''; (document.getElementById('editGender') || {}).value = user.gender || ''; (document.getElementById('editBio') || {}).value = user.bio || '';
    editForm.addEventListener('submit', async function (e) { e.preventDefault(); const firstName = (document.getElementById('editFirstName') || {}).value || ''; const lastName = (document.getElementById('editLastName') || {}).value || ''; const email = (document.getElementById('editEmail') || {}).value || ''; const age = (document.getElementById('editAge') || {}).value || ''; const city = (document.getElementById('editCity') || {}).value || ''; const schoolClass = (document.getElementById('editClass') || {}).value || ''; let avgGrade = (document.getElementById('editAvg') || {}).value || ''; const gender = (document.getElementById('editGender') || {}).value || ''; const bio = (document.getElementById('editBio') || {}).value || ''; if (avgGrade) { const n = parseFloat(String(avgGrade).replace(',', '.')); if (isNaN(n) || n < 2 || n > 5) { alert('Средний балл должен быть числом от 2 до 5'); return; } avgGrade = String(n); } if (!['male', 'female'].includes(gender)) { alert('Выберите пол: Мужской или Женский'); return; } try { const res = await fetch('/api/users/' + encodeURIComponent(user.id), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), schoolClass: schoolClass.trim(), age: age.trim(), city: city.trim(), avgGrade: avgGrade.trim(), gender: gender.trim(), bio: bio.trim(), profileConfigured: Boolean(age.trim() && city.trim() && avgGrade.trim() && gender.trim() && bio.trim()) }) }); const j = await res.json(); if (j.success && j.user) { localStorage.setItem('currentUser', JSON.stringify(j.user)); window.location.href = 'profile.html'; } } catch (e) { alert('Ошибка обновления профиля'); } }); }

  // All-requests
  const reqForm = document.getElementById('requestForm'); function getQueryParam(name) { try { const params = new URLSearchParams(window.location.search); return params.get(name); } catch (e) { return null; } } const initialSubject = getQueryParam('subject'); const subjectButtons = document.querySelectorAll('.class-grid .class-card'); if (subjectButtons && subjectButtons.length) { subjectButtons.forEach(btn => { btn.addEventListener('click', function (e) { const href = (btn.getAttribute('href') || '').trim(); if (href === '#' || href === '' ) { e.preventDefault(); const s = btn.getAttribute('data-subject') || btn.textContent.trim(); subjectButtons.forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); const sel = document.getElementById('reqSubject'); if (sel) sel.value = s; renderRequests('requestsList', s); try { history.replaceState(null, '', '?subject=' + encodeURIComponent(s)); } catch (e) {} } }); }); }

  if (initialSubject) { const sel = document.getElementById('reqSubject'); if (sel) sel.value = initialSubject; subjectButtons.forEach(b => { const s = (b.getAttribute('data-subject') || b.textContent || '').trim(); if (s === initialSubject) b.classList.add('selected'); else b.classList.remove('selected'); }); }

  await renderRequests('requestsList', initialSubject); await updateSubjectCounts();

  if (reqForm) { reqForm.addEventListener('submit', async function (e) { e.preventDefault(); const title = (document.getElementById('reqTitle') || {}).value || ''; const subject = (document.getElementById('reqSubject') || {}).value || ''; const text = (document.getElementById('reqText') || {}).value || ''; if (!title.trim()) return; await createRequest({ id: Date.now(), title: title.trim(), subject, text: text.trim() }); reqForm.reset(); await renderRequests('requestsList', subject); await updateSubjectCounts(); }); }

  const createForm = document.getElementById('createRequestForm'); if (createForm) { createForm.addEventListener('submit', async function (e) { e.preventDefault(); const subject = document.getElementById('subject').value; const classFrom = document.getElementById('classFrom').value; const classTo = document.getElementById('classTo').value; const description = document.getElementById('description').value; const type = (document.getElementById('type') || {}).value || 'ask'; if (!subject || !classFrom || !classTo || !description.trim()) return; const fromN = parseInt(String(classFrom), 10); const toN = parseInt(String(classTo), 10); if (isNaN(fromN) || isNaN(toN)) { alert('Пожалуйста, укажите корректные номера классов'); return; } if (fromN > toN) { alert('Класс "от" не может быть больше класса "до"'); return; } const title = `${subject} (${classFrom}-${classTo} класс)`; await createRequest({ title, subject, classFrom, classTo, description, type }); alert('Запрос создан!'); window.location.href = 'index.html'; }); }
});
