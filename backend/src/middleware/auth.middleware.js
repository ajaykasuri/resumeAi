const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'guest') {
      const session = await queryOne(
        'SELECT * FROM guest_sessions WHERE session_token = ? AND expires_at > NOW()',
        [decoded.sessionToken]
      );
      if (!session) {
        return res.status(401).json({ success: false, message: 'Guest session expired' });
      }
      req.user = { id: null, role: 'guest', sessionToken: decoded.sessionToken, sessionId: session.id };
      return next();
    }

    const user = await queryOne(
      'SELECT id, uuid, name, email, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'guest') {
        const user = await queryOne(
          'SELECT id, uuid, name, email, role FROM users WHERE id = ? AND is_active = 1',
          [decoded.userId]
        );
        req.user = user || null;
      }
    }
    next();
  } catch {
    next();
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireRole };
