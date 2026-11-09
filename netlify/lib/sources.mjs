import { createHash } from 'node:crypto';
import Parser from 'rss-parser';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

const USER_AGENT = 'Mozilla/5.0 (compatible; AuthenticReaderBot/1.0; +https://authentic-reader.netlify.app)';

/*
 * Outlets the daily briefing draws from. Lean ratings are approximate, adapted
 * from widely used media-bias charts (AllSides, Ad Fontes Media), and are used
 * only to pick a spread of perspectives for comparisons. `republishable` marks
 * outlets whose terms allow republishing full articles with attribution. The methodology page
 * (src/pages/MethodPage.tsx) lists the same outlets; keep the two in sync.
 */
export const FEEDS = [
  { name: 'The Guardian', lean: 'left', url: 'https://www.theguardian.com/world/rss' },
  { name: 'The Guardian', lean: 'left', url: 'https://www.theguardian.com/us-news/rss' },
  { name: 'NPR', lean: 'center-left', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'NPR', lean: 'center-left', url: 'https://feeds.npr.org/1004/rss.xml' },
  { name: 'NPR', lean: 'center-left', url: 'https://feeds.npr.org/1014/rss.xml' },
  { name: 'CBS News', lean: 'center-left', url: 'https://www.cbsnews.com/latest/rss/main' },
  { name: 'ABC News', lean: 'center-left', url: 'https://abcnews.go.com/abcnews/topstories' },
  { name: 'NBC News', lean: 'center-left', url: 'https://feeds.nbcnews.com/nbcnews/public/news' },
  { name: 'Time', lean: 'center-left', url: 'https://time.com/feed/' },
  { name: 'BBC News', lean: 'center', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'BBC News', lean: 'center', url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml' },
  { name: 'BBC News', lean: 'center', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { name: 'BBC News', lean: 'center', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
  { name: 'PBS NewsHour', lean: 'center', url: 'https://www.pbs.org/newshour/feeds/rss/headlines' },
  { name: 'The Hill', lean: 'center', url: 'https://thehill.com/homenews/feed/' },
  { name: 'Axios', lean: 'center', url: 'https://www.axios.com/feeds/feed.rss' },
  { name: 'CNBC', lean: 'center', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
  { name: 'Fox News', lean: 'right', url: 'https://moxie.foxnews.com/google-publisher/latest.xml' },
  { name: 'Fox News', lean: 'right', url: 'https://moxie.foxnews.com/google-publisher/politics.xml' },
  { name: 'Fox News', lean: 'right', url: 'https://moxie.foxnews.com/google-publisher/world.xml' },
  { name: 'New York Post', lean: 'right', url: 'https://nypost.com/news/feed/' },
  { name: 'Washington Times', lean: 'right', url: 'https://www.washingtontimes.com/rss/headlines/news/' },
  { name: 'Washington Examiner', lean: 'right', url: 'https://www.washingtonexaminer.com/section/news/feed/' },
  { name: 'The Daily Wire', lean: 'right', url: 'https://www.dailywire.com/feeds/rss.xml' },
  { name: 'Al Jazeera', lean: 'international', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'Deutsche Welle', lean: 'international', url: 'https://rss.dw.com/xml/rss-en-all' },
  { name: 'France 24', lean: 'international', url: 'https://www.france24.com/en/rss' },
  { name: 'Sky News', lean: 'international', url: 'https://feeds.skynews.com/feeds/rss/world.xml' },
  { name: 'ProPublica', lean: 'center-left', republishable: true, url: 'https://feeds.propublica.org/propublica/main' },
  { name: 'The 19th', lean: 'center-left', republishable: true, url: 'https://19thnews.org/feed/' },
  { name: 'Inside Climate News', lean: 'center-left', republishable: true, url: 'https://insideclimatenews.org/feed/' },
  { name: 'KFF Health News', lean: 'center', republishable: true, url: 'https://kffhealthnews.org/feed/' },
  { name: 'CalMatters', lean: 'center', republishable: true, url: 'https://calmatters.org/feed/' },
  { name: 'The Conversation', lean: 'center', republishable: true, url: 'https://theconversation.com/us/articles.atom' },
  { name: 'Global Voices', lean: 'international', republishable: true, url: 'https://globalvoices.org/feed/' }
];

export const MIN_FULL_ARTICLE_CHARS = 1500;

// Cross-promotion and fundraising lines that article pages mix into the body text.
const PROMO_PARAGRAPH = /^(read more|watch|related|see also|listen|more:|advertisement|sign up|subscribe|follow us)\b|^(a free press is a cornerstone|support trusted journalism)/i;
const MAX_ITEMS_PER_FEED = 40;

const rssParser = new Parser();

export function utcDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export function articleKey(title) {
  const normalized = String(title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `article/${createHash('sha256').update(normalized).digest('hex').slice(0, 32)}`;
}

export async function fetchText(url, timeoutMs) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

function decodeEntities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' };
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : match;
    }
    return named[code.toLowerCase()] ?? match;
  });
}

export function stripHtml(html) {
  return decodeEntities(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Readability HTML to plain text, keeping paragraph breaks (ReaderView splits on blank lines). */
export function htmlToParagraphs(html) {
  const text = String(html || '')
    .replace(/<(figure|figcaption|script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr|ul|ol)>/gi, '\n\n')
    .replace(/<[^>]*>/g, '');
  return decodeEntities(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph && !PROMO_PARAGRAPH.test(paragraph))
    .join('\n\n');
}

export async function fetchFeedItems(feed) {
  try {
    const xml = await fetchText(feed.url, 12000);
    const parsed = await rssParser.parseString(xml);
    return (parsed.items || []).slice(0, MAX_ITEMS_PER_FEED).map((item) => ({
      title: stripHtml(item.title || ''),
      link: item.link,
      description: stripHtml(item.contentSnippet || item.summary || item.content || '').slice(0, 400),
      content: stripHtml(item['content:encoded'] || item.content || ''),
      author: item.creator || item.author || null,
      publishDate: item.isoDate || item.pubDate || null,
      sourceName: feed.name,
      lean: feed.lean,
      republishable: Boolean(feed.republishable)
    })).filter((item) => item.title && item.link);
  } catch (error) {
    console.warn(`[briefing] Feed failed: ${feed.name} (${error.message})`);
    return [];
  }
}

export async function extractArticle(url) {
  try {
    const html = await fetchText(url, 12000);
    const { document } = parseHTML(html);
    const parsed = new Readability(document).parse();
    const text = htmlToParagraphs(parsed?.content);
    if (!text) return null;
    return {
      title: parsed.title?.trim() || null,
      text,
      byline: parsed.byline?.trim() || null
    };
  } catch (error) {
    console.warn(`[briefing] Extraction failed: ${url} (${error.message})`);
    return null;
  }
}

export function looksLikeFullArticle(text) {
  if (!text || text.length < MIN_FULL_ARTICLE_CHARS) return false;
  if (text.split(/\s+/).length < 250) return false;
  const lower = text.toLowerCase();
  const paywallMarkers = ['subscribe to read', 'sign up to read', 'to continue reading', 'unlock this article', 'members only'];
  return !paywallMarkers.some((marker) => lower.includes(marker));
}


export function isOpinionPiece(item) {
  return /\/(commentisfree|opinion|opinions)\//.test(item.link) || / \| [A-Z][\w'’-]+ [A-Z][\w'’-]+$/.test(item.title);
}


// Sites that republish other outlets' articles, so they never count as independent confirmation.
export const SYNDICATORS = new Set(['yahoo', 'msn', 'aol', 'newsbreak', 'flipboard', 'ground']);

/** "bbc" for both bbc.co.uk and bbc.com, so an outlet's own pages are not counted as independent. */
export function outletName(url) {
  try {
    const parts = new URL(url).hostname.replace(/^www\./, '').split('.');
    const secondLevel = ['co', 'com', 'org', 'net', 'gov', 'ac'];
    return parts.length >= 3 && secondLevel.includes(parts[parts.length - 2]) ? parts[parts.length - 3] : parts[parts.length - 2];
  } catch {
    return null;
  }
}

