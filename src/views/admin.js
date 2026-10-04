import { esc, rub, date, productImg, lessonImg, statusLabel } from './util.js';
import { REQUEST_STATUS, ORDER_STATUS, PRODUCT_STATUS, CATEGORIES, SHAPES, LEVELS, CHANNELS, DELIVERY, label } from '../constants.js';

const NAV = [
  ['/admin', 'Обзор'],
  ['/admin/requests', 'Заявки'],
  ['/admin/orders', 'Заказы'],
  ['/admin/products', 'Изделия'],
  ['/admin/lessons', 'Мастер-классы'],
  ['/admin/settings', 'Настройки'],
];

export function shell({ title, body, current, flash }) {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Админка</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/admin.css">
<meta name="robots" content="noindex">
</head><body>
<aside class="side">
  <a class="side__logo" href="/admin"><span>Я</span> Админка</a>
  <nav>${NAV.map(([h, t]) => `<a href="${h}" class="${current === h ? 'is-active' : ''}">${t}</a>`).join('')}</nav>
  <div class="side__foot"><a href="/" target="_blank">Открыть сайт ↗</a><form method="post" action="/admin/logout"><button>Выйти</button></form></div>
</aside>
<main class="content">
  <h1>${esc(title)}</h1>
  ${flash ? `<p class="flash">${esc(flash)}</p>` : ''}
  ${body}
</main>
<script src="/js/admin.js"></script>
</body></html>`;
}

export const loginPage = (error) => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Вход</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Manrope:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/admin.css"><meta name="robots" content="noindex"></head>
<body class="login"><form method="post" action="/admin/login" class="login__box">
<span class="login__mark">Я</span><h1>Вход для Ярославы</h1>
${error ? `<p class="flash flash--error">${esc(error)}</p>` : ''}
<label>Пароль<input type="password" name="password" autofocus required></label>
<button class="btn">Войти</button></form></body></html>`;

const badge = (pairs, key) => `<span class="st st--${esc(key)}">${esc(label(pairs, key))}</span>`;
const select = (name, pairs, value) =>
  `<select name="${name}">${pairs.map(([k, t]) => `<option value="${esc(k)}" ${k === value ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
const contactLine = (c) => `${esc(label(CHANNELS, c.channel))}: <b>${esc(c.handle)}</b>${c.phone ? ` · тел. ${esc(c.phone)}` : ''}${c.email ? ` · ${esc(c.email)}` : ''}`;

/* ---------- dashboard ---------- */

export function dashboard({ requests, orders, products, lessons }) {
  const newReq = requests.filter((r) => r.status === 'new');
  const activeReq = requests.filter((r) => !['done', 'cancelled'].includes(r.status));
  const awaiting = orders.filter((o) => ['new', 'awaiting_payment'].includes(o.status));
  const body = `
<div class="kpis">
  <a class="kpi" href="/admin/requests?status=new"><b>${newReq.length}</b><span>новых заявок</span></a>
  <a class="kpi" href="/admin/requests"><b>${activeReq.length}</b><span>заявок в работе</span></a>
  <a class="kpi" href="/admin/orders"><b>${awaiting.length}</b><span>заказов ждут оплаты</span></a>
  <a class="kpi" href="/admin/products"><b>${products.filter((p) => p.status === 'available').length}/${products.length}</b><span>изделий в наличии</span></a>
  <a class="kpi" href="/admin/lessons"><b>${lessons.length}</b><span>мастер-классов</span></a>
</div>
<h2>Последние заявки</h2>
${requestsTable(requests.slice(0, 8))}
<h2>Последние заказы</h2>
${ordersTable(orders.slice(0, 8))}`;
  return shell({ title: 'Обзор', body, current: '/admin' });
}

/* ---------- custom requests ---------- */

function requestsTable(list) {
  if (!list.length) return '<p class="empty">Пока пусто.</p>';
  return `<table class="table"><thead><tr><th>№</th><th>Дата</th><th>Изделие</th><th>Клиент</th><th>Статус</th></tr></thead><tbody>
${list.map((r) => `<tr data-href="/admin/requests/${r.id}"><td><a href="/admin/requests/${r.id}">${esc(r.number)}</a></td><td>${date(r.createdAt)}</td><td>${esc(r.itemLabel)}${r.refs.length ? ` · 📎${r.refs.length}` : ''}</td><td>${esc(r.contact.name)}<br><small>${esc(label(CHANNELS, r.contact.channel))} ${esc(r.contact.handle)}</small></td><td>${badge(REQUEST_STATUS, r.status)}</td></tr>`).join('')}
</tbody></table>`;
}

export function requests({ list, status, counts }) {
  const tabs = [['', 'Все'], ...REQUEST_STATUS];
  const body = `
<div class="tabs">${tabs.map(([k, t]) => `<a href="/admin/requests${k ? `?status=${k}` : ''}" class="${status === k ? 'is-active' : ''}">${t} <small>${k ? counts[k] || 0 : counts.all}</small></a>`).join('')}</div>
${requestsTable(list)}`;
  return shell({ title: 'Индивидуальные заявки', body, current: '/admin/requests' });
}

export function requestDetail({ r, flash }) {
  const idx = REQUEST_STATUS.findIndex(([k]) => k === r.status);
  const rows = [
    ['Изделие', r.itemLabel],
    ['Похоже на', r.likeProduct ? `<a href="/shop/${esc(r.likeProduct)}" target="_blank">${esc(r.likeProduct)}</a>` : ''],
    ['Пряжа', r.yarnLabel],
    ['Цвета', [...r.colors, r.customColor].filter(Boolean).map(esc).join(', ') + (r.colorAdvice ? ' · <i>хочет подобрать вместе</i>' : '')],
    ['Размер', r.sizeMode === 'size' ? esc(r.size || '—') : Object.entries(r.measures).map(([k, v]) => `${esc(k)}: ${esc(v)} см`).join('<br>')],
    ['Посадка', esc(r.fit)],
    ['Пожелания', esc(r.comment).replace(/\n/g, '<br>')],
    ['Срок', esc(r.deadline)],
    ['Бюджет', esc(r.budget)],
  ].filter(([, v]) => v);
  const body = `
<p class="crumbs"><a href="/admin/requests">← Все заявки</a></p>
<div class="pipeline">${REQUEST_STATUS.filter(([k]) => k !== 'cancelled').map(([k, t], i) => `<span class="${i < idx ? 'past' : ''}${k === r.status ? ' now' : ''}">${t}</span>`).join('')}</div>
<div class="cols">
  <section class="panel">
    <h2>${esc(r.number)} · ${date(r.createdAt)}</h2>
    <dl class="dl">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
    ${r.refs.length ? `<h3>Референсы</h3><div class="thumbs">${r.refs.map((f) => `<a href="/admin/files/${r.id}/${esc(f.file)}" target="_blank"><img src="/admin/files/${r.id}/${esc(f.file)}" alt=""><span>${esc(f.tagLabel)}</span></a>`).join('')}</div>` : ''}
  </section>
  <section class="panel">
    <h2>Клиент</h2>
    <p><b>${esc(r.contact.name)}</b></p>
    <p>${contactLine(r.contact)}</p>
    ${r.contact.wantsCall ? '<p class="warn">Просит позвонить</p>' : ''}
    ${r.contact.channel === 'telegram' ? `<p><a class="btn btn--small" href="https://t.me/${esc(r.contact.handle.replace(/^@/, ''))}" target="_blank">Написать в Telegram</a></p>` : ''}
    <form method="post" action="/admin/requests/${r.id}/status" class="stack">
      <label>Статус ${select('status', REQUEST_STATUS, r.status)}</label>
      <label>Заметка (необязательно)<textarea name="note" rows="3" placeholder="Например: согласовали мохер, срок 4 недели, предоплата получена"></textarea></label>
      <button class="btn">Сохранить</button>
    </form>
    <h3>История</h3>
    <ul class="history">${[...r.history].reverse().map((h) => `<li><time>${date(h.at)}</time> ${h.status ? badge(REQUEST_STATUS, h.status) : ''} ${esc(h.note || '')}</li>`).join('')}</ul>
  </section>
</div>`;
  return shell({ title: `Заявка ${r.number}`, body, current: '/admin/requests', flash });
}

/* ---------- shop orders ---------- */

function ordersTable(list) {
  if (!list.length) return '<p class="empty">Пока пусто.</p>';
  return `<table class="table"><thead><tr><th>№</th><th>Дата</th><th>Тип</th><th>Состав</th><th>Сумма</th><th>Клиент</th><th>Статус</th></tr></thead><tbody>
${list.map((o) => `<tr data-href="/admin/orders/${o.id}"><td><a href="/admin/orders/${o.id}">${esc(o.number)}</a></td><td>${date(o.createdAt)}</td><td>${o.type === 'lesson' ? 'Урок' : 'Изделия'}</td><td>${o.items.map((i) => esc(i.title)).join(', ')}</td><td>${rub(o.total)}</td><td>${esc(o.customer.name)}</td><td>${badge(ORDER_STATUS, o.status)}</td></tr>`).join('')}
</tbody></table>`;
}

export function orders({ list }) {
  return shell({ title: 'Заказы', body: ordersTable(list), current: '/admin/orders' });
}

export function orderDetail({ o, siteUrl, flash }) {
  const c = o.customer;
  const body = `
<p class="crumbs"><a href="/admin/orders">← Все заказы</a></p>
<div class="cols">
  <section class="panel">
    <h2>${esc(o.number)} · ${date(o.createdAt)} ${badge(ORDER_STATUS, o.status)}</h2>
    <table class="table table--plain">${o.items.map((i) => `<tr><td>${esc(i.title)}</td><td>${rub(i.price)}</td></tr>`).join('')}<tr><th>Итого</th><th>${rub(o.total)}</th></tr></table>
    <dl class="dl">
      <dt>Клиент</dt><dd>${esc(c.name)}</dd>
      <dt>Связь</dt><dd>${contactLine(c)}</dd>
      ${o.type === 'goods' ? `<dt>Доставка</dt><dd>${esc(label(DELIVERY, c.delivery))}${c.delivery !== 'pickup' ? `<br>${esc([c.zip, c.city, c.address].filter(Boolean).join(', '))}` : ''}</dd>` : ''}
      ${c.comment ? `<dt>Комментарий</dt><dd>${esc(c.comment)}</dd>` : ''}
      <dt>Оплата</dt><dd>${o.payment ? `${esc(o.payment.provider)} ${esc(o.payment.id || '')}` : 'по ссылке вручную'}</dd>
      ${o.accessToken ? `<dt>Доступ к уроку</dt><dd><input class="copy" readonly value="${esc(siteUrl)}/lessons/watch/${esc(o.accessToken)}"></dd>` : ''}
    </dl>
  </section>
  <section class="panel">
    <h2>Действия</h2>
    ${!['paid', 'shipped', 'done', 'cancelled'].includes(o.status) ? `<form method="post" action="/admin/orders/${o.id}/paid" class="stack"><button class="btn">Подтвердить оплату</button><p class="hint">${o.type === 'lesson' ? 'Будет создана персональная ссылка на урок и отправлена клиенту на email.' : 'Изделия получат статус «Продано».'}</p></form>` : ''}
    <form method="post" action="/admin/orders/${o.id}/status" class="stack">
      <label>Статус ${select('status', ORDER_STATUS, o.status)}</label>
      <button class="btn btn--ghost">Сохранить статус</button>
      <p class="hint">При отмене забронированные изделия вернутся в наличие.</p>
    </form>
  </section>
</div>`;
  return shell({ title: `Заказ ${o.number}`, body, current: '/admin/orders', flash });
}

/* ---------- products ---------- */

export function products({ list, flash }) {
  const body = `
<p><a class="btn" href="/admin/products/new">+ Добавить изделие</a></p>
<table class="table"><thead><tr><th></th><th>Название</th><th>Категория</th><th>Цена</th><th>Наличие</th><th>На главной</th></tr></thead><tbody>
${list.map((p) => `<tr data-href="/admin/products/${p.id}"><td><img class="tiny" src="${esc(productImg(p))}" style="background:${esc(p.bg)}" alt=""></td><td><a href="/admin/products/${p.id}">${esc(p.title)}</a></td><td>${esc(p.category)}</td><td>${rub(p.price)}</td><td><span class="st st--${esc(p.status)}">${statusLabel(p.status)}</span></td><td>${p.featured ? '★' : ''}</td></tr>`).join('')}
</tbody></table>`;
  return shell({ title: 'Изделия', body, current: '/admin/products', flash });
}

const opt = (list, value) => list.map(([k, t]) => `<option value="${esc(k)}" ${k === value ? 'selected' : ''}>${esc(t)}</option>`).join('');

export function productForm({ p, flash }) {
  const isNew = !p.id;
  const body = `
<p class="crumbs"><a href="/admin/products">← Все изделия</a>${!isNew ? ` · <a href="/shop/${esc(p.slug)}" target="_blank">Открыть на сайте ↗</a>` : ''}</p>
<form method="post" enctype="multipart/form-data" action="${isNew ? '/admin/products' : `/admin/products/${p.id}`}" class="form">
  <div class="cols">
    <section class="panel">
      <label>Название *<input name="title" required value="${esc(p.title)}" placeholder="Шаль «Гранат»"></label>
      <div class="row">
        <label>Категория <select name="category">${opt(CATEGORIES.map((c) => [c, c]), p.category)}</select></label>
        <label>Цена, ₽ *<input name="price" type="number" min="0" required value="${esc(p.price)}"></label>
      </div>
      <div class="row">
        <label>Наличие <select name="status">${opt(Object.entries(PRODUCT_STATUS), p.status)}</select></label>
        <label>Порядок <input name="sort" type="number" value="${esc(p.sort ?? 0)}"></label>
      </div>
      <label>Короткое описание<textarea name="description" rows="4">${esc(p.description)}</textarea></label>
      <div class="row">
        <label>Техника<input name="material" value="${esc(p.material)}" placeholder="Вязание спицами"></label>
        <label>Состав<input name="composition" value="${esc(p.composition)}" placeholder="100% меринос"></label>
      </div>
      <div class="row">
        <label>Размер<input name="size" value="${esc(p.size)}" placeholder="S — M"></label>
        <label>Параметры<input name="params" value="${esc(p.params)}" placeholder="Длина 60 см"></label>
      </div>
      <label>Особенности ручной работы (по одной в строке)<textarea name="features" rows="4">${esc((p.features || []).join('\n'))}</textarea></label>
      <label class="inline"><input type="checkbox" name="featured" value="1" ${p.featured ? 'checked' : ''}> Показывать на главной в «Избранных работах»</label>
    </section>
    <section class="panel">
      <h2>Фотографии</h2>
      ${(p.images || []).length ? `<div class="thumbs thumbs--edit">${p.images.map((src) => `<label><img src="${esc(src)}" alt=""><span><input type="checkbox" name="removeImages" value="${esc(src)}"> удалить</span></label>`).join('')}</div>` : '<p class="hint">Пока нет фото — на сайте показывается иллюстрация-заглушка.</p>'}
      <label>Добавить фото (можно несколько)<input type="file" name="images" accept="image/*" multiple></label>
      <div class="row">
        <label>Цвет фона карточки<input type="color" name="bg" value="${esc(p.bg || '#E8DDD0')}"></label>
        <label>Силуэт заглушки <select name="shape">${opt(Object.entries(SHAPES), p.shape)}</select></label>
      </div>
      <div class="actions">
        <button class="btn">${isNew ? 'Создать' : 'Сохранить'}</button>
      </div>
    </section>
  </div>
</form>
${!isNew ? `<form method="post" action="/admin/products/${p.id}/delete" data-confirm="Удалить изделие «${esc(p.title)}»?"><button class="btn btn--danger">Удалить изделие</button></form>` : ''}`;
  return shell({ title: isNew ? 'Новое изделие' : p.title, body, current: '/admin/products', flash });
}

/* ---------- lessons ---------- */

export function lessons({ list, flash }) {
  const body = `
<p><a class="btn" href="/admin/lessons/new">+ Добавить мастер-класс</a></p>
<table class="table"><thead><tr><th></th><th>Название</th><th>Уровень</th><th>Длительность</th><th>Цена</th><th>Видео</th><th>Опубликован</th></tr></thead><tbody>
${list.map((l) => `<tr data-href="/admin/lessons/${l.id}"><td><img class="tiny" src="${esc(lessonImg(l))}" style="background:${esc(l.bg)}" alt=""></td><td><a href="/admin/lessons/${l.id}">${esc(l.title)}</a></td><td>${esc(l.level)}</td><td>${esc(l.duration)}</td><td>${rub(l.price)}</td><td>${(l.videos || []).filter((v) => v.url).length}</td><td>${l.published ? 'да' : 'нет'}</td></tr>`).join('')}
</tbody></table>`;
  return shell({ title: 'Мастер-классы', body, current: '/admin/lessons', flash });
}

export function lessonForm({ l, flash }) {
  const isNew = !l.id;
  const pairs = (arr) => (arr || []).map((x) => x.join(' | ')).join('\n');
  const body = `
<p class="crumbs"><a href="/admin/lessons">← Все мастер-классы</a>${!isNew ? ` · <a href="/lessons/${esc(l.slug)}" target="_blank">Открыть на сайте ↗</a>` : ''}</p>
<form method="post" enctype="multipart/form-data" action="${isNew ? '/admin/lessons' : `/admin/lessons/${l.id}`}" class="form">
  <div class="cols">
    <section class="panel">
      <label>Название *<input name="title" required value="${esc(l.title)}"></label>
      <label>Подзаголовок<input name="subtitle" value="${esc(l.subtitle)}"></label>
      <div class="row">
        <label>Уровень <select name="level">${opt(LEVELS.map((x) => [x, x]), l.level)}</select></label>
        <label>Длительность<input name="duration" value="${esc(l.duration)}" placeholder="2 ч 10 мин"></label>
        <label>Цена, ₽ *<input name="price" type="number" min="0" required value="${esc(l.price)}"></label>
      </div>
      <label>Что получится в результате<textarea name="result" rows="2">${esc(l.result)}</textarea></label>
      <label>Чему научится (по пункту в строке)<textarea name="learn" rows="4">${esc((l.learn || []).join('\n'))}</textarea></label>
      <label>Программа (строка: «Название | 25 мин»)<textarea name="program" rows="6">${esc(pairs(l.program))}</textarea></label>
      <label>Материалы (по пункту в строке)<textarea name="materials" rows="4">${esc((l.materials || []).join('\n'))}</textarea></label>
      <label>Что входит (по пункту в строке)<textarea name="includes" rows="4">${esc((l.includes || []).join('\n'))}</textarea></label>
    </section>
    <section class="panel">
      <h2>Видео (закрытый доступ)</h2>
      <label>Строка: «Название | ссылка» — YouTube, RuTube, VK, Kinescope или прямая ссылка на mp4<textarea name="videos" rows="6">${esc((l.videos || []).map((v) => `${v.title} | ${v.url}`).join('\n'))}</textarea></label>
      <h2>Превью</h2>
      ${l.preview ? `<p><img class="preview" src="${esc(l.preview)}" alt=""></p><label class="inline"><input type="checkbox" name="removePreview" value="1"> удалить превью</label>` : ''}
      <label>Загрузить превью<input type="file" name="preview" accept="image/*"></label>
      <div class="row">
        <label>Цвет фона<input type="color" name="bg" value="${esc(l.bg || '#7A1323')}"></label>
        <label>Мотив заглушки <select name="motif">${opt(Object.entries(SHAPES), l.motif)}</select></label>
        <label>Порядок<input name="sort" type="number" value="${esc(l.sort ?? 0)}"></label>
      </div>
      <label class="inline"><input type="checkbox" name="published" value="1" ${l.published !== false ? 'checked' : ''}> Опубликован</label>
      <label class="inline"><input type="checkbox" name="featured" value="1" ${l.featured ? 'checked' : ''}> Показывать на главной</label>
      <div class="actions"><button class="btn">${isNew ? 'Создать' : 'Сохранить'}</button></div>
    </section>
  </div>
</form>
${!isNew ? `<form method="post" action="/admin/lessons/${l.id}/delete" data-confirm="Удалить мастер-класс «${esc(l.title)}»?"><button class="btn btn--danger">Удалить</button></form>` : ''}`;
  return shell({ title: isNew ? 'Новый мастер-класс' : l.title, body, current: '/admin/lessons', flash });
}

/* ---------- settings ---------- */

export function settings({ s, flash, mailReady, payMode }) {
  const body = `
<form method="post" enctype="multipart/form-data" action="/admin/settings" class="form">
  <div class="cols">
    <section class="panel">
      <h2>Контакты на сайте</h2>
      <label>Telegram<input name="telegram" value="${esc(s.telegram)}"></label>
      <label>MAX<input name="max" value="${esc(s.max)}"></label>
      <label>Email для клиентов<input name="email" type="email" value="${esc(s.email)}"></label>
      <label>Телефон (необязательно)<input name="phone" value="${esc(s.phone)}"></label>
      <div class="row">
        <label>Город<input name="city" value="${esc(s.city)}"></label>
        <label>Адрес самовывоза<input name="pickupAddress" value="${esc(s.pickupAddress)}"></label>
      </div>
    </section>
    <section class="panel">
      <h2>Фотографии</h2>
      ${s.heroImage ? `<img class="preview" src="${esc(s.heroImage)}" alt="">` : ''}
      <label>Портрет на главной<input type="file" name="heroImage" accept="image/*"></label>
      ${s.aboutImage ? `<img class="preview" src="${esc(s.aboutImage)}" alt="">` : ''}
      <label>Фото на странице «О Ярославе»<input type="file" name="aboutImage" accept="image/*"></label>
      <h2>Система</h2>
      <p>Уведомления на email: <b>${mailReady ? 'SMTP настроен' : 'SMTP не настроен — письма сохраняются в data/outbox'}</b></p>
      <p>Оплата: <b>${payMode === 'yookassa' ? 'ЮKassa (онлайн)' : 'вручную — ссылку на оплату вы отправляете сами'}</b></p>
      <p class="hint">Почта, пароль админки и ключи ЮKassa задаются в файле .env на сервере.</p>
      <div class="actions"><button class="btn">Сохранить</button></div>
    </section>
  </div>
</form>`;
  return shell({ title: 'Настройки', body, current: '/admin/settings', flash });
}
