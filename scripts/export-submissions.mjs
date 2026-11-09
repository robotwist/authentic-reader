// Prints reader submissions as CSV, using the Netlify CLI login on this machine.
//   npm run export:subscribers > subscribers.csv
//   npm run export:reports > reports.csv
import fs from 'node:fs';
import os from 'node:os';
import { getStore } from '@netlify/blobs';

const kind = process.argv[2] === 'reports' ? 'reports' : 'subscribers';
const config = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/netlify/config.json`, 'utf8'));
const token = Object.values(config.users)[0].auth.token;
const { siteId } = JSON.parse(fs.readFileSync('.netlify/state.json', 'utf8'));
const store = getStore({ name: 'reader-submissions', siteID: siteId, token });

const { blobs } = await store.list({ prefix: `${kind}/` });
const rows = (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))).filter(Boolean)
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

const csv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const columns = kind === 'subscribers' ? ['email', 'createdAt'] : ['createdAt', 'story', 'message', 'email'];
console.log(columns.join(','));
for (const row of rows) console.log(columns.map((c) => csv(row[c])).join(','));
console.error(`${rows.length} ${kind}`);
