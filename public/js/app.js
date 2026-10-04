(() => {
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const rub = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n) || 0)) + '\u00a0₽';

  const { gsap } = window;
  if (!gsap) {
    html.classList.remove('is-loading');
    html.classList.add('reduce');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, Flip, DrawSVGPlugin);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) html.classList.add('reduce');

  const smoother = reduce
    ? null
    : ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, effects: true, smoothTouch: false });

  let locks = 0;
  function lock(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    const locked = locks > 0;
    if (smoother) smoother.paused(locked);
    else html.style.overflow = locked ? 'hidden' : '';
  }

  function scrollToEl(el, smooth = true) {
    if (!el) return;
    if (smoother) smoother.scrollTo(el, smooth, 'top 110px');
    else el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }

  /* ---------- cart storage ---------- */

  const CART_KEY = 'ya_cart';
  const cart = {
    get() {
      try {
        const v = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    },
    set(ids) {
      localStorage.setItem(CART_KEY, JSON.stringify([...new Set(ids)]));
      updateCount();
    },
  };

  function updateCount(bump) {
    const n = cart.get().length;
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = n;
      el.classList.toggle('is-on', n > 0);
    });
    if (bump) gsap.fromTo('[data-cart-open].pill__btn', { rotate: -16 }, { rotate: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
  }

  /* ---------- curtain: page enter / leave ---------- */

  const curtain = $('[data-curtain]');

  function leaveTo(href) {
    if (reduce) return (location.href = href);
    gsap.timeline()
      .set(curtain, { yPercent: 100 })
      .to(curtain, { yPercent: 0, duration: 0.75, ease: 'expo.inOut', onComplete: () => (location.href = href) });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.getAttribute('href') === '#') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname.startsWith('/admin') || url.pathname.startsWith('/uploads')) return;
    const samePage = url.pathname === location.pathname && url.search === location.search;
    e.preventDefault();
    if (samePage && url.hash) {
      closeAll();
      scrollToEl($(url.hash));
      return;
    }
    leaveTo(url.href);
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) gsap.set(curtain, { yPercent: -100 });
  });

  /* ---------- entrance & scroll animations ---------- */

  function splitTitles(delay) {
    $$('[data-title]').forEach((el) => {
      const split = SplitText.create(el, { type: 'words,chars', mask: 'words' });
      gsap.from(split.chars, { yPercent: 118, duration: 1.3, ease: 'expo.out', stagger: 0.028, delay });
    });
  }

  function reveals() {
    $$('[data-fade]').forEach((el) =>
      gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: 0.2, scrollTrigger: { trigger: el, start: 'top 94%', once: true } }),
    );

    ScrollTrigger.batch('[data-reveal], [data-card]', {
      start: 'top 94%',
      once: true,
      onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: 0.11, overwrite: true }),
    });

    $$('[data-lines]').forEach((el) =>
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, { yPercent: 105, duration: 1.25, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
      }),
    );

    $$('[data-draw]').forEach((path) => {
      if (path.closest('.hero')) {
        gsap.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 2.6, ease: 'power2.inOut', delay: 0.7 });
      } else {
        gsap.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: path.closest('section') || path, start: 'top 75%', end: 'bottom 30%', scrub: 1 } });
      }
    });

    const heroImg = $('[data-hero-img]');
    if (heroImg) {
      gsap.from(heroImg, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', delay: 0.2 });
      gsap.from($('img', heroImg), { scale: 1.35, duration: 2.2, ease: 'expo.out', delay: 0.3 });
      gsap.from('.hero__badge', { scale: 0, rotate: -90, duration: 1.4, ease: 'expo.out', delay: 1 });
    }

    const word = $('[data-footer-word]');
    if (word) {
      const split = SplitText.create(word, { type: 'chars' });
      gsap.from(split.chars, { yPercent: 100, duration: 1.4, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: word, start: 'top 98%', once: true } });
    }

    $$('[data-marquee]').forEach((m) => {
      const track = $('.marquee__track', m);
      const tween = gsap.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
      tween.totalTime(32 * 500);
      ScrollTrigger.create({
        trigger: m,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate(self) {
          const boost = Math.min(Math.abs(self.getVelocity()) / 300, 6);
          gsap.to(tween, {
            timeScale: self.direction * (1 + boost),
            duration: 0.2,
            overwrite: true,
            onComplete: () => gsap.to(tween, { timeScale: self.direction, duration: 1.2 }),
          });
        },
      });
    });

    $$('[data-counter]').forEach((el) => {
      const obj = { v: 0 };
      gsap.to(obj, {
        v: Number(el.dataset.counter) || 0,
        duration: 2.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => (el.textContent = Math.round(obj.v)),
      });
    });

    gsap.matchMedia().add('(min-width: 961px)', () => {
      $$('[data-pin]').forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 120px',
          endTrigger: el.parentElement,
          end: () => `bottom ${el.offsetHeight + 120}px`,
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });
      });
    });

    const header = $('[data-header]');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => header.classList.toggle('is-scrolled', self.scroll() > 60) });
  }

  function showStatic() {
    html.classList.remove('is-loading');
    gsap.set(curtain, { yPercent: -100 });
    gsap.set('[data-fade], [data-reveal], [data-card]', { opacity: 1 });
  }

  function start() {
    if (reduce) {
      showStatic();
      return;
    }
    gsap.set(curtain, { yPercent: 0 });
    html.classList.remove('is-loading');
    gsap.to(curtain, { yPercent: -100, duration: 1.05, ease: 'expo.inOut', delay: 0.1 });
    splitTitles(0.55);
    reveals();
    if (location.hash) setTimeout(() => scrollToEl($(location.hash), false), 200);
  }

  Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]).then(start);

  /* ---------- custom cursor ---------- */

  if (finePointer && !reduce) {
    html.classList.add('has-cursor');
    const c = $('[data-cursor-el]');
    const label = $('[data-cursor-label]');
    gsap.set(c, { opacity: 0 });
    const xTo = gsap.quickTo(c, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      if (!shown) {
        gsap.set(c, { x: e.clientX, y: e.clientY });
        gsap.to(c, { opacity: 1, duration: 0.3 });
        shown = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      const tagged = t.closest('[data-cursor]');
      const interactive = t.closest('a, button, label, select, [role="button"]');
      c.classList.toggle('has-label', Boolean(tagged));
      c.classList.toggle('is-hover', !tagged && Boolean(interactive));
      c.classList.toggle('is-light', Boolean(t.closest('.values, .footer, .menu__side, .search, .custom--dark, .filter-tab')));
      label.textContent = tagged ? tagged.dataset.cursor : '';
    });
    document.documentElement.addEventListener('pointerleave', () => {
      gsap.to(c, { opacity: 0, duration: 0.3 });
      shown = false;
    });
  }

  /* ---------- menu ---------- */

  const menu = $('[data-menu]');
  const menuBtn = $('[data-menu-toggle]');
  const menuTl = gsap.timeline({ paused: true, onReverseComplete: () => gsap.set(menu, { visibility: 'hidden' }) })
    .set(menu, { visibility: 'visible' })
    .fromTo('.menu__main', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0)
    .fromTo('.menu__side', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0.08)
    .fromTo('.menu__col a span, .menu__small a span', { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.035 }, 0.45)
    .fromTo('.menu__label, .menu__foot, .menu__promo', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05 }, 0.55);
  let menuOpen = false;

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    if (open) menuTl.timeScale(1).play();
    else menuTl.timeScale(1.6).reverse();
    lock(open);
  }
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));

  /* ---------- search ---------- */

  const search = $('[data-search]');
  const searchInput = $('[data-search-input]');
  const searchResults = $('[data-search-results]');
  const searchTl = gsap.timeline({ paused: true, onReverseComplete: () => gsap.set(search, { visibility: 'hidden' }) })
    .set(search, { visibility: 'visible' })
    .to(search, { opacity: 1, duration: 0.5, ease: 'power2.out' })
    .fromTo('.search__input', { opacity: 0, y: 40, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, 0.1)
    .fromTo('[data-search-close]', { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' }, 0.2);
  let searchOpen = false;

  function setSearch(open) {
    if (open === searchOpen) return;
    searchOpen = open;
    search.setAttribute('aria-hidden', !open);
    if (open) {
      if (menuOpen) setMenu(false);
      searchTl.timeScale(1).play();
      setTimeout(() => searchInput.focus(), 250);
    } else {
      searchTl.timeScale(1.5).reverse();
    }
    lock(open);
  }
  $$('[data-search-open]').forEach((b) => b.addEventListener('click', () => setSearch(true)));
  $('[data-search-close]').addEventListener('click', () => setSearch(false));

  let searchTimer;
  let searchSeq = 0;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) {
      searchResults.innerHTML = '';
      return;
    }
    searchTimer = setTimeout(async () => {
      const seq = ++searchSeq;
      const list = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => []);
      if (seq !== searchSeq) return;
      searchResults.innerHTML = list.length
        ? list.map((h) => `<a class="search__hit" href="${esc(h.url)}"><img src="${esc(h.img)}" alt=""><span><small>${esc(h.kind)}</small><b>${esc(h.title)}</b></span><span>${esc(h.meta)}</span></a>`).join('')
        : '<p class="search__empty">Ничего не нашлось. Попробуйте «кружево», «свитер» или «урок».</p>';
      gsap.from(searchResults.children, { opacity: 0, y: 20, stagger: 0.05, duration: 0.5, ease: 'power3.out' });
    }, 220);
  });

  /* ---------- drawers: cart & filter ---------- */

  const dim = $('[data-dim]');
  const cartEl = $('[data-cart]');
  const cartItems = $('[data-cart-items]');
  const cartTotal = $('[data-cart-total]');
  const cartCheckout = $('[data-cart-checkout]');
  gsap.set(cartEl, { x: 0, xPercent: 100 });
  const cartTl = gsap.timeline({ paused: true, onReverseComplete: () => gsap.set([cartEl, dim], { visibility: 'hidden' }) })
    .set([cartEl, dim], { visibility: 'visible' })
    .to(dim, { opacity: 1, duration: 0.5 }, 0)
    .to(cartEl, { xPercent: 0, duration: 0.8, ease: 'expo.inOut' }, 0);
  let cartOpen = false;

  async function renderCart() {
    const ids = cart.get();
    if (!ids.length) {
      cartItems.innerHTML = '<p class="cart__empty">Корзина пока пуста.<br><a href="/shop">Посмотреть готовые изделия</a></p>';
      cartTotal.textContent = rub(0);
      cartCheckout.classList.add('is-disabled');
      cartCheckout.setAttribute('aria-disabled', 'true');
      return;
    }
    const list = await fetch('/api/products/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).then((r) => r.json()).catch(() => []);
    const known = new Set(list.map((p) => p.id));
    if (known.size !== ids.length) cart.set(ids.filter((id) => known.has(id)));
    const available = list.filter((p) => p.status === 'available');
    cartItems.innerHTML = list
      .map((p) => `
      <div class="mini${p.status === 'available' ? '' : ' mini--off'}">
        <img src="${esc(p.img)}" alt="" style="--bg:${esc(p.bg)}">
        <div><b>${esc(p.title)}</b><span>${p.status === 'available' ? 'Ручная работа, 1 экземпляр' : 'Уже недоступно'}</span><br><button class="mini__remove" type="button" data-remove="${esc(p.id)}">Убрать</button></div>
        <span>${rub(p.price)}</span>
      </div>`)
      .join('');
    cartTotal.textContent = rub(available.reduce((s, p) => s + p.price, 0));
    const disabled = !available.length;
    cartCheckout.classList.toggle('is-disabled', disabled);
    cartCheckout.setAttribute('aria-disabled', String(disabled));
  }

  cartItems.addEventListener('click', (e) => {
    const id = e.target.closest('[data-remove]')?.dataset.remove;
    if (!id) return;
    cart.set(cart.get().filter((x) => x !== id));
    renderCart();
    syncCartButtons();
  });
  cartCheckout.addEventListener('click', (e) => {
    if (cartCheckout.classList.contains('is-disabled')) e.preventDefault();
  });

  function setCart(open) {
    if (open === cartOpen) return;
    cartOpen = open;
    cartEl.setAttribute('aria-hidden', !open);
    if (open) {
      if (menuOpen) setMenu(false);
      if (filterOpen) setFilter(false);
      renderCart();
      cartTl.timeScale(1).play();
    } else {
      cartTl.timeScale(1.4).reverse();
    }
    lock(open);
  }
  $$('[data-cart-open]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    setCart(true);
  }));
  $('[data-cart-close]').addEventListener('click', () => setCart(false));

  function syncCartButtons() {
    const ids = cart.get();
    $$('[data-add-to-cart]').forEach((b) => {
      const inCart = ids.includes(b.dataset.addToCart);
      b.classList.toggle('is-in-cart', inCart);
      b.firstChild.textContent = inCart ? 'В корзине ✓ ' : 'Купить ';
    });
  }
  $$('[data-add-to-cart]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.addToCart;
    if (!cart.get().includes(id)) {
      cart.set([...cart.get(), id]);
      updateCount(true);
    }
    syncCartButtons();
    setCart(true);
  }));

  const filter = $('[data-filter]');
  let filterOpen = false;
  let setFilter = () => {};
  if (filter) {
    gsap.set(filter, { x: 0, xPercent: -100 });
    const filterTl = gsap.timeline({ paused: true, onReverseComplete: () => gsap.set([filter, dim], { visibility: 'hidden' }) })
      .set([filter, dim], { visibility: 'visible' })
      .to(dim, { opacity: 1, duration: 0.6 }, 0)
      .to(filter, { xPercent: 0, duration: 0.9, ease: 'expo.inOut' }, 0)
      .to('#smooth-wrapper, .site-header', { x: () => Math.min(innerWidth * 0.12, 170), duration: 0.9, ease: 'expo.inOut' }, 0)
      .to('.filter-tab', { xPercent: -120, duration: 0.5, ease: 'power3.in' }, 0)
      .fromTo('.filter__label, .filter__list li, .filter__promo', { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.03 }, 0.35);

    setFilter = (open) => {
      if (open === filterOpen) return;
      filterOpen = open;
      filter.setAttribute('aria-hidden', !open);
      if (open) {
        if (menuOpen) setMenu(false);
        filterTl.timeScale(1).play();
      } else {
        filterTl.timeScale(1.4).reverse();
      }
      lock(open);
    };
    $$('[data-filter-open]').forEach((b) => b.addEventListener('click', () => setFilter(true)));
    $('[data-filter-close]').addEventListener('click', () => setFilter(false));

    const grid = $('[data-grid]');
    const cards = $$('[data-card]', grid);
    const empty = $('[data-grid-empty]');
    const countEl = $('[data-count]');
    const countWord = $('[data-count-word]');
    const plural = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'изделие' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'изделия' : 'изделий');
    const state = { cat: $('[data-filter-cat].is-active')?.dataset.filterCat || 'all', status: 'all' };

    const apply = (animate) => {
      const flipState = animate ? Flip.getState(cards) : null;
      let n = 0;
      cards.forEach((c) => {
        const ok = (state.cat === 'all' || c.dataset.cat === state.cat) && (state.status === 'all' || c.dataset.status === state.status);
        c.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      countEl.textContent = n;
      countWord.textContent = plural(n);
      empty.hidden = n > 0;
      const url = new URL(location.href);
      if (state.cat === 'all') url.searchParams.delete('cat');
      else url.searchParams.set('cat', state.cat);
      history.replaceState(null, '', url);
      if (!animate) return;
      Flip.from(flipState, {
        duration: 0.8,
        ease: 'power3.inOut',
        absolute: true,
        stagger: 0.02,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.45 }),
        onComplete: () => {
          gsap.set(cards.filter((c) => c.style.display !== 'none'), { opacity: 1, y: 0 });
          ScrollTrigger.refresh();
        },
      });
    };

    filter.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter-cat], [data-filter-status]');
      if (!btn) return;
      const key = btn.dataset.filterCat ? 'cat' : 'status';
      state[key] = btn.dataset.filterCat || btn.dataset.filterStatus;
      $$(key === 'cat' ? '[data-filter-cat]' : '[data-filter-status]', filter).forEach((b) => b.classList.toggle('is-active', b === btn));
      setFilter(false);
      setTimeout(() => apply(true), 350);
    });
    if (state.cat !== 'all') apply(false);
  }

  dim.addEventListener('click', () => {
    setCart(false);
    setFilter(false);
  });

  function closeAll() {
    setMenu(false);
    setSearch(false);
    setCart(false);
    setFilter(false);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  /* ---------- accordion ---------- */

  $$('[data-accordion] .acc').forEach((acc) => {
    const head = $('.acc__head', acc);
    const body = $('.acc__body', acc);
    head.setAttribute('aria-expanded', acc.classList.contains('is-open'));
    head.addEventListener('click', () => {
      const open = !acc.classList.contains('is-open');
      acc.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', open);
      gsap.fromTo(body, { height: open ? 0 : body.scrollHeight }, { height: open ? 'auto' : 0, duration: 0.6, ease: 'power3.inOut', onComplete: () => ScrollTrigger.refresh() });
    });
  });

  /* ---------- contact channel label ---------- */

  document.addEventListener('change', (e) => {
    if (e.target.name !== 'channel') return;
    const form = e.target.form;
    const lbl = form && $('[data-handle-label]', form);
    const input = form?.elements.handle;
    if (!lbl || !input) return;
    const isMax = e.target.value === 'max';
    lbl.textContent = isMax ? 'Номер или ник в MAX *' : 'Ник или номер в Telegram *';
    input.placeholder = isMax ? '+7 900 000-00-00' : '@username';
  });

  if ($('[data-clear-cart]')) cart.set([]);
  updateCount();
  syncCartButtons();

  window.YA = { smoother, lock, esc, rub, cart, scrollToEl, refresh: () => ScrollTrigger.refresh(), updateCount };
})();
