const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'db', 'data.sqlite3');
const db = new Database(dbPath, { readonly: true });
try {
  const tbl = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name='requests'").get();
  console.log('table info:', tbl);
  const cols = db.prepare("PRAGMA table_info('requests')").all();
  console.log('columns:', cols);
} catch (e) {
  console.error('schema inspect error', e);
  process.exit(2);
}
