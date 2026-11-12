import { briefingsStore } from '../lib/store.mjs';
import { loadCheckSessions, loadCorrections, summarizeChecks } from '../lib/record.mjs';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300',
  'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=600, stale-while-revalidate=3600'
};

export default async (req) => {
  const { pathname } = new URL(req.url);
  const store = briefingsStore();
  try {
    const body = pathname.endsWith('/checks')
      ? summarizeChecks(await loadCheckSessions(store))
      : { corrections: await loadCorrections(store) };
    return new Response(JSON.stringify(body), { headers: HEADERS });
  } catch (error) {
    console.error('record:', error);
    return new Response(JSON.stringify({ error: 'Unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};

export const config = {
  path: ['/api/corrections', '/api/checks']
};
