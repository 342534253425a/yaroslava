(() => {
  const root = document.querySelector('[data-wizard]');
  if (!root || !window.YA) return;
  const { gsap } = window;
  const { esc } = window.YA;
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];

  const form = $('[data-wizard-form]');
  const data = JSON.parse(document.getElementById('wizard-data').textContent);
  const steps = $$('[data-step]');
  const navBtns = $$('[data-goto]');
  const prevBtn = $('[data-prev]');
  const nextBtn = $('[data-next]');
  const submitBtn = $('[data-submit]');
  const errorEl = $('[data-error]');
  const progress = $('[data-progress]');
  const LAST = steps.length - 1;
  const MAX_FILES = 8;
  const MAX_SIZE = 10 * 1024 * 1024;

  let current = 0;
  let reached = 0;
  const files = [];

  const radio = (name) => form.querySelector(`[name="${name}"]:checked`)?.value || '';
  const checked = (name) => $$(`[name="${name}"]:checked`, form).map((i) => i.value);
  const value = (name) => (form.elements[name]?.value || '').trim();

  /* ---------- dynamic fields ---------- */

  function syncOther() {
    $('[data-other]').hidden = radio('item') !== 'other';
  }
  function syncSizeMode() {
    const mode = radio('sizeMode');
    $$('[data-mode]').forEach((el) => (el.hidden = el.dataset.mode !== mode));
  }
  function syncColors() {
    const full = checked('colors').length >= 3;
    $$('[name="colors"]', form).forEach((i) => (i.disabled = full && !i.checked));
  }

  form.addEventListener('change', (e) => {
    const n = e.target.name;
    if (n === 'item') syncOther();
    if (n === 'sizeMode') syncSizeMode();
    if (n === 'colors') syncColors();
    errorEl.textContent = '';
    $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
  });

  /* ---------- validation ---------- */

  function invalid(name, msg) {
    const input = form.elements[name];
    const holder = (input?.length ? input[0] : input)?.closest('.field, .check');
    holder?.classList.add('is-invalid');
    return msg;
  }

  function validate(i) {
    switch (i) {
      case 0:
        if (!radio('item')) return 'Выберите, что связать.';
        if (radio('item') === 'other' && !value('itemOther')) return invalid('itemOther', 'Опишите изделие в нескольких словах.');
        return '';
      case 1:
        return radio('yarn') ? '' : 'Выберите пряжу или вариант «Посоветуйте мне».';
      case 2:
        return checked('colors').length || value('customColor') || form.elements.colorAdvice.checked ? '' : 'Выберите цвет, опишите свой или отметьте, что хотите подобрать вместе.';
      case 3:
        if (radio('sizeMode') === 'size') return radio('size') ? '' : 'Выберите размер.';
        return Object.keys(data.measures).some((k) => value(`m_${k}`)) ? '' : 'Укажите хотя бы одну мерку.';
      case 6:
        if (!value('name')) return invalid('name', 'Как к вам обращаться?');
        if (!value('handle')) return invalid('handle', 'Укажите контакт в Telegram или MAX — так Ярослава с вами свяжется.');
        if (value('email') && !/^\S+@\S+\.\S+$/.test(value('email'))) return invalid('email', 'Проверьте email.');
        if (!form.elements.consent.checked) return invalid('consent', 'Нужно согласие на обработку данных.');
        return '';
      default:
        return '';
    }
  }

  /* ---------- navigation ---------- */

  function updateUI() {
    prevBtn.hidden = current === 0;
    nextBtn.hidden = current === LAST;
    submitBtn.hidden = current !== LAST;
    gsap.to(progress, { width: `${((current + 1) / steps.length) * 100}%`, duration: 0.6, ease: 'power3.out' });
    navBtns.forEach((b, i) => {
      b.disabled = i > reached;
      b.classList.toggle('is-current', i === current);
      b.classList.toggle('is-done', i < reached && i !== current);
    });
    const list = navBtns[current]?.closest('ol');
    if (list && list.scrollWidth > list.clientWidth) {
      const b = navBtns[current];
      list.scrollTo({ left: b.offsetLeft - (list.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' });
    }
  }

  function scrollTop() {
    if (root.getBoundingClientRect().top < 0) window.YA.scrollToEl(root);
  }

  function go(target) {
    if (target === current || target < 0 || target > LAST) return;
    if (target > current) {
      for (let i = current; i < target; i++) {
        const err = validate(i);
        if (err) {
          errorEl.textContent = err;
          if (i !== current) go(i);
          gsap.fromTo(errorEl, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
          return;
        }
      }
    }
    errorEl.textContent = '';
    const from = steps[current];
    const to = steps[target];
    const dir = target > current ? 1 : -1;
    current = target;
    reached = Math.max(reached, target);
    if (target === LAST) buildSummary();
    updateUI();
    gsap.to(from, {
      opacity: 0,
      y: -24 * dir,
      duration: 0.3,
      ease: 'power2.in',
      onComplete() {
        from.classList.remove('is-active');
        gsap.set(from, { clearProps: 'opacity,transform' });
        to.classList.add('is-active');
        gsap.fromTo(to, { opacity: 0, y: 34 * dir }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
        gsap.fromTo($$('.choice, .swatch, .size, .field, .pill-choice, .summary > div, .dropzone', to), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.02, delay: 0.08, ease: 'power3.out' });
        window.YA.refresh();
        scrollTop();
      },
    });
  }

  nextBtn.addEventListener('click', () => go(current + 1));
  prevBtn.addEventListener('click', () => go(current - 1));
  navBtns.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.goto))));

  /* ---------- reference photos ---------- */

  const refs = $('[data-refs]');
  const tpl = $('[data-ref-tpl]');
  const fileInput = $('[data-files]');
  const dropzone = $('[data-dropzone]');

  function addFiles(list) {
    let skipped = 0;
    for (const file of list) {
      if (!file.type.startsWith('image/') || file.size > MAX_SIZE || files.length >= MAX_FILES) {
        skipped++;
        continue;
      }
      files.push({ file, url: URL.createObjectURL(file), tag: 'item' });
    }
    errorEl.textContent = skipped ? `Часть файлов не добавлена: только изображения до 10 МБ, не больше ${MAX_FILES} штук.` : '';
    renderRefs(true);
  }

  function renderRefs(animateLast) {
    refs.innerHTML = '';
    files.forEach((f, i) => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.querySelector('img').src = f.url;
      const sel = node.querySelector('select');
      sel.value = f.tag;
      sel.addEventListener('change', () => (f.tag = sel.value));
      node.querySelector('.ref__remove').addEventListener('click', () => {
        URL.revokeObjectURL(f.url);
        files.splice(i, 1);
        renderRefs();
      });
      refs.append(node);
    });
    if (animateLast && refs.lastElementChild) gsap.from(refs.lastElementChild, { opacity: 0, scale: 0.85, duration: 0.5, ease: 'back.out(2)' });
    window.YA.refresh();
  }

  fileInput.addEventListener('change', () => {
    addFiles([...fileInput.files]);
    fileInput.value = '';
  });
  ['dragenter', 'dragover'].forEach((t) => dropzone.addEventListener(t, () => dropzone.classList.add('is-over')));
  ['dragleave', 'drop'].forEach((t) => dropzone.addEventListener(t, () => dropzone.classList.remove('is-over')));

  /* ---------- summary ---------- */

  function buildSummary() {
    const item = radio('item');
    const colors = [...checked('colors'), value('customColor')].filter(Boolean);
    if (form.elements.colorAdvice.checked) colors.push('подобрать вместе');
    const size = radio('sizeMode') === 'size'
      ? radio('size')
      : Object.entries(data.measures).filter(([k]) => value(`m_${k}`)).map(([k, n]) => `${n}: ${value(`m_${k}`)} см`).join(', ');
    const rows = [
      [0, 'Изделие', item === 'other' ? `Другое: ${value('itemOther')}` : data.items[item]],
      [1, 'Пряжа', data.yarns[radio('yarn')]],
      [2, 'Цвет', colors.join(', ')],
      [3, 'Параметры', [size, radio('fit')].filter(Boolean).join(' · ')],
      [4, 'Референсы', files.length ? `<span class="summary__thumbs">${files.map((f) => `<img src="${f.url}" alt="" title="${esc(data.tags[f.tag])}">`).join('')}</span>` : 'Нет', true],
      [5, 'Пожелания', [value('comment'), value('deadline') && `Срок: ${value('deadline')}`, value('budget') && `Бюджет: ${value('budget')}`].filter(Boolean).join(' · ') || '—'],
      [6, 'Контакт', `${value('name')} · ${data.channels[radio('channel')]} ${value('handle')}${value('phone') ? ` · ${value('phone')}` : ''}${form.elements.wantsCall.checked ? ' · просит позвонить' : ''}`],
    ];
    $('[data-summary]').innerHTML = rows
      .map(([step, k, v, raw]) => `<div><dt>${k}</dt><dd>${raw ? v : esc(v || '—')}</dd><button type="button" data-edit="${step}">Изменить</button></div>`)
      .join('');
  }

  $('[data-summary]').addEventListener('click', (e) => {
    const step = e.target.closest('[data-edit]')?.dataset.edit;
    if (step != null) go(Number(step));
  });

  /* ---------- submit ---------- */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    for (let i = 0; i < LAST; i++) {
      const err = validate(i);
      if (err) {
        go(i);
        errorEl.textContent = err;
        return;
      }
    }
    const fd = new FormData(form);
    files.forEach((f) => {
      fd.append('refs', f.file);
      fd.append('refTags', f.tag);
    });
    submitBtn.disabled = true;
    submitBtn.firstChild.textContent = 'Отправляем… ';
    try {
      const res = await fetch('/api/requests', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Не удалось отправить заявку.');
      const done = $('[data-done]');
      $('[data-done-number]').textContent = json.number;
      gsap.to([form, $('.wizard__nav')], {
        opacity: 0,
        y: -30,
        duration: 0.4,
        onComplete() {
          form.hidden = true;
          $('.wizard__nav').style.display = 'none';
          done.hidden = false;
          gsap.fromTo(done, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' });
          window.YA.refresh();
          window.YA.scrollToEl(root);
        },
      });
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.firstChild.textContent = 'Отправить заявку ';
    }
  });

  syncOther();
  syncSizeMode();
  updateUI();
})();
