// lib/auth.js
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '8h';

export async function generateToken(user) {
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  return token;
}

export async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function getTokenFromCookies() {
  const cookieStore = cookies();
  return cookieStore.get('auth-token');
}

export async function getCurrentUser() {
  const token = getTokenFromCookies();
  if (!token) return null;
  
  try {
    return await verifyToken(token.value);
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 // 8 hours
  });
}