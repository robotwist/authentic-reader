import { briefingsStore } from '../lib/store.mjs';
import { articleKey, toLegacyAnalysis } from '../lib/briefing.mjs';

// Analysis is generated once per day by generate-briefing-background; these
// endpoints only serve stored results so visitor traffic never calls the LLM.

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function notCached() {
  return json({ success: false, error: 'Not available', message: 'Analysis is only available for briefing articles.' }, 404);
}

export default async (req) => {
  const { pathname } = new URL(req.url);
  const route = pathname.replace(/\/$/, '').split('/').pop();

  if (route === 'health') {
    return json({ success: true, health: { mode: 'precomputed' } });
  }
  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  // LlamaService sends the prompt as content, with the headline on a "TITLE:" line.
  const title = route === 'analyze'
    ? body?.article?.content?.match(/^TITLE: (.+)$/m)?.[1]
    : body?.article?.title;
  if (!title) return notCached();

  const store = briefingsStore();
  const record = await store.get(articleKey(title), { type: 'json' });

  if (route === 'analyze-deep') {
    if (!record?.deep) return notCached();
    return json({ success: true, analysis: record.deep, analysis_type: 'industry-leading', timestamp: Date.now() });
  }
  if (route === 'compare-sources') {
    if (!record?.comparison) return notCached();
    return json({ success: true, comparison: record.comparison, timestamp: Date.now() });
  }
  if (route === 'analyze') {
    if (!record?.deep) return notCached();
    return json({ success: true, analysis: toLegacyAnalysis(record.deep), timestamp: Date.now() });
  }
  return json({ success: false, error: 'Not found' }, 404);
};

export const config = {
  // The /api/ai/ paths remain for pages cached by older service workers.
  path: [
    '/api/analysis/analyze-deep', '/api/analysis/compare-sources', '/api/analysis/analyze', '/api/analysis/health',
    '/api/ai/analyze-deep', '/api/ai/compare-sources', '/api/ai/analyze', '/api/ai/health'
  ]
};
