const Database = require('better-sqlite3');

// Opens the file "expenses.db", or creates it if it doesn't exist
const db = new Database('expenses.db');

// SQLite ignores foreign keys unless you turn this on for every connection
db.pragma('foreign_keys = ON');

db.exec(`
  -- 1. USERS: one row per person who registers (used from Phase 3)
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,              -- never store the real password
    name          TEXT NOT NULL,
    currency      TEXT NOT NULL DEFAULT 'USD',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- 2. CATEGORIES: Food, Transport, Rent... each user has their own list
  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT NOT NULL,
    color      TEXT NOT NULL DEFAULT '#6366f1', -- used for chart colors later
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, name),                     -- no two "Food" for the same user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 3. EXPENSES: the main table, one row per purchase
  CREATE TABLE IF NOT EXISTS expenses (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    category_id    INTEGER NOT NULL,
    amount_cents   INTEGER NOT NULL CHECK (amount_cents > 0),  -- 12.50 is stored as 1250
    description    TEXT,
    expense_date   TEXT NOT NULL,                              -- 'YYYY-MM-DD'
    payment_method TEXT NOT NULL DEFAULT 'cash'
                   CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'e_wallet')),
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  -- 4. BUDGETS: a monthly spending limit per category
  CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    month       TEXT NOT NULL,                                 -- 'YYYY-MM'
    limit_cents INTEGER NOT NULL CHECK (limit_cents > 0),
    UNIQUE (user_id, category_id, month),                      -- one budget per category per month
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  -- INDEXES: make the most common searches fast
  CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses (user_id, expense_date);
  CREATE INDEX IF NOT EXISTS idx_expenses_category  ON expenses (category_id);
`);

module.exports = db;