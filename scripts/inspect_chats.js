const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'db', 'data.sqlite3');
const db = new Database(dbPath, { readonly: true });
try {
  const chats = db.prepare('SELECT * FROM chats ORDER BY id DESC').all();
  console.log('chats:', JSON.stringify(chats, null, 2));
  const msgs = db.prepare('SELECT * FROM chat_messages ORDER BY id DESC LIMIT 50').all();
  console.log('messages:', JSON.stringify(msgs, null, 2));
} catch (e) { console.error('inspect chats error', e); process.exit(2); }
