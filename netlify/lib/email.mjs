// The email edition, sent through Buttondown's API. Everything here is a
// no-op until BUTTONDOWN_API_KEY is set.

const API = 'https://api.buttondown.com/v1';
const API_VERSION = '2026-04-01';
// If a run publishes only part of the edition, the email waits until the run
// at or after this UTC hour (16:00 UTC is 10 AM Central) and sends what is ready.
const SEND_PARTIAL_AFTER_UTC_HOUR = 16;

export const emailEnabled = () => Boolean(process.env.BUTTONDOWN_API_KEY);

function headers(extra = {}) {
  return {
    Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
    'Content-Type': 'application/json',
    'X-API-Version': API_VERSION,
    ...extra
  };
}

/**
 * Adds a reader to the newsletter. Buttondown sends them a confirmation
 * email (double opt-in). An address that already exists is not an error.
 */
export async function addSubscriber(email) {
  if (!emailEnabled()) return { added: false, reason: 'email not configured' };
  const response = await fetch(`${API}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email_address: email, tags: ['website'] }),
    signal: AbortSignal.timeout(10000)
  });
  if (response.ok) return { added: true };
  const body = await response.json().catch(() => ({}));
  if (response.status === 400 && /already|exists/i.test(JSON.stringify(body))) return { added: false, reason: 'already subscribed' };
  throw new Error(`Buttondown ${response.status}: ${JSON.stringify(body).slice(0, 200)}`);
}

const formatDate = (date) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** The edition as Markdown; Buttondown adds the unsubscribe footer. */
export function editionMarkdown(day, siteUrl) {
  const date = day.briefingDate;
  const order = (day.order || Object.keys(day.topics)).filter((key) => day.topics[key]);
  const lines = [
    `**${formatDate(date)}**. The day's most-covered stories, read closely for logic, rhetoric, and framing.`,
    ''
  ];

  order.forEach((key, i) => {
    const story = day.topics[key];
    const link = `${siteUrl}/?date=${date}&story=${encodeURIComponent(key)}`;
    const coverage = story.outlets?.length > 1 ? ` · covered by ${story.outlets.length} outlets` : '';
    const continuing = story.dayCount > 1 ? ` · day ${story.dayCount}` : '';
    lines.push(`## ${i + 1}. ${story.topic}`, '', `**[${story.article.title}](${link})**`, '');
    if (story.why) lines.push(story.why, '');
    lines.push(`*${(story.category || 'News')} · ${story.article.source}${coverage}${continuing}*`, '');
  });

  const opinions = ['left', 'right'].map((side) => day.opinions?.[side]).filter(Boolean);
  if (opinions.length) {
    lines.push('## Opinion, weighed', '', 'One column from each side, judged on how well it makes its case.', '');
    for (const o of opinions) {
      const link = `${siteUrl}/?date=${date}&opinion=${o.side}`;
      lines.push(`- **From the ${o.side}:** [${o.article.title}](${link}), ${o.article.source}. Argument ${o.argumentScore.overall}/100.`);
    }
    lines.push('');
  }

  lines.push('---', '', `[Read today's briefing](${siteUrl}/?date=${date}) · [How this works](${siteUrl}/method)`);
  return lines.join('\n');
}

/** Whether today's edition is ready to email: complete, or late enough to send what is ready. */
export function readyToSend({ storiesPublished, storiesPlanned }, now = new Date()) {
  if (!storiesPublished) return false;
  return storiesPublished >= storiesPlanned || now.getUTCHours() >= SEND_PARTIAL_AFTER_UTC_HOUR;
}

/**
 * Sends the day's edition once. A marker in the store prevents a second send,
 * even if several runs publish the same day.
 */
export async function sendEdition(store, day, siteUrl) {
  if (!emailEnabled()) return { sent: false, reason: 'email not configured' };
  const marker = `meta/emailed/${day.briefingDate}`;
  if (await store.get(marker, { type: 'json' })) return { sent: false, reason: 'already sent' };

  const response = await fetch(`${API}/emails`, {
    method: 'POST',
    headers: headers({ 'X-Buttondown-Live-Dangerously': 'true' }),
    body: JSON.stringify({
      subject: `The Daily Authentic: ${formatDate(day.briefingDate)}`,
      body: editionMarkdown(day, siteUrl),
      status: 'about_to_send'
    }),
    signal: AbortSignal.timeout(20000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Buttondown ${response.status}: ${JSON.stringify(body).slice(0, 300)}`);
  await store.setJSON(marker, { sentAt: new Date().toISOString(), emailId: body.id || null });
  return { sent: true, emailId: body.id || null };
}
