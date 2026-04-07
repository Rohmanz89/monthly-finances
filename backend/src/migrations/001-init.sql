-- Drop existing tables (for clean re-creation)
DROP TABLE IF EXISTS dashboard_settings CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense'))
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  is_recurring BOOLEAN DEFAULT FALSE,
  next_date DATE,
  transaction_date DATE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE dashboard_settings (
  id SERIAL PRIMARY KEY,
  show_income BOOLEAN DEFAULT TRUE,
  show_expense BOOLEAN DEFAULT TRUE,
  show_balance BOOLEAN DEFAULT TRUE,
  show_reminder BOOLEAN DEFAULT TRUE,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE
);

-- Default categories
INSERT INTO categories (name, type) VALUES
  ('Gaji', 'income'),
  ('Freelance', 'income'),
  ('Investasi', 'income'),
  ('Bonus', 'income'),
  ('Listrik', 'expense'),
  ('Air', 'expense'),
  ('Internet', 'expense'),
  ('Makanan', 'expense'),
  ('Transportasi', 'expense'),
  ('Hiburan', 'expense'),
  ('Belanja', 'expense'),
  ('Kesehatan', 'expense')
ON CONFLICT DO NOTHING;
