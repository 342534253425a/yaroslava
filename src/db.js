import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { get, put, BlobNotFoundError, BlobPreconditionFailedError } from '@vercel/blob';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Without Blob, serverless disks are read-only except /tmp, which dies with the instance.
const STORAGE = process.env.STORAGE_DIR || (process.env.VERCEL ? '/tmp/yaroslava' : ROOT);
export const DATA_DIR = path.join(STORAGE, 'data');
export const UPLOADS_DIR = path.join(STORAGE, 'uploads');
export const PRIVATE_DIR = path.join(DATA_DIR, 'private');
const FILE = path.join(DATA_DIR, 'db.json');
const DB_KEY = 'db/db.json';

export const blobOn = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

let state = null;
let base = null;
let etag = null;
let queue = Promise.resolve();
let ready = null;

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// GET may return a weak tag (W/"…"); conditional writes accept only the strong form.
const strongTag = (tag) => (tag ? tag.replace(/^W\//, '') : tag);

// Two instances can read the same database and write at once. Keep both sets of changes.
function mergeList(baseList = [], localList = [], remoteList = []) {
  const baseMap = new Map(baseList.map((x) => [x.id, x]));
  const localMap = new Map(localList.map((x) => [x.id, x]));
  const remoteMap = new Map(remoteList.map((x) => [x.id, x]));
  const ids = [];
  for (const x of [...localList, ...remoteList]) if (!ids.includes(x.id)) ids.push(x.id);
  const out = [];
  for (const id of ids) {
    const b = baseMap.get(id);
    const l = localMap.get(id);
    const r = remoteMap.get(id);
    if (!l) {
      if (!b || !same(b, r)) out.push(r);
      continue;
    }
    if (!r) {
      if (!b || !same(b, l)) out.push(l);
      continue;
    }
    out.push(b && same(b, l) ? r : l);
  }
  return out;
}

function merge(prev, local, remote) {
  return {
    settings: same(local.settings, prev.settings) ? remote.settings : local.settings,
    counters: {
      request: Math.max(local.counters?.request || 0, remote.counters?.request || 0),
      order: Math.max(local.counters?.order || 0, remote.counters?.order || 0),
    },
    requests: mergeList(prev.requests, local.requests, remote.requests).sort((a, c) => String(c.createdAt).localeCompare(String(a.createdAt))),
    orders: mergeList(prev.orders, local.orders, remote.orders).sort((a, c) => String(c.createdAt).localeCompare(String(a.createdAt))),
    products: mergeList(prev.products, local.products, remote.products),
    lessons: mergeList(prev.lessons, local.lessons, remote.lessons),
  };
}

async function readBlob() {
  try {
    const res = await get(DB_KEY, { access: 'private', useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return { data: JSON.parse(await new Response(res.stream).text()), etag: strongTag(res.blob.etag) };
  } catch (err) {
    if (err instanceof BlobNotFoundError || err?.name === 'BlobNotFoundError') return null;
    throw err;
  }
}

async function writeBlob(data, match) {
  const res = await put(DB_KEY, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
    ...(match ? { ifMatch: match } : {}),
  });
  return strongTag(res.etag);
}

function remember(data, tag) {
  base = structuredClone(data);
  etag = tag;
}

async function init(seed) {
  if (!blobOn()) {
    for (const dir of [DATA_DIR, UPLOADS_DIR, PRIVATE_DIR]) fs.mkdirSync(dir, { recursive: true });
    state = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : seed();
    if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
    remember(state, null);
    return state;
  }
  const fresh = await readBlob();
  if (!fresh) {
    state = seed();
    remember(state, await writeBlob(state));
  } else {
    state = fresh.data;
    remember(state, fresh.etag);
  }
  return state;
}

export function load(seed) {
  ready ??= init(seed);
  return ready;
}

export const db = () => state;

// A warm instance keeps an old copy in memory. Reload before each page so another instance's writes show up.
export async function refresh() {
  if (!blobOn()) return;
  await ready;
  await queue;
  const fresh = await readBlob();
  if (!fresh) return;
  if (same(state, base)) state = fresh.data;
  else state = merge(base, state, fresh.data);
  remember(fresh.data, fresh.etag);
}

async function commit(snapshot) {
  if (!blobOn()) {
    const tmp = FILE + '.tmp';
    await fs.promises.writeFile(tmp, snapshot);
    try {
      await fs.promises.rename(tmp, FILE);
    } catch {
      await fs.promises.writeFile(FILE, snapshot);
      await fs.promises.rm(tmp, { force: true });
    }
    return;
  }
  let local = JSON.parse(snapshot);
  for (let attempt = 0; attempt < 5; attempt++) {
    const fresh = await readBlob();
    const merged = fresh ? merge(base, local, fresh.data) : local;
    try {
      const tag = await writeBlob(merged, fresh?.etag);
      if (same(state, local)) state = merged;
      else state = merge(local, state, merged);
      remember(merged, tag);
      return;
    } catch (err) {
      if (!(err instanceof BlobPreconditionFailedError) && err?.name !== 'BlobPreconditionFailedError') throw err;
      local = merged;
    }
  }
  throw new Error('Не удалось сохранить данные: слишком много одновременных записей');
}

export function save() {
  const snapshot = JSON.stringify(state);
  const run = queue.then(() => commit(snapshot));
  queue = run.catch((err) => console.error('[db] save failed', err));
  return run;
}

export function nextNumber(key) {
  state.counters[key] = (state.counters[key] || 0) + 1;
  return state.counters[key];
}

export const uid = () => crypto.randomUUID();
export const token = (bytes = 24) => crypto.randomBytes(bytes).toString('base64url');

export function slugify(text) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return String(text)
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || uid().slice(0, 8);
}

export function uniqueSlug(list, base, selfId) {
  let slug = slugify(base);
  let n = 2;
  while (list.some((x) => x.slug === slug && x.id !== selfId)) slug = `${slugify(base)}-${n++}`;
  return slug;
}
