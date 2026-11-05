const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../config/database');
const { validationResult } = require('express-validator');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return { accessToken };
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), passwordHash, 'user']
    );

    const user = await queryOne(
      'SELECT id, uuid, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const { accessToken } = generateTokens(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await queryOne(
      'SELECT id, uuid, name, email, password_hash, role, is_active FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    const { accessToken } = generateTokens(user.id);
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/guest
const guestAccess = async (req, res, next) => {
  try {
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      'INSERT INTO guest_sessions (session_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?)',
      [sessionToken, req.ip, req.headers['user-agent'] || '', expiresAt]
    );

    const guestToken = jwt.sign(
      { type: 'guest', sessionToken },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Guest session created',
      data: { accessToken: guestToken, sessionToken, expiresAt },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    if (req.user.role === 'guest') {
      return res.json({
        success: true,
        data: { user: { role: 'guest', sessionToken: req.user.sessionToken } },
      });
    }

    const user = await queryOne(
      'SELECT id, uuid, name, email, role, avatar_url, is_verified, last_login_at, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    await query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);
    const user = await queryOne(
      'SELECT id, uuid, name, email, role, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, guestAccess, getMe, updateProfile, changePassword };
