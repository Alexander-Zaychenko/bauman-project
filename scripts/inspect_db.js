const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'db', 'data.sqlite3');
const db = new Database(dbPath, { readonly: true });
try {
  const u = db.prepare('SELECT COUNT(1) as c FROM users').get();
  const r = db.prepare('SELECT COUNT(1) as c FROM requests').get();
  console.log('DB path:', dbPath);
  console.log('users:', u && u.c);
  console.log('requests:', r && r.c);
  const rows = db.prepare('SELECT id, title, subject, creatorName, accepted FROM requests ORDER BY id DESC LIMIT 20').all();
  console.log('recent requests rows:', JSON.stringify(rows, null, 2));
} catch (e) {
  console.error('DB inspect error', e);
  process.exit(2);
}
