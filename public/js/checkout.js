(() => {
  const root = document.querySelector('[data-checkout]');
  if (!root || !window.YA) return;
  const { esc, rub, cart } = window.YA;
  const form = root.querySelector('[data-checkout-form]');
  const errorEl = form.querySelector('[data-error]');
  const submit = form.querySelector('[data-submit]');
  const isLesson = root.dataset.mode === 'lesson';
  const itemsEl = root.querySelector('[data-summary-items]');
  const totalEl = root.querySelector('[data-summary-total]');
  let available = [];

  async function loadGoods() {
    const ids = cart.get();
    if (!ids.length) {
      itemsEl.innerHTML = '<p class="cart__empty">Корзина пуста. <a href="/shop">Выбрать изделие</a></p>';
      totalEl.textContent = rub(0);
      submit.disabled = true;
      return;
    }
    const list = await fetch('/api/products/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).then((r) => r.json());
    available = list.filter((p) => p.status === 'available');
    itemsEl.innerHTML = list
      .map((p) => `<div class="mini${p.status === 'available' ? '' : ' mini--off'}"><img src="${esc(p.img)}" alt="" style="--bg:${esc(p.bg)}"><div><b>${esc(p.title)}</b><span>${p.status === 'available' ? '1 экземпляр' : 'Уже недоступно — не войдёт в заказ'}</span></div><span>${rub(p.price)}</span></div>`)
      .join('');
    totalEl.textContent = rub(available.reduce((s, p) => s + p.price, 0));
    submit.disabled = !available.length;
  }

  const address = form.querySelector('[data-address]');
  const pickup = form.querySelector('[data-pickup]');
  form.addEventListener('change', (e) => {
    if (e.target.name === 'delivery') {
      const isPickup = e.target.value === 'pickup';
      address.hidden = isPickup;
      pickup.hidden = !isPickup;
      window.YA.refresh();
    }
    errorEl.textContent = '';
  });

  const v = (n) => (form.elements[n]?.value || '').trim();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const delivery = form.querySelector('[name="delivery"]:checked')?.value;
    let err = '';
    if (!v('name') || !v('handle')) err = 'Укажите имя и контакт в Telegram или MAX.';
    else if (isLesson && !/^\S+@\S+\.\S+$/.test(v('email'))) err = 'Укажите email — на него придёт ссылка на урок.';
    else if (!isLesson && delivery !== 'pickup' && (!v('city') || !v('address'))) err = 'Укажите город и адрес доставки.';
    else if (!form.elements.consent.checked) err = 'Нужно согласие с условиями.';
    if (err) {
      errorEl.textContent = err;
      return;
    }
    const body = {
      name: v('name'),
      channel: form.querySelector('[name="channel"]:checked')?.value,
      handle: v('handle'),
      email: v('email'),
      phone: v('phone'),
      comment: v('comment'),
      consent: true,
    };
    if (isLesson) body.lesson = root.dataset.lesson;
    else Object.assign(body, { items: available.map((p) => p.id), delivery, city: v('city'), zip: v('zip'), address: v('address') });

    submit.disabled = true;
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.status === 409 && json.unavailable) {
        cart.set(cart.get().filter((id) => !json.unavailable.includes(id)));
        await loadGoods();
      }
      if (!res.ok) throw new Error(json.error || 'Не удалось оформить заказ.');
      location.href = json.redirect;
    } catch (ex) {
      errorEl.textContent = ex.message;
      submit.disabled = false;
    }
  });

  if (!isLesson) loadGoods();
})();
