import { createHash } from 'node:crypto';
import Parser from 'rss-parser';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

const USER_AGENT = 'Mozilla/5.0 (compatible; AuthenticReaderBot/1.0; +https://authentic-reader.netlify.app)';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

// Keys and labels must match TOPIC_KEYS in src/pages/DailyBriefingPage.tsx.
// `dedicated` feeds only carry stories on the topic, so items qualify without a keyword hit.
export const TOPICS = [
  {
    key: 'ukraine',
    label: 'Ukraine',
    icon: '🇺🇦',
    keywords: ['ukraine', 'ukrainian', 'kyiv', 'zelensky', 'russia', 'russian', 'kremlin', 'putin'],
    feeds: [
      { name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
      { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' }
    ]
  },
  {
    key: 'gaza',
    label: 'Gaza',
    icon: '🕊️',
    keywords: ['gaza', 'palestin', 'israel', 'hamas', 'west bank', 'netanyahu', 'idf'],
    feeds: [
      { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' }
    ]
  },
  {
    key: 'diseases',
    label: 'Public Health',
    icon: '🦠',
    keywords: ['health', 'disease', 'vaccine', 'virus', 'outbreak', 'infection', 'pandemic', 'measles', 'flu', 'cancer', 'cdc', 'study'],
    feeds: [
      { name: 'BBC Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml', dedicated: true },
      { name: 'NPR Health', url: 'https://feeds.npr.org/1128/rss.xml', dedicated: true },
      { name: 'ScienceDaily Health', url: 'https://www.sciencedaily.com/rss/top/health.xml', dedicated: true }
    ]
  },
  {
    key: 'epstein',
    label: 'Justice',
    icon: '📄',
    keywords: ['court', 'judge', 'justice department', 'trial', 'lawsuit', 'supreme court', 'indict', 'prosecut', 'ruling', 'verdict', 'charged'],
    feeds: [
      { name: 'The Hill', url: 'https://thehill.com/homenews/feed/' },
      { name: 'The Guardian Law', url: 'https://www.theguardian.com/law/rss', dedicated: true },
      { name: 'NPR Politics', url: 'https://feeds.npr.org/1014/rss.xml' },
      { name: 'The Guardian US', url: 'https://www.theguardian.com/us-news/rss' }
    ]
  },
  {
    key: 'trump',
    label: 'Economy',
    icon: '⚖️',
    keywords: ['economy', 'economic', 'inflation', 'tariff', 'stocks', 'federal reserve', 'jobs', 'recession', 'trade', 'prices', 'interest rate'],
    feeds: [
      { name: 'CNBC', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', dedicated: true },
      { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', dedicated: true },
      { name: 'The Hill', url: 'https://thehill.com/homenews/feed/' }
    ]
  }
];

// Categories drive which "contrast" source SourceComparisonView picks.
const COMPARISON_SOURCES = [
  { name: 'The Guardian', category: 'left', url: 'https://www.theguardian.com/world/rss' },
  { name: 'The Guardian US', category: 'left', url: 'https://www.theguardian.com/us-news/rss' },
  { name: 'NPR', category: 'center-left', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'CBS News', category: 'center-left', url: 'https://www.cbsnews.com/latest/rss/main' },
  { name: 'BBC', category: 'center', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'The Hill', category: 'center', url: 'https://thehill.com/homenews/feed/' },
  { name: 'Fox News', category: 'right', url: 'https://moxie.foxnews.com/google-publisher/politics.xml' },
  { name: 'Fox News World', category: 'right', url: 'https://moxie.foxnews.com/google-publisher/world.xml' },
  { name: 'New York Post', category: 'right', url: 'https://nypost.com/feed/' },
  { name: 'Washington Times', category: 'right', url: 'https://www.washingtontimes.com/rss/headlines/news/' },
  { name: 'Al Jazeera', category: 'international', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'Deutsche Welle', category: 'international', url: 'https://rss.dw.com/xml/rss-en-all' },
  { name: 'France 24', category: 'international', url: 'https://www.france24.com/en/rss' }
];

const MIN_FULL_ARTICLE_CHARS = 1500;
const MIN_FALLBACK_ARTICLE_CHARS = 700;
const MAX_CANDIDATES_PER_TOPIC = 8;
const RECENT_DAYS_TO_SKIP = 3;
const MAX_ARTICLE_AGE_HOURS = 48;

const KEYWORD_STOPWORDS = new Set([
  'about', 'after', 'against', 'amid', 'from', 'have', 'into', 'more', 'news', 'over', 'said', 'says',
  'than', 'that', 'their', 'there', 'they', 'this', 'with', 'would', 'year', 'years', 'what', 'when', 'will'
]);

const DEEP_SYSTEM_PROMPT = `You are an expert media literacy analyst and cognitive bias researcher. Your analysis is used by journalists, fact-checkers, and educators.

Analyze the article thoroughly and return a JSON object with exactly this structure:

{
  "executive_summary": {
    "one_sentence": "The core claim in one neutral sentence",
    "key_claims": ["Claim 1", "Claim 2", "Claim 3"],
    "what_happened": "Factual summary of events (2-3 sentences)",
    "why_it_matters": "Significance and implications"
  },
  "logic_score": {
    "overall": 0-100,
    "breakdown": {
      "factual_accuracy": 0-100,
      "logical_coherence": 0-100,
      "source_quality": 0-100,
      "emotional_neutrality": 0-100,
      "completeness": 0-100
    },
    "grade": "A/B/C/D/F",
    "explanation": "Why this score"
  },
  "bias_analysis": {
    "political_lean": "left | center-left | center | center-right | right",
    "confidence": 0-100,
    "evidence": ["Specific evidence 1", "Evidence 2"],
    "framing": "How the story is framed (hero/villain narrative, conflict framing, etc.)",
    "what_perspectives_missing": ["Missing viewpoint 1", "Missing viewpoint 2"]
  },
  "emotional_manipulation": {
    "score": 0-100,
    "techniques_used": [
      { "technique": "Fear Mongering | Outrage Bait | etc.", "quote": "Exact text", "impact": "How this affects the reader", "severity": "low | medium | high" }
    ],
    "emotional_words": ["word1", "word2"],
    "intended_emotional_response": "What the reader is meant to feel"
  },
  "rhetorical_analysis": {
    "manipulation_techniques": [
      { "type": "Technique name", "category": "logical | emotional | rhetorical | propaganda", "quote": "Exact text from article", "explanation": "Why this is manipulative", "neutral_rewrite": "How to say this fairly", "severity": "low | medium | high" }
    ],
    "headline_accuracy": { "matches_content": true, "clickbait_score": 0-100, "issues": "Description of any headline problems" },
    "source_transparency": { "named_sources": 0, "anonymous_sources": 0, "documents_cited": 0, "concerns": "Any source quality issues" }
  },
  "claim_verification": [
    { "claim": "Specific claim from article", "verification_status": "verified | unverified | disputed | false | needs_context", "confidence": 0-100, "notes": "What readers should know" }
  ],
  "stakeholder_analysis": {
    "who_benefits": ["Entity 1"],
    "who_is_harmed": ["Entity 1"],
    "author_perspective": "Where does the author seem to stand?",
    "potential_conflicts": "Any conflicts of interest?"
  },
  "missing_context": {
    "critical_omissions": ["What's missing 1"],
    "historical_context_needed": "Background readers need",
    "alternative_interpretations": "Other ways to view this story",
    "questions_unanswered": ["Question 1"]
  },
  "reader_guidance": {
    "critical_questions": ["Question to ask 1", "Question 2", "Question 3"],
    "what_to_verify": ["Claim to check 1"],
    "recommended_sources": "Where to get more balanced info",
    "media_literacy_lesson": "What this article teaches about reading news critically"
  },
  "overall_assessment": {
    "reliability": "high | medium | low",
    "recommended_action": "trust | verify | skeptical | disregard",
    "summary": "2-3 sentence overall assessment"
  },
  "search_keywords": ["5-8 lowercase single words that identify THIS story in other outlets' headlines: surnames, places, organizations, distinctive terms (e.g. 'eisenkot', 'smotrich', 'knesset')"]
}

Rules:
1. Output only valid JSON.
2. Quote exactly from the article for every "quote" field.
3. Be fair: say so when an article is well written, and return empty arrays when there is nothing to report.
4. Score honestly.
5. Focus on helping readers become better media consumers.`;

const COMPARISON_SYSTEM_PROMPT = `You are a media bias expert analyzing how different news sources cover the same story.

Compare the coverage and return JSON with this structure:
{
  "same_story_sources": ["Names, exactly as given, of the related sources reporting the same specific story as the primary article"],
  "story_core": {
    "common_facts": ["Fact all sources agree on"],
    "disputed_facts": ["Fact where sources disagree"]
  },
  "framing_comparison": [
    {
      "source": "Source name exactly as given",
      "political_lean": "left | center | right",
      "headline_framing": "How they frame it in the headline",
      "emphasis": "What they emphasize",
      "downplayed": "What they minimize",
      "unique_angle": "Any unique perspective"
    }
  ],
  "language_differences": [
    { "concept": "The same thing described differently", "variations": { "Source A": "Their term", "Source B": "Their term" } }
  ],
  "missing_from_each": [
    { "source": "Source name", "omits": ["Important aspect they don't cover"] }
  ],
  "reader_takeaway": {
    "most_balanced": "Which source is most balanced",
    "most_context": "Which provides most context",
    "recommendation": "How a reader should approach this story"
  }
}

Related sources were found by keyword search, so some may be about a different story. Leave those out of "same_story_sources" and out of every other field. If none cover the same story, return an empty "same_story_sources" array. Output only valid JSON.`;

const rssParser = new Parser();

export function utcDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export function articleKey(title) {
  const normalized = String(title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `article/${createHash('sha256').update(normalized).digest('hex').slice(0, 32)}`;
}

async function fetchText(url, timeoutMs) {
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

function stripHtml(html) {
  return decodeEntities(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Readability HTML to plain text, keeping paragraph breaks (ReaderView splits on blank lines). */
function htmlToParagraphs(html) {
  const text = String(html || '')
    .replace(/<(figure|figcaption|script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr|ul|ol)>/gi, '\n\n')
    .replace(/<[^>]*>/g, '');
  return decodeEntities(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

async function fetchFeedItems(feed) {
  try {
    const xml = await fetchText(feed.url, 12000);
    const parsed = await rssParser.parseString(xml);
    return (parsed.items || []).map((item) => ({
      title: (item.title || '').trim(),
      link: item.link,
      description: stripHtml(item.contentSnippet || item.summary || item.content || ''),
      content: stripHtml(item['content:encoded'] || item.content || ''),
      author: item.creator || item.author || null,
      publishDate: item.isoDate || item.pubDate || null,
      sourceName: feed.name
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

function looksLikeFullArticle(text) {
  if (!text || text.length < MIN_FULL_ARTICLE_CHARS) return false;
  if (text.split(/\s+/).length < 250) return false;
  const lower = text.toLowerCase();
  const paywallMarkers = ['subscribe to read', 'sign up to read', 'to continue reading', 'unlock this article', 'members only'];
  return !paywallMarkers.some((marker) => lower.includes(marker));
}

function matchesKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

function isOpinionPiece(item) {
  return /\/(commentisfree|opinion|opinions)\//.test(item.link) || / \| [A-Z][\w'’-]+ [A-Z][\w'’-]+$/.test(item.title);
}

function storyTokens(keywords) {
  const tokens = keywords
    .flatMap((keyword) => String(keyword).toLowerCase().split(/[^a-z0-9'’-]+/))
    .map((token) => token.replace(/['’]s$/, ''))
    .filter((token) => token.length >= 4 && !KEYWORD_STOPWORDS.has(token));
  return [...new Set(tokens)];
}

export async function callGroqJson({ system, user, maxTokens = 8000 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2,
    max_completion_tokens: maxTokens,
    response_format: { type: 'json_object' }
  };
  if (model.startsWith('openai/gpt-oss')) body.reasoning_effort = 'low';

  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000)
    });

    if (response.status === 429 || response.status >= 500) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 15000;
      console.warn(`[briefing] Groq ${response.status}, retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 90000)));
      continue;
    }

    const data = await response.json();
    if (!response.ok) throw new Error(`Groq ${response.status}: ${data?.error?.message || 'unknown error'}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned an empty response');
    return { json: JSON.parse(content), model, usage: data.usage };
  }
  throw new Error('Groq rate limit retries exhausted');
}

export async function analyzeArticleDeep(article) {
  const text = article.content.length > 9000 ? `${article.content.slice(0, 9000)}...` : article.content;
  const { json, model } = await callGroqJson({
    system: DEEP_SYSTEM_PROMPT,
    user: `TITLE: ${article.title}\nSOURCE: ${article.source}\n\nARTICLE TEXT:\n${text}`
  });
  json.metadata = { analyzed_at: new Date().toISOString(), model, service: 'industry-leading', analysis_version: '3.0' };
  return json;
}

async function findRelatedCoverage(article, keywords, feedCache) {
  const results = [];
  for (const source of COMPARISON_SOURCES) {
    if (!feedCache.has(source.url)) feedCache.set(source.url, fetchFeedItems(source));
  }

  for (const source of COMPARISON_SOURCES) {
    const items = await feedCache.get(source.url);
    let best = null;
    for (const item of items) {
      if (item.link === article.url || item.title === article.title) continue;
      const hits = matchesKeywords(`${item.title} ${item.description}`, keywords);
      if (hits.length >= 2 && (!best || hits.length > best.hits)) best = { item, hits: hits.length };
    }
    if (best && !results.some((r) => r.item.link === best.item.link)) results.push({ ...best, source });
  }

  const top = results.sort((a, b) => b.hits - a.hits).slice(0, 5);
  return Promise.all(top.map(async ({ item, hits, source }) => {
    const extracted = await extractArticle(item.link);
    const content = extracted?.text && extracted.text.length > item.content.length ? extracted.text : (item.content || item.description);
    return {
      name: source.name,
      category: source.category,
      title: item.title,
      url: item.link,
      content,
      description: content.slice(0, 500),
      matchScore: hits / keywords.length
    };
  }));
}

export async function compareCoverage(article, keywords, feedCache) {
  const related = await findRelatedCoverage(article, keywords, feedCache);
  if (related.length === 0) {
    return { found: false, message: 'No comparable coverage found from other sources' };
  }

  const context = related.map((r) =>
    `SOURCE: ${r.name} (${r.category} leaning)\nHEADLINE: ${r.title}\nCONTENT: ${r.content.slice(0, 2500)}`
  ).join('\n\n---\n\n');

  let analysis;
  try {
    ({ json: analysis } = await callGroqJson({
      system: COMPARISON_SYSTEM_PROMPT,
      user: `PRIMARY ARTICLE:\nSOURCE: ${article.source}\nHEADLINE: ${article.title}\nCONTENT: ${article.content.slice(0, 3000)}\n\nRELATED COVERAGE FROM OTHER SOURCES:\n${context}\n\nAnalyze how these sources frame the same story.`,
      maxTokens: 6000
    }));
  } catch (error) {
    console.warn(`[briefing] Comparison analysis failed: ${error.message}`);
    return { found: false, message: 'Source comparison is unavailable for this story' };
  }

  const sameStory = new Set((analysis.same_story_sources || []).map((name) => String(name).toLowerCase()));
  const confirmed = related.filter((r) => sameStory.has(r.name.toLowerCase()));
  if (confirmed.length === 0) {
    return { found: false, message: 'No other outlets covered this specific story' };
  }

  return {
    found: true,
    primary_source: article.source,
    related_sources: confirmed.map(({ matchScore, ...rest }) => rest),
    comparison_analysis: analysis,
    generated_at: new Date().toISOString()
  };
}

/** Shape read by getFallacies/getBias/getSummary in DailyBriefingPage. */
export function toBriefingAnalysis(deep) {
  if (!deep) return null;
  const lean = deep.bias_analysis?.political_lean;
  return {
    summary: deep.executive_summary?.one_sentence || null,
    manipulationAnalysis: {
      logicalFallacies: (deep.rhetorical_analysis?.manipulation_techniques || []).map((t) => ({
        type: t.type || 'Unknown',
        location: t.quote || '',
        explanation: t.explanation || ''
      }))
    },
    biasAnalysis: lean ? {
      direction: lean,
      confidence: (deep.bias_analysis?.confidence ?? 50) / 100,
      explanation: deep.bias_analysis?.framing || ''
    } : undefined,
    overallAssessment: {
      reliabilityScore: deep.logic_score?.overall ?? null
    }
  };
}

/** Shape read by LlamaService.generateText for POST /api/ai/analyze. */
export function toLegacyAnalysis(deep) {
  return {
    summary: deep.executive_summary?.one_sentence || '',
    tone_rating: deep.emotional_manipulation?.intended_emotional_response || 'Objective',
    bias_rating: deep.bias_analysis?.political_lean || 'center',
    bias_explanation: deep.bias_analysis?.framing || '',
    biasConfidence: deep.bias_analysis?.confidence ?? 50,
    fallacies: (deep.rhetorical_analysis?.manipulation_techniques || []).map((t) => ({
      type: t.type,
      quote: t.quote,
      subtext: t.explanation,
      correction: t.neutral_rewrite,
      severity: t.severity || 'medium'
    })),
    missing_context: (deep.missing_context?.critical_omissions || []).join(' '),
    educational_insight: deep.reader_guidance?.media_literacy_lesson || '',
    reliabilityScore: deep.logic_score?.overall ?? 50,
    manipulationTechniques: (deep.emotional_manipulation?.techniques_used || []).map((t) => t.technique).filter(Boolean),
    model_used: deep.metadata?.model
  };
}

async function recentlyUsedUrls(store, today) {
  const { blobs } = await store.list({ prefix: 'day/' });
  const recentKeys = blobs.map((b) => b.key).filter((k) => k !== `day/${today}`).sort().slice(-RECENT_DAYS_TO_SKIP);
  const urls = new Set();
  for (const key of recentKeys) {
    const day = await store.get(key, { type: 'json' });
    for (const topic of Object.values(day?.topics || {})) {
      if (topic.article?.url) urls.add(topic.article.url);
    }
  }
  return urls;
}

function topicRelevance(item, feed, topic) {
  const titleHits = matchesKeywords(item.title, topic.keywords).length;
  const descriptionHits = matchesKeywords(item.description, topic.keywords).length;
  return titleHits * 2 + descriptionHits + (feed.dedicated ? 2 : 0);
}

async function pickArticleForTopic(topic, usedUrls) {
  const feedResults = await Promise.all(topic.feeds.map(fetchFeedItems));
  const cutoff = Date.now() - MAX_ARTICLE_AGE_HOURS * 3600 * 1000;
  const candidates = feedResults
    .flatMap((items, i) => items.map((item) => ({ item, score: topicRelevance(item, topic.feeds[i], topic) })))
    .filter(({ item, score }) => score >= 2 && !usedUrls.has(item.link) && !isOpinionPiece(item))
    .filter(({ item }) => !item.publishDate || new Date(item.publishDate).getTime() >= cutoff)
    .sort((a, b) => b.score - a.score || new Date(b.item.publishDate || 0) - new Date(a.item.publishDate || 0))
    .map(({ item }) => item);

  let fallback = null;
  for (const item of candidates.slice(0, MAX_CANDIDATES_PER_TOPIC)) {
    const extracted = await extractArticle(item.link);
    const text = extracted?.text && extracted.text.length > item.content.length ? extracted.text : item.content;
    const article = {
      title: item.title,
      url: item.link,
      source: item.sourceName,
      publishDate: item.publishDate ? new Date(item.publishDate).toISOString() : null,
      author: extracted?.byline || item.author || undefined,
      content: text || ''
    };
    if (looksLikeFullArticle(article.content)) return article;
    if (article.content.length >= MIN_FALLBACK_ARTICLE_CHARS && (!fallback || article.content.length > fallback.content.length)) {
      fallback = article;
    }
  }
  return fallback;
}

/**
 * Builds today's briefing and writes it to the blob store:
 *   day/YYYY-MM-DD       briefing in the shape DailyBriefingPage expects
 *   article/<title hash> deep analysis + cross-source comparison for one article
 */
export async function generateBriefing(store, { date = utcDate() } = {}) {
  const usedUrls = await recentlyUsedUrls(store, date);
  const feedCache = new Map();
  const topics = {};
  const report = [];

  for (const topic of TOPICS) {
    const started = Date.now();
    try {
      const article = await pickArticleForTopic(topic, usedUrls);
      if (!article) {
        report.push({ topic: topic.key, ok: false, reason: 'no usable article' });
        continue;
      }
      usedUrls.add(article.url);

      let deep = null;
      try {
        deep = await analyzeArticleDeep(article);
      } catch (error) {
        console.warn(`[briefing] Deep analysis failed for ${topic.key}: ${error.message}`);
      }

      const storyKeywords = storyTokens(deep?.search_keywords || []);
      const keywords = storyKeywords.length >= 2 ? storyKeywords : storyTokens([article.title]);
      const comparison = await compareCoverage(article, keywords, feedCache);

      await store.setJSON(articleKey(article.title), { date, title: article.title, url: article.url, deep, comparison });

      topics[topic.key] = {
        topic: topic.label,
        icon: topic.icon,
        article,
        analysis: toBriefingAnalysis(deep)
      };
      report.push({
        topic: topic.key,
        ok: true,
        title: article.title,
        source: article.source,
        chars: article.content.length,
        analyzed: Boolean(deep),
        relatedSources: comparison.found ? comparison.related_sources.length : 0,
        seconds: Math.round((Date.now() - started) / 1000)
      });
    } catch (error) {
      report.push({ topic: topic.key, ok: false, reason: error.message });
    }
  }

  if (Object.keys(topics).length === 0) {
    throw new Error(`No topics produced an article: ${JSON.stringify(report)}`);
  }

  const briefing = { generatedAt: new Date().toISOString(), version: '3.0', briefingDate: date, topics };
  await store.setJSON(`day/${date}`, briefing);
  return { date, report };
}
