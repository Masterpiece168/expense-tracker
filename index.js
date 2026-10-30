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

app.get('/api/expenses', (req, res) => {
  const rows = db.prepare(`
    SELECT e.id, e.amount_cents, e.description, e.expense_date,
           e.payment_method, c.name AS category
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    WHERE e.user_id = ?
    ORDER BY e.expense_date DESC, e.id DESC
  `).all(USER_ID);

  res.json(rows);
});

app.post('/api/expenses', (req, res) => {
  const { amount_cents, description, expense_date, category_id, payment_method } = req.body;

  // RULE 1: amount must be a whole number greater than 0
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    return res.status(400).json({ error: 'amount_cents must be a whole number greater than 0' });
  }

  // RULE 2: date must look like 2026-10-30
  if (typeof expense_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expense_date)) {
    return res.status(400).json({ error: 'expense_date must look like 2026-10-30' });
  }

  // RULE 3: the category must exist and belong to this user
  const category = db
    .prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .get(category_id, USER_ID);

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Optional field: only these four payment methods are allowed
  const method = payment_method ?? 'cash';
  if (!['cash', 'card', 'bank_transfer', 'e_wallet'].includes(method)) {
    return res.status(400).json({ error: 'payment_method must be cash, card, bank_transfer or e_wallet' });
  }

  const result = db.prepare(`
    INSERT INTO expenses (user_id, category_id, amount_cents, description, expense_date, payment_method)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(USER_ID, category_id, amount_cents, description ?? null, expense_date, method);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/health', (req, res) => {
  res.json({status: 'ok'});
});

// 4. Start listening for requests on port 3000
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});