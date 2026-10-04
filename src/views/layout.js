import { esc } from './util.js';

const icon = {
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
};
export { icon };

const NAV_SHOP = [
  ['/shop', 'Готовые изделия'],
  ['/lessons', 'Видео-уроки'],
  ['/order', 'Индивидуальный заказ'],
];
const NAV_ABOUT = [
  ['/about', 'О Ярославе'],
  ['/#works', 'Избранные работы'],
  ['/contacts', 'Контакты'],
];
const NAV_INFO = [
  ['/info/payment', 'Оплата'],
  ['/info/delivery', 'Доставка'],
  ['/info/returns', 'Возврат'],
];

const tgLink = (t) => `https://t.me/${String(t).replace(/^@/, '')}`;

function menuLinks(list, current) {
  return list
    .map(([href, text]) => `<li><a href="${href}"${current === href ? ' aria-current="page"' : ''}><span>${text}</span></a></li>`)
    .join('');
}

function header(s, current) {
  return `
<header class="site-header" data-header>
  <a class="logo" href="/" aria-label="Ярослава — на главную">
    <span class="logo__mark">Я</span>
    <span class="logo__text">Ярослава</span>
  </a>
  <div class="pill" data-pill>
    <button class="pill__btn" type="button" data-cart-open aria-label="Корзина">${icon.bag}<span class="pill__count" data-cart-count>0</span></button>
    <button class="pill__btn" type="button" data-search-open aria-label="Поиск">${icon.search}</button>
    <button class="pill__btn burger" type="button" data-menu-toggle aria-label="Меню" aria-expanded="false"><span></span><span></span></button>
  </div>
</header>

<nav class="menu" data-menu aria-hidden="true">
  <div class="menu__main">
    <div class="menu__cols">
      <div class="menu__col">
        <p class="menu__label">Магазин и уроки</p>
        <ul>${menuLinks(NAV_SHOP, current)}</ul>
      </div>
      <div class="menu__col">
        <p class="menu__label">Ярослава</p>
        <ul>${menuLinks(NAV_ABOUT, current)}</ul>
      </div>
    </div>
    <div class="menu__foot">
      <a href="${tgLink(s.telegram)}" target="_blank" rel="noopener">Telegram ${esc(s.telegram)}</a>
      <a href="mailto:${esc(s.email)}">${esc(s.email)}</a>
    </div>
  </div>
  <aside class="menu__side">
    <p class="menu__label">Покупателям</p>
    <ul class="menu__small">${menuLinks(NAV_INFO, current)}<li><a href="#" data-cart-open><span>Корзина</span></a></li></ul>
    <a class="menu__promo" href="/order">
      <span class="menu__promo-eyebrow">Индивидуальный заказ</span>
      <span class="menu__promo-title">Вещь, связанная лично для&nbsp;вас</span>
      <span class="menu__promo-cta">Собрать заявку ${icon.arrow}</span>
    </a>
  </aside>
</nav>

<div class="search" data-search aria-hidden="true">
  <button class="square-close" type="button" data-search-close aria-label="Закрыть поиск">${icon.close}</button>
  <div class="search__inner">
    <label class="visually-hidden" for="search-input">Поиск по сайту</label>
    <input class="search__input" id="search-input" type="search" placeholder="Поиск по изделиям и урокам…" autocomplete="off" data-search-input>
    <div class="search__results" data-search-results></div>
  </div>
</div>

<aside class="cart" data-cart aria-hidden="true">
  <div class="cart__head">
    <p class="cart__title">Корзина</p>
    <button class="cart__close" type="button" data-cart-close aria-label="Закрыть корзину">${icon.close}</button>
  </div>
  <div class="cart__items" data-cart-items></div>
  <div class="cart__foot">
    <p class="cart__total"><span>Итого</span><b data-cart-total>0 ₽</b></p>
    <a class="btn btn--block" href="/checkout" data-cart-checkout>Оформить заказ</a>
    <p class="cart__note">Каждая вещь существует в одном экземпляре — после оформления она бронируется за вами.</p>
  </div>
</aside>
<div class="dim" data-dim></div>`;
}

function footer(s) {
  return `
<footer class="footer">
  <div class="footer__top">
    <div class="footer__cta">
      <p class="eyebrow eyebrow--light">Индивидуальный заказ</p>
      <h2 class="footer__title" data-lines>Расскажите, какую вещь вы&nbsp;хотите — и&nbsp;она будет связана для&nbsp;вас</h2>
      <a class="btn btn--light" href="/order">Обсудить заказ ${icon.arrow}</a>
    </div>
    <div class="footer__cols">
      <div><p class="footer__label">Магазин</p><ul>${NAV_SHOP.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
      <div><p class="footer__label">Ярослава</p><ul>${NAV_ABOUT.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
      <div><p class="footer__label">Покупателям</p><ul>${NAV_INFO.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
      <div>
        <p class="footer__label">Связаться</p>
        <ul>
          <li><a href="${tgLink(s.telegram)}" target="_blank" rel="noopener">Telegram</a></li>
          <li><span>MAX ${esc(s.max)}</span></li>
          <li><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>
        </ul>
      </div>
    </div>
  </div>
  <div class="footer__word" data-footer-word aria-hidden="true">Ярослава</div>
  <div class="footer__bottom">
    <span>© ${new Date().getFullYear()} Ярослава. Авторский трикотаж и кружево ручной работы</span>
    <span>Связано вручную в г.&nbsp;${esc(s.city)}</span>
  </div>
</footer>`;
}

export function layout({ title, description, body, current = '', settings, outside = '', scripts = [], bodyClass = '' }) {
  const fullTitle = title ? `${title} — Ярослава` : 'Ярослава — авторский трикотаж и кружево ручной работы';
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || 'Готовые вязаные вещи, видео-уроки и индивидуальные изделия на заказ от мастера Ярославы: ручное вязание, ирландское кружево, натуральная пряжа.')}">
<meta name="theme-color" content="#7A1323">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Manrope:wght@300;400;500;600&family=Marck+Script&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<script>document.documentElement.classList.add('js','is-loading');setTimeout(function(){document.documentElement.classList.remove('is-loading')},3500);</script>
</head>
<body class="${esc(bodyClass)}">
<div class="curtain" data-curtain aria-hidden="true"><span class="curtain__mark">Я</span></div>
<div class="cursor" data-cursor-el aria-hidden="true"><span class="cursor__ring"></span><span class="cursor__label" data-cursor-label></span></div>
${header(settings, current)}
${outside}
<div id="smooth-wrapper">
  <div id="smooth-content">
    <main class="main">${body}</main>
    ${footer(settings)}
  </div>
</div>
<script src="/vendor/gsap/gsap.min.js"></script>
<script src="/vendor/gsap/ScrollTrigger.min.js"></script>
<script src="/vendor/gsap/ScrollSmoother.min.js"></script>
<script src="/vendor/gsap/SplitText.min.js"></script>
<script src="/vendor/gsap/Flip.min.js"></script>
<script src="/vendor/gsap/DrawSVGPlugin.min.js"></script>
<script src="/js/app.js"></script>
${scripts.map((s) => `<script src="${s}"></script>`).join('\n')}
</body>
</html>`;
}
