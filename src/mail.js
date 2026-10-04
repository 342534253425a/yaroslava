import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { DATA_DIR } from './db.js';

const OUTBOX = path.join(DATA_DIR, 'outbox');

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE ?? 'true') !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

function storeInOutbox({ to, subject, html }) {
  fs.mkdirSync(OUTBOX, { recursive: true });
  const name = `${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
  fs.writeFileSync(path.join(OUTBOX, name), `<!-- to: ${to} -->\n<h3>${subject}</h3>\n${html}`);
  console.log(`[mail] SMTP не настроен — письмо «${subject}» сохранено в data/outbox/${name}`);
}

export async function sendMail({ to, subject, html, attachments }) {
  const recipient = to || process.env.OWNER_EMAIL;
  if (!transport || !recipient) return storeInOutbox({ to: recipient || '(не указан)', subject, html });
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: recipient,
      subject,
      html,
      attachments,
    });
  } catch (err) {
    console.error('[mail] отправка не удалась', err.message);
    storeInOutbox({ to: recipient, subject, html });
  }
}
