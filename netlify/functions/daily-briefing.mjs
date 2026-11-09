import { getStore } from '@netlify/blobs';

const CACHE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=60',
  'Netlify-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600'
};

function json(body, status = 200, headers = CACHE_HEADERS) {
  return new Response(JSON.stringify(body), { status, headers });
}

function formatDate(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });
}

async function listDates(store) {
  const { blobs } = await store.list({ prefix: 'day/' });
  return blobs.map((b) => b.key.slice('day/'.length)).sort().reverse();
}

export default async (req, context) => {
  const store = getStore({ name: 'briefings', consistency: 'strong' });
  const { pathname } = new URL(req.url);

  try {
    if (pathname.replace(/\/$/, '') === '/api/daily-briefing/status') {
      const lastRun = await store.get('meta/last-run', { type: 'json' });
      return json(lastRun || { message: 'No runs recorded yet.' }, 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    }

    if (pathname.replace(/\/$/, '') === '/api/daily-briefing/archive') {
      const dates = (await listDates(store)).map((date) => ({ date, formatted: formatDate(date) }));
      return json({ count: dates.length, dates });
    }

    const requested = context.params?.date;
    if (requested && !/^\d{4}-\d{2}-\d{2}$/.test(requested)) {
      return json({ error: 'Invalid date format', message: 'Date must be in YYYY-MM-DD format' }, 400);
    }

    const date = requested || (await listDates(store))[0];
    const briefing = date ? await store.get(`day/${date}`, { type: 'json' }) : null;
    if (!briefing) {
      return json({ error: 'Briefing not found', message: requested ? `No briefing found for ${requested}` : 'No briefing has been generated yet.' }, 404);
    }

    return json({ ...briefing, isArchive: Boolean(requested) });
  } catch (error) {
    console.error('daily-briefing failed:', error);
    return json({ error: 'Service unavailable', message: 'Could not load the briefing.' }, 503, { 'Content-Type': 'application/json' });
  }
};

export const config = {
  path: ['/api/daily-briefing', '/api/daily-briefing/status', '/api/daily-briefing/archive', '/api/daily-briefing/archive/:date']
};
