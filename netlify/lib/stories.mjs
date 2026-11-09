import { callGroqJson, currentFacts, DailyLimitError } from './groq.mjs';
import { FEEDS, fetchFeedItems, isOpinionPiece } from './sources.mjs';

export const STORIES_PER_DAY = 5;
const MAX_HEADLINE_AGE_HOURS = 36;
const CLUSTER_SIMILARITY = 0.3;
const CLUSTERS_FOR_EDITOR = 40;
const STORY_KEY = /^[a-z0-9]+(-[a-z0-9]+){0,6}$/;

const STOPWORDS = new Set(`
a about above after again against ago all also amid an and another any are around as at back be been before being
between both but by can could day days did does doing down during each even every few for from further get gets
had has have having he her here hers him his how i if in into is it its just last latest least like live make
many may me more most much must my new news no nor not now of off on once one only or other our out over own
people report reports said same say says see she should since so some still such take than that the their them
then there these they this those through to today too top two under until up update updates us very video
videos via was watch way we were what when where which while who whom why will with would year years yet you your
week weeks month months monday tuesday wednesday thursday friday saturday sunday first three four five
`.split(/\s+/).filter(Boolean));

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .split(/[^a-z0-9']+/)
    .map((t) => t.replace(/'s$/, '').replace(/'/g, ''))
    .map((t) => (t.length > 4 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function addTo(target, vector, scale = 1) {
  for (const [token, weight] of vector) target.set(token, (target.get(token) || 0) + weight * scale);
}

function cosine(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [token, weight] of a) {
    normA += weight * weight;
    const other = b.get(token);
    if (other) dot += weight * other;
  }
  for (const weight of b.values()) normB += weight * weight;
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

/**
 * Groups headlines about the same story. Each item is compared with cluster
 * centroids (not individual items) so unrelated stories do not chain together.
 * Tokens are weighted by rarity across the day's headlines.
 */
export function clusterHeadlines(items) {
  const docs = items.map((item) => {
    const titleTokens = tokenize(item.title);
    const descriptionTokens = tokenize(item.description).slice(0, 30);
    return { item, titleTokens, tokens: new Set([...titleTokens, ...descriptionTokens]), descriptionTokens };
  });

  const df = new Map();
  for (const doc of docs) for (const token of doc.tokens) df.set(token, (df.get(token) || 0) + 1);
  const idf = (token) => Math.log((docs.length + 1) / (df.get(token) || 1));

  for (const doc of docs) {
    const vector = new Map();
    for (const token of doc.titleTokens) vector.set(token, (vector.get(token) || 0) + 2 * idf(token));
    for (const token of doc.descriptionTokens) vector.set(token, (vector.get(token) || 0) + idf(token));
    doc.vector = vector;
  }

  const clusters = [];
  for (const doc of docs) {
    let best = null;
    for (const cluster of clusters) {
      const similarity = cosine(doc.vector, cluster.centroid);
      if (similarity >= CLUSTER_SIMILARITY && (!best || similarity > best.similarity)) best = { cluster, similarity };
    }
    if (best) {
      best.cluster.items.push(doc.item);
      addTo(best.cluster.centroid, doc.vector);
    } else {
      clusters.push({ items: [doc.item], centroid: new Map(doc.vector) });
    }
  }

  return clusters.map((cluster) => {
    const outlets = [...new Set(cluster.items.map((i) => i.sourceName))];
    const leans = [...new Set(cluster.items.map((i) => i.lean))];
    const newest = Math.max(...cluster.items.map((i) => new Date(i.publishDate || 0).getTime()));
    const topTokens = [...cluster.centroid.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
    return { items: cluster.items, outlets, leans, newest, topTokens, score: outlets.length + 0.5 * leans.length };
  }).sort((a, b) => b.score - a.score || b.newest - a.newest);
}

/** Recent, non-opinion headlines from every feed, de-duplicated by link and title. */
export async function gatherHeadlines() {
  const cutoff = Date.now() - MAX_HEADLINE_AGE_HOURS * 3600 * 1000;
  const results = await Promise.all(FEEDS.map(fetchFeedItems));
  const seenLinks = new Set();
  const seenTitles = new Set();
  const items = [];
  for (const item of results.flat()) {
    const titleKey = item.title.toLowerCase().replace(/\W+/g, ' ').trim();
    if (seenLinks.has(item.link) || seenTitles.has(titleKey)) continue;
    if (isOpinionPiece(item)) continue;
    if (item.publishDate && new Date(item.publishDate).getTime() < cutoff) continue;
    seenLinks.add(item.link);
    seenTitles.add(titleKey);
    items.push(item);
  }
  return items;
}

const EDITOR_SYSTEM_PROMPT = `You are the front-page editor of The Daily Authentic, a daily media-literacy briefing. From today's headline clusters, choose the ${STORIES_PER_DAY} most important stories for a general reader in the US and abroad.

Return a JSON object:
{
  "stories": [
    {
      "clusters": [1, 7],
      "key": "lowercase-hyphenated-story-key",
      "label": "2-5 word name of the ongoing story",
      "category": "World | U.S. Politics | Economy | Health & Science | Technology | Justice | Climate | Conflict",
      "continues": "key from EXISTING STORIES, or null",
      "why_today": "One sentence: what happened in the last day and why it matters, based only on the headlines"
    }
  ]
}

Rules:
- Choose ${STORIES_PER_DAY} different subjects, ordered by importance. Never two stories about the same event.
- Strongly prefer stories covered by 4 or more outlets across the spectrum; each cluster lists its outlets and their leans. Choose a cluster with fewer than 3 outlets only if it is clearly more consequential than the better-covered alternatives.
- Prefer consequential news: government, conflict, the economy, public health, science, courts, major disasters. Skip sports results, celebrity, entertainment, lifestyle, product news, and opinion unless it is the day's dominant story.
- List several cluster ids when clusters are clearly the same story.
- If a story continues one in EXISTING STORIES, set "continues" and "key" to that story's key. Otherwise create a stable key that names the ongoing story rather than today's event (e.g. "russia-ukraine-war", "us-government-shutdown"), at most 5 words.
- "label" names the ongoing story (e.g. "Russia–Ukraine War"), not today's headline.`;

/** Coverage-ranked picks, used when the editor is unavailable or returns too few stories. */
function fallbackSelection(clusters, minOutlets = 1) {
  return clusters
    .map((cluster, index) => ({ cluster, index }))
    .filter(({ cluster }) => cluster.outlets.length >= minOutlets)
    .slice(0, STORIES_PER_DAY * 2)
    .map(({ cluster, index }) => ({
      clusterIndexes: [index],
      key: cluster.topTokens.slice(0, 3).join('-') || `story-${index + 1}`,
      label: cluster.items[0].title.split(/\s+/).slice(0, 6).join(' '),
      category: 'News',
      continues: null,
      why: cluster.items[0].description.split(/(?<=[.!?])\s/)[0] || cluster.items[0].title
    }));
}

/**
 * Picks the day's stories: headline clusters ranked by cross-outlet coverage,
 * then an editorial pass that chooses, names, and links them to earlier stories.
 */
export async function selectStories(storyIndex, ai, { date }) {
  const items = await gatherHeadlines();
  const clusters = clusterHeadlines(items).filter((c) => c.outlets.length >= 2).slice(0, CLUSTERS_FOR_EDITOR);
  if (clusters.length === 0) throw new Error(`No multi-outlet stories found among ${items.length} headlines`);

  const existing = Object.entries(storyIndex)
    .filter(([, s]) => s.last_date && (new Date(date) - new Date(s.last_date)) / 86400000 <= 30)
    .map(([key, s]) => `- ${key}: ${s.label} (last covered ${s.last_date}: ${s.last_headline})`);
  const clusterLines = clusters.map((c, i) =>
    `[${i + 1}] ${c.outlets.length} outlets: ${c.outlets.join(', ')} (leans: ${c.leans.join(', ')})\n    ${c.items.slice(0, 3).map((it) => it.title).join(' / ')}`
  );

  let picks;
  try {
    const { json } = await callGroqJson({
      system: EDITOR_SYSTEM_PROMPT,
      user: `TODAY: ${date}\nCURRENT FACTS: ${currentFacts()}\n\nEXISTING STORIES:\n${existing.join('\n') || '(none yet)'}\n\nCLUSTERS:\n${clusterLines.join('\n')}`,
      maxTokens: 4000,
      ai
    });
    picks = (json.stories || []).map((s) => ({
      clusterIndexes: (s.clusters || []).map((n) => Number(n) - 1).filter((n) => Number.isInteger(n) && clusters[n]),
      key: storyIndex[s.continues] ? s.continues : String(s.key || '').toLowerCase(),
      label: String(s.label || '').trim(),
      category: String(s.category || 'World').trim(),
      continues: storyIndex[s.continues] ? s.continues : null,
      why: String(s.why_today || '').trim()
    }));
  } catch (error) {
    if (!(error instanceof DailyLimitError)) console.warn(`[briefing] Story selection failed, using coverage ranking: ${error.message}`);
    picks = fallbackSelection(clusters);
  }

  // The editor's picks first, then the best-covered remaining clusters if it
  // returned too few. Comparisons need breadth, so at most one thinly covered
  // story (fewer than 3 outlets) is allowed.
  const fallbackPicks = fallbackSelection(clusters, 3);
  const usedClusters = new Set();
  const usedKeys = new Set();
  const stories = [];
  let thinStories = 0;
  for (const pick of [...picks, ...fallbackPicks]) {
    const indexes = pick.clusterIndexes.filter((n) => !usedClusters.has(n));
    if (indexes.length === 0 || !STORY_KEY.test(pick.key) || usedKeys.has(pick.key) || !pick.label) continue;
    const storyItems = indexes.flatMap((n) => clusters[n].items);
    const outlets = [...new Set(storyItems.map((i) => i.sourceName))];
    if (outlets.length < 3 && thinStories >= 1) continue;
    if (outlets.length < 3) thinStories++;
    indexes.forEach((n) => usedClusters.add(n));
    usedKeys.add(pick.key);
    stories.push({
      key: pick.key,
      label: pick.label,
      category: pick.category,
      continues: pick.continues,
      why: pick.why,
      items: storyItems,
      outlets,
      leans: [...new Set(storyItems.map((i) => i.lean))]
    });
    if (stories.length === STORIES_PER_DAY) break;
  }
  const outletCount = new Set(items.map((i) => i.sourceName)).size;
  return { stories, headlineCount: items.length, clusterCount: clusters.length, outletCount };
}
