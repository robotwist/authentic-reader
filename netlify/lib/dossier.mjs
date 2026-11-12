import { callGroqJson, currentFacts } from './groq.mjs';
import { outletName, SYNDICATORS } from './sources.mjs';

// ---------------------------------------------------------------------------
// Topic dossiers ("The Story So Far"): knowledge that accumulates across days.
// The timeline and confirmed facts are copied deterministically from stored
// analyses; only the narrative, open questions, and framing patterns are
// synthesized, and only from the dossier and the day's analysis.
// ---------------------------------------------------------------------------

const MAX_TIMELINE_ENTRIES = 120;
const MAX_CONFIRMED_FACTS = 30;

const DOSSIER_SYSTEM_PROMPT = `You maintain the running "story so far" file for one news story on a media-literacy site. You receive the current file and today's analyzed article. Update the file using ONLY that material, never outside knowledge.

Return a JSON object:
{
  "narrative": "4-6 plain sentences for a reader catching up: how the story has developed across the dated entries, naming dates in the form Nov 9. If the entries cover different stories, describe the main threads separately instead of forcing one narrative.",
  "open_questions": [
    { "question": "", "raised": "YYYY-MM-DD", "status": "open | answered", "answer": "Short answer from today's article, or empty string", "answered_on": "YYYY-MM-DD or empty string" }
  ],
  "framing_patterns": [
    { "source": "Outlet name", "pattern": "How this outlet has tended to frame the topic, based only on the comparisons provided" }
  ]
}

Rules:
- Carry existing open questions forward unchanged unless today's article answers them; then set status "answered" with the answer and today's date.
- Add at most 3 new open questions, taken from today's unanswered questions, and keep at most 8 open questions in total (drop the oldest open ones first). Keep answered questions for the record.
- Keep framing patterns only for outlets that appear in the comparisons, refining existing patterns with today's evidence.
- Be plain and factual. No speculation.
- Keep every figure exactly as reported, including what it is compared against (e.g. "compared with unvaccinated people"). If the source material is unclear about a comparison, leave the figure out.
- Attribute claims to their source ("The Guardian reported...", "officials said...") rather than stating them as settled fact.`;

export async function loadDossier(store, storyKey) {
  return (await store.get(`dossier/${storyKey}`, { type: 'json' })) || {
    topic: storyKey,
    label: null,
    category: null,
    timeline: [],
    confirmed_facts: [],
    open_questions: [],
    framing_patterns: [],
    narrative: null,
    synthesized_through: null,
    updated_at: null
  };
}

/** Adds the day's article and any independently confirmed claims. Idempotent. */
export function addArticleToDossier(dossier, date, article, deep) {
  const existing = dossier.timeline.find((entry) => entry.url === article.url);
  const entry = {
    date,
    headline: article.title,
    summary: deep?.executive_summary?.one_sentence || '',
    source: article.source,
    url: article.url
  };
  if (existing) Object.assign(existing, entry);
  else dossier.timeline.push(entry);
  dossier.timeline.sort((a, b) => b.date.localeCompare(a.date));
  dossier.timeline = dossier.timeline.slice(0, MAX_TIMELINE_ENTRIES);

  for (const claim of deep?.claim_verification || []) {
    const sources = (claim.sources || []).filter((s) => !SYNDICATORS.has(outletName(s.url)));
    if (claim.verification_status !== 'verified' || sources.length === 0) continue;
    if (dossier.confirmed_facts.some((fact) => fact.quote === claim.quote)) continue;
    dossier.confirmed_facts.unshift({
      fact: claim.claim,
      quote: claim.quote,
      date,
      source: article.source,
      article_url: article.url,
      sources
    });
  }
  dossier.confirmed_facts = dossier.confirmed_facts.slice(0, MAX_CONFIRMED_FACTS);
}

/** Archive excerpt passed to the analysis prompt; excludes the article being analyzed. */
export function dossierContext(dossier, excludeUrl) {
  const timeline = dossier.timeline.filter((entry) => entry.url !== excludeUrl).slice(0, 10);
  if (timeline.length === 0) return '';
  const lines = ['OUR ARCHIVE ON THIS TOPIC (earlier briefings on this site):'];
  if (dossier.narrative) lines.push(`Story so far: ${dossier.narrative}`);
  lines.push('Timeline:', ...timeline.map((e) => `- ${e.date} (${e.source}): ${e.headline}. ${e.summary}`));
  const facts = dossier.confirmed_facts.filter((f) => f.article_url !== excludeUrl).slice(0, 8);
  if (facts.length > 0) {
    lines.push('Independently confirmed earlier:', ...facts.map((f) => `- ${f.date}: ${f.fact} (sources: ${f.sources.map((s) => s.title || s.url).join('; ')})`));
  }
  return lines.join('\n');
}

export async function synthesizeDossier(dossier, date, article, record, ai) {
  const deep = record.deep;
  const comparison = record.comparison?.found ? record.comparison.comparison_analysis : null;
  const current = {
    narrative: dossier.narrative,
    open_questions: dossier.open_questions,
    framing_patterns: dossier.framing_patterns,
    timeline: dossier.timeline.slice(0, 12).map((e) => `${e.date} (${e.source}): ${e.headline}. ${e.summary}`)
  };
  const today = {
    date,
    headline: article.title,
    source: article.source,
    summary: deep.executive_summary,
    unanswered_questions: deep.missing_context?.questions_unanswered || [],
    comparison: comparison ? {
      framing: (comparison.framing_comparison || []).map((f) => ({ source: f.source, headline_framing: f.headline_framing, emphasis: f.emphasis, downplayed: f.downplayed })),
      language_differences: comparison.language_differences || []
    } : 'No other outlets covered this story today.'
  };

  const { json } = await callGroqJson({
    system: DOSSIER_SYSTEM_PROMPT,
    user: `CURRENT FACTS: ${currentFacts()}\n\nCURRENT FILE:\n${JSON.stringify(current, null, 1)}\n\nTODAY'S ANALYZED ARTICLE:\n${JSON.stringify(today, null, 1)}`,
    maxTokens: 4000,
    ai
  });

  if (typeof json.narrative === 'string' && json.narrative.trim()) dossier.narrative = json.narrative.trim();
  if (Array.isArray(json.open_questions)) {
    const answered = json.open_questions.filter((q) => q.status === 'answered');
    const open = json.open_questions.filter((q) => q.status !== 'answered').slice(0, 8);
    dossier.open_questions = [...open, ...answered].filter((q) => q.question);
  }
  if (Array.isArray(json.framing_patterns)) dossier.framing_patterns = json.framing_patterns.filter((p) => p.source && p.pattern);
  dossier.synthesized_through = date;
}


/** Days on which the story appeared in the briefing. */
export function coverageDays(dossier) {
  return new Set(dossier.timeline.map((entry) => entry.date)).size;
}

/**
 * Compact index of every story with a dossier, read by the daily story
 * selection so continuing stories keep their key and record.
 */
export async function updateStoryIndex(store, storyKey, dossier) {
  const index = (await store.get('meta/stories-index', { type: 'json' })) || {};
  const latest = dossier.timeline[0];
  index[storyKey] = {
    label: dossier.label || latest?.headline || storyKey,
    category: dossier.category || null,
    last_date: latest?.date || null,
    last_headline: latest?.headline || null,
    days: coverageDays(dossier)
  };
  await store.setJSON('meta/stories-index', index);
}
