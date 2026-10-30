const db = require('./db');

db.prepare(`
  INSERT OR IGNORE INTO users (id, email, password_hash, name)
  VALUES (1, 'test@example.com', 'temporary', 'Test User')
`).run();

console.log('Test user ready');