const db = require('../config/db');
const { verifyToken } = require('../utils/security');

function getTokenFromRequest(req) {
  const header = req.headers?.authorization;
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function getAuthSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-insecure-secret';
}

async function attachUser(req, userId) {
  const { rows } = await db.query(
    'SELECT id, email, full_name, school_name, grade, created_at FROM users WHERE id = $1',
    [userId],
  );
  req.user = rows[0] ?? null;
}

async function optionalAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  let verified;
  try {
    verified = verifyToken(token, getAuthSecret());
  } catch (e) {
    return next(e);
  }

  if (!verified.ok) return next();

  const userId = verified.payload?.sub;
  if (typeof userId !== 'string' || userId.length === 0) return next();

  req.auth = { userId, tokenPayload: verified.payload };
  try {
    await attachUser(req, userId);
  } catch (e) {
    return next(e);
  }
  return next();
}

async function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: 'missing_auth' });

  let verified;
  try {
    verified = verifyToken(token, getAuthSecret());
  } catch (e) {
    return next(e);
  }
  if (!verified.ok) return res.status(401).json({ error: verified.error ?? 'invalid_auth' });

  const userId = verified.payload?.sub;
  if (typeof userId !== 'string' || userId.length === 0) {
    return res.status(401).json({ error: 'invalid_auth' });
  }

  req.auth = { userId, tokenPayload: verified.payload };
  try {
    await attachUser(req, userId);
  } catch (e) {
    return next(e);
  }

  if (!req.user) return res.status(401).json({ error: 'user_not_found' });
  return next();
}

module.exports = { optionalAuth, requireAuth };
