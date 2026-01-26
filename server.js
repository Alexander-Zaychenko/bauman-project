const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, 'db', 'data.sqlite3');
const db = new Database(dbPath);

// Ensure users table exists
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT,
  lastName TEXT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  schoolClass TEXT,
  age TEXT,
  city TEXT,
  avgGrade TEXT,
  gender TEXT,
  bio TEXT,
  profileConfigured INTEGER DEFAULT 0,
  skillpoints INTEGER DEFAULT 0
);
`);

// Ensure requests table exists
db.exec(`
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  subject TEXT,
  text TEXT,
  classFrom TEXT,
  classTo TEXT,
  type TEXT,
  creatorId INTEGER,
  creatorName TEXT,
  accepted INTEGER DEFAULT 0,
  acceptedBy INTEGER,
  acceptedAt INTEGER,
  skillpoints INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open'
);
`);

// Chats table: one chat per accepted request (creator + accepter)
db.exec(`
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requestId INTEGER,
  creatorId INTEGER,
  accepterId INTEGER,
  status TEXT DEFAULT 'active', -- active, cancelled, completed
  createdAt INTEGER
);
`);

// Ensure chats table has updatedAt column (added later) to avoid SQL errors when updating
try {
  const info = db.prepare("PRAGMA table_info('chats')").all();
  const hasUpdated = info && info.some(c => c.name === 'updatedAt');
  if (!hasUpdated) {
    db.prepare('ALTER TABLE chats ADD COLUMN updatedAt INTEGER').run();
  }
} catch (e) {
  console.error('Error ensuring chats.updatedAt column', e);
}

// Ensure users.skillpoints and requests.skillpoints/status columns exist (for upgrades)
try {
  const uinfo = db.prepare("PRAGMA table_info('users')").all();
  if (uinfo && !uinfo.some(c => c.name === 'skillpoints')) {
    db.prepare('ALTER TABLE users ADD COLUMN skillpoints INTEGER DEFAULT 0').run();
  }
} catch (e) { console.error('Error ensuring users.skillpoints column', e); }
try {
  const rinfo = db.prepare("PRAGMA table_info('requests')").all();
  if (rinfo && !rinfo.some(c => c.name === 'skillpoints')) {
    db.prepare('ALTER TABLE requests ADD COLUMN skillpoints INTEGER DEFAULT 0').run();
  }
  if (rinfo && !rinfo.some(c => c.name === 'status')) {
    db.prepare("ALTER TABLE requests ADD COLUMN status TEXT DEFAULT 'open'").run();
  }
} catch (e) { console.error('Error ensuring requests.skillpoints/status columns', e); }

// Chat messages
db.exec(`
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chatId INTEGER,
  senderId INTEGER,
  text TEXT,
  createdAt INTEGER
);
`);

// Seed sample users and requests if empty (helpful for development)
try {
  const uCount = db.prepare('SELECT COUNT(1) as c FROM users').get();
  if (uCount && uCount.c === 0) {
    db.prepare('INSERT INTO users (firstName,lastName,name,email,password,schoolClass,age,city,avgGrade,gender,bio,profileConfigured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run('Иван','Иванов','Иванов Иван','ivan@test.ru','123456','10','16','Москва','4.2','male','Люблю математику',1);
    db.prepare('INSERT INTO users (firstName,lastName,name,email,password,schoolClass,age,city,avgGrade,gender,bio,profileConfigured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run('Ольга','Олеговна','Олеговна Ольга','olga@test.ru','password','11','18','СПб','4.53','female','Готова помочь с обществознанием',1);
    db.prepare('INSERT INTO users (firstName,lastName,name,email,password,schoolClass,age,city,avgGrade,gender,bio,profileConfigured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run('Анна','Петрова','Петрова Анна','anna@test.ru','pwd123','9','15','Казань','4.0','female','',0);
    console.log('Seeded sample users');
  }
  const rCount = db.prepare('SELECT COUNT(1) as c FROM requests').get();
  if (rCount && rCount.c === 0) {
    db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
      .run('Обществознание (7-8 класс)','Обществознание','Нужна помощь с темой права и обязанностей.','7','8','ask',2,'Олеговна Ольга');
    db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
      .run('Математика: задачи на проценты','Математика','Нужна помощь с задачами на проценты и смешанные числа.','9','11','ask',1,'Иванов Иван');
    db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
      .run('Алгебра: формулы сокращенного умножения','Алгебра','Разобрать формулы и примеры их применения.','8','9','ask',3,'Петрова Анна');
    console.log('Seeded sample requests');
  }
} catch (e) {
  console.error('Seeding error', e);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Register
app.post('/api/register', (req, res) => {
  const u = req.body || {};
  if (!u.email || !u.password) return res.status(400).json({ error: 'email and password required' });
  try {
    const name = ((u.lastName || '') + (u.firstName ? (' ' + u.firstName) : '')).trim() || u.firstName || u.lastName || '';
    const stmt = db.prepare(`INSERT INTO users (firstName,lastName,name,email,password,schoolClass,age,city,avgGrade,gender,bio,profileConfigured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const info = stmt.run(u.firstName||'', u.lastName||'', name, u.email, u.password, u.schoolClass||'', u.age||'', u.city||'', u.avgGrade||'', u.gender||'', u.bio||'', u.profileConfigured?1:0);
    const user = db.prepare('SELECT id, firstName,lastName,name,email,schoolClass,age,city,avgGrade,gender,bio,profileConfigured,skillpoints FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, user });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'email_exists' });
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = db.prepare('SELECT id, firstName,lastName,name,email,schoolClass,age,city,avgGrade,gender,bio,profileConfigured,skillpoints FROM users WHERE email = ? AND password = ?').get(email, password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  res.json({ success: true, user });
});

// Get user
app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const user = db.prepare('SELECT id, firstName,lastName,name,email,schoolClass,age,city,avgGrade,gender,bio,profileConfigured,skillpoints FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ user });
});

// Requests: list, create, get, accept
// List only non-accepted requests by default
app.get('/api/requests', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM requests WHERE status = 'open' ORDER BY id DESC").all();
    res.json({ requests: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

app.get('/api/requests/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ request: row });
});

app.post('/api/requests', (req, res) => {
  const r = req.body || {};
  if (!r.title || !r.subject) return res.status(400).json({ error: 'title and subject required' });
  try {
    // require skillpoints amount (integer >= 0)
    const sp = parseInt(r.skillpoints, 10) || 0;
    if (sp < 0) return res.status(400).json({ error: 'invalid_skillpoints' });
    // If creator provided, validate balance across active requests
    const creatorId = (r.creator && r.creator.id) || null;
    if (creatorId) {
      const userRow = db.prepare('SELECT id, skillpoints FROM users WHERE id = ?').get(creatorId);
      if (!userRow) return res.status(400).json({ error: 'invalid_creator' });
      const reserved = db.prepare("SELECT IFNULL(SUM(skillpoints),0) as s FROM requests WHERE creatorId = ? AND status IN ('open','accepted')").get(creatorId);
      const reservedSum = (reserved && reserved.s) ? Number(reserved.s) : 0;
      const available = (Number(userRow.skillpoints) || 0) - reservedSum;
      if (available < sp) return res.status(400).json({ error: 'insufficient_skillpoints', available, reserved: reservedSum });
    }
    const stmt = db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName,skillpoints,status) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const info = stmt.run(r.title, r.subject, r.text||r.description||'', r.classFrom||'', r.classTo||'', r.type||'ask', creatorId, (r.creator && r.creator.name) || null, sp, 'open');
    const inserted = db.prepare('SELECT * FROM requests WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, request: inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

// Creator cancels a request: mark cancelled and free reserved points
app.post('/api/requests/:id/cancel', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body || {};
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!request) return res.status(404).json({ error: 'not_found' });
    if (!body.userId || Number(body.userId) !== Number(request.creatorId)) return res.status(403).json({ error: 'not_creator' });
    if (request.status === 'completed' || request.status === 'cancelled') return res.status(409).json({ error: 'invalid_status' });
    // if accepted, find chat and cancel it
    if (request.status === 'accepted') {
      const chat = db.prepare('SELECT * FROM chats WHERE requestId = ? AND status = ?').get(id, 'active');
      if (chat) db.prepare('UPDATE chats SET status = ?, updatedAt = ? WHERE id = ?').run('cancelled', Date.now(), chat.id);
    }
    db.prepare("UPDATE requests SET status = 'cancelled', accepted = 0, acceptedBy = NULL, acceptedAt = NULL WHERE id = ?").run(id);
    const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    res.json({ success: true, request: updated });
  } catch (e) { console.error(e); res.status(500).json({ error: 'internal' }); }
});

app.post('/api/requests/:id/accept', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body || {};
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    // ensure request exists and isn't already accepted
    const reqRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!reqRow) return res.status(404).json({ error: 'not_found' });
    if (reqRow.accepted) return res.status(409).json({ error: 'already_accepted' });
    // prevent accepting your own request
    if (body.userId && reqRow.creatorId && Number(body.userId) === Number(reqRow.creatorId)) {
      return res.status(400).json({ error: 'cannot_accept_own_request' });
    }
    const now = Date.now();
    db.prepare('UPDATE requests SET accepted = 1, acceptedBy = ?, acceptedAt = ?, status = ? WHERE id = ?').run(body.userId || null, now, 'accepted', id);
    // create chat for creator and accepter
    const info = db.prepare('INSERT INTO chats (requestId, creatorId, accepterId, status, createdAt) VALUES (?,?,?,?,?)')
      .run(id, reqRow.creatorId || null, body.userId || null, 'active', now);
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(info.lastInsertRowid);
    const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    res.json({ success: true, request: updated, chat });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

// Chats endpoints
// list chats for a user: use query ?userId=
app.get('/api/chats', (req, res) => {
  const userId = parseInt(req.query.userId, 10) || null;
  try {
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const rows = db.prepare('SELECT * FROM chats WHERE (creatorId = ? OR accepterId = ?) ORDER BY createdAt DESC').all(userId, userId);
    res.json({ chats: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

app.get('/api/chats/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(id);
    if (!chat) return res.status(404).json({ error: 'not_found' });
    const msgs = db.prepare('SELECT * FROM chat_messages WHERE chatId = ? ORDER BY id ASC').all(id);
    // include request info
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(chat.requestId);
    res.json({ chat, messages: msgs, request });
  } catch (e) { console.error(e); res.status(500).json({ error: 'internal' }); }
});

app.post('/api/chats/:id/messages', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body || {};
  if (!id) return res.status(400).json({ error: 'invalid id' });
  if (!body.senderId || !body.text) return res.status(400).json({ error: 'senderId and text required' });
  try {
    const now = Date.now();
    const info = db.prepare('INSERT INTO chat_messages (chatId, senderId, text, createdAt) VALUES (?,?,?,?)').run(id, body.senderId, body.text, now);
    const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, message: msg });
  } catch (e) { console.error(e); res.status(500).json({ error: 'internal' }); }
});

// accepter cancels: revert request to unaccepted and mark chat cancelled
app.post('/api/chats/:id/cancel', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body || {};
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(id);
    if (!chat) return res.status(404).json({ error: 'not_found' });
    if (chat.status !== 'active') return res.status(409).json({ error: 'invalid_status' });
    // update chat
    db.prepare('UPDATE chats SET status = ?, updatedAt = ? WHERE id = ?').run('cancelled', Date.now(), id);
    // revert request: mark as open again
    db.prepare("UPDATE requests SET accepted = 0, acceptedBy = NULL, acceptedAt = NULL, status = 'open' WHERE id = ?").run(chat.requestId);
    const updated = db.prepare('SELECT * FROM chats WHERE id = ?').get(id);
    res.json({ success: true, chat: updated });
  } catch (e) { console.error(e); res.status(500).json({ error: 'internal' }); }
});

// creator confirms completion: mark chat completed
app.post('/api/chats/:id/confirm', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(id);
    if (!chat) return res.status(404).json({ error: 'not_found' });
    if (chat.status !== 'active') return res.status(409).json({ error: 'invalid_status' });
    // complete chat and transfer skillpoints from creator to accepter
    const now = Date.now();
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(chat.requestId);
    if (!request) return res.status(404).json({ error: 'request_not_found' });
    const points = Number(request.skillpoints || 0);
    // perform transfer in a transaction: credit accepter then debit creator, rollback on failure
    const tx = db.transaction(() => {
      db.prepare('UPDATE chats SET status = ?, updatedAt = ? WHERE id = ?').run('completed', now, id);
      if (points > 0) {
        const creatorId = request.creatorId;
        const accepterId = chat.accepterId;
        if (!creatorId || !accepterId) throw new Error('missing_parties');
        if (Number(creatorId) === Number(accepterId)) throw new Error('same_user');
        // credit accepter first
        db.prepare('UPDATE users SET skillpoints = skillpoints + ? WHERE id = ?').run(points, accepterId);
        // then debit creator (ensure they have enough points)
        const dec = db.prepare('UPDATE users SET skillpoints = skillpoints - ? WHERE id = ? AND skillpoints >= ?').run(points, creatorId, points);
        if (dec.changes === 0) throw new Error('creator_insufficient_funds');
      }
      db.prepare("UPDATE requests SET status = 'completed' WHERE id = ?").run(request.id);
    });
    try {
      tx();
    } catch (err) {
      console.error('Transfer error', err);
      if (err && err.message === 'creator_insufficient_funds') return res.status(409).json({ error: 'creator_insufficient_funds' });
      if (err && err.message === 'missing_parties') return res.status(400).json({ error: 'missing_parties' });
      if (err && err.message === 'same_user') return res.status(400).json({ error: 'same_user' });
      return res.status(500).json({ error: 'transfer_failed' });
    }
    const updated = db.prepare('SELECT * FROM chats WHERE id = ?').get(id);
    res.json({ success: true, chat: updated });
  } catch (e) { console.error(e); res.status(500).json({ error: 'internal' }); }
});

// Update user
app.post('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const u = req.body || {};
  try {
    const name = ((u.lastName || '') + (u.firstName ? (' ' + u.firstName) : '')).trim() || u.firstName || u.lastName || '';
    const stmt = db.prepare(`UPDATE users SET firstName=?, lastName=?, name=?, email=?, schoolClass=?, age=?, city=?, avgGrade=?, gender=?, bio=?, profileConfigured=? WHERE id=?`);
    stmt.run(u.firstName||'', u.lastName||'', name, u.email||'', u.schoolClass||'', u.age||'', u.city||'', u.avgGrade||'', u.gender||'', u.bio||'', u.profileConfigured?1:0, id);
    const user = db.prepare('SELECT id, firstName,lastName,name,email,schoolClass,age,city,avgGrade,gender,bio,profileConfigured,skillpoints FROM users WHERE id = ?').get(id);
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
