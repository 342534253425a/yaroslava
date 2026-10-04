import { layout, icon } from './layout.js';
import { esc, rub, titleHtml, productImg, lessonImg, placeholder, statusLabel, plural, isDark } from './util.js';
import { CATEGORIES, ITEMS, YARNS, COLORS, SIZES, MEASURES, FITS, REF_TAGS, CHANNELS, DELIVERY, ORDER_STATUS, label } from '../constants.js';

const page = (settings, opts) => layout({ settings, ...opts });

/* ---------- shared components ---------- */

export function productCard(p) {
  const real = Boolean(p.images?.length);
  return `
<a class="card${p.status === 'sold' ? ' card--sold' : ''}" href="/shop/${esc(p.slug)}" data-card data-cat="${esc(p.category)}" data-status="${esc(p.status)}" data-cursor="Смотреть">
  <div class="card__media" style="--bg:${esc(p.bg)}">
    <img class="card__img${real ? '' : ' card__img--ph'}" src="${esc(productImg(p))}" alt="${esc(p.title)}" loading="lazy">
    <span class="badge badge--${esc(p.status)}">${statusLabel(p.status)}</span>
  </div>
  <div class="card__body">
    <h3 class="card__title">${titleHtml(p.title)}</h3>
    <p class="card__cat">${esc(p.category)}</p>
    <p class="card__price">${p.status === 'sold' ? 'Можно заказать похожее' : rub(p.price)}</p>
  </div>
</a>`;
}

export function lessonCard(l) {
  return `
<a class="lesson-card" href="/lessons/${esc(l.slug)}" data-reveal data-cursor="Подробнее">
  <div class="lesson-card__media" style="--bg:${esc(l.bg)}">
    <img src="${esc(lessonImg(l))}" alt="${esc(l.title)}" loading="lazy">
    <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
    <span class="lesson-card__dur">${esc(l.duration)}</span>
  </div>
  <div class="lesson-card__body">
    <p class="lesson-card__meta"><span class="chip">${esc(l.level)}</span></p>
    <h3 class="lesson-card__title">${esc(l.title)}</h3>
    <p class="lesson-card__text">${esc(l.subtitle)}</p>
    <p class="lesson-card__price">${rub(l.price)} <span class="link-arrow">Подробнее ${icon.arrow}</span></p>
  </div>
</a>`;
}

const pageHead = (title, sub, extra = '') => `
<section class="page-head">
  <h1 class="page-title" data-title>${title}</h1>
  ${sub ? `<p class="page-sub" data-fade>${sub}</p>` : ''}
  ${extra}
</section>`;

const marquee = (words) => {
  const run = words.map((w) => `<span>${esc(w)}</span><i>✦</i>`).join('');
  return `<div class="marquee" data-marquee aria-hidden="true"><div class="marquee__track">${run}${run}</div></div>`;
};

const thread = (cls = '') => `
<svg class="thread ${cls}" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
  <path data-draw d="M-20 330 C 180 380, 260 120, 420 190 S 600 380, 760 250 S 980 40, 1060 150 S 1150 300, 1230 220"/>
</svg>`;

/* ---------- home ---------- */

export function home({ settings, featured, lessons, counts }) {
  const heroImg = settings.heroImage || placeholder('rose', '#7A1323');
  const routes = [
    ['01', '/shop', 'Готовые изделия', 'Вещи, которые уже связаны и ждут своего человека. Каждая — в единственном экземпляре.', `${counts.available} ${plural(counts.available, ['вещь', 'вещи', 'вещей'])} в наличии`, placeholder('sweater', '#E8DDD0'), 'Выбрать вещь'],
    ['02', '/lessons', 'Видео-уроки', 'Мастер-классы для вязальщиц: от первого мотива ирландского кружева до готового свитера.', `${counts.lessons} ${plural(counts.lessons, ['урок', 'урока', 'уроков'])}`, placeholder('rose', '#3B0710'), 'Смотреть уроки'],
    ['03', '/order', 'Вещь на заказ', 'Соберите заявку: фасон, пряжа, цвет и мерки. Ярослава свяжет изделие лично для вас.', 'от 3 недель', placeholder('dress', '#9E2A3A'), 'Собрать заявку'],
  ];
  const values = [
    ['Ручная работа', 'Ни одной машинной петли. Каждое изделие проходит через руки мастера от первого ряда до последней нити.'],
    ['Ирландское кружево', 'Объёмные розы, листья и сетка — старинная техника, в которой каждый мотив вяжется отдельно.'],
    ['Натуральная пряжа', 'Меринос, хлопок, лён, альпака, шёлк. Материалы, которые дышат и с годами становятся только лучше.'],
    ['Спицы и крючок', 'Свитеры, кардиганы, платья и юбки — две техники, которые можно сочетать в одной вещи.'],
    ['Один экземпляр', 'Готовые вещи не повторяются в точности. Даже повтор на заказ получает свой характер.'],
  ];
  const body = `
<section class="hero">
  <div class="hero__text">
    <p class="eyebrow" data-fade>Авторский трикотаж и кружево ручной работы</p>
    <h1 class="hero__title" data-title>Искусство<br>в&nbsp;каждой <em>петле</em></h1>
    <p class="hero__lead" data-fade>Меня зовут Ярослава. Я вяжу спицами и крючком, плету ирландское кружево и создаю вещи, у которых есть душа и история.</p>
    <div class="hero__actions" data-fade>
      <a class="btn" href="/shop">Готовые изделия ${icon.arrow}</a>
      <a class="btn btn--ghost" href="/lessons">Видео-уроки</a>
      <a class="link-arrow" href="/order">Заказать свою вещь ${icon.arrow}</a>
    </div>
    <ul class="hero__facts" data-fade>
      <li><b>${esc(settings.city || 'Москва')}</b><span>мастерская</span></li>
      <li><b>${counts.available}</b><span>${plural(counts.available, ['вещь', 'вещи', 'вещей'])} в наличии</span></li>
      <li><b>${counts.lessons}</b><span>${plural(counts.lessons, ['урок', 'урока', 'уроков'])}</span></li>
    </ul>
  </div>
  <div class="hero__media">
    <div class="hero__img parallax" data-hero-img style="--bg:#7A1323"><img data-speed="auto" src="${esc(heroImg)}" alt="Ярослава — мастер ручного вязания"><p class="hero__cap">Ирландская роза · крючок</p></div>
    <div class="hero__badge" aria-hidden="true">
      <svg viewBox="0 0 200 200"><defs><path id="circle" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"/></defs><text><textPath href="#circle">ручная работа ✦ ирландское кружево ✦ натуральная пряжа ✦</textPath></text></svg>
      <span>Я</span>
    </div>
  </div>
  ${thread('thread--hero')}
</section>

<section class="intro">
  <div class="intro__frame">
    <p class="eyebrow" data-fade>Знакомство</p>
    <p class="intro__text" data-lines>Я верю, что вещь, связанная руками, хранит тепло человека, который её создавал. Поэтому здесь нет конвейера — только медленная работа, натуральные нити и внимание к каждой петле.</p>
    <p class="signature" data-fade>Ярослава</p>
  </div>
</section>

<section class="routes">
  <header class="section-head">
    <p class="eyebrow" data-fade>С чего начать</p>
    <h2 class="section-title" data-lines>Три способа прикоснуться к&nbsp;ремеслу</h2>
  </header>
  <div class="routes__grid">
    ${routes.map(([n, href, t, text, meta, img, cta]) => `
    <a class="route" href="${href}" data-reveal data-cursor="Перейти">
      <div class="route__media"><img src="${img}" alt="" loading="lazy"><span class="route__num">${n}</span></div>
      <div class="route__body">
        <p class="route__meta">${esc(meta)}</p>
        <h3 class="route__title">${t}</h3>
        <p class="route__text">${text}</p>
        <span class="link-arrow">${cta} ${icon.arrow}</span>
      </div>
    </a>`).join('')}
  </div>
</section>

${marquee(['Ручная работа', 'Ирландское кружево', 'Натуральная пряжа', 'Единственный экземпляр', 'Вязание спицами и крючком'])}

<section class="featured" id="works">
  <header class="section-head section-head--row">
    <div>
      <p class="eyebrow" data-fade>Избранные работы</p>
      <h2 class="section-title" data-lines>Вещи, которые говорят за&nbsp;меня</h2>
    </div>
    <a class="link-arrow" href="/shop" data-fade>Все изделия ${icon.arrow}</a>
  </header>
  <div class="grid grid--4" data-batch>${featured.map(productCard).join('')}</div>
</section>

<section class="values">
  <div class="values__head">
    <p class="eyebrow eyebrow--light" data-fade>Почему ручная работа</p>
    <h2 class="section-title section-title--light" data-lines>Что отличает каждую вещь</h2>
  </div>
  <ol class="values__list">
    ${values.map(([t, d], i) => `<li class="value" data-reveal><span class="value__num">0${i + 1}</span><h3 class="value__title">${t}</h3><p class="value__text">${d}</p></li>`).join('')}
  </ol>
</section>

<section class="custom">
  <div class="custom__media parallax" style="--bg:#E8DDD0"><img data-speed="auto" src="${placeholder('yarn', '#E8DDD0')}" alt="" loading="lazy"></div>
  <div class="custom__body">
    <p class="eyebrow" data-fade>Индивидуальный заказ</p>
    <h2 class="section-title" data-lines>Ваше особенное изделие</h2>
    <p class="custom__text" data-fade>Не нашли готовую вещь? Соберите её сами — шаг за шагом. Ярослава посмотрит заявку, подскажет по пряже и посадке и свяжется с вами в Telegram или MAX.</p>
    <ol class="steps-line" data-batch>
      ${['Изделие', 'Пряжа', 'Цвет', 'Параметры', 'Референсы', 'Пожелания', 'Контакт'].map((s, i) => `<li data-reveal><span>${i + 1}</span>${s}</li>`).join('')}
    </ol>
    <a class="btn" href="/order" data-fade>Собрать заявку ${icon.arrow}</a>
  </div>
</section>

<section class="lessons-teaser">
  <header class="section-head section-head--row">
    <div>
      <p class="eyebrow" data-fade>Видео-уроки</p>
      <h2 class="section-title" data-lines>Научу тому, что умею сама</h2>
    </div>
    <a class="link-arrow" href="/lessons" data-fade>Все уроки ${icon.arrow}</a>
  </header>
  <div class="lessons-grid">${lessons.map(lessonCard).join('')}</div>
</section>

<section class="text-block">
  <div class="text-block__title"><h2 class="section-title" data-lines>Сделано руками — с&nbsp;любовью к&nbsp;деталям</h2></div>
  <div class="text-block__cols" data-fade>
    <p>Ручное вязание — это время. На шаль из ирландского кружева уходит до шести недель: сначала по одному вяжутся розы, листья и бутоны, затем они раскладываются на выкройке и соединяются тонкой сеткой. Поэтому каждая вещь получается неповторимой.</p>
    <p>Я работаю только с натуральной пряжей и подбираю её под задачу: хлопок и лён для лета, меринос и альпака для холодов, мохер с шёлком для воздушных кружев. Если вещь, которая вам понравилась, уже продана, — я с радостью свяжу похожую по вашим меркам.</p>
  </div>
</section>`;
  return page(settings, { title: '', body, current: '/' , bodyClass: 'page-home' });
}

/* ---------- shop ---------- */

export function shop({ settings, products, activeCat }) {
  const statusFilters = [['all', 'Все'], ['available', 'В наличии'], ['repeat', 'Можно повторить'], ['sold', 'Проданные — для вдохновения']];
  const outside = `
<button class="filter-tab" type="button" data-filter-open aria-label="Фильтр изделий">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/></svg>
  <span>Фильтр</span>
</button>
<aside class="filter" data-filter aria-hidden="true">
  <button class="square-close" type="button" data-filter-close aria-label="Закрыть фильтр">${icon.close}</button>
  <p class="filter__label">Категория</p>
  <ul class="filter__list">
    ${['Все изделия', ...CATEGORIES].map((c, i) => `<li><button type="button" data-filter-cat="${i ? esc(c) : 'all'}" class="${(activeCat || 'all') === (i ? c : 'all') ? 'is-active' : ''}">${esc(c)}</button></li>`).join('')}
  </ul>
  <p class="filter__label">Наличие</p>
  <ul class="filter__list filter__list--small">
    ${statusFilters.map(([k, t]) => `<li><button type="button" data-filter-status="${k}" class="${k === 'all' ? 'is-active' : ''}">${t}</button></li>`).join('')}
  </ul>
  <a class="filter__promo" href="/order">Не нашли свою вещь? <b>Закажите индивидуально ${icon.arrow}</b></a>
</aside>`;
  const body = `
${pageHead('Готовые изделия', 'Каждая вещь существует в одном экземпляре. Если изделие уже нашло хозяйку — его можно повторить на заказ.', `<p class="page-count" data-fade><span data-count>${products.length}</span> <span data-count-word>${plural(products.length, ['изделие', 'изделия', 'изделий'])}</span> · <button type="button" class="link-btn" data-filter-open>фильтр</button></p>`)}
<section class="grid-wrap">
  <div class="grid" data-grid data-batch>${products.map(productCard).join('')}</div>
  <p class="grid-empty" data-grid-empty hidden>В этой подборке пока ничего нет. <a href="/order">Закажите вещь индивидуально</a>.</p>
</section>
${marquee(['Купить готовое', 'Повторить на заказ', 'Связать по вашим меркам'])}
<section class="text-block">
  <div class="text-block__title"><h2 class="section-title" data-lines>Как купить готовую вещь</h2></div>
  <ol class="how-list" data-batch>
    <li data-reveal><span>01</span><b>Выберите изделие</b>Посмотрите фотографии, состав и размеры. Статус покажет, свободна ли вещь.</li>
    <li data-reveal><span>02</span><b>Оформите заказ</b>Укажите контакт в Telegram или MAX и способ доставки — вещь сразу забронируется за вами.</li>
    <li data-reveal><span>03</span><b>Оплата и доставка</b>Ярослава подтвердит заказ, пришлёт ссылку на оплату и отправит изделие СДЭКом или Почтой.</li>
  </ol>
</section>`;
  return page(settings, { title: 'Готовые изделия', body, current: '/shop', outside, bodyClass: 'page-shop' });
}

/* ---------- product ---------- */

export function product({ settings, p, more }) {
  const imgs = p.images?.length ? p.images : [productImg(p)];
  const real = Boolean(p.images?.length);
  const like = `/order?like=${encodeURIComponent(p.slug)}`;
  const actions = {
    available: `<button class="btn" type="button" data-add-to-cart="${esc(p.id)}">Купить ${icon.arrow}</button><a class="btn btn--ghost" href="${like}">Хочу похожее на заказ</a>`,
    reserved: `<button class="btn" type="button" disabled>Забронировано</button><a class="btn btn--ghost" href="${like}">Хочу похожее на заказ</a>`,
    sold: `<a class="btn" href="${like}">Хочу похожее на заказ ${icon.arrow}</a>`,
    repeat: `<a class="btn" href="${like}">Заказать такое же ${icon.arrow}</a>`,
  }[p.status];
  const notes = {
    reserved: 'Изделие забронировано другим покупателем. Если бронь снимется, вещь снова появится в наличии.',
    sold: 'Эта вещь уже нашла хозяйку. Ярослава может связать похожую — по вашим меркам и в вашем цвете.',
    repeat: 'Оригинал продан, но модель можно повторить: срок изготовления обсуждается индивидуально.',
  }[p.status];
  const acc = [
    ['Особенности ручной работы', `<ul class="ticks">${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`],
    ['Уход', '<p>Ручная стирка в прохладной воде со средством для шерсти или деликатных тканей. Не выкручивать, сушить в расправленном виде на горизонтальной поверхности.</p>'],
    ['Оплата и доставка', '<p>После оформления Ярослава подтвердит заказ и пришлёт ссылку на оплату. Отправка СДЭКом или Почтой России по всему миру, самовывоз — по договорённости. <a href="/info/delivery">Подробнее</a></p>'],
  ];
  const body = `
<section class="product">
  <div class="product__gallery">
    ${imgs.map((src, i) => `<div class="product__shot${i === 0 ? ' product__shot--main' : ''}" style="--bg:${esc(p.bg)}" data-reveal><img class="${real ? '' : 'is-ph'}" src="${esc(src)}" alt="${esc(p.title)}${i ? `, фото ${i + 1}` : ''}"${i ? ' loading="lazy"' : ''}></div>`).join('')}
  </div>
  <div class="product__info" data-pin>
    <a class="back-link" href="/shop">← Все изделия</a>
    <p class="eyebrow">${esc(p.category)}</p>
    <h1 class="product__title" data-title>${titleHtml(p.title)}</h1>
    <div class="product__row">
      <p class="product__price">${rub(p.price)}</p>
      <p class="status status--${esc(p.status)}"><i></i>${statusLabel(p.status)}</p>
    </div>
    <p class="product__lead">${esc(p.description)}</p>
    <div class="product__actions">${actions}</div>
    ${notes ? `<p class="product__note">${notes}</p>` : ''}
    <dl class="specs">
      <div><dt>Техника</dt><dd>${esc(p.material)}</dd></div>
      <div><dt>Состав</dt><dd>${esc(p.composition)}</dd></div>
      <div><dt>Размер</dt><dd>${esc(p.size)}</dd></div>
      <div><dt>Параметры</dt><dd>${esc(p.params)}</dd></div>
    </dl>
    <div class="accordion" data-accordion>
      ${acc.map(([t, c], i) => `<div class="acc${i === 0 ? ' is-open' : ''}"><button class="acc__head" type="button">${t}<i></i></button><div class="acc__body"><div class="acc__inner">${c}</div></div></div>`).join('')}
    </div>
  </div>
</section>
${more.length ? `
<section class="featured">
  <header class="section-head section-head--row">
    <h2 class="section-title" data-lines>Другие работы</h2>
    <a class="link-arrow" href="/shop">Все изделия ${icon.arrow}</a>
  </header>
  <div class="grid" data-batch>${more.map(productCard).join('')}</div>
</section>` : ''}`;
  return page(settings, { title: p.title, description: p.description, body, current: '/shop', bodyClass: 'page-product' });
}

/* ---------- lessons ---------- */

const howLessons = [
  ['Выберите урок', 'Посмотрите программу, уровень и список материалов.'],
  ['Оплатите', 'Оплата онлайн или по ссылке, которую пришлёт Ярослава.'],
  ['Получите доступ', 'Персональная ссылка придёт на почту и откроется сразу после оплаты.'],
  ['Смотрите', 'В своём темпе, сколько угодно раз. Доступ остаётся навсегда.'],
];

export function lessons({ settings, list }) {
  const body = `
${pageHead('Видео-уроки', 'Мастер-классы для вязальщиц: подробно, без спешки и с ответами на вопросы, которые обычно остаются за кадром.')}
<section class="how">
  <ol class="how__list" data-batch>
    ${howLessons.map(([t, d], i) => `<li data-reveal><span class="how__num">0${i + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}
  </ol>
</section>
<section class="lessons-page">
  <div class="lessons-grid lessons-grid--page">${list.map(lessonCard).join('')}</div>
</section>`;
  return page(settings, { title: 'Видео-уроки', body, current: '/lessons', bodyClass: 'page-lessons' });
}

export function lesson({ settings, l }) {
  const faq = [
    ['Как я получу доступ?', 'Сразу после подтверждения оплаты вы получите персональную ссылку на закрытую страницу с уроком. Ссылка придёт на почту, а при оплате онлайн откроется автоматически.'],
    ['Сколько действует доступ?', 'Навсегда. Уроки можно пересматривать в любое время с любого устройства.'],
    ['Подойдёт ли урок новичку?', l.level === 'Начальный' ? 'Да, урок рассчитан именно на тех, кто только начинает.' : `Урок рассчитан на уровень «${esc(l.level)}». Если сомневаетесь — напишите Ярославе, она подскажет, с чего начать.`],
    ['Можно ли задать вопрос?', 'Да, в течение месяца после покупки можно присылать фото работы в Telegram и получать комментарии.'],
  ];
  const buy = `<a class="btn btn--block" href="/checkout?lesson=${esc(l.slug)}">Купить урок · ${rub(l.price)}</a>`;
  const body = `
<section class="lesson-hero">
  <div class="lesson-hero__text">
    <a class="back-link" href="/lessons">← Все уроки</a>
    <p class="eyebrow" data-fade>${esc(l.level)} уровень · ${esc(l.duration)}</p>
    <h1 class="lesson-hero__title" data-title>${esc(l.title)}</h1>
    <p class="lesson-hero__sub" data-fade>${esc(l.subtitle)}</p>
    <div class="lesson-hero__actions" data-fade><a class="btn" href="/checkout?lesson=${esc(l.slug)}">Купить за ${rub(l.price)} ${icon.arrow}</a></div>
  </div>
  <div class="lesson-hero__media" style="--bg:${esc(l.bg)}" data-reveal>
    <img src="${esc(lessonImg(l))}" alt="${esc(l.title)}">
    <span class="play play--big" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
  </div>
</section>

<section class="lesson-body">
  <div class="lesson-main">
    <div class="lesson-block" data-reveal>
      <h2 class="lesson-block__title">Что получится</h2>
      <p class="lesson-block__lead">${esc(l.result)}</p>
    </div>
    <div class="lesson-block" data-reveal>
      <h2 class="lesson-block__title">Чему вы научитесь</h2>
      <ul class="ticks ticks--2">${l.learn.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <div class="lesson-block" data-reveal>
      <h2 class="lesson-block__title">Программа</h2>
      <ol class="program">${l.program.map(([t, d], i) => `<li><span class="program__n">${String(i + 1).padStart(2, '0')}</span><span class="program__t">${esc(t)}</span><span class="program__d">${esc(d)}</span></li>`).join('')}</ol>
    </div>
    <div class="lesson-block" data-reveal>
      <h2 class="lesson-block__title">Материалы</h2>
      <ul class="ticks">${l.materials.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </div>
  <aside class="lesson-aside" data-pin>
    <div class="lesson-aside__card">
      <p class="lesson-aside__price">${rub(l.price)}</p>
      <dl class="specs specs--compact">
        <div><dt>Уровень</dt><dd>${esc(l.level)}</dd></div>
        <div><dt>Длительность</dt><dd>${esc(l.duration)}</dd></div>
        <div><dt>Доступ</dt><dd>Навсегда</dd></div>
      </dl>
      <p class="lesson-aside__label">Что входит</p>
      <ul class="ticks">${l.includes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${buy}
    </div>
  </aside>
</section>

<section class="faq">
  <h2 class="section-title" data-lines>Вопросы</h2>
  <div class="accordion" data-accordion>
    ${faq.map(([q, a]) => `<div class="acc"><button class="acc__head" type="button">${q}<i></i></button><div class="acc__body"><div class="acc__inner"><p>${a}</p></div></div></div>`).join('')}
  </div>
</section>`;
  return page(settings, { title: l.title, description: l.subtitle, body, current: '/lessons', bodyClass: 'page-lesson' });
}

export function watch({ settings, l, order }) {
  const embed = (url) => {
    const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
    if (yt) return `<iframe src="https://www.youtube.com/embed/${yt[1]}" allowfullscreen loading="lazy"></iframe>`;
    if (/rutube\.ru\/video\/(\w+)/.test(url)) return `<iframe src="https://rutube.ru/play/embed/${url.match(/rutube\.ru\/video\/(\w+)/)[1]}" allowfullscreen loading="lazy"></iframe>`;
    if (/vk\.com\/video_ext/.test(url) || /kinescope|vimeo|embed/.test(url)) return `<iframe src="${esc(url)}" allowfullscreen loading="lazy"></iframe>`;
    return `<video src="${esc(url)}" controls preload="metadata"></video>`;
  };
  const videos = (l.videos || []).filter((v) => v.url);
  const body = `
${pageHead(esc(l.title), `Доступ по заказу ${esc(order.number)}. Сохраните эту страницу — ссылка персональная и действует всегда.`)}
<section class="watch">
  ${videos.length
    ? videos.map((v, i) => `<article class="watch__item" data-reveal><p class="eyebrow">Урок ${i + 1}</p><h2 class="watch__title">${esc(v.title)}</h2><div class="watch__player">${embed(v.url)}</div></article>`).join('')
    : `<div class="notice" data-reveal><p><b>Видео готовятся к публикации.</b> Как только Ярослава загрузит уроки, они появятся на этой странице — ссылка не изменится.</p></div>`}
  <div class="notice notice--soft" data-reveal><p>Вопросы по уроку можно присылать в Telegram <a href="https://t.me/${esc(String(settings.telegram).replace('@', ''))}" target="_blank" rel="noopener">${esc(settings.telegram)}</a>.</p></div>
</section>`;
  return page(settings, { title: l.title, body, bodyClass: 'page-watch' });
}

/* ---------- custom order wizard ---------- */

const dots = (n) => `<span class="dots" aria-label="${n} из 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;

export function order({ settings, like }) {
  const preItem = like ? like.item : '';
  const steps = ['Изделие', 'Пряжа', 'Цвет', 'Параметры', 'Референсы', 'Пожелания', 'Контакт', 'Проверка'];
  const body = `
${pageHead('Индивидуальный заказ', 'Соберите заявку шаг за шагом — это займёт пару минут. Ярослава изучит её и напишет вам, чтобы обсудить детали и сроки.')}
<section class="wizard" data-wizard>
  <aside class="wizard__nav" data-pin>
    <div class="wizard__progress"><span data-progress></span></div>
    <ol class="wizard__steps">
      ${steps.map((s, i) => `<li><button type="button" data-goto="${i}" ${i ? 'disabled' : ''}><span>${String(i + 1).padStart(2, '0')}</span>${s}</button></li>`).join('')}
    </ol>
    ${like ? `<div class="wizard__like"><img src="${esc(productImg(like.p))}" alt=""><p>Похоже на<br><b>${esc(like.p.title)}</b></p></div>` : ''}
  </aside>

  <form class="wizard__form" data-wizard-form novalidate>
    <input type="hidden" name="likeProduct" value="${like ? esc(like.p.slug) : ''}">

    <fieldset class="step is-active" data-step="0">
      <legend class="step__title">Что связать?</legend>
      <p class="step__hint">Выберите тип изделия. Если нужного нет — выберите «Другое» и опишите.</p>
      <div class="choices choices--items">
        ${ITEMS.map((it) => `
        <label class="choice">
          <input type="radio" name="item" value="${it.id}" ${preItem === it.id ? 'checked' : ''}>
          <span class="choice__box">
            <img src="${placeholder(it.shape, '#EFE6DC')}" alt="" loading="lazy">
            <span class="choice__label">${it.label}</span>
          </span>
        </label>`).join('')}
      </div>
      <div class="field field--other" data-other hidden>
        <label for="itemOther">Опишите изделие</label>
        <input id="itemOther" name="itemOther" type="text" maxlength="120" placeholder="Например: детский комбинезон, сумка, воротник">
      </div>
    </fieldset>

    <fieldset class="step" data-step="1">
      <legend class="step__title">Из какой пряжи?</legend>
      <p class="step__hint">У каждой пряжи свой характер. Не уверены — выберите «Посоветуйте мне».</p>
      <div class="choices choices--yarn">
        ${YARNS.map((y) => `
        <label class="choice">
          <input type="radio" name="yarn" value="${y.id}">
          <span class="choice__box yarn">
            <span class="yarn__name">${y.name}</span>
            <span class="yarn__comp">${y.composition}</span>
            ${y.soft ? `<span class="yarn__props"><span>Мягкость ${dots(y.soft)}</span><span>Теплота ${dots(y.warm)}</span><span>Сезон <b>${y.season}</b></span><span>Плотность <b>${y.density}</b></span></span>` : ''}
            <span class="yarn__note">${y.note}</span>
          </span>
        </label>`).join('')}
      </div>
    </fieldset>

    <fieldset class="step" data-step="2">
      <legend class="step__title">Какой цвет?</legend>
      <p class="step__hint">Можно выбрать до трёх цветов — для сочетаний и полос.</p>
      <div class="swatches">
        ${COLORS.map(([n, hex]) => `
        <label class="swatch">
          <input type="checkbox" name="colors" value="${n}">
          <span class="swatch__dot" style="--c:${hex}${isDark(hex) ? '' : ';--tick:#1E1517'}"></span>
          <span class="swatch__name">${n}</span>
        </label>`).join('')}
      </div>
      <div class="field">
        <label for="customColor">Свой цвет или оттенок</label>
        <input id="customColor" name="customColor" type="text" maxlength="120" placeholder="Например: как спелая вишня, с тёплым подтоном">
      </div>
      <label class="check"><input type="checkbox" name="colorAdvice" value="1"> <span>Хочу подобрать цвет вместе с Ярославой</span></label>
    </fieldset>

    <fieldset class="step" data-step="3">
      <legend class="step__title">Размер и параметры</legend>
      <p class="step__hint">Можно указать привычный размер или точные мерки — так вещь сядет идеально.</p>
      <div class="segmented" role="radiogroup">
        <label><input type="radio" name="sizeMode" value="size" checked><span>Стандартный размер</span></label>
        <label><input type="radio" name="sizeMode" value="measures"><span>Мои мерки</span></label>
      </div>
      <div class="sizes" data-mode="size">
        ${SIZES.map((s) => `<label class="size"><input type="radio" name="size" value="${s}"><span>${s}</span></label>`).join('')}
      </div>
      <div class="measures" data-mode="measures" hidden>
        ${MEASURES.map(([k, n]) => `<div class="field field--unit"><label for="m-${k}">${n}</label><input id="m-${k}" name="m_${k}" type="number" min="20" max="250" inputmode="numeric" placeholder="—"><span>см</span></div>`).join('')}
      </div>
      <p class="field-label">Посадка</p>
      <div class="pills">
        ${FITS.map((f) => `<label class="pill-choice"><input type="radio" name="fit" value="${f}"><span>${f}</span></label>`).join('')}
      </div>
    </fieldset>

    <fieldset class="step" data-step="4">
      <legend class="step__title">Референсы</legend>
      <p class="step__hint">Загрузите фото вещей, которые нравятся, пример фасона или узора. До 8 изображений, каждое до 10 МБ. Шаг необязательный.</p>
      <label class="dropzone" data-dropzone>
        <input type="file" accept="image/*" multiple data-files>
        <span class="dropzone__icon">+</span>
        <span class="dropzone__text"><b>Перетащите фото сюда</b> или нажмите, чтобы выбрать</span>
      </label>
      <div class="refs" data-refs></div>
      <template data-ref-tpl>
        <div class="ref">
          <img alt="">
          <select aria-label="Что на фото">${REF_TAGS.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>
          <button type="button" class="ref__remove" aria-label="Удалить">${icon.close}</button>
        </div>
      </template>
    </fieldset>

    <fieldset class="step" data-step="5">
      <legend class="step__title">Пожелания</legend>
      <p class="step__hint">Расскажите о вещи: для какого случая, что важно, чего точно не хочется.</p>
      <div class="field">
        <label for="comment">Комментарий</label>
        <textarea id="comment" name="comment" rows="6" maxlength="3000" placeholder="Например: хочу платье к осенней свадьбе, длина миди, рукав три четверти…">${like ? esc(`Хочу похожее на «${like.p.title}».`) : ''}</textarea>
      </div>
      <div class="field-row">
        <div class="field"><label for="deadline">Желаемый срок</label><input id="deadline" name="deadline" type="text" maxlength="80" placeholder="Например: к 15 декабря"></div>
        <div class="field"><label for="budget">Ориентир по бюджету</label><input id="budget" name="budget" type="text" maxlength="80" placeholder="Например: до 25 000 ₽"></div>
      </div>
    </fieldset>

    <fieldset class="step" data-step="6">
      <legend class="step__title">Как с вами связаться?</legend>
      <p class="step__hint">Ярослава напишет в Telegram или MAX. Телефон — только если вам удобнее звонок.</p>
      <div class="field"><label for="name">Ваше имя *</label><input id="name" name="name" type="text" maxlength="80" required autocomplete="given-name"></div>
      <div class="segmented" role="radiogroup">
        ${CHANNELS.map(([k, t], i) => `<label><input type="radio" name="channel" value="${k}" ${i ? '' : 'checked'}><span>${t}</span></label>`).join('')}
      </div>
      <div class="field"><label for="handle" data-handle-label>Ник или номер в Telegram *</label><input id="handle" name="handle" type="text" maxlength="80" required placeholder="@username"></div>
      <div class="field-row">
        <div class="field"><label for="phone">Телефон (необязательно)</label><input id="phone" name="phone" type="tel" maxlength="30" autocomplete="tel" placeholder="+7"></div>
        <div class="field"><label for="email">Email (необязательно)</label><input id="email" name="email" type="email" maxlength="120" autocomplete="email"></div>
      </div>
      <label class="check"><input type="checkbox" name="wantsCall" value="1"> <span>Хочу, чтобы мне позвонили</span></label>
      <label class="check"><input type="checkbox" name="consent" value="1" required> <span>Согласна(-ен) на обработку персональных данных для связи по заявке *</span></label>
    </fieldset>

    <fieldset class="step" data-step="7">
      <legend class="step__title">Проверьте заявку</legend>
      <p class="step__hint">Если всё верно — отправляйте. Изменить можно любой шаг.</p>
      <dl class="summary" data-summary></dl>
    </fieldset>

    <p class="wizard__error" data-error role="alert"></p>
    <div class="wizard__actions">
      <button type="button" class="btn btn--ghost" data-prev hidden>← Назад</button>
      <button type="button" class="btn" data-next>Далее ${icon.arrow}</button>
      <button type="submit" class="btn" data-submit hidden>Отправить заявку ${icon.arrow}</button>
    </div>
  </form>

  <div class="wizard__done" data-done hidden>
    <p class="eyebrow">Заявка принята</p>
    <h2 class="section-title">Спасибо! Номер вашей заявки <span data-done-number></span></h2>
    <p>Статус: <b>Новая заявка</b>. Ярослава получила уведомление и свяжется с вами в ближайшее время, чтобы обсудить детали, сроки и стоимость.</p>
    <div class="hero__actions"><a class="btn" href="/shop">Посмотреть готовые изделия</a><a class="btn btn--ghost" href="/">На главную</a></div>
  </div>
</section>
<script type="application/json" id="wizard-data">${JSON.stringify({
    items: Object.fromEntries(ITEMS.map((i) => [i.id, i.label])),
    yarns: Object.fromEntries(YARNS.map((y) => [y.id, y.name])),
    measures: Object.fromEntries(MEASURES),
    tags: Object.fromEntries(REF_TAGS),
    channels: Object.fromEntries(CHANNELS),
    steps,
  }).replace(/</g, '\\u003c')}</script>`;
  return page(settings, { title: 'Индивидуальный заказ', body, current: '/order', bodyClass: 'page-order', scripts: ['/js/order.js'] });
}

/* ---------- about ---------- */

export function about({ settings, counts }) {
  const img = settings.aboutImage || placeholder('rose', '#3B0710');
  const body = `
<section class="about-hero">
  <div class="about-hero__text">
    <p class="eyebrow" data-fade>О мастере</p>
    <h1 class="page-title page-title--left" data-title>О Ярославе</h1>
    <p class="about-hero__lead" data-lines>Я вяжу больше пятнадцати лет. Начинала с бабушкиных спиц и простых шарфов, а сейчас создаю платья из ирландского кружева, которые вяжутся неделями.</p>
  </div>
  <div class="about-hero__media parallax" style="--bg:#3B0710"><img data-speed="auto" src="${esc(img)}" alt="Ярослава"></div>
</section>

<section class="stats" data-batch>
  <div class="stat" data-reveal><b data-counter="15">0</b><span>лет в ремесле</span></div>
  <div class="stat" data-reveal><b data-counter="${Math.max(counts.products, 1) * 20}">0</b><span>изделий связано</span></div>
  <div class="stat" data-reveal><b data-counter="${counts.lessons}">0</b><span>видео-уроков</span></div>
</section>

<section class="story">
  <div class="story__row">
    <h2 class="section-title" data-lines>Отношение к&nbsp;ремеслу</h2>
    <div class="story__text" data-fade>
      <p>Для меня вязание — не хобби и не производство, а способ разговаривать с миром. Я не тороплюсь: каждую вещь сначала продумываю, вяжу образец, распускаю, если что-то не так, и начинаю снова.</p>
      <p>Поэтому мои изделия не похожи на магазинный трикотаж. Они живые: в них видна рука, и они служат годами.</p>
    </div>
  </div>
  <div class="story__row">
    <h2 class="section-title" data-lines>Ирландское кружево</h2>
    <div class="story__text" data-fade>
      <p>Эта техника появилась в Ирландии в XIX веке: розы, листья и трилистники вяжутся по отдельности тончайшим крючком, а затем собираются в полотно. Сегодня ирландское кружево — редкость, и мне важно сохранить его.</p>
    </div>
  </div>
  <div class="story__row">
    <h2 class="section-title" data-lines>Материалы</h2>
    <div class="story__text" data-fade>
      <p>Только натуральная пряжа: меринос, альпака, кашемир, хлопок, лён и шёлк. Я сама проверяю каждую партию — стираю образцы, смотрю, как пряжа ведёт себя через год носки.</p>
    </div>
  </div>
  <div class="story__row">
    <h2 class="section-title" data-lines>Индивидуальные заказы</h2>
    <div class="story__text" data-fade>
      <p>Вещь на заказ начинается с разговора. Мы обсуждаем, для какого случая она нужна, подбираем пряжу и цвет, я снимаю мерки или подробно объясняю, как сделать это самой. Перед стартом присылаю образец вязки — и только после вашего «да» начинаю работу.</p>
    </div>
  </div>
</section>

<section class="custom custom--dark">
  <div class="custom__body">
    <p class="eyebrow eyebrow--light" data-fade>Давайте знакомиться</p>
    <h2 class="section-title section-title--light" data-lines>Готовая вещь, урок или изделие лично для&nbsp;вас</h2>
    <div class="hero__actions" data-fade>
      <a class="btn btn--light" href="/shop">Готовые изделия</a>
      <a class="btn btn--outline-light" href="/lessons">Видео-уроки</a>
      <a class="btn btn--outline-light" href="/order">Индивидуальный заказ</a>
    </div>
  </div>
</section>`;
  return page(settings, { title: 'О Ярославе', body, current: '/about', bodyClass: 'page-about' });
}

/* ---------- checkout ---------- */

export function checkout({ settings, lesson: l }) {
  const isLesson = Boolean(l);
  const body = `
${pageHead('Оформление', isLesson ? 'Видео-урок — доступ откроется после оплаты.' : 'Проверьте заказ и оставьте контакты. Вещи бронируются за вами сразу после оформления.')}
<section class="checkout" data-checkout data-mode="${isLesson ? 'lesson' : 'goods'}" ${isLesson ? `data-lesson="${esc(l.slug)}"` : ''}>
  <form class="checkout__form" data-checkout-form novalidate>
    <h2 class="checkout__h">Контакты</h2>
    <div class="field"><label for="c-name">Имя *</label><input id="c-name" name="name" required maxlength="80" autocomplete="name"></div>
    <div class="segmented" role="radiogroup">
      ${CHANNELS.map(([k, t], i) => `<label><input type="radio" name="channel" value="${k}" ${i ? '' : 'checked'}><span>${t}</span></label>`).join('')}
    </div>
    <div class="field"><label for="c-handle" data-handle-label>Ник или номер в Telegram *</label><input id="c-handle" name="handle" required maxlength="80" placeholder="@username"></div>
    <div class="field-row">
      <div class="field"><label for="c-email">Email${isLesson ? ' * — сюда придёт ссылка на урок' : ''}</label><input id="c-email" name="email" type="email" ${isLesson ? 'required' : ''} maxlength="120" autocomplete="email"></div>
      <div class="field"><label for="c-phone">Телефон</label><input id="c-phone" name="phone" type="tel" maxlength="30" autocomplete="tel" placeholder="+7"></div>
    </div>
    ${isLesson ? '' : `
    <h2 class="checkout__h">Доставка</h2>
    <div class="pills">
      ${DELIVERY.map(([k, t], i) => `<label class="pill-choice"><input type="radio" name="delivery" value="${k}" ${i ? '' : 'checked'}><span>${t}</span></label>`).join('')}
    </div>
    <div data-address>
      <div class="field-row">
        <div class="field"><label for="c-city">Город *</label><input id="c-city" name="city" maxlength="80" autocomplete="address-level2"></div>
        <div class="field"><label for="c-zip">Индекс</label><input id="c-zip" name="zip" maxlength="12" autocomplete="postal-code"></div>
      </div>
      <div class="field"><label for="c-address">Адрес или пункт выдачи *</label><input id="c-address" name="address" maxlength="200" autocomplete="street-address"></div>
    </div>
    <p class="field-note" data-pickup hidden>Самовывоз: ${esc(settings.city)}, ${esc(settings.pickupAddress)}. Время согласуем в сообщениях.</p>`}
    <div class="field"><label for="c-comment">Комментарий</label><textarea id="c-comment" name="comment" rows="3" maxlength="1000"></textarea></div>
    <label class="check"><input type="checkbox" name="consent" value="1" required> <span>Согласна(-ен) с <a href="/info/returns">условиями</a> и обработкой персональных данных *</span></label>
    <p class="wizard__error" data-error role="alert"></p>
    <button class="btn btn--block" type="submit" data-submit>${isLesson ? 'Перейти к оплате' : 'Оформить заказ'} ${icon.arrow}</button>
  </form>
  <aside class="checkout__summary" data-pin>
    <p class="checkout__h">Ваш заказ</p>
    <div class="checkout__items" data-summary-items>
      ${isLesson ? `<div class="mini"><img src="${esc(lessonImg(l))}" alt="" style="--bg:${esc(l.bg)}"><div><b>${esc(l.title)}</b><span>Видео-урок · ${esc(l.duration)}</span></div><span>${rub(l.price)}</span></div>` : '<p class="muted">Загрузка…</p>'}
    </div>
    <p class="checkout__total"><span>Итого</span><b data-summary-total>${isLesson ? rub(l.price) : '—'}</b></p>
  </aside>
</section>`;
  return page(settings, { title: 'Оформление', body, bodyClass: 'page-checkout', scripts: ['/js/checkout.js'] });
}

export function done({ settings, order: o, lesson: l, payMode }) {
  const paid = o.status === 'paid' || o.status === 'shipped' || o.status === 'done';
  let text;
  if (o.type === 'lesson') {
    text = paid && o.accessToken
      ? `<p>Оплата получена — урок уже ваш. Ссылка на доступ также отправлена на ${esc(o.customer.email)}.</p><div class="hero__actions"><a class="btn" href="/lessons/watch/${esc(o.accessToken)}">Смотреть урок ${icon.arrow}</a></div>`
      : payMode === 'yookassa' && o.payment?.url
        ? `<p>Оплата ещё не завершена.</p><div class="hero__actions"><a class="btn" href="${esc(o.payment.url)}">Оплатить ${rub(o.total)}</a></div>`
        : `<p>Ярослава пришлёт ссылку на оплату в ${esc(label(CHANNELS, o.customer.channel))}. После подтверждения оплаты персональная ссылка на урок придёт на ${esc(o.customer.email)}.</p>`;
  } else {
    text = paid
      ? '<p>Оплата получена. Ярослава упакует изделие и пришлёт трек-номер.</p>'
      : `<p>Изделия забронированы за вами. Ярослава свяжется с вами в ${esc(label(CHANNELS, o.customer.channel))}, подтвердит наличие и пришлёт ссылку на оплату.</p>`;
  }
  const body = `
${pageHead('Спасибо!', `Заказ ${esc(o.number)} · статус: <b>${esc(label(ORDER_STATUS, o.status))}</b>`)}
<section class="done" ${o.type === 'goods' ? 'data-clear-cart' : ''}>
  <div class="done__card" data-reveal>
    ${text}
    <ul class="done__items">${o.items.map((it) => `<li><span>${esc(it.title)}</span><b>${rub(it.price)}</b></li>`).join('')}</ul>
    <p class="done__total"><span>Итого</span><b>${rub(o.total)}</b></p>
  </div>
  <div class="hero__actions" data-fade><a class="btn btn--ghost" href="${l ? '/lessons' : '/shop'}">Продолжить покупки</a><a class="link-arrow" href="/">На главную ${icon.arrow}</a></div>
</section>`;
  return page(settings, { title: 'Заказ оформлен', body });
}

/* ---------- info & errors ---------- */

const INFO = {
  payment: ['Оплата', [
    ['Готовые изделия', 'После оформления заказа вещь бронируется за вами на 48 часов. Ярослава подтверждает наличие и присылает ссылку на оплату банковской картой или через СБП.'],
    ['Видео-уроки', 'Оплата онлайн при оформлении или по ссылке от Ярославы. Сразу после подтверждения оплаты вы получаете персональную ссылку на закрытую страницу с уроком.'],
    ['Индивидуальные заказы', 'Работа начинается после предоплаты 50% — когда согласованы фасон, пряжа, мерки и срок. Остаток оплачивается перед отправкой готового изделия.'],
  ]],
  delivery: ['Доставка', [
    ['СДЭК', 'До пункта выдачи или курьером. Срок — 2–7 дней по России, стоимость рассчитывается по тарифу СДЭК.'],
    ['Почта России', 'Отправка первым классом с трек-номером по России и за рубеж.'],
    ['Самовывоз', 'Бесплатно, по предварительной договорённости.'],
    ['Упаковка', 'Каждая вещь упаковывается в хлопковый мешочек с карточкой по уходу.'],
  ]],
  returns: ['Возврат', [
    ['Готовые изделия', 'Если вещь не подошла, её можно вернуть в течение 14 дней в первоначальном виде. Стоимость обратной доставки оплачивает покупатель.'],
    ['Индивидуальные заказы', 'Изделия, связанные по индивидуальным меркам, возврату не подлежат. Если что-то не так с посадкой — Ярослава бесплатно поправит изделие.'],
    ['Видео-уроки', 'Цифровые товары возвращаются, только если доступ не был открыт. Если урок не открывается — напишите, мы решим вопрос.'],
  ]],
};

export function info({ settings, key }) {
  const data = INFO[key];
  if (!data) return null;
  const [title, sections] = data;
  const body = `
${pageHead(title, '')}
<section class="info">
  ${sections.map(([h, t]) => `<div class="info__row" data-reveal><h2 class="info__h">${h}</h2><p>${t}</p></div>`).join('')}
  <p class="info__more" data-fade>Остались вопросы? <a href="/contacts">Напишите Ярославе</a>.</p>
</section>`;
  return page(settings, { title, body, current: `/info/${key}` });
}

export function contacts({ settings }) {
  const tg = String(settings.telegram).replace('@', '');
  const body = `
${pageHead('Контакты', 'Быстрее всего Ярослава отвечает в Telegram и MAX.')}
<section class="contacts">
  <a class="contact" href="https://t.me/${esc(tg)}" target="_blank" rel="noopener" data-reveal data-cursor="Написать"><span class="eyebrow">Telegram</span><b>${esc(settings.telegram)}</b></a>
  <div class="contact" data-reveal><span class="eyebrow">MAX</span><b>${esc(settings.max)}</b></div>
  <a class="contact" href="mailto:${esc(settings.email)}" data-reveal data-cursor="Написать"><span class="eyebrow">Email</span><b>${esc(settings.email)}</b></a>
  ${settings.phone ? `<a class="contact" href="tel:${esc(settings.phone)}" data-reveal><span class="eyebrow">Телефон</span><b>${esc(settings.phone)}</b></a>` : ''}
  <div class="contact" data-reveal><span class="eyebrow">Город</span><b>${esc(settings.city)}</b></div>
</section>`;
  return page(settings, { title: 'Контакты', body, current: '/contacts' });
}

export function notFound({ settings }) {
  const body = `${pageHead('Петля убежала', 'Такой страницы нет — но есть много других красивых вещей.', `<div class="hero__actions hero__actions--center" data-fade><a class="btn" href="/">На главную</a><a class="btn btn--ghost" href="/shop">Готовые изделия</a></div>`)}`;
  return page(settings, { title: 'Страница не найдена', body });
}
