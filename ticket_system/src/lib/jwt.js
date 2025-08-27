import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export function signAccessToken({ sub, role }) {
  return jwt.sign({ sub, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getUserFromRequest(req) {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const decoded = verifyAccessToken(header.slice(7));
    return { id: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}
