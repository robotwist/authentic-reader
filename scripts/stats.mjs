// Prints daily reader counts, using the Netlify CLI login on this machine.
//   npm run stats          last 14 days
//   npm run stats -- 60    last 60 days
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { getStore } from '@netlify/blobs';
import { mergeDays } from '../netlify/lib/stats.mjs';

const days = Number(process.argv[2]) || 14;
const config = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/netlify/config.json`, 'utf8'));
const token = Object.values(config.users)[0].auth.token;
const { siteId } = JSON.parse(fs.readFileSync('.netlify/state.json', 'utf8'));
const store = getStore({ name: 'site-stats', siteID: siteId, token });

// Keys are day/<date> (before sharding) and day/<date>/<shard>.
const { blobs } = await store.list({ prefix: 'day/' });
const byDate = {};
for (const { key } of blobs) (byDate[key.split('/')[1]] ||= []).push(key);
const dates = Object.keys(byDate).sort().slice(-days);
const rows = await Promise.all(dates.map(async (date) => {
  const records = await Promise.all(byDate[date].map((key) => store.get(key, { type: 'json' })));
  return mergeDays(date, records.filter(Boolean));
}));

if (rows.length === 0) {
  console.log('No visits recorded yet.');
  process.exit(0);
}

const pad = (value, width) => String(value).padStart(width);
console.log(`${'date'.padEnd(10)} ${pad('readers', 8)} ${pad('returning', 9)} ${pad('home', 6)} ${pad('stories', 8)} ${pad('opinion', 8)} ${pad('method', 7)} ${pad('archive', 8)}`);
for (const d of rows) {
  console.log(`${d.date} ${pad(d.visitors, 8)} ${pad(d.returning, 9)} ${pad(d.views.home, 6)} ${pad(d.views.story, 8)} ${pad(d.views.opinion || 0, 8)} ${pad(d.views.method, 7)} ${pad(d.views.archive, 8)}`);
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

// Upgrade markers. The thresholds and how they were estimated are in docs/SCALING.md.
const SITE = 'https://authentic-reader.netlify.app';
const READERS = { watch: 150, plan: 300, upgrade: 400, spike: 1000 };
const SUBSCRIBERS = { watch: 80, upgrade: 100 };
const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const DAILY_TOKENS = 200000;

console.log('\nUpgrade markers (docs/SCALING.md):');
const recent = rows.slice(-7);
const average = Math.round(recent.reduce((sum, d) => sum + d.visitors, 0) / recent.length);
const busiest = Math.max(...rows.map((d) => d.visitors));
let hosting = `under ${READERS.watch}/day: no action`;
if (average >= READERS.upgrade) hosting = `over ${READERS.upgrade}/day: move to Netlify Personal ($9) before credits run out`;
else if (average >= READERS.plan) hosting = `over ${READERS.plan}/day: move the pipeline to GitHub Actions, and plan for Netlify Personal`;
else if (average >= READERS.watch) hosting = `over ${READERS.watch}/day: check the Netlify usage page weekly`;
console.log(`  Hosting      ${average} readers/day over the last ${recent.length} days, ${hosting}`);
if (busiest >= READERS.spike) console.log(`               a day had ${busiest} readers: check the Netlify usage page now`);

function buttondownKey() {
  if (process.env.BUTTONDOWN_API_KEY) return process.env.BUTTONDOWN_API_KEY;
  try {
    const value = execFileSync('netlify', ['env:get', 'BUTTONDOWN_API_KEY'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\S{20,}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

const key = buttondownKey();
if (key) {
  try {
    const response = await fetch('https://api.buttondown.com/v1/subscribers?type=regular&page_size=1', {
      headers: { Authorization: `Token ${key}`, 'X-API-Version': '2026-04-01' },
      signal: AbortSignal.timeout(15000)
    });
    const { count } = await response.json();
    let email = `under ${SUBSCRIBERS.watch}: no action`;
    if (count >= SUBSCRIBERS.upgrade) email = `at the free limit of ${SUBSCRIBERS.upgrade}: move to Buttondown Basic ($9, up to 1,000)`;
    else if (count >= SUBSCRIBERS.watch) email = `nearing the free limit of ${SUBSCRIBERS.upgrade}: plan for Buttondown Basic ($9)`;
    console.log(`  Email        ${count} confirmed subscribers, ${email}`);
  } catch {
    console.log('  Email        could not reach Buttondown');
  }
} else {
  console.log('  Email        no Buttondown key on this machine; see the subscriber count in the Buttondown dashboard');
}

try {
  const status = await (await fetch(`${SITE}/api/daily-briefing/status`, { signal: AbortSignal.timeout(15000) })).json();
  const stories = (status.days || []).flatMap((d) => Object.entries(d.report || {}).filter(([k]) => !k.startsWith('opinion-')).map(([, r]) => r));
  const fallbacks = stories.filter((r) => r.model && r.model !== PRIMARY_MODEL).length;
  const busiestModel = Object.entries(status.tokens || {}).sort((a, b) => b[1] - a[1])[0];
  const notes = [];
  if (status.exhaustedModels?.length) notes.push(`daily allowance used up on ${status.exhaustedModels.join(', ')}`);
  if (fallbacks) notes.push(`${fallbacks} of ${stories.length} stories fell back to a smaller model`);
  if (busiestModel && busiestModel[1] >= DAILY_TOKENS * 0.9) notes.push(`${busiestModel[0]} used ${Math.round((busiestModel[1] / DAILY_TOKENS) * 100)}% of its daily allowance`);
  const verdict = notes.length ? `${notes.join('; ')}. If this repeats most days, move to the Groq Developer plan` : 'every story on the main model: no action';
  console.log(`  Analysis     latest run (${status.date}): ${verdict}`);
} catch {
  console.log('  Analysis     could not read the latest run report');
}
