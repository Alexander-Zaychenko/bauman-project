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
