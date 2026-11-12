import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_CONFIG } from '../config/api.config';
import './MethodPage.css';

interface Correction {
  id: string;
  date: string;
  editionDate: string;
  story: string;
  title: string;
  wrong: string;
  corrected: string;
}

interface Tally {
  total: number;
  agreed: number;
  partly: number;
  disagreed: number;
}

interface CheckSummary {
  recent: Tally & { since: string };
  allTime: Tally;
  lastChecked: string | null;
}

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function describe(tally: Tally): string {
  return `${tally.agreed} agreed, ${tally.partly} partly, ${tally.disagreed} disagreed, of ${tally.total} checked`;
}

const CorrectionsPage: React.FC = () => {
  const [corrections, setCorrections] = useState<Correction[] | null>(null);
  const [checks, setChecks] = useState<CheckSummary | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${API_CONFIG.BASE_URL}/api/corrections`).then((r) => (r.ok ? r.json() : null)).then((d) => setCorrections(d?.corrections || [])).catch(() => setCorrections([]));
    fetch(`${API_CONFIG.BASE_URL}/api/checks`).then((r) => (r.ok ? r.json() : null)).then(setChecks).catch(() => undefined);
  }, []);

  return (
    <div className="method-page">
      <header className="method-header">
        <p className="method-kicker">[CHECKS AND CORRECTIONS]</p>
        <h1>How the analysis is checked</h1>
        <p className="method-lede">
          Every week a person reads a random sample of the site&apos;s findings and fact-check verdicts against the articles
          and records whether each one holds up. Mistakes are corrected here, in public, and noted on the story itself.
        </p>
        <Link to="/" className="method-back">← Today&apos;s briefing</Link>
      </header>

      <section className="method-section" id="checks">
        <h2>[1] Hand-checked</h2>
        {checks && checks.allTime.total > 0 ? (
          <>
            <p><strong>Last four weeks:</strong> {describe(checks.recent)}.</p>
            <p><strong>Since checks began:</strong> {describe(checks.allTime)}.</p>
            {checks.lastChecked && <p className="method-note">Last checked {formatDate(checks.lastChecked)}.</p>}
          </>
        ) : (
          <p>The first weekly check has not been recorded yet.</p>
        )}
        <p>
          Each check covers the &quot;watch for&quot; finding and the fact-check verdicts for stories from the previous seven
          days, chosen at random. &quot;Partly&quot; means the finding is fair but overstated or missing context.
        </p>
      </section>

      <section className="method-section" id="corrections">
        <h2>[2] Corrections</h2>
        {corrections === null && <p>Loading…</p>}
        {corrections?.length === 0 && <p>No corrections so far.</p>}
        {corrections && corrections.length > 0 && (
          <dl className="method-statuses">
            {corrections.map((c) => (
              <div key={c.id}>
                <dt>{formatDate(c.date)}</dt>
                <dd>
                  <Link to={`/?date=${c.editionDate}&story=${encodeURIComponent(c.story)}`}>{c.title}</Link>, edition of{' '}
                  {formatDate(c.editionDate)}. <strong>Wrong:</strong> {c.wrong} <strong>Correction:</strong> {c.corrected}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <p>
          Found something wrong? <Link to="/method#report">Report an error</Link>.
        </p>
      </section>
    </div>
  );
};

export default CorrectionsPage;
