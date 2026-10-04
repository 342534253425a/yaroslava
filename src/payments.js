const API = 'https://api.yookassa.ru/v3/payments';

export const mode = process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET ? 'yookassa' : 'manual';

const headers = (idempotenceKey) => ({
  'Content-Type': 'application/json',
  Authorization: 'Basic ' + Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET}`).toString('base64'),
  ...(idempotenceKey ? { 'Idempotence-Key': idempotenceKey } : {}),
});

export async function createPayment(order, returnUrl) {
  const res = await fetch(API, {
    method: 'POST',
    headers: headers(order.id),
    body: JSON.stringify({
      amount: { value: order.total.toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: returnUrl },
      description: `Заказ ${order.number}`,
      metadata: { orderId: order.id },
    }),
  });
  if (!res.ok) throw new Error(`YooKassa ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, url: data.confirmation?.confirmation_url, status: data.status };
}

export async function getPayment(id) {
  const res = await fetch(`${API}/${encodeURIComponent(id)}`, { headers: headers() });
  if (!res.ok) throw new Error(`YooKassa ${res.status}`);
  return res.json();
}
