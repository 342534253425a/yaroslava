import fs from 'node:fs';
import path from 'node:path';
import { get, put, del, BlobNotFoundError } from '@vercel/blob';
import { blobOn, token, UPLOADS_DIR, PRIVATE_DIR } from './db.js';

const extOf = (file) => path.extname(file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';

async function readKey(key) {
  try {
    const res = await get(key, { access: 'private', useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return {
      buffer: Buffer.from(await new Response(res.stream).arrayBuffer()),
      contentType: res.blob.contentType,
    };
  } catch (err) {
    if (err instanceof BlobNotFoundError || err?.name === 'BlobNotFoundError') return null;
    throw err;
  }
}

export async function storeMedia(file) {
  if (!file) return '';
  if (!blobOn()) return `/uploads/media/${file.filename}`;
  const name = `${token(9)}${extOf(file)}`;
  await put(`media/${name}`, file.buffer, {
    access: 'private',
    addRandomSuffix: false,
    contentType: file.mimetype || 'image/jpeg',
  });
  return `/media/${name}`;
}

export async function storePrivate(requestId, file) {
  const name = `${token(9)}${extOf(file)}`;
  await put(`private/requests/${requestId}/${name}`, file.buffer, {
    access: 'private',
    addRandomSuffix: false,
    contentType: file.mimetype || 'application/octet-stream',
  });
  return name;
}

export async function readPrivate(requestId, filename) {
  const id = path.basename(String(requestId));
  const file = path.basename(String(filename));
  if (!id || !file || id !== String(requestId) || file !== String(filename)) return null;
  if (!blobOn()) {
    const full = path.join(PRIVATE_DIR, 'requests', id, file);
    return fs.existsSync(full) ? { buffer: fs.readFileSync(full), contentType: '' } : null;
  }
  return readKey(`private/requests/${id}/${file}`);
}

export async function readMedia(filename) {
  const file = path.basename(String(filename));
  if (!file || file !== String(filename)) return null;
  return readKey(`media/${file}`);
}

export async function removeStored(url) {
  if (!url) return;
  if (blobOn() && url.startsWith('/media/')) {
    try {
      await del(`media/${path.basename(url)}`);
    } catch (err) {
      console.error('[blob] delete', err.message);
    }
    return;
  }
  if (url.startsWith('/uploads/')) fs.rm(path.join(UPLOADS_DIR, url.slice('/uploads/'.length)), { force: true }, () => {});
}
