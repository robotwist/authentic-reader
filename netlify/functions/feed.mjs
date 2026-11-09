import { briefingsStore } from '../lib/store.mjs';

const FEED_DAYS = 14;

const escapeXml = (text) => String(text ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
const cdata = (html) => `<![CDATA[${String(html).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

function formatDate(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** One feed item per daily briefing, so RSS readers and RSS-to-email services get a newsletter-shaped edition. */
function itemFor(siteUrl, day) {
  const date = day.briefingDate;
  const order = (day.order || Object.keys(day.topics)).filter((key) => day.topics[key]);
  const stories = order.map((key) => {
    const story = day.topics[key];
    const link = `${siteUrl}/?date=${date}&story=${encodeURIComponent(key)}`;
    const summary = story.why || story.analysis?.summary || '';
    const outlets = story.outlets?.length > 1 ? ` · covered by ${story.outlets.length} outlets` : '';
    return `<h3>[${escapeXml((story.category || 'News').toUpperCase())}] ${escapeXml(story.topic)}</h3>
<p><a href="${escapeXml(link)}">${escapeXml(story.article.title)}</a><br/><small>${escapeXml(story.article.source)}${escapeXml(outlets)}</small></p>
${summary ? `<p>${escapeXml(summary)}</p>` : ''}`;
  }).join('\n');

  const opinions = ['left', 'right'].map((side) => day.opinions?.[side]).filter(Boolean).map((o) => {
    const link = `${siteUrl}/?date=${date}&opinion=${o.side}`;
    return `<p><strong>[FROM THE ${o.side.toUpperCase()}]</strong> <a href="${escapeXml(link)}">${escapeXml(o.article.title)}</a><br/><small>${escapeXml(o.article.source)} · argument ${o.argumentScore.overall}/100</small></p>`;
  }).join('\n');

  return `<item>
  <title>${escapeXml(`The Daily Authentic: ${formatDate(date)}`)}</title>
  <link>${escapeXml(`${siteUrl}/?date=${date}`)}</link>
  <guid isPermaLink="false">daily-authentic-${date}</guid>
  <pubDate>${new Date(day.generatedAt).toUTCString()}</pubDate>
  <description>${cdata(`<p>Today's most-covered stories, read closely for logic, rhetoric, and framing.</p>\n${stories}\n${opinions ? `<h3>[OPINION, WEIGHED]</h3>\n${opinions}` : ''}\n<p><a href="${siteUrl}/method">How this works</a></p>`)}</description>
</item>`;
}

export default async () => {
  const siteUrl = (process.env.URL || 'https://authentic-reader.netlify.app').replace(/\/$/, '');
  const store = briefingsStore();
  const { blobs } = await store.list({ prefix: 'day/' });
  const keys = blobs.map((b) => b.key).sort().reverse().slice(0, FEED_DAYS);
  const days = (await Promise.all(keys.map((key) => store.get(key, { type: 'json' })))).filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>The Daily Authentic</title>
  <link>${siteUrl}/</link>
  <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
  <description>The day's most-covered news stories, analyzed once for logic, rhetoric, and framing, with sourced fact-checks.</description>
  <language>en-us</language>
  ${days[0] ? `<lastBuildDate>${new Date(days[0].generatedAt).toUTCString()}</lastBuildDate>` : ''}
  ${days.map((day) => itemFor(siteUrl, day)).join('\n')}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600'
    }
  });
};

export const config = {
  path: '/feed.xml'
};
