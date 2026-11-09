import { callGroqJson, currentFacts } from './groq.mjs';
import { createQuoteGrounder, toClaimVerification } from './analysis.mjs';
import { extractArticle, fetchFeedItems, looksLikeFullArticle } from './sources.mjs';
import { tokenize } from './stories.mjs';

export const OPINION_VERSION = '1.0';

// Opinion sections, grouped by the side they generally argue from. Keep in sync
// with the outlet list on the methodology page (src/pages/MethodPage.tsx).
export const OPINION_FEEDS = {
  left: [
    { name: 'The Guardian Opinion', url: 'https://www.theguardian.com/commentisfree/rss' },
    { name: 'The Nation', url: 'https://www.thenation.com/feed/?post_type=article' },
    { name: 'The New Republic', url: 'https://newrepublic.com/rss.xml' }
  ],
  right: [
    { name: 'Fox News Opinion', url: 'https://moxie.foxnews.com/google-publisher/opinion.xml' },
    { name: 'New York Post Opinion', url: 'https://nypost.com/opinion/feed/' },
    { name: 'Washington Examiner Opinion', url: 'https://www.washingtonexaminer.com/section/opinion/feed/' },
    { name: 'The Federalist', url: 'https://thefederalist.com/feed/' }
  ]
};

const MAX_AGE_HOURS = 36;
const MAX_ATTEMPTS = 6;
// Shared words needed before a column is shown as being about one of the day's stories.
const RELATED_STORY_MIN_OVERLAP = 3;
const NOT_A_COLUMN = /^(transcript|podcast|video|watch|listen|newsletter|live)\b|\b(podcast|crossword|quiz)\b/i;

/** Distinctive words from today's stories, used to prefer columns about the day's news. */
export function storyVocabulary(stories) {
  return stories.map((story) => ({
    key: story.key,
    tokens: new Set(tokenize([story.label, story.article?.title, ...(story.related || []).map((r) => r.title)].join(' ')))
  }));
}

/** The story a column is most about, and how many distinctive words they share. */
export function relatedStory(item, vocabulary) {
  const tokens = new Set(tokenize(`${item.title} ${item.description}`));
  let best = { key: null, overlap: 0 };
  for (const story of vocabulary) {
    const overlap = [...tokens].filter((t) => story.tokens.has(t)).length;
    if (overlap > best.overlap) best = { key: story.key, overlap };
  }
  return best;
}

/**
 * One column per side: recent, full-length, preferring the one sharing the
 * most distinctive words with today's stories, then the newest.
 */
export async function pickOpinion(side, stories, usedUrls) {
  const cutoff = Date.now() - MAX_AGE_HOURS * 3600 * 1000;
  const vocabulary = storyVocabulary(stories);
  const items = (await Promise.all(OPINION_FEEDS[side].map((feed) => fetchFeedItems({ ...feed, lean: side })))).flat()
    .filter((item) => !usedUrls.has(item.link) && !NOT_A_COLUMN.test(item.title))
    .filter((item) => !item.publishDate || new Date(item.publishDate).getTime() >= cutoff)
    .map((item) => ({ item, ...relatedStory(item, vocabulary) }))
    .sort((a, b) => b.overlap - a.overlap || new Date(b.item.publishDate || 0) - new Date(a.item.publishDate || 0));

  for (const { item, key, overlap } of items.slice(0, MAX_ATTEMPTS)) {
    const extracted = await extractArticle(item.link);
    if (!extracted || !looksLikeFullArticle(extracted.text)) continue;
    // Some outlets append the byline to the headline: "Headline | Author Name".
    const byline = item.title.match(/ \| ([^|]+)$/);
    return {
      side,
      relatedStory: overlap >= RELATED_STORY_MIN_OVERLAP ? key : null,
      article: {
        title: byline ? item.title.slice(0, byline.index) : item.title,
        url: item.link,
        source: item.sourceName,
        lean: side,
        author: extracted.byline || byline?.[1] || item.author || undefined,
        publishDate: item.publishDate ? new Date(item.publishDate).toISOString() : null,
        content: extracted.text
      }
    };
  }
  return null;
}

const OPINION_SYSTEM_PROMPT = `You evaluate the quality of an opinion piece's argument for a media-literacy site. Judge how well the case is made, never whether you agree with it, and apply exactly the same standard to every viewpoint.

Return a JSON object:
{
  "thesis": "The author's central claim, in one neutral sentence",
  "argument_score": {
    "overall": 0-100,
    "evidence": 0-100,
    "logic": 0-100,
    "fairness": 0-100,
    "clarity": 0-100,
    "explanation": "Why, citing specifics from the piece"
  },
  "strengths": [
    { "point": "What the piece does well, specifically", "quote": "Exact passage from the piece" }
  ],
  "weaknesses": [
    { "type": "Name of the fallacy or rhetorical technique", "quote": "Exact passage from the piece", "explanation": "Why it weakens the argument", "fair_version": "How the point could be made fairly", "severity": "low | medium | high" }
  ],
  "strongest_counterargument": "The best case on the other side that the piece does not answer, stated fairly and in its strongest form",
  "claims_to_check": [
    { "claim": "Neutral paraphrase", "quote": "The exact sentence that makes the claim", "why_it_matters": "Why the argument depends on it" }
  ],
  "verdict": "Two sentences: how well-made is this argument, whatever a reader thinks of its conclusion?"
}

Rules:
1. Output only valid JSON.
2. Every "quote" must be copied character-for-character from the piece, without adding quotation marks.
3. Strengths must be real and specific: credit sound evidence, honest concessions, precise claims, and clear reasoning. List one to three.
4. List weaknesses only when they genuinely weaken the argument. Zero is valid; never pad.
5. Advocacy is the purpose of an opinion piece and is not itself a flaw. Score evidence, logic, fairness to opponents, and clarity.
6. Calibrate: 90-100 rigorous, well-evidenced, fair to opponents; 70-89 solid with gaps; 50-69 notable gaps or unfair characterizations; below 50 mostly rhetoric.
7. "claims_to_check" holds one to three factual statements about things that already happened that the argument relies on; never opinions or predictions.
8. Take recent facts only from the piece or CURRENT FACTS, not from memory.`;

export async function analyzeOpinion(article, ai) {
  const text = article.content.length > 9000 ? `${article.content.slice(0, 9000)}...` : article.content;
  const { json, model } = await callGroqJson({
    system: OPINION_SYSTEM_PROMPT,
    user: `CURRENT FACTS: ${currentFacts()}\nTITLE: ${article.title}\nOUTLET: ${article.source}\nAUTHOR: ${article.author || 'unknown'}\nPUBLISHED: ${article.publishDate || 'unknown'}\n\nTEXT:\n${text}`,
    reasoningEffort: 'medium',
    maxTokens: 10000,
    ai
  });

  const { groundList, stats } = createQuoteGrounder(article.content);
  json.strengths = groundList(json.strengths);
  json.weaknesses = groundList(json.weaknesses);
  json.claim_verification = toClaimVerification(groundList(json.claims_to_check));
  delete json.claims_to_check;
  json.metadata = { analyzed_at: new Date().toISOString(), model, opinion_version: OPINION_VERSION, quotes: stats };
  return json;
}

/** The part of an opinion analysis published in the daily briefing. */
export function toBriefingOpinion(pick, analysis) {
  return {
    side: pick.side,
    relatedStory: pick.relatedStory,
    article: pick.article,
    thesis: analysis.thesis,
    argumentScore: analysis.argument_score,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    strongestCounterargument: analysis.strongest_counterargument,
    claims: analysis.claim_verification,
    verdict: analysis.verdict
  };
}
