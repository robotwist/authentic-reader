// Sends stored signups that have not reached the email service yet to
// Buttondown (each gets a confirmation email). Uses the Netlify CLI login and
// the BUTTONDOWN_API_KEY set in Netlify.
//   npm run email:sync
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { getStore } from '@netlify/blobs';

process.env.BUTTONDOWN_API_KEY ||= execFileSync('netlify', ['env:get', 'BUTTONDOWN_API_KEY'], { encoding: 'utf8' }).trim().split('\n').pop();
if (!/^[\w-]{10,}$/.test(process.env.BUTTONDOWN_API_KEY)) {
  console.error('BUTTONDOWN_API_KEY is not set in Netlify.');
  process.exit(1);
}
const { addSubscriber } = await import('../netlify/lib/email.mjs');

const config = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/netlify/config.json`, 'utf8'));
const token = Object.values(config.users)[0].auth.token;
const { siteId } = JSON.parse(fs.readFileSync('.netlify/state.json', 'utf8'));
const store = getStore({ name: 'reader-submissions', siteID: siteId, token });

const { blobs } = await store.list({ prefix: 'subscribers/' });
let added = 0;
for (const { key } of blobs) {
  const record = await store.get(key, { type: 'json' });
  if (!record || record.emailService === 'added') continue;
  await addSubscriber(record.email);
  await store.setJSON(key, { ...record, emailService: 'added' });
  added++;
}
console.log(`${added} subscriber(s) sent to the email service; ${blobs.length - added} already there.`);
