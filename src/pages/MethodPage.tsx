import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { submitNetlifyForm } from '../components/SubscribeBox';
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
  ['No source found', 'The fact-checker could not find an independent source addressing the statement. This is not the same as false.']
];

const CorrectionsForm: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus('sending');
    try {
      await submitNetlifyForm('corrections', {
        story: String(data.get('story') || ''),
        message: String(data.get('message') || ''),
        email: String(data.get('email') || '')
      });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') return <p className="method-note" role="status">Thank you. Every report is read.</p>;

  return (
    <form name="corrections" className="corrections-form" onSubmit={handleSubmit}>
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
      {status === 'error' && <p className="method-note" role="alert">That didn&apos;t go through. Please try again.</p>}
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
          Every morning we pick the most-covered news stories, read one article on each closely, check its key claims,
          and show how other outlets told the same story. An AI does the reading. This page explains exactly what it does,
          and what it gets wrong.
        </p>
        <Link to="/" className="method-back">← Today&apos;s briefing</Link>
      </header>

      <section className="method-section">
        <h2>[1] How stories are chosen</h2>
        <p>
          Around 5 AM Central we collect the last day and a half of headlines from the outlets below. Headlines about the
          same event are grouped together, and groups are ranked by how many different outlets covered them and how much
          of the political spectrum they span. An AI editor then picks five consequential stories on different subjects,
          skipping sports, celebrity, and opinion unless they dominate the news.
        </p>
        <p>
          For each story we analyze one article: the full text from the most neutral-rated outlet that published one.
          The other outlets&apos; versions become the comparison.
        </p>
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
          Each article is analyzed once, when it enters the briefing, and the stored result is what every reader sees.
          The analysis is done by an open-weight language model (gpt-oss-120b, served by Groq; when its daily capacity runs
          out, a smaller model takes over, and the model used is shown on each analysis).
        </p>
        <ul>
          <li><strong>Exact quotes only.</strong> Every quote the model cites is checked against the article text by code.
            Near-misses are replaced with the article&apos;s actual sentence; anything that cannot be found is removed.</li>
          <li><strong>The outlet, not its sources.</strong> Quoting an official is normal reporting. Rhetoric inside a quotation
            belongs to the speaker, and is only counted against the outlet if the outlet adopts it in its own voice.</li>
          <li><strong>Nothing is padded.</strong> Careful reporting can and often does come back with no techniques found.</li>
          <li><strong>Background is labeled.</strong> Context drawn from the model&apos;s general knowledge is marked as unverified.
            Recent history comes from the article itself or from our own archive of earlier briefings.</li>
        </ul>
      </section>

      <section className="method-section" id="factcheck">
        <h2>[3] Fact checks</h2>
        <p>
          Up to three of the factual claims each story depends on are checked by an AI fact-checker that searches the web.
          Only independent sources count: not the original outlet, and not syndicated copies of the same article.
          Predictions and opinions are not fact-checked. Every result links to its sources so you can judge for yourself.
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
          <li>Language models can misread tone, miss context, or misjudge what matters. Treat the analysis as a reading aid,
            not a verdict.</li>
          <li>The models were trained on data that ends before today&apos;s news, which is why recent context is drawn from the
            article and our archive rather than from memory.</li>
          <li>Five stories a day from twenty outlets is a sample, not the whole news.</li>
          <li>The fact-checker reads search results, not full documents, and can miss sources that exist.</li>
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
