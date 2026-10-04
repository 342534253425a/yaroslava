import crypto from 'node:crypto';
import { db } from './db.js';

const COOKIE = 'ya_admin';
const TTL = 1000 * 60 * 60 * 24 * 14;

const secret = () => process.env.SESSION_SECRET || db().settings.secret;
const sign = (value) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');

export const adminPassword = () => process.env.ADMIN_PASSWORD || 'yaroslava';

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((p) => p.trim().split('=')).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]),
  );
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkPassword(input) {
  return safeEqual(input || '', adminPassword());
}

export function login(res) {
  const expires = String(Date.now() + TTL);
  res.cookie(COOKIE, `${expires}.${sign(expires)}`, { httpOnly: true, sameSite: 'lax', maxAge: TTL, path: '/' });
}

export function logout(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

export function isAdmin(req) {
  const raw = parseCookies(req.headers.cookie)[COOKIE];
  if (!raw) return false;
  const [expires, sig] = raw.split('.');
  return Boolean(sig) && safeEqual(sig, sign(expires)) && Number(expires) > Date.now();
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.redirect('/admin/login');
}
