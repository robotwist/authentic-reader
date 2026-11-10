import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundAnalysisQuotes, stripCitationMarkers } from './analysis.mjs';
import { addArticleToDossier, coverageDays, dossierContext } from './dossier.mjs';
import { isOpinionPiece, looksLikeFullArticle, outletName } from './sources.mjs';
import { clusterHeadlines } from './stories.mjs';

const ARTICLE = 'Officials said the bridge “was used to move weapons,” according to the ministry.\n\n' +
  'The strikes damaged energy facilities across the Kyiv region overnight. Nine people were hurt, including a child.';

test('quotes are replaced with the article’s exact wording despite quote marks and whitespace', () => {
  const deep = { rhetorical_analysis: { manipulation_techniques: [{ quote: '"the bridge "was used to move   weapons,""' }] } };
  const stats = groundAnalysisQuotes(deep, ARTICLE);
  assert.equal(deep.rhetorical_analysis.manipulation_techniques[0].quote, 'the bridge “was used to move weapons,”');
  assert.equal(stats.exact, 1);
});

test('near-miss quotes are repaired to the closest sentence and inventions are dropped', () => {
  const deep = {
    emotional_manipulation: {
      techniques_used: [
        { quote: 'The strikes damaged energy facilities across the Kyiv region last night' },
        { quote: 'Russia promised to end the war by Friday at noon' }
      ]
    }
  };
  const stats = groundAnalysisQuotes(deep, ARTICLE);
  assert.deepEqual(deep.emotional_manipulation.techniques_used.map((t) => t.quote), [
    'The strikes damaged energy facilities across the Kyiv region overnight.'
  ]);
  assert.deepEqual({ repaired: stats.repaired, dropped: stats.dropped }, { repaired: 1, dropped: 1 });
});

test('duplicate claims are removed after grounding', () => {
  const deep = { claims_to_check: [{ quote: 'Nine people were hurt, including a child.' }, { quote: 'Nine people were hurt, including a child' }] };
  groundAnalysisQuotes(deep, ARTICLE);
  assert.equal(deep.claims_to_check.length, 1);
});

test('outletName treats an outlet’s domains as one outlet', () => {
  assert.equal(outletName('https://www.bbc.co.uk/news/a'), outletName('https://www.bbc.com/news/b'));
  assert.equal(outletName('https://apnews.com/article/x'), 'apnews');
  assert.equal(outletName('not a url'), null);
});

test('citation markers from search results are stripped', () => {
  assert.equal(stripCitationMarkers('AP reported nine wounded【1†L4-L6】【3†L9】 .'), 'AP reported nine wounded.');
});

test('opinion pieces and short snippets are filtered out', () => {
  assert.equal(isOpinionPiece({ link: 'https://www.theguardian.com/commentisfree/2026/x', title: 'A view' }), true);
  assert.equal(isOpinionPiece({ link: 'https://x.com/a', title: 'Midterms reshape the AI debate | Heather Stewart' }), true);
  assert.equal(isOpinionPiece({ link: 'https://x.com/a', title: 'Trains collide in Egypt' }), false);
  assert.equal(looksLikeFullArticle('Too short.'), false);
  assert.equal(looksLikeFullArticle('word '.repeat(400)), true);
});

test('headlines about the same story cluster together across outlets', () => {
  const item = (sourceName, lean, title) => ({ sourceName, lean, title, description: '', publishDate: '2026-11-09T00:00:00Z', link: `${sourceName}/${title}` });
  const clusters = clusterHeadlines([
    item('BBC News', 'center', 'Seven dead after trains collide in Egypt'),
    item('The Guardian', 'left', 'Collision of two trains in Egypt kills at least seven'),
    item('Washington Times', 'right', 'Collision between 2 trains in Egypt kills 7'),
    item('NPR', 'center-left', 'Pope Leo arrives in Argentina on historic visit'),
    item('Al Jazeera', 'international', 'Pope Leo welcomed by Milei in Argentina'),
    item('Fox News', 'right', 'Kyle Larson wins third NASCAR Cup title')
  ]);
  assert.deepEqual(clusters[0].outlets.sort(), ['BBC News', 'The Guardian', 'Washington Times']);
  assert.deepEqual(clusters[1].outlets.sort(), ['Al Jazeera', 'NPR']);
  assert.equal(clusters[2].outlets.length, 1);
});

test('story files add each article once and keep only independently confirmed facts', () => {
  const dossier = { timeline: [], confirmed_facts: [] };
  const article = { title: 'Strikes hit Kyiv', url: 'https://bbc.com/a', source: 'BBC News' };
  const deep = {
    executive_summary: { one_sentence: 'Strikes hit Kyiv.' },
    claim_verification: [
      { claim: 'Nine hurt', quote: 'Nine people were hurt', verification_status: 'verified', sources: [{ url: 'https://apnews.com/x', title: 'AP' }] },
      { claim: 'Syndicated only', quote: 'Q2', verification_status: 'verified', sources: [{ url: 'https://www.yahoo.com/x', title: 'Yahoo' }] },
      { claim: 'Unchecked', quote: 'Q3', verification_status: 'unverified', sources: [] }
    ]
  };
  addArticleToDossier(dossier, '2026-11-09', article, deep);
  addArticleToDossier(dossier, '2026-11-09', article, deep);
  addArticleToDossier(dossier, '2026-11-10', { ...article, url: 'https://bbc.com/b' }, { executive_summary: { one_sentence: 'Talks begin.' } });
  assert.equal(dossier.timeline.length, 2);
  assert.equal(coverageDays(dossier), 2);
  assert.deepEqual(dossier.confirmed_facts.map((f) => f.fact), ['Nine hurt']);
  assert.match(dossierContext(dossier, 'https://bbc.com/b'), /2026-11-09 \(BBC News\): Strikes hit Kyiv/);
  assert.doesNotMatch(dossierContext(dossier, 'https://bbc.com/b'), /Talks begin/);
});

test('article text keeps paragraphs and drops promotional lines', async () => {
  const { htmlToParagraphs } = await import('./sources.mjs');
  const html = '<p>Herzog gave Eisenkot the &quot;first chance&quot;.</p><p>READ MORE: Israel taps opposition</p>' +
    '<figure><figcaption>Photo: AP</figcaption></figure><p>Talks begin Tuesday.</p><p>A free press is a cornerstone of a healthy democracy.</p>';
  assert.equal(htmlToParagraphs(html), 'Herzog gave Eisenkot the "first chance".\n\nTalks begin Tuesday.');
});

test('reader submissions are validated and bots are caught by the honeypot', async () => {
  const { normalizeEmail, validateSubmission } = await import('./submissions.mjs');
  assert.equal(normalizeEmail('  Reader@Example.COM '), 'reader@example.com');
  assert.equal(normalizeEmail('not-an-email'), null);
  assert.equal(validateSubmission('subscribe', { email: 'reader@example.com' }), null);
  assert.match(validateSubmission('subscribe', { email: 'nope' }), /valid email/);
  assert.equal(validateSubmission('subscribe', { email: 'reader@example.com', website: 'spam.biz' }), 'Invalid request.');
  assert.equal(validateSubmission('report', { story: 'Egypt crash', message: 'Wrong death toll' }), null);
  assert.match(validateSubmission('report', { story: 'Egypt crash', message: '' }), /fill in/);
  assert.match(validateSubmission('report', { story: 'x', message: 'y', email: 'bad' }), /valid email/);
});

test('visits are counted from page flags only, and bots and bad input are ignored', async () => {
  const { applyHit, emptyDay, isBot, parseHit } = await import('./stats.mjs');
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
  assert.equal(isBot('LinkedInBot/1.0 (compatible; Mozilla/5.0)'), true);
  assert.equal(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1'), false);
  assert.equal(parseHit({ view: 'admin' }), null);
  assert.equal(parseHit({ view: 'story', story: '../etc' }), null);
  assert.deepEqual(parseHit({ view: 'home', firstToday: false, returning: true }), { view: 'home', story: null, firstToday: false, returning: false });

  let day = emptyDay('2026-11-09');
  day = applyHit(day, parseHit({ view: 'home', firstToday: true, returning: true }));
  day = applyHit(day, parseHit({ view: 'story', story: 'egypt-train-collision' }));
  day = applyHit(day, parseHit({ view: 'home', firstToday: true }));
  assert.deepEqual({ visitors: day.visitors, returning: day.returning, home: day.views.home, story: day.views.story }, { visitors: 2, returning: 1, home: 2, story: 1 });
  assert.equal(day.stories['egypt-train-collision'], 1);
});

test('contradictions need a source about the same measure and period', async () => {
  const { contradictionProblem, urlPeriod } = await import('./analysis.mjs');
  assert.deepEqual(urlPeriod('https://www.reuters.com/markets/x-2024-11-12/'), new Date(Date.UTC(2024, 10, 1)));
  assert.deepEqual(urlPeriod('https://example.com/2026/10/article'), new Date(Date.UTC(2026, 9, 1)));
  assert.equal(urlPeriod('https://example.com/article'), null);
  const article = '2026-11-09T00:00:00Z';
  const old = [{ url: 'https://www.reuters.com/markets/inflation-2024-11-12/' }];
  const recent = [{ url: 'https://www.reuters.com/markets/inflation-2026-10-14/' }];
  assert.match(contradictionProblem({ same_measure_and_period: false }, recent, article), /different measure or period/);
  assert.match(contradictionProblem({ same_measure_and_period: true }, old, article), /earlier period/);
  assert.match(contradictionProblem({ same_measure_and_period: true, source_period: '2025-01' }, [], article), /earlier period/);
  assert.equal(contradictionProblem({ same_measure_and_period: true, source_period: '2026-10' }, recent, article), null);
});

test('opinion columns are matched to the day story they discuss', async () => {
  const { relatedStory, storyVocabulary } = await import('./opinion.mjs');
  const vocabulary = storyVocabulary([
    { key: 'egypt-train-collision', label: 'Egypt Train Crash', article: { title: 'Seven dead after trains collide in Egypt' }, related: [] },
    { key: 'trump-immigration-policy', label: 'Trump Immigration Stance', article: { title: 'Trump says deportation policy might be too tough' }, related: [{ title: 'Trump backs away from hardline immigration policy' }] }
  ]);
  assert.deepEqual(relatedStory({ title: 'Trump’s immigration retreat is a cynical deportation dodge', description: '' }, vocabulary), { key: 'trump-immigration-policy', overlap: 3 });
  assert.equal(relatedStory({ title: 'The case for four-day school weeks', description: '' }, vocabulary).overlap, 0);
});

test('opinion views are counted by side', async () => {
  const { parseHit } = await import('./stats.mjs');
  assert.deepEqual(parseHit({ view: 'opinion', story: 'left' }), { view: 'opinion', story: 'opinion-left', firstToday: false, returning: false });
  assert.equal(parseHit({ view: 'opinion', story: 'center' }), null);
});

test('the email edition lists every story and opinion with links, and waits until it is ready', async () => {
  const { editionMarkdown, readyToSend } = await import('./email.mjs');
  const day = {
    briefingDate: '2026-11-09',
    order: ['egypt-train-collision'],
    topics: { 'egypt-train-collision': { topic: 'Egypt Train Crash', category: 'World', why: 'Two trains collided.', outlets: ['BBC News', 'PBS'], dayCount: 2, article: { title: 'Seven dead after trains collide', source: 'BBC News' } } },
    opinions: { right: { side: 'right', article: { title: 'A column', source: 'Fox News Opinion' }, argumentScore: { overall: 70 } } }
  };
  const md = editionMarkdown(day, 'https://example.org');
  assert.match(md, /## 1\. Egypt Train Crash/);
  assert.match(md, /\[Seven dead after trains collide\]\(https:\/\/example\.org\/\?date=2026-11-09&story=egypt-train-collision\)/);
  assert.match(md, /covered by 2 outlets · day 2/);
  assert.match(md, /\*\*From the right:\*\* \[A column\]\(https:\/\/example\.org\/\?date=2026-11-09&opinion=right\)/);
  const at = (hour) => new Date(Date.UTC(2026, 10, 9, hour));
  assert.equal(readyToSend({ storiesPublished: 5, storiesPlanned: 5 }, at(11)), true);
  assert.equal(readyToSend({ storiesPublished: 3, storiesPlanned: 5 }, at(11)), false);
  assert.equal(readyToSend({ storiesPublished: 3, storiesPlanned: 5 }, at(16)), true);
  assert.equal(readyToSend({ storiesPublished: 0, storiesPlanned: 5 }, at(21)), false);
});

test('the sharpest point prefers the analysis finding, then headline, technique, sourcing, omission', async () => {
  const { sharpestPoint } = await import('./analysis.mjs');
  assert.equal(sharpestPoint({ sharpest_point: { finding: 'Leads with the most alarming figure.', kind: 'numbers' } }).kind, 'numbers');
  assert.equal(sharpestPoint({ rhetorical_analysis: { headline_accuracy: { matches_content: false, issues: 'Says "collapse"; the body says "slowdown".' }, manipulation_techniques: [{ type: 'Loaded Language', explanation: 'x', severity: 'high' }] } }).kind, 'headline');
  assert.match(sharpestPoint({ rhetorical_analysis: { manipulation_techniques: [{ type: 'Low One', explanation: 'a', severity: 'low' }, { type: 'False Choice', explanation: 'b', severity: 'high', quote: 'q' }] } }).finding, /^False Choice/);
  assert.equal(sharpestPoint({ rhetorical_analysis: { manipulation_techniques: [], source_transparency: { named_sources: 1, anonymous_sources: 3 } } }).kind, 'sourcing');
  assert.equal(sharpestPoint({ missing_context: { critical_omissions: ['The baseline year'] } }).finding, 'Leaves out: The baseline year');
  assert.equal(sharpestPoint({}).kind, 'none');
});
