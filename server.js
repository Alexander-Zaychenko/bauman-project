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
  profileConfigured INTEGER DEFAULT 0
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
  acceptedAt INTEGER
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
    const user = db.prepare('SELECT id, firstName,lastName,name,email,schoolClass,age,city,avgGrade,gender,bio,profileConfigured FROM users WHERE id = ?').get(info.lastInsertRowid);
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
  const user = db.prepare('SELECT id, firstName,lastName,name,email,schoolClass,age,city,avgGrade,gender,bio,profileConfigured FROM users WHERE email = ? AND password = ?').get(email, password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  res.json({ success: true, user });
});

// Get user
app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const user = db.prepare('SELECT id, firstName,lastName,name,email,schoolClass,age,city,avgGrade,gender,bio,profileConfigured FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ user });
});

// Requests: list, create, get, accept
app.get('/api/requests', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM requests ORDER BY id DESC').all();
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
    const stmt = db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)');
    const info = stmt.run(r.title, r.subject, r.text||r.description||'', r.classFrom||'', r.classTo||'', r.type||'ask', (r.creator && r.creator.id) || null, (r.creator && r.creator.name) || null);
    const inserted = db.prepare('SELECT * FROM requests WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, request: inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

app.post('/api/requests/:id/accept', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body || {};
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    const now = Date.now();
    db.prepare('UPDATE requests SET accepted = 1, acceptedBy = ?, acceptedAt = ? WHERE id = ?').run(body.userId || null, now, id);
    const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    res.json({ success: true, request: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
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
    const user = db.prepare('SELECT id, firstName,lastName,name,email,schoolClass,age,city,avgGrade,gender,bio,profileConfigured FROM users WHERE id = ?').get(id);
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
