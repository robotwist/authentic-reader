import React from 'react';
import './CriticalRead.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- stored analysis payloads are loosely typed JSON */

export interface WatchFor {
  finding: string;
  quote?: string;
  kind?: string;
}

const SEVERITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Mirrors sharpestPoint in netlify/lib/analysis.mjs for analyses stored before it existed. */
export function sharpestPoint(deep: any): WatchFor | null {
  if (!deep) return null;
  if (deep.sharpest_point?.finding) return deep.sharpest_point;
  const headline = deep.rhetorical_analysis?.headline_accuracy;
  if (headline && headline.matches_content === false && headline.issues) {
    return { finding: `The headline goes beyond the story: ${headline.issues}`, kind: 'headline' };
  }
  const techniques = [...(deep.rhetorical_analysis?.manipulation_techniques || [])]
    .sort((a: any, b: any) => (SEVERITY_RANK[a.severity] ?? 1) - (SEVERITY_RANK[b.severity] ?? 1));
  if (techniques[0]) return { finding: `${techniques[0].type}: ${techniques[0].explanation}`, quote: techniques[0].quote, kind: 'logic' };
  const sources = deep.rhetorical_analysis?.source_transparency;
  if (sources && sources.anonymous_sources > 0 && sources.anonymous_sources >= sources.named_sources) {
    return { finding: `Rests mostly on anonymous sources (${sources.anonymous_sources} unnamed, ${sources.named_sources} named).`, kind: 'sourcing' };
  }
  const omission = deep.missing_context?.critical_omissions?.[0];
  if (omission) return { finding: `Leaves out: ${omission}`, kind: 'omission' };
  return { finding: 'No misleading techniques in the outlet\u2019s own words.', kind: 'none' };
}

const CLAIM_LABELS: Array<[string, string]> = [
  ['verified', 'supported'],
  ['false', 'contradicted'],
  ['disputed', 'disputed'],
  ['needs_context', 'need context'],
  ['unverified', 'no source found']
];

function claimTally(claims: any[]): string | null {
  const checked = claims.filter((c) => c.checked);
  if (claims.length === 0) return null;
  if (checked.length === 0) return 'Not yet checked';
  return CLAIM_LABELS
    .map(([status, label]) => [checked.filter((c) => c.verification_status === status).length, label] as const)
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(' · ');
}

/** The sharpest findings, first: what to watch for, the headline, sourcing, claims, and what is missing. */
const CriticalRead: React.FC<{ deep: any }> = ({ deep }) => {
  const watch = sharpestPoint(deep);
  if (!watch) return null;

  const headline = deep.rhetorical_analysis?.headline_accuracy;
  const sources = deep.rhetorical_analysis?.source_transparency;
  const claims = claimTally(deep.claim_verification || []);
  const omission = deep.missing_context?.critical_omissions?.[0];

  const rows: Array<[string, React.ReactNode]> = [
    ['WATCH FOR', <>
      {watch.finding}
      {watch.quote && <span className="critical-quote"> &ldquo;{watch.quote}&rdquo;</span>}
    </>]
  ];
  if (headline && watch.kind !== 'headline') {
    rows.push(['HEADLINE', headline.matches_content === false ? `Goes beyond the story. ${headline.issues || ''}` : 'Matches the story']);
  }
  if (sources) {
    rows.push(['SOURCES', `${sources.named_sources} named · ${sources.anonymous_sources} anonymous · ${sources.documents_cited} documents`]);
  }
  if (claims) rows.push(['CLAIMS', claims]);
  if (omission && watch.kind !== 'omission') rows.push(['MISSING', omission]);

  return (
    <section className="critical-read" aria-label="The critical read">
      <h2 className="critical-title">[THE CRITICAL READ]</h2>
      <dl className="critical-rows">
        {rows.map(([label, value]) => (
          <div key={label} className={label === 'WATCH FOR' ? 'is-lead' : undefined}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default CriticalRead;
