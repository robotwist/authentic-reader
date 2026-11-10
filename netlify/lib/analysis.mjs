import { callGroqJson, currentFacts, DailyLimitError } from './groq.mjs';
import { extractArticle, outletName, SYNDICATORS, utcDate } from './sources.mjs';

export const ANALYSIS_VERSION = '4.0';


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
  "sharpest_point": {
    "finding": "The single most important thing a critical reader should notice about how this article is written, in one plain sentence. If the article is careful, say what it does well instead.",
    "quote": "The exact passage the finding rests on, or an empty string",
    "kind": "framing | omission | sourcing | logic | headline | numbers | none"
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
  }
}

Rules:
1. Output only valid JSON.
2. Every "quote" must be copied character-for-character from the article text, without adding quotation marks. If you cannot quote it exactly, leave the item out.
3. Distinguish the outlet from the people it quotes. Attributing a statement to a named official or expert is normal reporting, not an "Appeal to Authority". Rhetoric inside a quotation belongs to the speaker; only blame the outlet if it adopts that framing in its own voice, headline, or story structure. Set "speaker" accordingly.
4. List only techniques that genuinely mislead. Zero is a valid answer for careful reporting; never pad the list.
5. Calibrate scores: 90-100 exemplary, well-sourced reporting; 70-89 solid with minor issues; 50-69 notable slant, weak sourcing, or important omissions; below 50 misleading. Bias confidence should be low (under 50) for straight news with little evidence of lean.
6. "claims_to_check" should hold the 2-4 factual claims the story most depends on, preferring specific figures, dates, and attributions that outside sources could confirm. Only include statements of fact about things that already happened; never predictions, opinions, or analysis.
7. Your training data ends well before the article's publication date, so the world may have changed. For context_explainer and missing_context, draw recent facts (who holds an office, election results, current policies) only from the article itself or from OUR ARCHIVE when it is provided; from memory, give only long-established background such as history, institutions, and how processes work. Never describe someone's current role from memory. OUR ARCHIVE holds this site's earlier analyzed briefings on the topic: use it as the preferred source for recent history, mention the dates of earlier developments, and ignore archive entries about a different story.
8. Do not state specific numbers, dates, or quotes from memory unless they are long-established and you are certain of them. Leave a key fact out rather than guess.
9. When restating percentages, risks, or other comparisons, keep exactly what the article says they are compared against. If the article does not say (e.g. "a 55% reduction" without a baseline), do not supply one; instead list the missing baseline in missing_context.critical_omissions.`;

const COMPARISON_SYSTEM_PROMPT = `You are a media bias expert analyzing how different news sources cover the same story.

Compare the coverage and return JSON with this structure:
{
  "same_story_sources": ["Names, exactly as given, of the related sources covering the same news event or ongoing story as the primary article"],
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

Related sources come from the same group of headlines as the primary article, so most cover the same story. Include a source if it reports the same event or the same ongoing story, even when it covers a different moment, stage, or angle of it (for example, another stop on the same trip, or a later development in the same case). Leave out only sources about a different event, and leave those out of every other field too. Output only valid JSON.`;

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
    let to = article.map[start + needle.length - 1] + 1;
    const text = article.text.slice(from, to);
    const opens = (text.match(/[“‘]/g) || []).length;
    const closes = (text.match(/[”’]/g) || []).length;
    const closing = article.text.slice(to, to + 2).match(/^[,.;:!?]?[”’"]/);
    if (opens > closes && closing) to += closing[0].length;
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
/**
 * Returns a function that keeps only list items whose quote can be found in
 * the content (rewriting each quote to the content's exact wording), and the
 * running counts of exact, repaired, and dropped quotes.
 */
export function createQuoteGrounder(content) {
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
  return { groundList, stats };
}

/** Grounded, de-duplicated claims, each starting as not yet checked. */
export function toClaimVerification(claims) {
  const seen = new Set();
  return (claims || []).filter((c) => !seen.has(c.quote) && seen.add(c.quote)).map((c) => ({
    claim: c.claim,
    quote: c.quote,
    why_it_matters: c.why_it_matters,
    verification_status: 'unverified',
    checked: false,
    notes: 'Not yet checked against outside sources.'
  }));
}

export function groundAnalysisQuotes(deep, content) {
  const { groundList, stats } = createQuoteGrounder(content);

  if (deep.rhetorical_analysis) {
    deep.rhetorical_analysis.manipulation_techniques = groundList(deep.rhetorical_analysis.manipulation_techniques);
  }
  if (deep.emotional_manipulation) {
    deep.emotional_manipulation.techniques_used = groundList(deep.emotional_manipulation.techniques_used);
  }
  if (deep.sharpest_point?.quote) {
    const [grounded] = groundList([{ quote: deep.sharpest_point.quote }]);
    deep.sharpest_point.quote = grounded ? grounded.quote : '';
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

export async function analyzeArticleDeep(article, ai, archiveContext = '') {
  const text = article.content.length > 9000 ? `${article.content.slice(0, 9000)}...` : article.content;
  const { json, model } = await callGroqJson({
    system: DEEP_SYSTEM_PROMPT,
    user: `TODAY: ${utcDate()}\nCURRENT FACTS: ${currentFacts()}\n${archiveContext ? `\n${archiveContext}\n` : ''}\nTITLE: ${article.title}\nSOURCE: ${article.source}\nPUBLISHED: ${article.publishDate || 'unknown'}\n\nARTICLE TEXT:\n${text}`,
    reasoningEffort: 'medium',
    maxTokens: 12000,
    ai
  });

  const quoteStats = groundAnalysisQuotes(json, article.content);
  if (json.logic_score && Number.isFinite(json.logic_score.overall)) {
    json.logic_score.grade = letterGrade(json.logic_score.overall);
  }
  json.claim_verification = toClaimVerification(json.claims_to_check);
  json.metadata = { analyzed_at: new Date().toISOString(), model, analysis_version: ANALYSIS_VERSION, quotes: quoteStats, used_archive: Boolean(archiveContext) };
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
Check the statement exactly as the article words it. Never mark it contradicted based on a different study or event, or on a paraphrase the article did not make. A forecast, projection, estimate, or target never contradicts a reported figure, and figures for different time periods do not conflict; if that is all you find, use "needs_context" or "unverified". The article itself does not count as an independent source, and neither do syndicated or republished copies of it (e.g. on Yahoo, MSN, or news aggregators). Predictions and opinions cannot be supported; mark them "unverified".

Reply with only a JSON object (not a tool call):
{"checks":[{"index":1,"status":"","explanation":"1-2 sentences on what the sources say, naming them","source_period":"YYYY-MM that the source's figure or event refers to, or empty","same_measure_and_period":true,"sources":[{"title":"","url":""}]}]}
"same_measure_and_period" must be true only when the source describes exactly the same measure, for the same period, as the statement.`;

const CONTRADICTION_MAX_SOURCE_AGE_DAYS = 183;

/** Year and month from a URL path such as /2024-11-12/ or /2024/11/, if present. */
export function urlPeriod(url) {
  const match = String(url || '').match(/[/-](20\d{2})[/-](\d{2})(?:[/-]\d{2})?(?:[/-]|$)/);
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)) : null;
}

/**
 * A contradiction needs a source about the same measure and period. Returns
 * the reason it falls short, or null when the contradiction stands.
 */
export function contradictionProblem(check, sources, articleDate) {
  if (check.same_measure_and_period !== true) return 'the sources describe a different measure or period';
  const reference = articleDate ? new Date(articleDate) : new Date();
  const oldest = reference.getTime() - CONTRADICTION_MAX_SOURCE_AGE_DAYS * 86400000;
  const stated = /^\d{4}-\d{2}$/.test(check.source_period || '') ? new Date(`${check.source_period}-01T00:00:00Z`) : null;
  const dated = [stated, ...sources.map((s) => urlPeriod(s.url))].filter(Boolean);
  if (dated.some((d) => d.getTime() < oldest)) return 'the conflicting source is from an earlier period than the article';
  return null;
}

const FACTCHECK_STATUS_MAP = {
  supported: 'verified',
  contradicted: 'false',
  disputed: 'disputed',
  needs_context: 'needs_context',
  unverified: 'unverified'
};

export function stripCitationMarkers(text) {
  return String(text || '').replace(/【[^】]*】/g, '').replace(/\s+([.,;:])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

/** Checks the analysis' claims with web search and writes results into deep.claim_verification. */
export async function factCheckClaims(article, deep, ai) {
  const claims = (deep.claim_verification || []).slice(0, 3);
  if (claims.length === 0) return deep;

  const { json, model } = await callGroqJson({
    system: FACTCHECK_SYSTEM_PROMPT,
    user: `ARTICLE: "${article.title}" (${article.source}, published ${article.publishDate || 'recently'})\n\nSTATEMENTS:\n${claims.map((c, i) => `${i + 1}. "${c.quote || c.claim}"`).join('\n')}`,
    tools: [{ type: 'browser_search' }],
    maxTokens: 6000,
    ai
  });

  const ownOutlet = outletName(article.url);
  for (const check of json.checks || []) {
    const claim = claims[Number(check.index) - 1];
    if (!claim) continue;
    const sources = (check.sources || [])
      .filter((s) => /^https?:\/\//.test(s?.url || '') && outletName(s.url) !== ownOutlet && !SYNDICATORS.has(outletName(s.url)))
      .map((s) => ({ title: stripCitationMarkers(s.title), url: s.url }))
      .slice(0, 3);
    const status = FACTCHECK_STATUS_MAP[check.status] || 'unverified';
    const problem = status === 'false' ? contradictionProblem(check, sources, article.publishDate) : null;
    if (sources.length === 0 && status !== 'unverified') {
      claim.verification_status = 'unverified';
      claim.notes = 'The fact-checker found no independent source outside the original outlet.';
    } else if (problem) {
      claim.verification_status = 'needs_context';
      claim.notes = `Sources report different figures, but ${problem}, so this is not treated as a contradiction. ${stripCitationMarkers(check.explanation)}`.trim();
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

/**
 * Compares the primary article with other outlets' coverage of the same story.
 * `candidates` come from the story's headline cluster: { name, lean, title, url, content }.
 */
export async function compareCoverage(article, candidates, ai) {
  const related = (await Promise.all(candidates.slice(0, 4).map(async (c) => {
    const extracted = await extractArticle(c.url);
    const content = extracted?.text && extracted.text.length > (c.content || '').length ? extracted.text : (c.content || c.description || '');
    return { name: c.name, category: c.lean, title: c.title, url: c.url, content, description: content.slice(0, 500) };
  }))).filter((r) => r.content.length > 150);

  if (related.length === 0) {
    return { found: false, message: 'No comparable coverage found from other sources' };
  }

  const context = related.map((r) =>
    `SOURCE: ${r.name} (${r.category} leaning)\nHEADLINE: ${r.title}\nCONTENT: ${r.content.slice(0, 2000)}`
  ).join('\n\n---\n\n');

  let analysis;
  try {
    ({ json: analysis } = await callGroqJson({
      system: COMPARISON_SYSTEM_PROMPT,
      user: `PRIMARY ARTICLE:\nSOURCE: ${article.source}\nHEADLINE: ${article.title}\nCONTENT: ${article.content.slice(0, 3000)}\n\nRELATED COVERAGE FROM OTHER SOURCES:\n${context}\n\nAnalyze how these sources frame the same story.`,
      maxTokens: 6000,
      ai
    }));
  } catch (error) {
    if (error instanceof DailyLimitError) throw error;
    console.warn(`[briefing] Comparison analysis failed, will retry next run: ${error.message}`);
    return null;
  }

  const sameStory = new Set((analysis.same_story_sources || []).map((name) => String(name).toLowerCase()));
  const confirmed = related.filter((r) => sameStory.has(r.name.toLowerCase()));
  if (confirmed.length === 0) {
    return { found: false, message: 'No other outlets covered this specific story' };
  }

  return {
    found: true,
    primary_source: article.source,
    related_sources: confirmed,
    comparison_analysis: analysis,
    generated_at: new Date().toISOString()
  };
}

/** Shape read by getFallacies/getBias/getSummary in DailyBriefingPage. */
const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

/**
 * The one thing a critical reader should notice first: the analysis' own
 * sharpest point when present, otherwise the most serious finding it has.
 * Keep in step with sharpestPoint in src/components/CriticalRead.tsx.
 */
export function sharpestPoint(deep) {
  if (!deep) return null;
  if (deep.sharpest_point?.finding) {
    return { finding: deep.sharpest_point.finding, quote: deep.sharpest_point.quote || '', kind: deep.sharpest_point.kind || 'logic' };
  }
  const headline = deep.rhetorical_analysis?.headline_accuracy;
  if (headline && headline.matches_content === false && headline.issues) {
    return { finding: `The headline goes beyond the story: ${headline.issues}`, quote: '', kind: 'headline' };
  }
  const techniques = [...(deep.rhetorical_analysis?.manipulation_techniques || [])]
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 1) - (SEVERITY_RANK[b.severity] ?? 1));
  if (techniques[0]) {
    return { finding: `${techniques[0].type}: ${techniques[0].explanation}`, quote: techniques[0].quote || '', kind: 'logic' };
  }
  const sources = deep.rhetorical_analysis?.source_transparency;
  if (sources && sources.anonymous_sources > 0 && sources.anonymous_sources >= sources.named_sources) {
    return { finding: `Rests mostly on anonymous sources (${sources.anonymous_sources} unnamed, ${sources.named_sources} named).`, quote: '', kind: 'sourcing' };
  }
  const omission = deep.missing_context?.critical_omissions?.[0];
  if (omission) return { finding: `Leaves out: ${omission}`, quote: '', kind: 'omission' };
  return { finding: 'No misleading techniques in the outlet\'s own words.', quote: '', kind: 'none' };
}

export function toBriefingAnalysis(deep) {
  if (!deep) return null;
  const lean = deep.bias_analysis?.political_lean;
  return {
    summary: deep.executive_summary?.one_sentence || null,
    watchFor: sharpestPoint(deep),
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
