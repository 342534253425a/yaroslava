import { PRODUCT_STATUS } from '../constants.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const rub = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n) || 0)) + '\u00a0₽';

export const date = (iso) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function titleHtml(title) {
  const [first, ...rest] = String(title).split(' ');
  return `<b>${esc(first)}</b>${rest.length ? ' ' + esc(rest.join(' ')) : ''}`;
}

function luminance(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  if (Number.isNaN(n)) return 0;
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const isDark = (hex) => luminance(hex) < 0.25;

export function placeholder(shape, bg = '#7A1323') {
  const fg = isDark(bg) ? 'F3ECE4' : '7A1323';
  return `/ph/${shape}.svg?bg=${String(bg).replace('#', '')}&fg=${fg}`;
}

export const productImg = (p, i = 0) => p.images?.[i] || placeholder(p.shape, p.bg);
export const lessonImg = (l) => l.preview || placeholder(l.motif || 'rose', l.bg);

export const statusLabel = (s) => PRODUCT_STATUS[s] || s;

export function plural(n, [one, few, many]) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const lines = (text) =>
  String(text || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
