// /backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../db/sqlConnection'); // ✅ CORRECT IMPORT
require('dotenv').config();

// REGISTER
exports.register = async (req, res) => {
  try {
    const { username, email, password, role_id } = req.body;
    const pool = await poolPromise;
    const request = pool.request();

    // Ensure email/username unique
    const existing = await request
      .input('email', sql.NVarChar, email)
      .query('SELECT 1 FROM Users WHERE email = @email');
      
    if (existing.recordset.length) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash & Insert
    const hash = await bcrypt.hash(password, 10);
    await request
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, hash)
      .input('role_id', sql.Int, role_id)
      .input('created_at', sql.DateTime, new Date())
      .query(`
        INSERT INTO Users (username, email, password_hash, role_id, created_at)
        VALUES (@username, @email, @password_hash, @role_id, @created_at)
      `);

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('❌ register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await poolPromise;
    const request = pool.request();

    const result = await request
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    const user = result.recordset;
    if (user.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Password verification
    const validPassword = await bcrypt.compare(password, user[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { user_id: user[0].user_id, role_id: user[0].role_id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, user_id: user[0].user_id, role_id: user[0].role_id });
  } catch (err) {
    console.error('❌ login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
