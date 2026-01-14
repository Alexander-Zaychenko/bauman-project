const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'data.sqlite3');
const db = new Database(dbPath);

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

// Seed a sample user if table empty
const row = db.prepare('SELECT COUNT(1) as c FROM users').get();
if (row && row.c === 0) {
  db.prepare('INSERT INTO users (firstName,lastName,name,email,password,profileConfigured) VALUES (?,?,?,?,?,?)')
    .run('Иван', 'Иванов', 'Иванов Иван', 'ivan@test.ru', '123456', 0);
  console.log('Seeded sample user: ivan@test.ru / 123456');
}

console.log('DB initialized at', dbPath);
