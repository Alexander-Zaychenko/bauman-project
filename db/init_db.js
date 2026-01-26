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
  profileConfigured INTEGER DEFAULT 0,
  skillpoints INTEGER DEFAULT 0
);
`);

// Seed a sample user if table empty
const row = db.prepare('SELECT COUNT(1) as c FROM users').get();
if (row && row.c === 0) {
  db.prepare('INSERT INTO users (firstName,lastName,name,email,password,schoolClass,age,city,avgGrade,gender,bio,profileConfigured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .run('Иван', 'Иванов', 'Иванов Иван', 'ivan@test.ru', '123456', '10', '16', 'Москва', '4.2', 'male', 'Люблю математику', 1);
  db.prepare('INSERT INTO users (firstName,lastName,name,email,password,schoolClass,age,city,avgGrade,gender,bio,profileConfigured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .run('Ольга', 'Олеговна', 'Олеговна Ольга', 'olga@test.ru', 'password', '11', '18', 'СПб', '4.53', 'female', 'Готова помочь с обществознанием', 1);
  db.prepare('INSERT INTO users (firstName,lastName,name,email,password,schoolClass,age,city,avgGrade,gender,bio,profileConfigured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .run('Анна', 'Петрова', 'Петрова Анна', 'anna@test.ru', 'pwd123', '9', '15', 'Казань', '4.0', 'female', '', 0);
  console.log('Seeded sample users');
}

// Ensure requests table exists and seed sample requests if empty
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
const rcount = db.prepare('SELECT COUNT(1) as c FROM requests').get();
if (rcount && rcount.c === 0) {
  db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
    .run('Обществознание (7-8 класс)', 'Обществознание', 'Нужна помощь с темой права и обязанностей.', '7', '8', 'ask', 2, 'Олеговна Ольга');
  db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
    .run('Математика: задачи на проценты', 'Математика', 'Нужна помощь с задачами на проценты и смешанные числа.', '9', '11', 'ask', 1, 'Иванов Иван');
  db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
    .run('Алгебра: формулы сокращенного умножения', 'Алгебра', 'Разобрать формулы и примеры их применения.', '8', '9', 'ask', 3, 'Петрова Анна');
  console.log('Seeded sample requests');
}

console.log('DB initialized at', dbPath);
