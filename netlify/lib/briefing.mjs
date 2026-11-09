import { createAiContext, DailyLimitError } from './groq.mjs';
import { articleKey, extractArticle, looksLikeFullArticle, utcDate } from './sources.mjs';
import { ANALYSIS_VERSION, analyzeArticleDeep, compareCoverage, factCheckClaims, toBriefingAnalysis } from './analysis.mjs';
import { addArticleToDossier, coverageDays, dossierContext, loadDossier, synthesizeDossier, updateStoryIndex } from './dossier.mjs';
import { selectStories } from './stories.mjs';
import { analyzeOpinion, OPINION_VERSION, pickOpinion, toBriefingOpinion } from './opinion.mjs';

export { articleKey, utcDate } from './sources.mjs';
export { toLegacyAnalysis } from './analysis.mjs';

const BRIEFING_VERSION = '5.0';
const MIN_STORIES_TO_PUBLISH = 3;
const RECENT_DAYS_TO_SKIP = 3;
const MIN_FALLBACK_ARTICLE_CHARS = 700;
const MAX_PRIMARY_ATTEMPTS = 6;
const MAX_RELATED = 4;
const OPINION_SIDES = ['left', 'right'];

// The analyzed article comes from the most neutral outlet that has a full text;
// the comparison then shows how the rest of the spectrum covered it.
const PRIMARY_LEAN_ORDER = ['center', 'international', 'center-left', 'right', 'left'];
const ROUNDUP = /biggest news|what to know|live updates?|newsletter|morning brief|week in review|recap/i;

// Labels for briefings created before stories replaced fixed topics.
const LEGACY_TOPICS = {
  ukraine: { label: 'Ukraine', category: 'Conflict' },
  gaza: { label: 'Gaza', category: 'Conflict' },
  diseases: { label: 'Public Health', category: 'Health & Science' },
  epstein: { label: 'Justice', category: 'Justice' },
  trump: { label: 'Economy', category: 'Economy' }
};

async function recentlyUsedUrls(store, today) {
  const { blobs } = await store.list({ prefix: 'day/' });
  const recentKeys = blobs.map((b) => b.key).filter((k) => k !== `day/${today}`).sort().slice(-RECENT_DAYS_TO_SKIP);
  const urls = new Set();
  for (const key of recentKeys) {
    const day = await store.get(key, { type: 'json' });
    for (const item of [...Object.values(day?.topics || {}), ...Object.values(day?.opinions || {})]) {
      if (item?.article?.url) urls.add(item.article.url);
    }
  }
  return urls;
}

function toArticle(item, extracted) {
  const text = extracted?.text && extracted.text.length > (item.content || '').length ? extracted.text : (item.content || '');
  return {
    title: item.title,
    url: item.link,
    source: item.sourceName,
    lean: item.lean,
    publishDate: item.publishDate ? new Date(item.publishDate).toISOString() : null,
    author: extracted?.byline || item.author || undefined,
    content: text
  };
}

async function choosePrimaryArticle(story, usedUrls) {
  const candidates = story.items
    .filter((item) => !usedUrls.has(item.link) && !ROUNDUP.test(item.title))
    .sort((a, b) =>
      PRIMARY_LEAN_ORDER.indexOf(a.lean) - PRIMARY_LEAN_ORDER.indexOf(b.lean) ||
      new Date(b.publishDate || 0) - new Date(a.publishDate || 0));

  let fallback = null;
  for (const item of candidates.slice(0, MAX_PRIMARY_ATTEMPTS)) {
    const article = toArticle(item, await extractArticle(item.link));
    if (looksLikeFullArticle(article.content)) return article;
    if (article.content.length >= MIN_FALLBACK_ARTICLE_CHARS && (!fallback || article.content.length > fallback.content.length)) fallback = article;
  }
  return fallback;
}

/** Up to MAX_RELATED other outlets, spreading across leans before repeating one. */
function chooseRelated(story, primary) {
  const byOutlet = new Map();
  for (const item of story.items) {
    if (item.sourceName === primary.source || item.link === primary.url || ROUNDUP.test(item.title)) continue;
    if (!byOutlet.has(item.sourceName)) byOutlet.set(item.sourceName, item);
  }
  const byLean = new Map();
  for (const item of byOutlet.values()) {
    if (!byLean.has(item.lean)) byLean.set(item.lean, []);
    byLean.get(item.lean).push(item);
  }
  const picked = [];
  while (picked.length < MAX_RELATED && [...byLean.values()].some((list) => list.length)) {
    for (const list of byLean.values()) {
      if (list.length && picked.length < MAX_RELATED) picked.push(list.shift());
    }
  }
  return picked.map((item) => ({ name: item.sourceName, lean: item.lean, title: item.title, url: item.link, description: item.description, content: item.content }));
}

/** Older drafts stored one article per fixed topic; normalize them to the story shape. */
function normalizeDraft(draft, published) {
  if (draft?.stories) return draft;
  const topics = draft?.topics || Object.fromEntries(Object.entries(published?.topics || {}).map(([k, t]) => [k, t.article]));
  if (Object.keys(topics).length === 0) return null;
  const stories = {};
  for (const [key, article] of Object.entries(topics)) {
    stories[key] = { label: LEGACY_TOPICS[key]?.label || key, category: LEGACY_TOPICS[key]?.category || 'News', why: '', article, related: [], outlets: [article.source], leans: [] };
  }
  return { date: draft?.date || published?.briefingDate, version: 2, order: Object.keys(stories), stories };
}

async function createDraft(run, date) {
  const { store, ai } = run;
  const storyIndex = (await store.get('meta/stories-index', { type: 'json' })) || {};
  const usedUrls = await recentlyUsedUrls(store, date);
  const { stories, headlineCount, clusterCount, outletCount } = await selectStories(storyIndex, ai, { date });

  const draft = { date, version: 2, order: [], stories: {}, selection: { headlineCount, clusterCount, outletCount, selectedAt: new Date().toISOString() } };
  for (const story of stories) {
    const article = await choosePrimaryArticle(story, usedUrls);
    if (!article) continue;
    usedUrls.add(article.url);
    draft.order.push(story.key);
    draft.stories[story.key] = {
      label: story.label,
      category: story.category,
      why: story.why,
      continues: story.continues,
      outlets: story.outlets,
      leans: story.leans,
      article,
      related: chooseRelated(story, article)
    };
  }
  if (draft.order.length > 0) await store.setJSON(`draft/${date}`, draft);
  return draft;
}

/**
 * Builds or completes the briefing. Safe to run several times a day: each run
 * first finishes anything still pending from yesterday, then works on today,
 * only doing steps that are missing. When a model's daily Groq quota runs out
 * the next model in the chain is used; when every model is out, the step waits
 * for the next run.
 *
 * Blob layout:
 *   draft/YYYY-MM-DD      the day's chosen stories, articles, and comparison candidates
 *   article/<title hash>  deep analysis, fact-checks, and cross-source comparison
 *   day/YYYY-MM-DD        published briefing in the shape DailyBriefingPage expects
 *   dossier/<story key>   "The Story So Far": timeline, confirmed facts, open questions
 *   meta/stories-index    every story with a dossier, for continuity across days
 *   meta/last-run         report from the most recent run
 */
export async function generateBriefing(store, { date = utcDate(), deadline = Date.now() + 13 * 60 * 1000 } = {}) {
  const run = { store, deadline, ai: createAiContext() };

  const days = [];
  const yesterday = utcDate(new Date(new Date(`${date}T12:00:00Z`).getTime() - 24 * 3600 * 1000));
  if ((await store.get(`draft/${yesterday}`, { type: 'json' })) || (await store.get(`day/${yesterday}`, { type: 'json' }))) {
    days.push(await processDay(run, yesterday, { createIfMissing: false }));
  }
  days.push(await processDay(run, date, { createIfMissing: true }));

  const summary = {
    date,
    finishedAt: new Date().toISOString(),
    exhaustedModels: [...run.ai.exhausted],
    tokens: run.ai.tokens,
    days
  };
  await store.setJSON('meta/last-run', summary);
  return summary;
}

async function processDay(run, date, { createIfMissing }) {
  const { store, ai } = run;
  const hasTime = () => Date.now() < run.deadline;
  const report = {};

  const published = await store.get(`day/${date}`, { type: 'json' });
  let draft = normalizeDraft(await store.get(`draft/${date}`, { type: 'json' }), published);
  if (!draft && createIfMissing) {
    try {
      draft = await createDraft(run, date);
    } catch (error) {
      return { date, published: false, error: `Story selection failed: ${error.message}` };
    }
  }
  if (!draft || draft.order.length === 0) return { date, published: false, error: 'No stories' };

  const records = {};
  for (const key of draft.order) {
    const story = draft.stories[key];
    report[key] = { label: story.label, source: story.article.source };
    records[key] = (await store.get(articleKey(story.article.title), { type: 'json' })) || { date, title: story.article.title, url: story.article.url };
  }
  const save = (key) => store.setJSON(articleKey(draft.stories[key].article.title), records[key]);

  // Opinion columns are chosen after the stories so they can be matched to them.
  if (createIfMissing && !draft.opinions && hasTime()) {
    const usedUrls = await recentlyUsedUrls(store, date);
    const stories = draft.order.map((key) => ({ key, ...draft.stories[key] }));
    draft.opinions = {};
    for (const side of OPINION_SIDES) {
      try {
        draft.opinions[side] = await pickOpinion(side, stories, usedUrls);
      } catch (error) {
        console.warn(`[briefing] Opinion selection failed for ${side}: ${error.message}`);
        draft.opinions[side] = null;
      }
    }
    await store.setJSON(`draft/${date}`, draft);
  }
  const opinionRecords = {};
  for (const [side, pick] of Object.entries(draft.opinions || {})) {
    if (!pick) continue;
    report[`opinion-${side}`] = { source: pick.article.source };
    opinionRecords[side] = (await store.get(articleKey(pick.article.title), { type: 'json' })) || { date, title: pick.article.title, url: pick.article.url, kind: 'opinion' };
  }
  const saveOpinion = (side) => store.setJSON(articleKey(draft.opinions[side].article.title), opinionRecords[side]);

  // Pass 1: analysis and comparison for every story, so the core briefing is
  // complete before quota is spent on fact-checks.
  for (const key of draft.order) {
    const story = draft.stories[key];
    const record = records[key];
    try {
      if (record.deep?.metadata?.analysis_version !== ANALYSIS_VERSION) {
        if (!ai.canUse(ai.analysisModels) || !hasTime()) {
          report[key].pending = 'analysis';
          continue;
        }
        const dossier = await loadDossier(store, key);
        record.deep = await analyzeArticleDeep(story.article, ai, dossierContext(dossier, story.article.url));
        await save(key);
      }
      if (!record.comparison && story.related.length > 0 && ai.canUse(ai.analysisModels) && hasTime()) {
        const comparison = await compareCoverage(story.article, story.related, ai);
        if (comparison) {
          record.comparison = comparison;
          await save(key);
        }
      }
    } catch (error) {
      report[key].pending = error instanceof DailyLimitError ? 'analysis (daily limit)' : undefined;
      if (!(error instanceof DailyLimitError)) report[key].error = error.message;
    }
    report[key].model = record.deep?.metadata?.model;
    report[key].relatedSources = record.comparison?.found ? record.comparison.related_sources.length : 0;
  }

  // Pass 1b: opinion columns, after the stories.
  for (const [side, record] of Object.entries(opinionRecords)) {
    const entry = report[`opinion-${side}`];
    if (record.opinion?.metadata?.opinion_version !== OPINION_VERSION) {
      if (!ai.canUse(ai.analysisModels) || !hasTime()) {
        entry.pending = 'analysis';
        continue;
      }
      try {
        record.opinion = await analyzeOpinion(draft.opinions[side].article, ai);
        await saveOpinion(side);
      } catch (error) {
        entry.pending = error instanceof DailyLimitError ? 'analysis (daily limit)' : undefined;
        if (!(error instanceof DailyLimitError)) entry.error = error.message;
      }
    }
    entry.score = record.opinion?.argument_score?.overall;
  }

  // Pass 2: web-searched fact-checks.
  for (const key of draft.order) {
    const record = records[key];
    const needsFactCheck = record.deep && !record.deep.metadata.fact_checked_at && record.deep.claim_verification?.length > 0;
    if (needsFactCheck && ai.canUse(ai.searchModels) && hasTime()) {
      try {
        await factCheckClaims(draft.stories[key].article, record.deep, ai);
        await save(key);
      } catch (error) {
        console.warn(`[briefing] Fact-check failed for ${key}: ${error.message}`);
      }
    }
    report[key].factChecked = Boolean(record.deep?.metadata?.fact_checked_at);
    if (needsFactCheck && !report[key].factChecked) report[key].pending = report[key].pending || 'fact-check';
  }

  // Pass 2b: fact-checks for opinion columns, after the stories'.
  for (const [side, record] of Object.entries(opinionRecords)) {
    const needsFactCheck = record.opinion && !record.opinion.metadata.fact_checked_at && record.opinion.claim_verification?.length > 0;
    if (needsFactCheck && ai.canUse(ai.searchModels) && hasTime()) {
      try {
        await factCheckClaims(draft.opinions[side].article, record.opinion, ai);
        await saveOpinion(side);
      } catch (error) {
        console.warn(`[briefing] Fact-check failed for opinion-${side}: ${error.message}`);
      }
    }
    report[`opinion-${side}`].factChecked = Boolean(record.opinion?.metadata?.fact_checked_at);
  }

  // Pass 3: fold the day into each story's running record.
  const dayCounts = {};
  for (const key of draft.order) {
    const story = draft.stories[key];
    const record = records[key];
    if (!record.deep) continue;
    const dossier = await loadDossier(store, key);
    dossier.label = story.label;
    dossier.category = story.category;
    addArticleToDossier(dossier, date, story.article, record.deep);
    const needsSynthesis = !dossier.synthesized_through || dossier.synthesized_through < date;
    if (needsSynthesis && ai.canUse(ai.analysisModels) && hasTime()) {
      try {
        await synthesizeDossier(dossier, date, story.article, record, ai);
      } catch (error) {
        console.warn(`[briefing] Story-so-far update failed for ${key}: ${error.message}`);
      }
    }
    dossier.updated_at = new Date().toISOString();
    await store.setJSON(`dossier/${key}`, dossier);
    await updateStoryIndex(store, key, dossier);
    dayCounts[key] = coverageDays(dossier);
    report[key].storyUpdated = dossier.synthesized_through === date;
  }

  const topics = {};
  const order = [];
  for (const key of draft.order) {
    const story = draft.stories[key];
    const record = records[key];
    if (!record.deep) continue;
    order.push(key);
    topics[key] = {
      topic: story.label,
      category: story.category,
      why: story.why,
      article: story.article,
      analysis: toBriefingAnalysis(record.deep),
      outlets: story.outlets,
      leans: story.leans,
      dayCount: dayCounts[key] || 1
    };
  }

  const opinions = {};
  for (const [side, record] of Object.entries(opinionRecords)) {
    if (record.opinion) opinions[side] = toBriefingOpinion(draft.opinions[side], record.opinion);
  }

  const shouldPublish = order.length >= MIN_STORIES_TO_PUBLISH || (published && order.length > 0);
  if (shouldPublish) {
    await store.setJSON(`day/${date}`, {
      generatedAt: new Date().toISOString(),
      version: BRIEFING_VERSION,
      briefingDate: date,
      selection: draft.selection || null,
      order,
      topics,
      opinions
    });
  }

  return { date, published: shouldPublish, storiesPublished: order.length, storiesPlanned: draft.order.length, report };
}
