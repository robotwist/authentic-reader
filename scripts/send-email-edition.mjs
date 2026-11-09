// Emails today's edition through Buttondown. Run by .github/workflows/email-edition.yml
// after the morning pipeline runs; reads the published edition from the site,
// so it needs no access to Netlify.
//
//   BUTTONDOWN_API_KEY=... node scripts/send-email-edition.mjs
//   BUTTONDOWN_API_KEY=... PREVIEW_TO=you@example.com node scripts/send-email-edition.mjs
import { readyToSend, sendEdition } from '../netlify/lib/email.mjs';

const SITE = (process.env.SITE_URL || 'https://authentic-reader.netlify.app').replace(/\/$/, '');
const previewTo = process.env.PREVIEW_TO?.trim() || undefined;

async function getJson(path) {
  const response = await fetch(`${SITE}${path}`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

if (!process.env.BUTTONDOWN_API_KEY) {
  console.error('BUTTONDOWN_API_KEY is not set.');
  process.exit(1);
}

const day = await getJson('/api/daily-briefing');
const today = new Date().toISOString().slice(0, 10);
if (!previewTo && day.briefingDate !== today) {
  console.log(`Latest edition is ${day.briefingDate}; nothing published for ${today} yet.`);
  process.exit(0);
}

// The status report lists every story planned for the day, published or not.
const status = await getJson('/api/daily-briefing/status');
const report = status.days?.find((d) => d.date === day.briefingDate)?.report || {};
const storiesPlanned = Object.keys(report).filter((key) => !key.startsWith('opinion-')).length;
const storiesPublished = (day.order || Object.keys(day.topics)).length;
if (!previewTo && !readyToSend({ storiesPublished, storiesPlanned: Math.max(storiesPlanned, storiesPublished) })) {
  console.log(`Edition has ${storiesPublished} of ${storiesPlanned} stories; waiting for the next run.`);
  process.exit(0);
}

const result = await sendEdition(day, SITE, { previewTo });
console.log(JSON.stringify({ date: day.briefingDate, storiesPublished, storiesPlanned, ...result }));
