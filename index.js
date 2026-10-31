// =====================================================================
// EXPENSE TRACKER API
//
// How this file is organized:
//   1. SETUP        - load libraries, create the app, settings
//   2. HELPERS      - small functions that routes share
//   3. ROUTES       - grouped by feature: general, auth, categories, expenses
//   4. START SERVER - always last
// =====================================================================


// ---------------------------------------------------------------------
// 1. SETUP
// ---------------------------------------------------------------------
const express = require('express');   // the web framework (like Spring Boot, but lighter)
const bcrypt = require('bcryptjs');   // scrambles passwords into hashes
const jwt = require('jsonwebtoken');  // creates and checks login tokens
const db = require('./db');           // our SQLite database (see db.js)

const app = express();
app.use(express.json());              // lets the server read JSON sent by clients

// Secret used to sign login tokens. In production it comes from an environment variable.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

// TEMPORARY: pretend user number 1 is always logged in.
// Step two of Phase 3 replaces this with the real user from the token.
const USER_ID = 1;

// Categories every new user starts with
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Other'];


// ---------------------------------------------------------------------
// 2. HELPERS
// ---------------------------------------------------------------------

// Checks the data for creating or editing an expense.
// Returns null if everything is fine, or { status, error } describing the problem.
function validateExpense(body) {
  const { amount_cents, expense_date, category_id, payment_method } = body;

  // Rule 1: amount must be a whole number greater than 0
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    return { status: 400, error: 'amount_cents must be a whole number greater than 0' };
  }

  // Rule 2: date must look like 2026-10-30
  if (typeof expense_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expense_date)) {
    return { status: 400, error: 'expense_date must look like 2026-10-30' };
  }

  // Rule 3: payment method (optional) must be one of the allowed values
  const method = payment_method ?? 'cash';
  if (!['cash', 'card', 'bank_transfer', 'e_wallet'].includes(method)) {
    return { status: 400, error: 'payment_method must be cash, card, bank_transfer or e_wallet' };
  }

  // Rule 4: the category must exist and belong to this user
  const category = db
    .prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .get(category_id, USER_ID);
  if (!category) {
    return { status: 404, error: 'Category not found' };
  }

  return null;
}


// ---------------------------------------------------------------------
// 3. ROUTES
// ---------------------------------------------------------------------

// ----- General -----

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


// ----- Auth: register and login -----

// POST /api/auth/register  -> create an account
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Check the input
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }

  // Scramble the password. We never store the real one.
  const passwordHash = await bcrypt.hash(password, 10);

  // A transaction: either the user AND their categories are saved, or nothing is
  const createUser = db.transaction(() => {
    const result = db
      .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
      .run(email.trim().toLowerCase(), passwordHash, name.trim());

    const insertCategory = db.prepare('INSERT INTO categories (user_id, name) VALUES (?, ?)');
    for (const categoryName of DEFAULT_CATEGORIES) {
      insertCategory.run(result.lastInsertRowid, categoryName);
    }
    return result.lastInsertRowid;
  });

  try {
    const id = createUser();
    res.status(201).json({ id, email: email.trim().toLowerCase(), name: name.trim() });
  } catch (err) {
    // The UNIQUE rule on email was broken: this email already has an account
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// POST /api/auth/login  -> check the password and hand back a token
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Check the input
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }

  // Find the user by email (undefined if there is no such account)
  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.trim().toLowerCase());

  // Compare the typed password with the stored hash
  const passwordOk = user && await bcrypt.compare(password, user.password_hash);

  if (!passwordOk) {
    // Same message for a wrong email and a wrong password, so attackers learn nothing
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Create a token that says "this is user X" and stops working after 7 days
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});


// ----- Categories -----

// GET /api/categories  -> list this user's categories
app.get('/api/categories', (req, res) => {
  const rows = db
    .prepare('SELECT id, name, color FROM categories WHERE user_id = ?')
    .all(USER_ID);
  res.json(rows);
});

// POST /api/categories  -> add a category
app.post('/api/categories', (req, res) => {
  const { name } = req.body;

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const result = db
      .prepare('INSERT INTO categories (user_id, name) VALUES (?, ?)')
      .run(USER_ID, name.trim());

    res.status(201).json({ id: result.lastInsertRowid, name: name.trim() });
  } catch (err) {
    // The UNIQUE rule was broken: this category already exists
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    throw err;
  }
});


// ----- Expenses -----

// GET /api/expenses  -> list this user's expenses, newest first
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

// POST /api/expenses  -> add an expense
app.post('/api/expenses', (req, res) => {
  const problem = validateExpense(req.body);
  if (problem) {
    return res.status(problem.status).json({ error: problem.error });
  }

  const { amount_cents, description, expense_date, category_id, payment_method } = req.body;

  const result = db.prepare(`
    INSERT INTO expenses (user_id, category_id, amount_cents, description, expense_date, payment_method)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(USER_ID, category_id, amount_cents, description ?? null, expense_date, payment_method ?? 'cash');

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/expenses/:id  -> replace an expense with new data
app.put('/api/expenses/:id', (req, res) => {
  const problem = validateExpense(req.body);
  if (problem) {
    return res.status(problem.status).json({ error: problem.error });
  }

  const { amount_cents, description, expense_date, category_id, payment_method } = req.body;

  const result = db.prepare(`
    UPDATE expenses
    SET category_id = ?, amount_cents = ?, description = ?, expense_date = ?, payment_method = ?
    WHERE id = ? AND user_id = ?
  `).run(category_id, amount_cents, description ?? null, expense_date,
         payment_method ?? 'cash', req.params.id, USER_ID);

  // changes = 0 means no row matched: wrong id, or it belongs to someone else
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json({ id: Number(req.params.id) });
});

// DELETE /api/expenses/:id  -> remove an expense
app.delete('/api/expenses/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
    .run(req.params.id, USER_ID);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.status(204).end();   // success, nothing to send back
});


// ---------------------------------------------------------------------
// 4. START SERVER
// ---------------------------------------------------------------------
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});