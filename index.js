// 1. Load the Express library (like an import in Java)
const express = require('express');
const db = require('./db');

// 2. Create the app
const app = express();
app.use(express.json());   // lets the server read JSON in request bodies

const USER_ID = 1;         // temporary, until real login in Phase 3

// 3. Define a route: when someone visits "/", send back "Hello World"
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/api/categories', (req, res) => {
  const rows = db
    .prepare('SELECT id, name, color FROM categories WHERE user_id = ?')
    .all(USER_ID);
  res.json(rows);
});

app.post('/api/categories', (req, res) => {
  const { name } = req.body;

  // Validate: name must be a non-empty string
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const result = db
      .prepare('INSERT INTO categories (user_id, name) VALUES (?, ?)')
      .run(USER_ID, name.trim());

    res.status(201).json({ id: result.lastInsertRowid, name: name.trim() });
  } catch (err) {
    // Our UNIQUE rule in the database was broken: this category already exists
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    throw err;
  }
});

app.get('/api/health', (req, res) => {
  res.json({status: 'ok'});
});

// 4. Start listening for requests on port 3000
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});