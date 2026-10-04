import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { ROOT, UPLOADS_DIR, PRIVATE_DIR, load, refresh, db, save, nextNumber, uid, token, uniqueSlug, blobOn } from './src/db.js';
import { storeMedia, storePrivate, readPrivate, readMedia, removeStored } from './src/files.js';
import { seed } from './src/seed.js';
import { sendMail } from './src/mail.js';
import * as auth from './src/auth.js';
import * as pay from './src/payments.js';
import { placeholderSvg } from './src/ph.js';
import * as V from './src/views/pages.js';
import * as A from './src/views/admin.js';
import { esc, rub, lines } from './src/views/util.js';
import {
  ITEMS, YARNS, MEASURES, REF_TAGS, CHANNELS, DELIVERY, REQUEST_STATUS, ORDER_STATUS, PRODUCT_STATUS,
  CATEGORIES, SHAPES, LEVELS, SHAPE_TO_ITEM, label,
} from './src/constants.js';

const ready = load(seed);
const PORT = Number(process.env.PORT || 3000);
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.VERCEL ? true : 'loopback');

app.use('/vendor/gsap', express.static(path.join(ROOT, 'node_modules/gsap/dist'), { maxAge: '7d' }));
app.use(express.static(path.join(ROOT, 'public'), { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }));
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '200kb' }));
app.use((req, res, next) => {
  if (/^\/(css|js|vendor|ph|media|uploads|favicon)/.test(req.path)) return next();
  ready.then(() => refresh()).then(() => next(), next);
});

const S = () => db().settings;
const siteUrl = (req) => process.env.SITE_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const sortBy = (list) => [...list].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
const published = () => sortBy(db().lessons.filter((l) => l.published !== false));

/* ---------- uploads ---------- */

const imageFilter = (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif|heic|heif)$/.test(file.mimetype));
const diskTo = (dirFn) =>
  multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = dirFn(req);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, `${token(9)}${path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg'}`),
  });

const uploadStorage = blobOn() ? multer.memoryStorage() : null;
const requestUpload = multer({
  storage: uploadStorage || diskTo((req) => {
    req.requestId ??= uid();
    return path.join(PRIVATE_DIR, 'requests', req.requestId);
  }),
  fileFilter: imageFilter,
  limits: { files: 8, fileSize: 10 * 1024 * 1024 },
});
const mediaUpload = multer({
  storage: uploadStorage || diskTo(() => path.join(UPLOADS_DIR, 'media')),
  fileFilter: imageFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

/* ---------- emails ---------- */

const mailRow = (k, v) => (v ? `<tr><td style="padding:4px 12px 4px 0;color:#8b7b76;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>` : '');

async function notifyRequest(r, req) {
  const rows = [
    mailRow('Изделие', esc(r.itemLabel)),
    mailRow('Похоже на', esc(r.likeProduct)),
    mailRow('Пряжа', esc(r.yarnLabel)),
    mailRow('Цвета', esc([...r.colors, r.customColor].filter(Boolean).join(', ')) + (r.colorAdvice ? ' (подобрать вместе)' : '')),
    mailRow('Размер', r.sizeMode === 'size' ? esc(r.size) : Object.entries(r.measures).map(([k, v]) => `${esc(k)}: ${esc(v)} см`).join('<br>')),
    mailRow('Посадка', esc(r.fit)),
    mailRow('Пожелания', esc(r.comment).replace(/\n/g, '<br>')),
    mailRow('Срок', esc(r.deadline)),
    mailRow('Бюджет', esc(r.budget)),
    mailRow('Имя', esc(r.contact.name)),
    mailRow(esc(label(CHANNELS, r.contact.channel)), esc(r.contact.handle)),
    mailRow('Телефон', esc(r.contact.phone) + (r.contact.wantsCall ? ' — <b>просит позвонить</b>' : '')),
    mailRow('Email', esc(r.contact.email)),
    mailRow('Референсы', r.refs.length ? `${r.refs.length} фото во вложении` : ''),
  ].join('');
  sendMail({
    subject: `Новая заявка ${r.number}: ${r.itemLabel}`,
    html: `<h2 style="font-family:Georgia,serif;color:#7A1323">Новая заявка ${esc(r.number)}</h2><table>${rows}</table><p><a href="${siteUrl(req)}/admin/requests/${r.id}">Открыть в админке</a></p>`,
    attachments: (await Promise.all(r.refs.map(async (f) => {
      const got = await readPrivate(r.id, f.file);
      return got ? { filename: f.file, content: got.buffer } : null;
    }))).filter(Boolean),
  });
}

function notifyOrder(o, req) {
  const c = o.customer;
  sendMail({
    subject: `Новый заказ ${o.number} · ${rub(o.total)}`,
    html: `<h2 style="font-family:Georgia,serif;color:#7A1323">Заказ ${esc(o.number)}</h2>
<ul>${o.items.map((i) => `<li>${esc(i.title)} — ${rub(i.price)}</li>`).join('')}</ul>
<table>${mailRow('Итого', rub(o.total))}${mailRow('Имя', esc(c.name))}${mailRow(esc(label(CHANNELS, c.channel)), esc(c.handle))}${mailRow('Телефон', esc(c.phone))}${mailRow('Email', esc(c.email))}${o.type === 'goods' ? mailRow('Доставка', esc(label(DELIVERY, c.delivery)) + ' ' + esc([c.zip, c.city, c.address].filter(Boolean).join(', '))) : ''}${mailRow('Комментарий', esc(c.comment))}</table>
<p><a href="${siteUrl(req)}/admin/orders/${o.id}">Открыть в админке</a></p>`,
  });
}

/* ---------- order state ---------- */

async function markPaid(o, req) {
  if (['paid', 'shipped', 'done'].includes(o.status)) return;
  o.status = 'paid';
  o.paidAt = new Date().toISOString();
  if (o.type === 'goods') {
    for (const it of o.items) {
      const p = db().products.find((x) => x.id === it.id);
      if (p) p.status = 'sold';
    }
  } else {
    o.accessToken ||= token(24);
    const l = db().lessons.find((x) => x.id === o.items[0]?.id);
    const link = `${siteUrl(req)}/lessons/watch/${o.accessToken}`;
    if (o.customer.email) {
      sendMail({
        to: o.customer.email,
        subject: `Доступ к уроку «${l?.title || ''}»`,
        html: `<h2 style="font-family:Georgia,serif;color:#7A1323">Спасибо за покупку!</h2><p>Ваш урок «${esc(l?.title)}» доступен по персональной ссылке:</p><p><a href="${link}">${link}</a></p><p>Ссылка действует всегда — сохраните это письмо.</p><p>Ярослава</p>`,
      });
    }
  }
  await save();
}

function releaseGoods(o) {
  if (o.type !== 'goods') return;
  for (const it of o.items) {
    const p = db().products.find((x) => x.id === it.id);
    if (p && p.status === 'reserved' && p.reservedBy === o.id) {
      p.status = 'available';
      delete p.reservedBy;
    }
  }
}

async function syncPayment(o, req) {
  if (pay.mode !== 'yookassa' || !o.payment?.id || o.status === 'paid') return;
  try {
    const p = await pay.getPayment(o.payment.id);
    if (p.status === 'succeeded') await markPaid(o, req);
    if (p.status === 'canceled' && o.status === 'awaiting_payment') {
      o.status = 'cancelled';
      releaseGoods(o);
      await save();
    }
  } catch (err) {
    console.error('[pay] status check failed', err.message);
  }
}

/* ---------- public pages ---------- */

app.get('/ph/:shape.svg', (req, res) => {
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=604800').send(placeholderSvg(req.params.shape, req.query.bg, req.query.fg));
});

app.get('/', (_req, res) => {
  const { products } = db();
  const sorted = sortBy(products);
  let featured = sorted.filter((p) => p.featured);
  if (featured.length < 3) featured = sorted.slice(0, 4);
  const lessons = published();
  const ls = lessons.filter((l) => l.featured);
  res.send(V.home({
    settings: S(),
    featured: featured.slice(0, 5),
    lessons: (ls.length >= 2 ? ls : lessons).slice(0, 2),
    counts: { available: products.filter((p) => p.status === 'available').length, lessons: lessons.length },
  }));
});

app.get('/shop', (req, res) => {
  const order = { available: 0, reserved: 1, repeat: 2, sold: 3 };
  const products = sortBy(db().products).sort((a, b) => order[a.status] - order[b.status]);
  res.send(V.shop({ settings: S(), products, activeCat: CATEGORIES.includes(req.query.cat) ? req.query.cat : '' }));
});

app.get('/shop/:slug', (req, res, next) => {
  const p = db().products.find((x) => x.slug === req.params.slug);
  if (!p) return next();
  const more = sortBy(db().products).filter((x) => x.id !== p.id && x.status !== 'sold').slice(0, 3);
  res.send(V.product({ settings: S(), p, more }));
});

app.get('/lessons', (_req, res) => res.send(V.lessons({ settings: S(), list: published() })));

app.get('/lessons/watch/:token', (req, res, next) => {
  const o = db().orders.find((x) => x.type === 'lesson' && x.accessToken && x.accessToken === req.params.token);
  if (!o || !['paid', 'shipped', 'done'].includes(o.status)) return next();
  const l = db().lessons.find((x) => x.id === o.items[0]?.id);
  if (!l) return next();
  res.set('X-Robots-Tag', 'noindex').send(V.watch({ settings: S(), l, order: o }));
});

app.get('/lessons/:slug', (req, res, next) => {
  const l = published().find((x) => x.slug === req.params.slug);
  if (!l) return next();
  res.send(V.lesson({ settings: S(), l }));
});

app.get('/order', (req, res) => {
  const p = req.query.like && db().products.find((x) => x.slug === req.query.like);
  res.send(V.order({ settings: S(), like: p ? { p, item: SHAPE_TO_ITEM[p.shape] || 'other' } : null }));
});

app.get('/about', (_req, res) => res.send(V.about({ settings: S(), counts: { products: db().products.length, lessons: published().length } })));
app.get('/contacts', (_req, res) => res.send(V.contacts({ settings: S() })));
app.get('/info/:key', (req, res, next) => {
  const html = V.info({ settings: S(), key: req.params.key });
  return html ? res.send(html) : next();
});

app.get('/checkout', (req, res, next) => {
  const l = req.query.lesson ? published().find((x) => x.slug === req.query.lesson) : null;
  if (req.query.lesson && !l) return next();
  res.send(V.checkout({ settings: S(), lesson: l }));
});

app.get('/checkout/done/:id', async (req, res, next) => {
  const o = db().orders.find((x) => x.id === req.params.id && x.publicKey === req.query.k);
  if (!o) return next();
  await syncPayment(o, req);
  const l = o.type === 'lesson' ? db().lessons.find((x) => x.id === o.items[0]?.id) : null;
  res.set('X-Robots-Tag', 'noindex').send(V.done({ settings: S(), order: o, lesson: l, payMode: pay.mode }));
});

/* ---------- public API ---------- */

app.get('/api/search', (req, res) => {
  const q = str(req.query.q, 80).toLowerCase();
  if (q.length < 2) return res.json([]);
  const hit = (...fields) => fields.some((f) => String(f || '').toLowerCase().includes(q));
  const products = db().products
    .filter((p) => hit(p.title, p.category, p.material, p.composition, p.description))
    .map((p) => ({ kind: 'Изделие', title: p.title, url: `/shop/${p.slug}`, meta: p.status === 'sold' ? 'Продано' : rub(p.price), img: p.images[0] || `/ph/${p.shape}.svg?bg=${p.bg.slice(1)}` }));
  const lessons = published()
    .filter((l) => hit(l.title, l.subtitle, l.level, l.result))
    .map((l) => ({ kind: 'Видео-урок', title: l.title, url: `/lessons/${l.slug}`, meta: rub(l.price), img: l.preview || `/ph/${l.motif}.svg?bg=${l.bg.slice(1)}` }));
  res.json([...products, ...lessons].slice(0, 8));
});

app.post('/api/products/lookup', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.slice(0, 30).map(String) : [];
  res.json(
    ids
      .map((id) => db().products.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => ({ id: p.id, title: p.title, price: p.price, status: p.status, slug: p.slug, bg: p.bg, img: p.images[0] || `/ph/${p.shape}.svg?bg=${p.bg.slice(1)}&fg=${'F3ECE4'}` })),
  );
});

app.post('/api/requests', (req, res, next) => {
  requestUpload.array('refs', 8)(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Фото больше 10 МБ — уменьшите его, пожалуйста.' : err.code === 'LIMIT_FILE_COUNT' ? 'Можно загрузить не больше 8 фото.' : 'Не удалось загрузить фото.';
      return res.status(400).json({ error: msg });
    }
    handleRequest(req, res).catch(next);
  });
});

async function handleRequest(req, res) {
    const b = req.body;
    const item = ITEMS.find((i) => i.id === b.item);
    const handle = str(b.handle, 80);
    const name = str(b.name, 80);
    if (!item || !handle || !name || b.consent !== '1') {
      if (req.requestId) fs.rm(path.join(PRIVATE_DIR, 'requests', req.requestId), { recursive: true, force: true }, () => {});
      return res.status(400).json({ error: 'Заполните тип изделия, имя и контакт в Telegram или MAX.' });
    }
    const id = req.requestId || uid();
    const tags = [].concat(b.refTags || []);
    const refs = blobOn()
      ? await Promise.all((req.files || []).map(async (f, i) => ({ file: await storePrivate(id, f), tag: tags[i] || 'item', tagLabel: label(REF_TAGS, tags[i] || 'item') })))
      : (req.files || []).map((f, i) => ({ file: f.filename, tag: tags[i] || 'item', tagLabel: label(REF_TAGS, tags[i] || 'item') }));
    const yarn = YARNS.find((y) => y.id === b.yarn);
    const measures = {};
    for (const [k, n] of MEASURES) if (b[`m_${k}`]) measures[n] = str(b[`m_${k}`], 6);
    const r = {
      id,
      number: `Я-${String(nextNumber('request')).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      status: 'new',
      item: item.id,
      itemLabel: item.id === 'other' && b.itemOther ? `Другое: ${str(b.itemOther, 120)}` : item.label,
      likeProduct: str(b.likeProduct, 80),
      yarn: yarn?.id || '',
      yarnLabel: yarn ? `${yarn.name} (${yarn.composition})` : 'Не выбрана',
      colors: [].concat(b.colors || []).map((c) => str(c, 40)).slice(0, 3),
      customColor: str(b.customColor, 120),
      colorAdvice: b.colorAdvice === '1',
      sizeMode: b.sizeMode === 'measures' ? 'measures' : 'size',
      size: str(b.size, 6),
      measures,
      fit: str(b.fit, 40),
      comment: str(b.comment, 3000),
      deadline: str(b.deadline, 80),
      budget: str(b.budget, 80),
      refs,
      contact: {
        name,
        channel: CHANNELS.some(([k]) => k === b.channel) ? b.channel : 'telegram',
        handle,
        phone: str(b.phone, 30),
        wantsCall: b.wantsCall === '1',
        email: str(b.email, 120),
      },
      history: [{ at: new Date().toISOString(), status: 'new', note: 'Заявка создана на сайте' }],
    };
    db().requests.unshift(r);
    await save();
    notifyRequest(r, req).catch((err) => console.error('[mail]', err.message));
    res.json({ ok: true, number: r.number, status: label(REQUEST_STATUS, r.status) });
}

app.post('/api/checkout', async (req, res) => {
  const b = req.body || {};
  const customer = {
    name: str(b.name, 80),
    channel: CHANNELS.some(([k]) => k === b.channel) ? b.channel : 'telegram',
    handle: str(b.handle, 80),
    phone: str(b.phone, 30),
    email: str(b.email, 120),
    comment: str(b.comment, 1000),
  };
  if (!customer.name || !customer.handle || b.consent !== true) return res.status(400).json({ error: 'Укажите имя и контакт в Telegram или MAX.' });

  let items;
  let type;
  if (b.lesson) {
    type = 'lesson';
    const l = published().find((x) => x.slug === b.lesson);
    if (!l) return res.status(404).json({ error: 'Урок не найден.' });
    if (!/^\S+@\S+\.\S+$/.test(customer.email)) return res.status(400).json({ error: 'Укажите email — на него придёт ссылка на урок.' });
    items = [{ id: l.id, title: l.title, price: l.price }];
  } else {
    type = 'goods';
    const ids = [...new Set((Array.isArray(b.items) ? b.items : []).map(String))].slice(0, 20);
    const products = ids.map((id) => db().products.find((p) => p.id === id)).filter(Boolean);
    if (!products.length) return res.status(400).json({ error: 'Корзина пуста.' });
    const unavailable = products.filter((p) => p.status !== 'available');
    if (unavailable.length) return res.status(409).json({ error: `Уже недоступно: ${unavailable.map((p) => p.title).join(', ')}. Уберите из корзины и попробуйте снова.`, unavailable: unavailable.map((p) => p.id) });
    customer.delivery = DELIVERY.some(([k]) => k === b.delivery) ? b.delivery : 'cdek';
    customer.city = str(b.city, 80);
    customer.zip = str(b.zip, 12);
    customer.address = str(b.address, 200);
    if (customer.delivery !== 'pickup' && (!customer.city || !customer.address)) return res.status(400).json({ error: 'Укажите город и адрес доставки.' });
    items = products.map((p) => ({ id: p.id, title: p.title, price: p.price }));
  }

  const o = {
    id: uid(),
    publicKey: token(12),
    number: `З-${String(nextNumber('order')).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
    type,
    items,
    total: items.reduce((s, i) => s + Number(i.price), 0),
    customer,
    status: 'new',
  };
  if (type === 'goods') {
    for (const it of items) {
      const p = db().products.find((x) => x.id === it.id);
      p.status = 'reserved';
      p.reservedBy = o.id;
    }
  }
  db().orders.unshift(o);
  await save();
  notifyOrder(o, req);

  const doneUrl = `/checkout/done/${o.id}?k=${o.publicKey}`;
  if (pay.mode === 'yookassa') {
    try {
      const p = await pay.createPayment(o, siteUrl(req) + doneUrl);
      o.payment = { provider: 'yookassa', id: p.id, url: p.url };
      o.status = 'awaiting_payment';
      await save();
      return res.json({ redirect: p.url });
    } catch (err) {
      console.error('[pay] create failed', err.message);
    }
  }
  o.status = 'awaiting_payment';
  await save();
  res.json({ redirect: doneUrl });
});

app.post('/api/pay/webhook', async (req, res) => {
  const id = req.body?.object?.id;
  const o = id && db().orders.find((x) => x.payment?.id === id);
  if (o) await syncPayment(o, req);
  res.sendStatus(200);
});

/* ---------- admin ---------- */

app.get('/admin/login', (req, res) => (auth.isAdmin(req) ? res.redirect('/admin') : res.send(A.loginPage())));
app.post('/admin/login', (req, res) => {
  if (!auth.checkPassword(req.body.password)) return res.status(401).send(A.loginPage('Неверный пароль'));
  auth.login(res);
  res.redirect('/admin');
});
app.post('/admin/logout', (_req, res) => {
  auth.logout(res);
  res.redirect('/admin/login');
});

const admin = express.Router();
admin.use(auth.requireAdmin);
const flashOf = (req) => ({ saved: 'Сохранено', created: 'Создано', deleted: 'Удалено', paid: 'Оплата подтверждена' })[req.query.f] || '';

admin.get('/', (_req, res) => res.send(A.dashboard(db())));

admin.get('/requests', (req, res) => {
  const status = REQUEST_STATUS.some(([k]) => k === req.query.status) ? req.query.status : '';
  const all = db().requests;
  const counts = { all: all.length };
  for (const r of all) counts[r.status] = (counts[r.status] || 0) + 1;
  res.send(A.requests({ list: status ? all.filter((r) => r.status === status) : all, status, counts }));
});

admin.get('/requests/:id', (req, res, next) => {
  const r = db().requests.find((x) => x.id === req.params.id);
  return r ? res.send(A.requestDetail({ r, flash: flashOf(req) })) : next();
});

admin.post('/requests/:id/status', wrap(async (req, res, next) => {
  const r = db().requests.find((x) => x.id === req.params.id);
  if (!r) return next();
  const status = REQUEST_STATUS.some(([k]) => k === req.body.status) ? req.body.status : r.status;
  const note = str(req.body.note, 1000);
  if (status !== r.status || note) {
    r.history.push({ at: new Date().toISOString(), status: status !== r.status ? status : '', note });
    r.status = status;
    await save();
  }
  res.redirect(`/admin/requests/${r.id}?f=saved`);
}));

admin.get('/files/:id/:file', wrap(async (req, res, next) => {
  const got = await readPrivate(req.params.id, req.params.file);
  if (!got) return next();
  res.set('Cache-Control', 'private, max-age=86400');
  sendImage(res, req.params.file, got);
}));

const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.heic': 'image/heic', '.heif': 'image/heif' };
function sendImage(res, name, got) {
  res.set('Content-Type', got.contentType || TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream');
  res.send(got.buffer);
}

app.get('/media/:file', wrap(async (req, res, next) => {
  const got = await readMedia(req.params.file);
  if (!got) return next();
  res.set('Cache-Control', 'public, max-age=604800');
  sendImage(res, req.params.file, got);
}));

admin.get('/orders', (_req, res) => res.send(A.orders({ list: db().orders })));
admin.get('/orders/:id', (req, res, next) => {
  const o = db().orders.find((x) => x.id === req.params.id);
  return o ? res.send(A.orderDetail({ o, siteUrl: siteUrl(req), flash: flashOf(req) })) : next();
});
admin.post('/orders/:id/paid', wrap(async (req, res, next) => {
  const o = db().orders.find((x) => x.id === req.params.id);
  if (!o) return next();
  if (o.status !== 'cancelled') await markPaid(o, req);
  res.redirect(`/admin/orders/${o.id}?f=paid`);
}));
admin.post('/orders/:id/status', wrap(async (req, res, next) => {
  const o = db().orders.find((x) => x.id === req.params.id);
  if (!o) return next();
  const status = ORDER_STATUS.some(([k]) => k === req.body.status) ? req.body.status : o.status;
  if (status === 'paid') await markPaid(o, req);
  else {
    if (status === 'cancelled') releaseGoods(o);
    o.status = status;
    await save();
  }
  res.redirect(`/admin/orders/${o.id}?f=saved`);
}));

const emptyProduct = () => ({ title: '', category: CATEGORIES[0], shape: 'sweater', bg: '#E8DDD0', price: '', status: 'available', images: [], features: [], sort: db().products.length });

async function applyProduct(p, b, files) {
  p.title = str(b.title, 120) || 'Без названия';
  p.slug = uniqueSlug(db().products, p.title, p.id);
  p.category = CATEGORIES.includes(b.category) ? b.category : CATEGORIES[0];
  p.price = Math.max(0, Number(b.price) || 0);
  p.status = PRODUCT_STATUS[b.status] ? b.status : 'available';
  if (p.status !== 'reserved') delete p.reservedBy;
  p.sort = Number(b.sort) || 0;
  p.description = str(b.description, 2000);
  p.material = str(b.material, 120);
  p.composition = str(b.composition, 120);
  p.size = str(b.size, 80);
  p.params = str(b.params, 200);
  p.features = lines(b.features).slice(0, 12);
  p.featured = b.featured === '1';
  p.bg = /^#[0-9a-f]{6}$/i.test(b.bg) ? b.bg : '#E8DDD0';
  p.shape = SHAPES[b.shape] ? b.shape : 'sweater';
  const remove = [].concat(b.removeImages || []);
  await Promise.all(remove.map(removeStored));
  const uploaded = [];
  for (const f of files || []) uploaded.push(await storeMedia(f));
  p.images = (p.images || []).filter((src) => !remove.includes(src)).concat(uploaded);
}

admin.get('/products', (req, res) => res.send(A.products({ list: sortBy(db().products), flash: flashOf(req) })));
admin.get('/products/new', (_req, res) => res.send(A.productForm({ p: emptyProduct() })));
admin.post('/products', mediaUpload.array('images', 12), wrap(async (req, res) => {
  const p = { ...emptyProduct(), id: uid(), createdAt: new Date().toISOString() };
  await applyProduct(p, req.body, req.files);
  db().products.push(p);
  await save();
  res.redirect(`/admin/products/${p.id}?f=created`);
}));
admin.get('/products/:id', (req, res, next) => {
  const p = db().products.find((x) => x.id === req.params.id);
  return p ? res.send(A.productForm({ p, flash: flashOf(req) })) : next();
});
admin.post('/products/:id', mediaUpload.array('images', 12), wrap(async (req, res, next) => {
  const p = db().products.find((x) => x.id === req.params.id);
  if (!p) return next();
  await applyProduct(p, req.body, req.files);
  await save();
  res.redirect(`/admin/products/${p.id}?f=saved`);
}));
admin.post('/products/:id/delete', wrap(async (req, res) => {
  const list = db().products;
  const i = list.findIndex((x) => x.id === req.params.id);
  if (i >= 0) {
    await Promise.all(list[i].images.map(removeStored));
    list.splice(i, 1);
    await save();
  }
  res.redirect('/admin/products?f=deleted');
}));

const emptyLesson = () => ({ title: '', level: LEVELS[0], duration: '', price: '', bg: '#7A1323', motif: 'rose', learn: [], program: [], materials: [], includes: [], videos: [], published: true, sort: db().lessons.length });

async function applyLesson(l, b, file) {
  const split = (s) => s.split('|').map((x) => x.trim());
  l.title = str(b.title, 120) || 'Без названия';
  l.slug = uniqueSlug(db().lessons, l.title, l.id);
  l.subtitle = str(b.subtitle, 200);
  l.level = LEVELS.includes(b.level) ? b.level : LEVELS[0];
  l.duration = str(b.duration, 40);
  l.price = Math.max(0, Number(b.price) || 0);
  l.result = str(b.result, 600);
  l.learn = lines(b.learn).slice(0, 20);
  l.program = lines(b.program).slice(0, 40).map((x) => { const [t, d = ''] = split(x); return [t, d]; });
  l.materials = lines(b.materials).slice(0, 20);
  l.includes = lines(b.includes).slice(0, 20);
  l.videos = lines(b.videos).slice(0, 40).map((x) => { const [t, ...u] = split(x); return { title: u.length ? t : 'Урок', url: u.length ? u.join('|') : t }; });
  l.bg = /^#[0-9a-f]{6}$/i.test(b.bg) ? b.bg : '#7A1323';
  l.motif = SHAPES[b.motif] ? b.motif : 'rose';
  l.sort = Number(b.sort) || 0;
  l.published = b.published === '1';
  l.featured = b.featured === '1';
  if (b.removePreview === '1' || file) {
    await removeStored(l.preview);
    l.preview = '';
  }
  if (file) l.preview = await storeMedia(file);
}

admin.get('/lessons', (req, res) => res.send(A.lessons({ list: sortBy(db().lessons), flash: flashOf(req) })));
admin.get('/lessons/new', (_req, res) => res.send(A.lessonForm({ l: emptyLesson() })));
admin.post('/lessons', mediaUpload.single('preview'), wrap(async (req, res) => {
  const l = { ...emptyLesson(), id: uid(), createdAt: new Date().toISOString() };
  await applyLesson(l, req.body, req.file);
  db().lessons.push(l);
  await save();
  res.redirect(`/admin/lessons/${l.id}?f=created`);
}));
admin.get('/lessons/:id', (req, res, next) => {
  const l = db().lessons.find((x) => x.id === req.params.id);
  return l ? res.send(A.lessonForm({ l, flash: flashOf(req) })) : next();
});
admin.post('/lessons/:id', mediaUpload.single('preview'), wrap(async (req, res, next) => {
  const l = db().lessons.find((x) => x.id === req.params.id);
  if (!l) return next();
  await applyLesson(l, req.body, req.file);
  await save();
  res.redirect(`/admin/lessons/${l.id}?f=saved`);
}));
admin.post('/lessons/:id/delete', wrap(async (req, res) => {
  const list = db().lessons;
  const i = list.findIndex((x) => x.id === req.params.id);
  if (i >= 0) {
    await removeStored(list[i].preview);
    list.splice(i, 1);
    await save();
  }
  res.redirect('/admin/lessons?f=deleted');
}));

admin.get('/settings', (req, res) => res.send(A.settings({ s: S(), flash: flashOf(req), mailReady: Boolean(process.env.SMTP_HOST), payMode: pay.mode })));
admin.post('/settings', mediaUpload.fields([{ name: 'heroImage', maxCount: 1 }, { name: 'aboutImage', maxCount: 1 }]), wrap(async (req, res) => {
  const s = S();
  for (const k of ['telegram', 'max', 'email', 'phone', 'city', 'pickupAddress']) s[k] = str(req.body[k], 200);
  for (const k of ['heroImage', 'aboutImage']) {
    const f = req.files?.[k]?.[0];
    if (f) {
      await removeStored(s[k]);
      s[k] = await storeMedia(f);
    }
  }
  await save();
  res.redirect('/admin/settings?f=saved');
}));

app.use('/admin', admin);

/* ---------- errors ---------- */

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Не найдено' });
  res.status(404).send(V.notFound({ settings: S() }));
});

app.use((err, req, res, _next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'Что-то пошло не так. Попробуйте ещё раз.' });
  res.status(500).send('Ошибка сервера');
});

if (!process.env.VERCEL) {
  ready.then(() => app.listen(PORT, () => {
    console.log(`Сайт Ярославы: http://localhost:${PORT}`);
    console.log(`Админка: http://localhost:${PORT}/admin${process.env.ADMIN_PASSWORD ? '' : '  (пароль по умолчанию «yaroslava» — задайте ADMIN_PASSWORD в .env)'}`);
    console.log(`Оплата: ${pay.mode === 'yookassa' ? 'ЮKassa' : 'вручную'} · Email: ${process.env.SMTP_HOST ? 'SMTP' : 'data/outbox'}`);
  }));
}

export default app;
