export const INITIAL_SCHEMA = `
  CREATE TABLE IF NOT EXISTS financial_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    institution TEXT,
    account_type TEXT NOT NULL DEFAULT 'credit_card',
    currency_code TEXT NOT NULL DEFAULT 'MXN',
    last_four_digits TEXT,
    statement_close_day INTEGER,
    payment_due_day INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES financial_accounts(id) ON DELETE SET NULL,
    merchant_id INTEGER REFERENCES merchants(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    currency_code TEXT NOT NULL DEFAULT 'MXN',
    transaction_date TEXT NOT NULL,
    posted_date TEXT,
    status TEXT NOT NULL DEFAULT 'posted',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE IF NOT EXISTS installment_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE RESTRICT,
    plan_type TEXT NOT NULL DEFAULT 'msi',
    installment_count INTEGER NOT NULL CHECK (installment_count > 0),
    first_due_date TEXT NOT NULL,
    total_principal_minor INTEGER NOT NULL CHECK (total_principal_minor > 0),
    total_interest_minor INTEGER NOT NULL DEFAULT 0 CHECK (total_interest_minor >= 0),
    total_fees_minor INTEGER NOT NULL DEFAULT 0 CHECK (total_fees_minor >= 0),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    installment_plan_id INTEGER NOT NULL REFERENCES installment_plans(id) ON DELETE RESTRICT,
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    due_date TEXT NOT NULL,
    principal_minor INTEGER NOT NULL CHECK (principal_minor >= 0),
    interest_minor INTEGER NOT NULL DEFAULT 0 CHECK (interest_minor >= 0),
    fees_minor INTEGER NOT NULL DEFAULT 0 CHECK (fees_minor >= 0),
    total_minor INTEGER NOT NULL CHECK (total_minor > 0),
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (installment_plan_id, installment_number)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES financial_accounts(id) ON DELETE SET NULL,
    payment_date TEXT NOT NULL,
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    currency_code TEXT NOT NULL DEFAULT 'MXN',
    status TEXT NOT NULL DEFAULT 'posted',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payment_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    installment_id INTEGER NOT NULL REFERENCES installments(id) ON DELETE RESTRICT,
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    created_at TEXT NOT NULL,
    UNIQUE (payment_id, installment_id)
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_active_date
    ON transactions(transaction_date) WHERE archived_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_installments_due_date
    ON installments(due_date);
  CREATE INDEX IF NOT EXISTS idx_installments_status
    ON installments(status);
`;
