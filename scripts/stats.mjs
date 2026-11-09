// Prints daily reader counts, using the Netlify CLI login on this machine.
//   npm run stats          last 14 days
//   npm run stats -- 60    last 60 days
import fs from 'node:fs';
import os from 'node:os';
import { getStore } from '@netlify/blobs';

const days = Number(process.argv[2]) || 14;
const config = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/netlify/config.json`, 'utf8'));
const token = Object.values(config.users)[0].auth.token;
const { siteId } = JSON.parse(fs.readFileSync('.netlify/state.json', 'utf8'));
const store = getStore({ name: 'site-stats', siteID: siteId, token });

const { blobs } = await store.list({ prefix: 'day/' });
const keys = blobs.map((b) => b.key).sort().slice(-days);
const rows = (await Promise.all(keys.map((key) => store.get(key, { type: 'json' })))).filter(Boolean);

if (rows.length === 0) {
  console.log('No visits recorded yet.');
  process.exit(0);
}

const pad = (value, width) => String(value).padStart(width);
console.log(`${'date'.padEnd(10)} ${pad('readers', 8)} ${pad('returning', 9)} ${pad('home', 6)} ${pad('stories', 8)} ${pad('method', 7)} ${pad('archive', 8)}`);
for (const d of rows) {
  console.log(`${d.date} ${pad(d.visitors, 8)} ${pad(d.returning, 9)} ${pad(d.views.home, 6)} ${pad(d.views.story, 8)} ${pad(d.views.method, 7)} ${pad(d.views.archive, 8)}`);
}

const totals = rows.reduce((t, d) => ({ visitors: t.visitors + d.visitors, returning: t.returning + d.returning }), { visitors: 0, returning: 0 });
const share = totals.visitors ? Math.round((totals.returning / totals.visitors) * 100) : 0;
console.log(`\n${rows.length} days: ${totals.visitors} daily readers, ${totals.returning} of them returning (${share}%)`);

const stories = {};
for (const d of rows) for (const [key, n] of Object.entries(d.stories)) stories[key] = (stories[key] || 0) + n;
const top = Object.entries(stories).sort((a, b) => b[1] - a[1]).slice(0, 10);
if (top.length) {
  console.log('\nMost-read stories:');
  for (const [key, n] of top) console.log(`  ${pad(n, 5)}  ${key}`);
}
