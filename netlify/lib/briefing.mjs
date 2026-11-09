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

export const ANALYSIS_VERSION = '4.0';

// Facts newer than the model's training data that it otherwise gets wrong.
// Override with the CURRENT_CONTEXT env var when they change.
const DEFAULT_CURRENT_CONTEXT = 'Donald Trump has been President of the United States since January 20, 2025 (his second term); JD Vance is Vice President.';

const DEEP_SYSTEM_PROMPT = `You are a senior media-literacy analyst. Readers use your analysis to understand a news story more deeply than the article alone allows: what is established, what is framing, and what context is missing. Precision and fairness matter more than finding problems.

Return a JSON object with exactly this structure:

{
  "executive_summary": {
    "one_sentence": "The core news in one neutral sentence",
    "key_claims": ["The 3-4 most important factual claims, paraphrased neutrally"],
    "what_happened": "Factual summary of events (2-3 sentences)",
    "why_it_matters": "Significance and implications"
  },
  "context_explainer": {
    "background": "3-5 sentences a reader new to this story needs: long-running history and how we got here, with recent developments taken only from the article",
    "key_facts": ["2-4 points on how to interpret this story: concepts, methods, or processes, e.g. what an observational study can and cannot show, what a percentage is compared against, how coalition formation works. No statistics, current events, or people's roles from memory"],
    "key_terms": [{ "term": "Jargon, acronym, institution, or person named in the article", "definition": "One plain-language sentence" }]
  },
  "tone": "One or two words for the article's tone, e.g. Measured, Urgent, Sympathetic, Alarmist, Dismissive, Celebratory",
  "logic_score": {
    "overall": 0-100,
    "breakdown": { "factual_accuracy": 0-100, "logical_coherence": 0-100, "source_quality": 0-100, "emotional_neutrality": 0-100, "completeness": 0-100 },
    "explanation": "Why this score, citing specifics"
  },
  "bias_analysis": {
    "political_lean": "left | center-left | center | center-right | right",
    "confidence": 0-100,
    "evidence": ["Specific word choices, story selection, or omissions that indicate lean"],
    "framing": "How the story is framed (conflict, human interest, hero/villain, economic, etc.)",
    "what_perspectives_missing": ["Stakeholders or viewpoints not represented"]
  },
  "emotional_manipulation": {
    "score": 0-100,
    "techniques_used": [
      { "technique": "Name", "quote": "Exact sentence or phrase copied from the article", "speaker": "outlet | name of the quoted person", "impact": "How this affects the reader", "severity": "low | medium | high" }
    ],
    "emotional_words": ["Loaded words the outlet itself chose"],
    "intended_emotional_response": "What the reader is meant to feel, in under 12 words"
  },
  "rhetorical_analysis": {
    "manipulation_techniques": [
      { "type": "Technique name", "category": "logical | emotional | rhetorical | propaganda", "quote": "Exact sentence or phrase copied from the article", "speaker": "outlet | name of the quoted person", "explanation": "Why this misleads, specifically", "neutral_rewrite": "How to say this fairly", "severity": "low | medium | high" }
    ],
    "headline_accuracy": { "matches_content": true, "clickbait_score": 0-100, "issues": "Any gap between headline and body, or empty string" },
    "source_transparency": { "named_sources": 0, "anonymous_sources": 0, "documents_cited": 0, "concerns": "Source quality issues, or empty string" }
  },
  "claims_to_check": [
    { "claim": "Neutral paraphrase", "quote": "The exact sentence from the article that makes this claim", "why_it_matters": "Why the story depends on this claim" }
  ],
  "stakeholder_analysis": {
    "who_benefits": ["Entity"],
    "who_is_harmed": ["Entity"],
    "author_perspective": "Where the outlet seems to stand, or 'Straight news, no clear stance'",
    "potential_conflicts": "Conflicts of interest, or empty string"
  },
  "missing_context": {
    "critical_omissions": ["Facts or perspectives whose absence changes how a reader would understand the story"],
    "alternative_interpretations": "Other reasonable readings of the same facts",
    "questions_unanswered": ["Questions the article raises but does not answer"]
  },
  "reader_guidance": {
    "critical_questions": ["3 questions a sharp reader should ask about this story"],
    "what_to_verify": ["Specific claims worth checking elsewhere"],
    "recommended_sources": "Kinds of sources that would give a fuller picture",
    "media_literacy_lesson": "One transferable lesson about reading news, grounded in this article"
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
2. Every "quote" must be copied character-for-character from the article text, without adding quotation marks. If you cannot quote it exactly, leave the item out.
3. Distinguish the outlet from the people it quotes. Attributing a statement to a named official or expert is normal reporting, not an "Appeal to Authority". Rhetoric inside a quotation belongs to the speaker; only blame the outlet if it adopts that framing in its own voice, headline, or story structure. Set "speaker" accordingly.
4. List only techniques that genuinely mislead. Zero is a valid answer for careful reporting; never pad the list.
5. Calibrate scores: 90-100 exemplary, well-sourced reporting; 70-89 solid with minor issues; 50-69 notable slant, weak sourcing, or important omissions; below 50 misleading. Bias confidence should be low (under 50) for straight news with little evidence of lean.
6. "claims_to_check" should hold the 2-4 factual claims the story most depends on, preferring specific figures, dates, and attributions that outside sources could confirm.
7. Your training data ends well before the article's publication date, so the world may have changed. For context_explainer and missing_context, draw recent facts (who holds an office, election results, current policies) only from the article itself; from memory, give only long-established background such as history, institutions, and how processes work. Never describe someone's current role from memory.
8. Do not state specific numbers, dates, or quotes from memory unless they are long-established and you are certain of them. Leave a key fact out rather than guess.`;

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

/** Thrown when Groq's per-day quota for a model is used up; retrying within this run is pointless. */
export class DailyLimitError extends Error {}

/** Tokens used per model during one pipeline run. */
export function createUsageTracker() {
  const totals = {};
  return {
    add(model, usage) { totals[model] = (totals[model] || 0) + (usage?.total_tokens || 0); },
    get(model) { return totals[model] || 0; },
    totals
  };
}

function parseJsonLoose(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model response contained no JSON object');
    return JSON.parse(match[0]);
  }
}

export async function callGroqJson({ system, user, maxTokens = 8000, model = process.env.GROQ_MODEL || DEFAULT_MODEL, reasoningEffort = 'low', tools, usageTracker }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2,
    max_completion_tokens: maxTokens
  };
  // Groq rejects JSON mode combined with built-in tools, so tool calls are parsed loosely instead.
  if (tools) {
    body.tools = tools;
    body.tool_choice = 'auto';
  } else {
    body.response_format = { type: 'json_object' };
  }
  if (model.startsWith('openai/gpt-oss')) body.reasoning_effort = reasoningEffort;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000)
    });

    if (response.status === 429 || response.status >= 500) {
      const errorText = await response.text();
      if (/per day/i.test(errorText)) {
        throw new DailyLimitError(`Groq daily limit reached for ${model}`);
      }
      const retryAfter = Number(response.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 15000;
      console.warn(`[briefing] Groq ${response.status} on ${model}, retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 90000)));
      continue;
    }

    const data = await response.json();
    if (!response.ok) throw new Error(`Groq ${response.status}: ${data?.error?.message || 'unknown error'}`);
    usageTracker?.add(model, data.usage);
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned an empty response');
    return { json: parseJsonLoose(content), model, usage: data.usage };
  }
  throw new Error('Groq rate limit retries exhausted');
}

// Character-level normalization that keeps an index back into the original
// text, so a model quote can be mapped to the article's exact wording.
function normalizeWithMap(text) {
  let normalized = '';
  const map = [];
  let lastWasSpace = false;
  for (let i = 0; i < text.length; i++) {
    let ch = text[i];
    if (/\s/.test(ch)) {
      if (lastWasSpace) continue;
      ch = ' ';
      lastWasSpace = true;
    } else {
      lastWasSpace = false;
      if ('‘’‛′'.includes(ch)) ch = "'";
      else if ('“”„″'.includes(ch)) ch = '"';
      else if ('‐‑‒–—―'.includes(ch)) ch = '-';
      ch = ch.toLowerCase();
    }
    normalized += ch;
    map.push(i);
  }
  return { normalized, map };
}

function words(text) {
  return String(text).toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) || [];
}

/**
 * Returns the article's own wording for a model-supplied quote: an exact
 * match, otherwise the sentence that best matches it, otherwise null.
 */
function groundQuote(quote, article) {
  if (!quote) return null;
  const cleaned = String(quote).trim().replace(/^["'“”‘’]+|["'“”‘’.,;:]+$/g, '').trim();
  if (cleaned.length < 8) return null;

  const needle = normalizeWithMap(cleaned).normalized;
  const start = article.normalized.indexOf(needle);
  if (start !== -1) {
    const from = article.map[start];
    const to = article.map[start + needle.length - 1] + 1;
    return { text: article.text.slice(from, to), exact: true };
  }

  const quoteWords = words(cleaned);
  if (quoteWords.length < 4) return null;
  let best = null;
  for (const sentence of article.sentences) {
    const sentenceWords = new Set(words(sentence));
    const overlap = quoteWords.filter((w) => sentenceWords.has(w)).length / quoteWords.length;
    if (!best || overlap > best.overlap) best = { sentence, overlap };
  }
  return best && best.overlap >= 0.75 ? { text: best.sentence.trim(), exact: false } : null;
}

/** Replaces every quote in the analysis with article text, dropping items that cannot be grounded. */
export function groundAnalysisQuotes(deep, content) {
  const { normalized, map } = normalizeWithMap(content);
  const article = {
    text: content,
    normalized,
    map,
    sentences: content.split(/(?<=[.!?…]["”’]?)\s+|\n+/).filter((s) => s.trim().length > 20)
  };
  const stats = { total: 0, exact: 0, repaired: 0, dropped: 0 };

  const groundList = (items, quoteField = 'quote') => (items || []).filter((item) => {
    stats.total++;
    const grounded = groundQuote(item[quoteField], article);
    if (!grounded) {
      stats.dropped++;
      return false;
    }
    stats[grounded.exact ? 'exact' : 'repaired']++;
    item[quoteField] = grounded.text;
    return true;
  });

  if (deep.rhetorical_analysis) {
    deep.rhetorical_analysis.manipulation_techniques = groundList(deep.rhetorical_analysis.manipulation_techniques);
  }
  if (deep.emotional_manipulation) {
    deep.emotional_manipulation.techniques_used = groundList(deep.emotional_manipulation.techniques_used);
  }
  const seenClaims = new Set();
  deep.claims_to_check = groundList(deep.claims_to_check).filter((c) => !seenClaims.has(c.quote) && seenClaims.add(c.quote));
  return stats;
}

function letterGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export async function analyzeArticleDeep(article, usageTracker) {
  const text = article.content.length > 9000 ? `${article.content.slice(0, 9000)}...` : article.content;
  const { json, model } = await callGroqJson({
    system: DEEP_SYSTEM_PROMPT,
    user: `TODAY: ${utcDate()}\nCURRENT FACTS: ${process.env.CURRENT_CONTEXT || DEFAULT_CURRENT_CONTEXT}\nTITLE: ${article.title}\nSOURCE: ${article.source}\nPUBLISHED: ${article.publishDate || 'unknown'}\n\nARTICLE TEXT:\n${text}`,
    reasoningEffort: 'medium',
    maxTokens: 12000,
    usageTracker
  });

  const quoteStats = groundAnalysisQuotes(json, article.content);
  if (json.logic_score && Number.isFinite(json.logic_score.overall)) {
    json.logic_score.grade = letterGrade(json.logic_score.overall);
  }
  json.claim_verification = (json.claims_to_check || []).map((c) => ({
    claim: c.claim,
    quote: c.quote,
    why_it_matters: c.why_it_matters,
    verification_status: 'unverified',
    checked: false,
    notes: 'Not yet checked against outside sources.'
  }));
  json.metadata = { analyzed_at: new Date().toISOString(), model, analysis_version: ANALYSIS_VERSION, quotes: quoteStats };
  return json;
}

const FACTCHECK_SYSTEM_PROMPT = `You are a careful fact-checker for a media-literacy site. Check each quoted statement from a news article against independent sources.

Use browser_search at most 2 times in total and rely on the search result snippets; do not open pages.

Status rules:
- "supported": an independent source confirms the statement as worded.
- "contradicted": a source about the SAME event, study, or figure directly conflicts with it.
- "disputed": credible sources disagree with each other.
- "needs_context": the statement is accurate but missing context that changes its meaning, such as what a percentage is compared against, a timeframe, or a counter-claim.
- "unverified": no source found that addresses this specific statement.
Check the statement exactly as the article words it. Never mark it contradicted based on a different study or event, or on a paraphrase the article did not make. The article itself does not count as an independent source.

Reply with only a JSON object (not a tool call):
{"checks":[{"index":1,"status":"","explanation":"1-2 sentences on what the sources say, naming them","sources":[{"title":"","url":""}]}]}`;

const FACTCHECK_STATUS_MAP = {
  supported: 'verified',
  contradicted: 'false',
  disputed: 'disputed',
  needs_context: 'needs_context',
  unverified: 'unverified'
};

/** "bbc" for both bbc.co.uk and bbc.com, so an outlet's own pages are not counted as independent. */
function outletName(url) {
  try {
    const parts = new URL(url).hostname.replace(/^www\./, '').split('.');
    const secondLevel = ['co', 'com', 'org', 'net', 'gov', 'ac'];
    return parts.length >= 3 && secondLevel.includes(parts[parts.length - 2]) ? parts[parts.length - 3] : parts[parts.length - 2];
  } catch {
    return null;
  }
}

function stripCitationMarkers(text) {
  return String(text || '').replace(/【[^】]*】/g, '').replace(/\s+([.,;:])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

/** Checks the analysis' claims with web search and writes results into deep.claim_verification. */
export async function factCheckClaims(article, deep, usageTracker) {
  const claims = (deep.claim_verification || []).slice(0, 3);
  if (claims.length === 0) return deep;

  const model = process.env.GROQ_FACTCHECK_MODEL || 'openai/gpt-oss-20b';
  const { json } = await callGroqJson({
    system: FACTCHECK_SYSTEM_PROMPT,
    user: `ARTICLE: "${article.title}" (${article.source}, published ${article.publishDate || 'recently'})\n\nSTATEMENTS:\n${claims.map((c, i) => `${i + 1}. "${c.quote || c.claim}"`).join('\n')}`,
    model,
    tools: [{ type: 'browser_search' }],
    maxTokens: 6000,
    usageTracker
  });

  const ownOutlet = outletName(article.url);
  for (const check of json.checks || []) {
    const claim = claims[Number(check.index) - 1];
    if (!claim) continue;
    const sources = (check.sources || [])
      .filter((s) => /^https?:\/\//.test(s?.url || '') && outletName(s.url) !== ownOutlet)
      .map((s) => ({ title: stripCitationMarkers(s.title), url: s.url }))
      .slice(0, 3);
    const status = FACTCHECK_STATUS_MAP[check.status] || 'unverified';
    if (sources.length === 0 && status !== 'unverified') {
      claim.verification_status = 'unverified';
      claim.notes = 'The fact-checker found no independent source outside the original outlet.';
    } else {
      claim.verification_status = status;
      claim.notes = stripCitationMarkers(check.explanation) || claim.notes;
    }
    claim.sources = sources;
    claim.checked = true;
  }
  for (const claim of claims.filter((c) => !c.checked)) {
    claim.notes = 'The fact-checker found no independent source addressing this statement.';
    claim.checked = true;
  }
  deep.metadata.fact_checked_at = new Date().toISOString();
  deep.metadata.fact_check_model = model;
  return deep;
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

export async function compareCoverage(article, keywords, feedCache, usageTracker) {
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
      maxTokens: 6000,
      usageTracker
    }));
  } catch (error) {
    if (error instanceof DailyLimitError) throw error;
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
    tone_rating: deep.tone || 'Measured',
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

const MIN_TOPICS_TO_PUBLISH = 3;

/**
 * Builds or completes today's briefing. Safe to run several times a day: each
 * run only does work that is still missing, and stops a step for the rest of
 * the run when Groq reports that model's daily quota is used up.
 *
 * Blob layout:
 *   draft/YYYY-MM-DD     articles chosen for the day, so retries keep the same stories
 *   article/<title hash> deep analysis, fact-checks, and cross-source comparison
 *   day/YYYY-MM-DD       published briefing in the shape DailyBriefingPage expects
 *   meta/last-run        report from the most recent run
 */
export async function generateBriefing(store, { date = utcDate(), deadline = Date.now() + 13 * 60 * 1000 } = {}) {
  const usage = createUsageTracker();
  const analysisModel = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const factCheckModel = process.env.GROQ_FACTCHECK_MODEL || 'openai/gpt-oss-20b';
  const factCheckBudget = Number(process.env.FACTCHECK_TOKEN_BUDGET || 150000);
  const exhausted = new Set();
  const feedCache = new Map();
  const report = [];

  const published = await store.get(`day/${date}`, { type: 'json' });
  let draft = await store.get(`draft/${date}`, { type: 'json' });
  if (!draft) {
    draft = { date, topics: {} };
    for (const [key, topic] of Object.entries(published?.topics || {})) draft.topics[key] = topic.article;
  }
  const usedUrls = await recentlyUsedUrls(store, date);
  for (const article of Object.values(draft.topics)) usedUrls.add(article.url);

  for (const topic of TOPICS) {
    const entry = { topic: topic.key };
    report.push(entry);
    try {
      let article = draft.topics[topic.key];
      if (!article) {
        article = await pickArticleForTopic(topic, usedUrls);
        if (!article) {
          entry.status = 'no usable article';
          continue;
        }
        usedUrls.add(article.url);
        draft.topics[topic.key] = article;
        await store.setJSON(`draft/${date}`, draft);
      }
      entry.title = article.title;
      entry.source = article.source;

      const key = articleKey(article.title);
      const record = (await store.get(key, { type: 'json' })) || { date, title: article.title, url: article.url };

      if (record.deep?.metadata?.analysis_version !== ANALYSIS_VERSION) {
        if (exhausted.has(analysisModel) || Date.now() > deadline) {
          entry.pending = 'analysis';
          continue;
        }
        record.deep = await analyzeArticleDeep(article, usage);
        await store.setJSON(key, record);
      }
      entry.quotes = record.deep.metadata.quotes;

      if (!record.comparison && !exhausted.has(analysisModel) && Date.now() < deadline) {
        const storyKeywords = storyTokens(record.deep.search_keywords || []);
        const keywords = storyKeywords.length >= 2 ? storyKeywords : storyTokens([article.title]);
        record.comparison = await compareCoverage(article, keywords, feedCache, usage);
        await store.setJSON(key, record);
      }
      entry.relatedSources = record.comparison?.found ? record.comparison.related_sources.length : 0;

      const needsFactCheck = !record.deep.metadata.fact_checked_at && record.deep.claim_verification?.length > 0;
      if (needsFactCheck && !exhausted.has(factCheckModel) && usage.get(factCheckModel) < factCheckBudget && Date.now() < deadline) {
        try {
          await factCheckClaims(article, record.deep, usage);
          await store.setJSON(key, record);
        } catch (error) {
          if (error instanceof DailyLimitError) exhausted.add(factCheckModel);
          console.warn(`[briefing] Fact-check failed for ${topic.key}: ${error.message}`);
        }
      }
      entry.factChecked = Boolean(record.deep.metadata.fact_checked_at);
      if (!entry.factChecked && needsFactCheck) entry.pending = 'fact-check';
    } catch (error) {
      if (error instanceof DailyLimitError) {
        exhausted.add(analysisModel);
        entry.pending = 'analysis (daily limit)';
      } else {
        entry.error = error.message;
      }
    }
  }

  const topics = {};
  for (const topic of TOPICS) {
    const article = draft.topics[topic.key];
    if (!article) continue;
    const record = await store.get(articleKey(article.title), { type: 'json' });
    if (!record?.deep) continue;
    topics[topic.key] = { topic: topic.label, icon: topic.icon, article, analysis: toBriefingAnalysis(record.deep) };
  }

  const shouldPublish = Object.keys(topics).length >= MIN_TOPICS_TO_PUBLISH || (published && Object.keys(topics).length > 0);
  if (shouldPublish) {
    await store.setJSON(`day/${date}`, { generatedAt: new Date().toISOString(), version: ANALYSIS_VERSION, briefingDate: date, topics });
  }

  const summary = {
    date,
    finishedAt: new Date().toISOString(),
    published: shouldPublish,
    topicsPublished: Object.keys(topics).length,
    exhaustedModels: [...exhausted],
    tokens: usage.totals,
    report
  };
  await store.setJSON('meta/last-run', summary);
  return summary;
}
