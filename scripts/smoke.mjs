// Smoke test for the public API: node scripts/smoke.mjs [baseUrl]
const base = process.argv[2] || 'http://localhost:3000';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function request(fields, files = []) {
  const fd = new FormData();
  for (const [k, v] of fields) fd.append(k, v);
  for (const f of files) fd.append('refs', f.blob, f.name);
  const res = await fetch(`${base}/api/requests`, { method: 'POST', body: fd });
  return [res.status, await res.json()];
}

const ok = await request(
  [
    ['item', 'dress'], ['yarn', 'mohair'], ['colors', 'Бордо'], ['colors', 'Молочный'], ['sizeMode', 'measures'],
    ['m_chest', '88'], ['m_hips', '94'], ['fit', 'Свободная'], ['comment', 'Платье к свадьбе'], ['name', 'Анна'],
    ['channel', 'telegram'], ['handle', '@anna_test'], ['phone', '+79990000000'], ['wantsCall', '1'], ['consent', '1'],
    ['likeProduct', 'plate-ryabina'], ['refTags', 'style'],
  ],
  [{ blob: new Blob([png], { type: 'image/png' }), name: 'ref.png' }],
);
console.log('valid request      ', ...ok);

const noContact = await request([['item', 'dress'], ['name', 'Анна'], ['consent', '1']]);
console.log('missing contact    ', ...noContact);

const badFile = await request(
  [['item', 'dress'], ['name', 'Анна'], ['handle', '@a'], ['consent', '1']],
  [{ blob: new Blob(['{}'], { type: 'application/json' }), name: 'x.json' }],
);
console.log('non-image skipped  ', ...badFile);
