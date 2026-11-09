import { getStore } from '@netlify/blobs';

// Aggregate daily counts only. No identifiers are received or stored: the
// browser reports whether this is its first view today and whether it has
// visited before, based on a last-visit date it keeps locally.

export const VIEWS = ['home', 'story', 'method', 'archive'];
const STORY_KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|curl|wget|python-requests/i;
const MAX_WRITE_ATTEMPTS = 8;

export function statsStore() {
  return getStore({ name: process.env.STATS_STORE || 'site-stats', consistency: 'strong' });
}

export function isBot(userAgent) {
  return !userAgent || BOT.test(userAgent);
}

/** Returns a clean hit, or null when the request is malformed. */
export function parseHit(body) {
  if (!body || !VIEWS.includes(body.view)) return null;
  const story = body.view === 'story' && STORY_KEY.test(String(body.story || '')) ? body.story : null;
  if (body.view === 'story' && !story) return null;
  return { view: body.view, story, firstToday: body.firstToday === true, returning: body.returning === true && body.firstToday === true };
}

export function emptyDay(date) {
  return { date, visitors: 0, returning: 0, views: Object.fromEntries(VIEWS.map((v) => [v, 0])), stories: {} };
}

export function applyHit(day, hit) {
  const next = structuredClone(day);
  next.views[hit.view] = (next.views[hit.view] || 0) + 1;
  if (hit.story) next.stories[hit.story] = (next.stories[hit.story] || 0) + 1;
  if (hit.firstToday) next.visitors += 1;
  if (hit.returning) next.returning += 1;
  return next;
}

/** Read-modify-write with an etag check, retried so simultaneous visits are not lost. */
export async function recordHit(store, date, hit) {
  const key = `day/${date}`;
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const current = await store.getWithMetadata(key, { type: 'json' });
    const next = applyHit(current?.data || emptyDay(date), hit);
    const result = current
      ? await store.setJSON(key, next, { onlyIfMatch: current.etag })
      : await store.setJSON(key, next, { onlyIfNew: true });
    if (result.modified) return true;
  }
  return false;
}
