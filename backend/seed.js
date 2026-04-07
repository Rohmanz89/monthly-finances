require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DB_URL });

(async () => {
  try {
    const hashed = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password, role, name) VALUES ($1, $2, 'admin', 'Admin')`,
      ['admin@mail.com', hashed]
    );
    console.log('Default user created:');
    console.log('  Email: admin@mail.com');
    console.log('  Password: admin123');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
  process.exit(0);
})();
