import { normalizeEmail, overRateLimit, saveReport, saveSubscriber, submissionsStore, validateSubmission } from '../lib/submissions.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export default async (req, context) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const kind = new URL(req.url).pathname.endsWith('/subscribe') ? 'subscribe' : 'report';

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }

  const problem = validateSubmission(kind, body);
  // Honeypot hits get a normal-looking success so bots do not retry.
  if (problem && body?.website) return json({ ok: true });
  if (problem) return json({ ok: false, error: problem }, 400);

  const store = submissionsStore();
  if (await overRateLimit(store, context.ip)) {
    return json({ ok: false, error: 'Too many submissions. Please try again later.' }, 429);
  }

  if (kind === 'subscribe') await saveSubscriber(store, normalizeEmail(body.email));
  else await saveReport(store, body);
  return json({ ok: true });
};

export const config = {
  path: ['/api/subscribe', '/api/report']
};
