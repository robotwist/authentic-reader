import { normalizeEmail, overRateLimit, saveReport, saveSubscriber, submissionsStore, validateSubmission } from '../lib/submissions.mjs';
import { addSubscriber, emailEnabled } from '../lib/email.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export default async (req, context) => {
  const kind = new URL(req.url).pathname.endsWith('/subscribe') ? 'subscribe' : 'report';
  if (req.method === 'GET' && kind === 'subscribe') return json({ ok: true, emailEdition: emailEnabled() });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

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

  if (kind === 'subscribe') {
    const email = normalizeEmail(body.email);
    let emailService = 'pending';
    if (emailEnabled()) {
      try {
        await addSubscriber(email);
        emailService = 'added';
      } catch (error) {
        console.warn('Could not add subscriber to the email service:', error.message);
      }
    }
    await saveSubscriber(store, email, emailService);
  } else {
    await saveReport(store, body);
  }
  return json({ ok: true });
};

export const config = {
  path: ['/api/subscribe', '/api/report']
};
