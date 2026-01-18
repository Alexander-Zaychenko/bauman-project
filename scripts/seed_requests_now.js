const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'db', 'data.sqlite3');
const db = new Database(dbPath);
try {
  const rcount = db.prepare('SELECT COUNT(1) as c FROM requests').get();
  console.log('current requests count:', rcount.c);
  if (rcount.c === 0) {
    db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
      .run('Обществознание (7-8 класс)', 'Обществознание', 'Нужна помощь с темой права и обязанностей.', '7', '8', 'ask', 2, 'Олеговна Ольга');
    db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
      .run('Математика: задачи на проценты', 'Математика', 'Нужна помощь с задачами на проценты и смешанные числа.', '9', '11', 'ask', 1, 'Иванов Иван');
    db.prepare('INSERT INTO requests (title,subject,text,classFrom,classTo,type,creatorId,creatorName) VALUES (?,?,?,?,?,?,?,?)')
      .run('Алгебра: формулы сокращенного умножения', 'Алгебра', 'Разобрать формулы и примеры их применения.', '8', '9', 'ask', 3, 'Петрова Анна');
    console.log('Inserted sample requests');
  } else {
    console.log('Skipping insert; requests present');
  }
} catch (e) {
  console.error('seeding failed', e);
  process.exit(2);
}
