require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cron = require('node-cron');
const crypto = require('crypto');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Expense Tracker API is running!' });
});

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({ origin: '*' }));

app.use(express.json());

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP
  message: { message: 'Terlalu banyak percobaan, silakan coba lagi setelah 15 menit.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// ─── Auth Middleware ──────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(403);
  }
}

// ─── Auth - Login ────────────────────────────────────────────────
app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!user.rows.length) return res.status(401).json({ message: 'User not found' });
    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Wrong password' });
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await pool.query(
      'INSERT INTO refresh_tokens (token, expires_at, user_id) VALUES ($1, $2, $3)',
      [refreshToken, expiresAt, user.rows[0].id]
    );
    res.json({ accessToken: token, refreshToken, role: user.rows[0].role });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Auth - Register ─────────────────────────────────────────────
app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, role, name`,
      [email, hashed, name || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await pool.query(
      'INSERT INTO refresh_tokens (token, expires_at, user_id) VALUES ($1, $2, $3)',
      [refreshToken, expiresAt, user.id]
    );
    res.json({ accessToken: token, refreshToken, role: user.role });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email already registered' });
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Auth - Refresh & Logout ─────────────────────────────────────
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
    
    const result = await pool.query('SELECT * FROM refresh_tokens WHERE token=$1', [refreshToken]);
    if (!result.rows.length) return res.status(403).json({ message: 'Invalid refresh token' });
    
    const tokenData = result.rows[0];
    if (new Date() > new Date(tokenData.expires_at)) {
      await pool.query('DELETE FROM refresh_tokens WHERE token=$1', [refreshToken]);
      return res.status(403).json({ message: 'Refresh token expired' });
    }
    
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [tokenData.user_id]);
    if (!user.rows.length) return res.status(403).json({ message: 'User not found' });
    
    const newAccessToken = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

app.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token=$1', [refreshToken]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Dashboard ───────────────────────────────────────────────────
app.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const income = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=$1 AND type='income'`, [userId]
    );
    const expense = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=$1 AND type='expense'`, [userId]
    );
    const unpaid = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE user_id=$1 AND status='unpaid'`, [userId]
    );
    const recent = await pool.query(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id=$1
       ORDER BY t.created_at DESC`, [userId]
    );
    res.json({
      total_income: income.rows[0].total,
      total_expense: expense.rows[0].total,
      balance: income.rows[0].total - expense.rows[0].total,
      unpaid_count: unpaid.rows[0].count,
      transactions: recent.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Transactions - List ─────────────────────────────────────────
app.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id=$1
       ORDER BY t.transaction_date DESC, t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List transactions error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Transactions - Create ───────────────────────────────────────
app.post('/transactions', authMiddleware, async (req, res) => {
  try {
    const { title, amount, type, status, categoryId, date, is_recurring } = req.body;
    const result = await pool.query(
      `INSERT INTO transactions (user_id, title, amount, type, status, category_id, transaction_date, is_recurring, next_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CASE WHEN $8::BOOLEAN = true THEN $7::DATE + INTERVAL '1 month' ELSE NULL END)
       RETURNING *`,
      [req.user.id, title, amount, type, status || 'unpaid', categoryId || null, date || new Date(), is_recurring || false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create transaction error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Transactions - Update ───────────────────────────────────────
app.put('/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { title, amount, type, status, categoryId, date, is_recurring } = req.body;
    const result = await pool.query(
      `UPDATE transactions
       SET title=$1, amount=$2, type=$3, status=$4, category_id=$5, transaction_date=$6, is_recurring=$7, next_date=CASE WHEN $7::BOOLEAN = true THEN COALESCE(next_date, $6::DATE + INTERVAL '1 month') ELSE NULL END
       WHERE id=$8 AND user_id=$9
       RETURNING *`,
      [title, amount, type, status, categoryId || null, date, is_recurring || false, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update transaction error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Transactions - Delete ───────────────────────────────────────
app.delete('/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error('Delete transaction error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Categories - List ───────────────────────────────────────────
app.get('/categories', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY type, name');
    res.json(result.rows);
  } catch (err) {
    console.error('List categories error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Categories - Create ─────────────────────────────────────────
app.post('/categories', authMiddleware, async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ message: 'Name and type are required' });
    const result = await pool.query(
      'INSERT INTO categories (name, type) VALUES ($1, $2) RETURNING *',
      [name, type]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create category error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Categories - Delete ─────────────────────────────────────────
app.delete('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Settings - Get & Update ─────────────────────────────────────
app.get('/settings', authMiddleware, async (req, res) => {
  try {
    let result = await pool.query('SELECT show_income, show_expense, show_balance, show_reminder FROM dashboard_settings WHERE user_id=$1', [req.user.id]);
    if (!result.rows.length) {
      result = await pool.query(
        'INSERT INTO dashboard_settings (user_id) VALUES ($1) RETURNING show_income, show_expense, show_balance, show_reminder',
        [req.user.id]
      );
    }
    const s = result.rows[0];
    res.json({ showIncome: s.show_income, showExpense: s.show_expense, showBalance: s.show_balance, showReminder: s.show_reminder });
  } catch (err) {
    console.error('Get settings error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

app.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { showIncome, showExpense, showBalance, showReminder } = req.body;
    const result = await pool.query(
      `INSERT INTO dashboard_settings (user_id, show_income, show_expense, show_balance, show_reminder)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) 
       DO UPDATE SET show_income=$2, show_expense=$3, show_balance=$4, show_reminder=$5
       RETURNING show_income, show_expense, show_balance, show_reminder`,
      [req.user.id, showIncome, showExpense, showBalance, showReminder]
    );
    const s = result.rows[0];
    res.json({ showIncome: s.show_income, showExpense: s.show_expense, showBalance: s.show_balance, showReminder: s.show_reminder });
  } catch (err) {
    console.error('Update settings error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Reminder - Unpaid transactions ──────────────────────────────
app.get('/reminder', authMiddleware, async (req, res) => {
  try {
    const data = await pool.query(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id=$1 AND t.status='unpaid' AND t.transaction_date <= CURRENT_DATE`,
      [req.user.id]
    );
    res.json(data.rows);
  } catch (err) {
    console.error('Reminder error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Cron - Recurring transactions (every day at 00:00) ──────────
cron.schedule('0 0 * * *', async () => {
  console.log('Running recurring job...');
  try {
    const data = await pool.query(
      `SELECT * FROM transactions WHERE is_recurring=true AND next_date <= CURRENT_DATE`
    );
    for (let t of data.rows) {
      await pool.query(
        `INSERT INTO transactions (user_id, title, amount, type, status, category_id, transaction_date, is_recurring)
         VALUES ($1,$2,$3,$4,'unpaid',$5,$6,false)`,
        [t.user_id, t.title, t.amount, t.type, t.category_id, t.next_date]
      );
      await pool.query(
        `UPDATE transactions SET next_date = next_date + interval '1 month' WHERE id=$1`,
        [t.id]
      );
    }
    console.log(`Recurring job completed. Processed ${data.rows.length} transactions.`);
  } catch (err) {
    console.error('Recurring job error:', err.message);
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () =>
    console.log(`Server running on port ${port}`)
  );
}

module.exports = app;
