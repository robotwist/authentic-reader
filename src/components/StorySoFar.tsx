/**
 * StorySoFar - the running record for a topic, built from every analyzed
 * article in the archive. Newsletter-style "previously" box.
 */

import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../config/api.config';
import './StorySoFar.css';

interface TimelineEntry {
  date: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
}

interface ConfirmedFact {
  fact: string;
  date: string;
  source: string;
  sources: Array<{ title: string; url: string }>;
}

interface OpenQuestion {
  question: string;
  raised: string;
  status: 'open' | 'answered';
  answer?: string;
  answered_on?: string;
}

interface Dossier {
  narrative: string | null;
  timeline: TimelineEntry[];
  confirmed_facts: ConfirmedFact[];
  open_questions: OpenQuestion[];
  framing_patterns: Array<{ source: string; pattern: string }>;
}

interface Props {
  topicKey: string;
  currentUrl?: string;
}

const TIMELINE_PREVIEW = 6;

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase();

const StorySoFar: React.FC<Props> = ({ topicKey, currentUrl }) => {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDossier(null);
    fetch(`${API_CONFIG.BASE_URL}/api/story/${topicKey}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setDossier(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [topicKey]);

  if (!dossier || dossier.timeline.length === 0) return null;

  const isFirstDay = dossier.timeline.length === 1;
  const timeline = showAll ? dossier.timeline : dossier.timeline.slice(0, TIMELINE_PREVIEW);
  const openQuestions = dossier.open_questions.filter((q) => q.status !== 'answered');
  const answeredQuestions = dossier.open_questions.filter((q) => q.status === 'answered');
  const oldest = dossier.timeline[dossier.timeline.length - 1].date;

  return (
    <section className="story-so-far" aria-label="The story so far">
      <header className="story-header">
        <h2 className="story-title">[THE STORY SO FAR]</h2>
        <span className="story-meta">
          {dossier.timeline.length} {dossier.timeline.length === 1 ? 'BRIEFING' : 'BRIEFINGS'} SINCE {formatDate(oldest)}
        </span>
      </header>

      {isFirstDay ? (
        <p className="story-empty">
          This is the first briefing on this topic in our archive. The record will build here, day by day.
        </p>
      ) : (
        dossier.narrative && <p className="story-narrative">{dossier.narrative}</p>
      )}

      <div className="story-block">
        <h3 className="story-block-title">[TIMELINE]</h3>
        <ol className="story-timeline">
          {timeline.map((entry) => (
            <li key={entry.url} className={entry.url === currentUrl ? 'is-current' : undefined}>
              <span className="timeline-date">{formatDate(entry.date)}</span>
              <span className="timeline-body">
                <a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.headline}</a>
                <span className="timeline-source"> / {entry.source}</span>
                {entry.url === currentUrl && <span className="timeline-current"> [THIS ARTICLE]</span>}
              </span>
            </li>
          ))}
        </ol>
        {dossier.timeline.length > TIMELINE_PREVIEW && (
          <button className="story-toggle" onClick={() => setShowAll(!showAll)}>
            {showAll ? '[SHOW LESS]' : `[SHOW ALL ${dossier.timeline.length}]`}
          </button>
        )}
      </div>

      {dossier.confirmed_facts.length > 0 && (
        <div className="story-block">
          <h3 className="story-block-title">[CONFIRMED SO FAR]</h3>
          <ul className="story-list">
            {dossier.confirmed_facts.slice(0, 6).map((fact, i) => (
              <li key={i}>
                {fact.fact}{' '}
                <span className="story-cite">
                  ({formatDate(fact.date)};{' '}
                  {fact.sources.map((source, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && ', '}
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {new URL(source.url).hostname.replace(/^www\./, '')}
                      </a>
                    </React.Fragment>
                  ))})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(openQuestions.length > 0 || answeredQuestions.length > 0) && (
        <div className="story-block">
          <h3 className="story-block-title">[OPEN QUESTIONS]</h3>
          <ul className="story-list">
            {openQuestions.map((q, i) => (
              <li key={`open-${i}`}>
                {q.question} <span className="story-cite">(RAISED {formatDate(q.raised)})</span>
              </li>
            ))}
            {answeredQuestions.slice(0, 3).map((q, i) => (
              <li key={`answered-${i}`} className="is-answered">
                {q.question}{' '}
                <span className="story-cite">
                  ANSWERED {q.answered_on ? formatDate(q.answered_on) : ''}: {q.answer}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dossier.framing_patterns.length > 0 && !isFirstDay && (
        <div className="story-block">
          <h3 className="story-block-title">[HOW OUTLETS HAVE FRAMED IT]</h3>
          <ul className="story-list">
            {dossier.framing_patterns.map((p, i) => (
              <li key={i}><strong>{p.source}:</strong> {p.pattern}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="story-note">
        Built only from articles analyzed in our archive. Confirmed facts were checked against independent sources.
      </p>
    </section>
  );
};

export default StorySoFar;
