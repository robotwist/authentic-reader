// The weekly hand-check: judge a sample of recent findings and fact-check
// verdicts against the articles. Results are published on /corrections.
//   npm run check          10 items from the last 7 days
//   npm run check -- 20    20 items
import { siteStore } from './site-store.mjs';
import { createAsk, promptCorrection } from './correction-prompt.mjs';
import { sharpestPoint } from '../netlify/lib/analysis.mjs';
import { articleKey } from '../netlify/lib/sources.mjs';
import { CHECK_PREFIX, loadCheckSessions } from '../netlify/lib/record.mjs';

const SITE = 'https://authentic-reader.netlify.app';
const WINDOW_DAYS = 7;
const size = Number(process.argv[2]) || 10;
const STATUS = {
  verified: 'SUPPORTED BY SOURCES',
  false: 'CONTRADICTED BY SOURCES',
  disputed: 'DISPUTED',
  needs_context: 'NEEDS CONTEXT',
  unverified: 'NO SOURCE FOUND'
};

const store = siteStore(process.env.BRIEFINGS_STORE || 'briefings');
const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 3600 * 1000).toISOString().slice(0, 10);
const alreadyChecked = new Set((await loadCheckSessions(store)).flatMap((s) => (s.items || []).map((i) => i.id)));

const findings = [];
const claims = [];
const { blobs } = await store.list({ prefix: 'day/' });
for (const { key } of blobs.filter((b) => b.key.slice(4) >= cutoff)) {
  const day = await store.get(key, { type: 'json' });
  if (!day) continue;
  for (const storyKey of day.order || Object.keys(day.topics)) {
    const story = day.topics[storyKey];
    const record = await store.get(articleKey(story.article.title), { type: 'json' });
    if (!record?.deep) continue;
    const base = { date: day.briefingDate, story: storyKey, title: story.topic, source: story.article.source, url: story.article.url };
    const finding = sharpestPoint(record.deep);
    if (finding) findings.push({ ...base, id: `${day.briefingDate}/${storyKey}/finding`, kind: 'finding', text: finding.finding, quote: finding.quote || '' });
    (record.deep.claim_verification || []).forEach((claim, i) => {
      if (!claim.checked) return;
      claims.push({
        ...base,
        id: `${day.briefingDate}/${storyKey}/claim/${i}`,
        kind: 'claim',
        text: claim.quote || claim.claim,
        verdict: STATUS[claim.verification_status] || claim.verification_status,
        notes: claim.notes || '',
        sources: (claim.sources || []).map((s) => s.url)
      });
    });
  }
}

const shuffle = (list) => list.map((item) => [Math.random(), item]).sort((a, b) => a[0] - b[0]).map(([, item]) => item);
const fresh = (list) => shuffle(list.filter((item) => !alreadyChecked.has(item.id)));
const freshFindings = fresh(findings);
const freshClaims = fresh(claims);
// Half findings and half claims, with either filling in when the other runs short.
const findingCount = Math.min(freshFindings.length, Math.max(Math.ceil(size / 2), size - freshClaims.length));
const sample = [...freshFindings.slice(0, findingCount), ...freshClaims.slice(0, size - findingCount)];
if (sample.length === 0) {
  console.log(`Nothing new to check from the last ${WINDOW_DAYS} days.`);
  process.exit(0);
}

const { ask, close } = createAsk();
const results = [];
console.log(`\nHand-check: ${sample.length} items from editions since ${cutoff}. Open each article and judge the site's reading of it.\n`);

for (const [n, item] of sample.entries()) {
  console.log(`[${n + 1} of ${sample.length}] ${item.kind === 'finding' ? 'WATCH FOR' : 'FACT CHECK'} · ${item.date} · ${item.title} (${item.source})`);
  console.log(`  Article: ${item.url}`);
  console.log(`  On the site: ${SITE}/?date=${item.date}&story=${item.story}`);
  if (item.kind === 'finding') {
    console.log(`  Finding: ${item.text}`);
    if (item.quote) console.log(`  Passage: "${item.quote}"`);
  } else {
    console.log(`  Claim: "${item.text}"`);
    console.log(`  Verdict: ${item.verdict}${item.notes ? `. ${item.notes}` : ''}`);
    for (const url of item.sources) console.log(`  Source: ${url}`);
  }
  const question = item.kind === 'finding' ? 'Is this a fair reading of the article?' : 'Is this verdict right?';
  let answer = '';
  while (answer !== null && !/^[apdsq]/i.test(answer)) answer = (await ask(`  ${question} [a]gree [p]artly [d]isagree [s]kip [q]uit: `))?.trim() ?? null;
  if (answer === null || /^q/i.test(answer)) break;
  const judgment = { a: 'agree', p: 'partly', d: 'disagree', s: 'skip' }[answer[0].toLowerCase()];
  const note = judgment === 'partly' || judgment === 'disagree' ? ((await ask('  What is off? (one line): ')) || '').trim() : '';
  results.push({ id: item.id, kind: item.kind, date: item.date, story: item.story, judgment, note });
  if (judgment === 'disagree' && /^y/i.test((await ask('  Publish a correction for this story? [y/N]: ')) || '')) {
    await promptCorrection(ask, store, { editionDate: item.date, story: item.story, title: item.title, wrong: note });
  }
  console.log('');
}
close();

if (results.length) {
  const now = new Date();
  const key = `${CHECK_PREFIX}${now.toISOString().slice(0, 16).replace(/[:T]/g, '-')}`;
  await store.setJSON(key, { date: now.toISOString().slice(0, 10), items: results });
  const count = (j) => results.filter((r) => r.judgment === j).length;
  console.log(`Saved: ${count('agree')} agreed, ${count('partly')} partly, ${count('disagree')} disagreed, ${count('skip')} skipped. The totals on /corrections update within about ten minutes.`);
}
