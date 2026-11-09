import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { submitForm } from '../lib/forms';
import './MethodPage.css';

// Keep in sync with FEEDS in netlify/lib/sources.mjs.
const OUTLETS: Array<[string, string]> = [
  ['The Guardian', 'Left'],
  ['NPR', 'Center-left'],
  ['CBS News', 'Center-left'],
  ['ABC News', 'Center-left'],
  ['NBC News', 'Center-left'],
  ['Time', 'Center-left'],
  ['BBC News', 'Center'],
  ['PBS NewsHour', 'Center'],
  ['The Hill', 'Center'],
  ['Axios', 'Center'],
  ['CNBC', 'Center'],
  ['Fox News', 'Right'],
  ['New York Post', 'Right'],
  ['Washington Times', 'Right'],
  ['Washington Examiner', 'Right'],
  ['The Daily Wire', 'Right'],
  ['Al Jazeera', 'International'],
  ['Deutsche Welle', 'International'],
  ['France 24', 'International'],
  ['Sky News', 'International']
];

const STATUSES: Array<[string, string]> = [
  ['Supported by sources', 'An independent outlet or primary source confirms the statement as worded.'],
  ['Contradicted by sources', 'A source about the same event, study, or figure directly conflicts with it.'],
  ['Disputed', 'Credible sources disagree with each other.'],
  ['Needs context', 'Accurate, but missing context that changes its meaning, such as what a percentage is compared against.'],
  ['No source found', 'No independent source addressing the statement was found. This is not the same as false.']
];

const CorrectionsForm: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus('sending');
    try {
      await submitForm('report', {
        story: String(data.get('story') || ''),
        message: String(data.get('message') || ''),
        email: String(data.get('email') || ''),
        website: String(data.get('website') || '')
      });
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not go through. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'done') return <p className="method-note" role="status">Thank you. Every report is read.</p>;

  return (
    <form className="corrections-form" onSubmit={handleSubmit}>
      <input className="visually-hidden" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label>
        <span>Story or link</span>
        <input name="story" required placeholder="Headline or URL" />
      </label>
      <label>
        <span>What is wrong?</span>
        <textarea name="message" required rows={4} />
      </label>
      <label>
        <span>Email (optional, if you want a reply)</span>
        <input type="email" name="email" />
      </label>
      <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'SENDING…' : 'SEND REPORT'}</button>
      {status === 'error' && <p className="method-note" role="alert">{error}</p>}
    </form>
  );
};

const MethodPage: React.FC = () => {
  useEffect(() => {
    document.title = 'How it works | The Daily Authentic';
    const target = window.location.hash ? document.querySelector(window.location.hash) : null;
    if (target) target.scrollIntoView();
    return () => {
      document.title = "The Daily Authentic: the day's news, read closely";
    };
  }, []);

  return (
    <div className="method-page">
      <header className="method-header">
        <p className="method-kicker">[METHODOLOGY]</p>
        <h1>How the Daily Authentic works</h1>
        <p className="method-lede">
          Every morning we select the most-covered news stories, read one article on each line by line, check its key
          claims against independent sources, and set it beside other outlets&apos; versions of the same event. The same
          fixed process runs every day. This page lays out its steps, its thresholds, and its limits.
        </p>
        <Link to="/" className="method-back">← Today&apos;s briefing</Link>
      </header>

      <section className="method-section">
        <h2>[1] How stories are chosen</h2>
        <p>
          Selection is driven by coverage, not by anyone&apos;s preference. A story makes the briefing because many outlets,
          across the spectrum, decided it was news.
        </p>
        <dl className="method-params">
          <div><dt>Sources</dt><dd>28 feeds from the 20 outlets listed below, collected around 5 AM Central.</dd></div>
          <div><dt>Window</dt><dd>Headlines published in the previous 36 hours. Opinion and commentary pieces are excluded.</dd></div>
          <div><dt>Grouping</dt><dd>Headlines are grouped when they share enough distinctive terms (names, places, specific
            nouns), with rarer terms weighted more heavily than common ones. Each headline joins the group it most resembles
            at a similarity of 0.30 or higher.</dd></div>
          <div><dt>Ranking</dt><dd>Each group scores one point per distinct outlet plus half a point per distinct part of the
            spectrum (left, center-left, center, right, international). Only groups covered by at least two outlets qualify.</dd></div>
          <div><dt>Selection</dt><dd>Five stories on five different subjects, favoring consequential news: government,
            conflict, the economy, public health, science, courts, and major disasters. Sports, celebrity, and lifestyle
            stories are left out unless they dominate the day. At most one story may have fewer than three outlets.</dd></div>
          <div><dt>Continuity</dt><dd>A story that continues one covered in the past 30 days keeps its name and adds to its
            running record (see section 5).</dd></div>
          <div><dt>Article</dt><dd>For each story, one article is analyzed in full: from the most neutral-rated outlet in the
            group that published at least 1,500 characters and 250 words of text. Roundups and live blogs are skipped.</dd></div>
          <div><dt>Comparison</dt><dd>Up to four other outlets from the same group, spread across the spectrum before any
            part of it is repeated.</dd></div>
        </dl>
        <table className="method-table">
          <thead>
            <tr><th>Outlet</th><th>Approximate lean</th></tr>
          </thead>
          <tbody>
            {OUTLETS.map(([name, lean]) => (
              <tr key={name}><td>{name}</td><td>{lean}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="method-note">
          Outlet leans are approximate, adapted from widely used media-bias charts (AllSides and Ad Fontes Media). They are
          used only to choose a spread of perspectives for comparison, never to judge an article.
        </p>
      </section>

      <section className="method-section">
        <h2>[2] How each article is read</h2>
        <p>
          Each article is analyzed once, when it enters the briefing, against the same rubric every day. The stored result
          is what every reader sees. The reading is automated, and its output is checked by rules that do not bend:
        </p>
        <ul>
          <li><strong>Exact quotes only.</strong> Every quoted passage is matched against the article text after normalizing
            quotation marks, dashes, and spacing. If there is no exact match, the article sentence sharing at least 75% of its
            words is used instead. Anything that cannot be found in the article is removed.</li>
          <li><strong>The outlet, not its sources.</strong> Quoting an official is normal reporting. Rhetoric inside a quotation
            belongs to the speaker, and is only counted against the outlet if the outlet adopts it in its own voice.</li>
          <li><strong>Nothing is padded.</strong> Techniques are listed only when they mislead. Careful reporting can and often
            does come back with none.</li>
          <li><strong>Calibrated scores.</strong> 90 to 100: exemplary, well-sourced reporting. 70 to 89: solid, with minor
            issues. 50 to 69: notable slant, weak sourcing, or important omissions. Below 50: misleading.</li>
          <li><strong>Numbers keep their baseline.</strong> A percentage is restated only with what the article compares it
            against. If the article does not say, the missing baseline is listed under what the article leaves out.</li>
          <li><strong>Background is labeled.</strong> Recent history comes only from the article itself or from our archive of
            earlier briefings. General background is marked as not independently verified.</li>
        </ul>
      </section>

      <section className="method-section" id="factcheck">
        <h2>[3] Fact checks</h2>
        <p>
          For each story, up to three of the factual claims it depends on are quoted exactly and searched for in
          independent coverage and primary sources. Only independent sources count: not the original outlet, and not
          syndicated or republished copies of the same article. Predictions and opinions are not fact-checked. Every
          result links to its sources so you can judge for yourself.
        </p>
        <dl className="method-statuses">
          {STATUSES.map(([label, meaning]) => (
            <div key={label}><dt>[{label.toUpperCase()}]</dt><dd>{meaning}</dd></div>
          ))}
        </dl>
      </section>

      <section className="method-section" id="bias">
        <h2>[4] What the bias label means</h2>
        <p>
          The left-to-right meter describes the article in front of you, not the outlet: its word choices, which facts it
          leads with, whose perspectives it includes, and what it leaves out. The confidence number is how strong that
          evidence is. Straight news with little evidence of slant gets a low-confidence &quot;center&quot; rating.
        </p>
        <p>
          A lean is not an accusation. Every story has to start somewhere. The useful question is what the framing
          emphasizes, and the comparison section shows that directly.
        </p>
      </section>

      <section className="method-section">
        <h2>[5] The comparison and the story so far</h2>
        <p>
          The comparison sets the analyzed article beside other outlets&apos; coverage of the same event and notes common facts,
          disputed facts, and where the same thing is described in different words. Articles that turn out to be about a
          different event are left out.
        </p>
        <p>
          &quot;The Story So Far&quot; is a running record for each continuing story, built only from articles in our archive:
          a dated timeline, facts that independent sources confirmed, and open questions that get marked answered when a
          later article answers them.
        </p>
      </section>

      <section className="method-section">
        <h2>[6] Limits</h2>
        <ul>
          <li>Automated reading can misjudge tone, miss context, or weigh things differently than you would. Treat the analysis
            as a reading aid, not a verdict.</li>
          <li>General background reflects reference material that predates today&apos;s news, which is why recent context is
            drawn only from the article and our archive.</li>
          <li>Five stories a day from twenty outlets is a sample, not the whole news.</li>
          <li>Fact checks rely on search results, not full documents, and can miss sources that exist.</li>
          <li>Outlet lean ratings are approximations, and coverage counts reward stories that many outlets chose to run.</li>
        </ul>
      </section>

      <section className="method-section" id="report">
        <h2>[7] Report an error</h2>
        <p>If something on the site is wrong, tell us. Corrections are made openly.</p>
        <CorrectionsForm />
      </section>
    </div>
  );
};

export default MethodPage;
