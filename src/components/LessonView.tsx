import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../config/api.config';
import { BriefingStory } from '../types/briefing';
import './LessonView.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- stored analysis payloads are loosely typed JSON */

interface Props {
  story: BriefingStory;
  date: string;
  deep: any;
  onBack: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  verified: 'Supported by independent sources',
  false: 'Contradicted by sources',
  disputed: 'Disputed',
  needs_context: 'Needs context',
  unverified: 'No independent source found'
};

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/**
 * A printable classroom handout for one story, built only from the stored
 * analysis: vocabulary, background, a close-reading task with an answer key,
 * how outlets worded the same story, and discussion questions.
 */
const LessonView: React.FC<Props> = ({ story, date, deep, onBack }) => {
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_CONFIG.BASE_URL}/api/analysis/compare-sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article: { title: story.article.title } })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setComparison(data?.comparison?.found ? data.comparison : null))
      .catch(() => undefined);
  }, [story.article.title]);

  if (!deep) {
    return (
      <div className="lesson-page">
        <p className="lesson-note">The analysis for this story is still being prepared. Please check back later.</p>
      </div>
    );
  }

  const terms: Array<{ term: string; definition: string }> = deep.context_explainer?.key_terms || [];
  const interpretation: string[] = deep.context_explainer?.key_facts || [];
  const techniques = [
    ...(deep.rhetorical_analysis?.manipulation_techniques || []).map((t: any) => ({ name: t.type, quote: t.quote, why: t.explanation, fair: t.neutral_rewrite })),
    ...(deep.emotional_manipulation?.techniques_used || []).map((t: any) => ({ name: t.technique, quote: t.quote, why: t.impact }))
  ].filter((t) => t.quote);
  const claims: any[] = deep.claim_verification || [];
  const questions: string[] = deep.reader_guidance?.critical_questions || [];
  const omissions: string[] = deep.missing_context?.critical_omissions || [];
  const wording: any[] = comparison?.comparison_analysis?.language_differences || [];
  const articleUrl = story.article.url;

  return (
    <div className="lesson-page">
      <div className="lesson-actions no-print">
        <button className="back-button" onClick={onBack}>← Back to the story</button>
        <button className="back-button" onClick={() => window.print()}>Print this lesson</button>
      </div>

      <header className="lesson-header">
        <p className="lesson-kicker">THE DAILY AUTHENTIC · CLASSROOM LESSON · {formatDate(date).toUpperCase()}</p>
        <h1 className="lesson-title">{story.topic}</h1>
        <p className="lesson-article">
          Read: <strong>&ldquo;{story.article.title}&rdquo;</strong>, {story.article.source}
          <span className="lesson-url"> ({articleUrl})</span>
        </p>
        <p className="lesson-goal">
          <strong>Goal:</strong> read a news article closely, separate what is established from how it is framed, and
          check a claim against independent sources.
        </p>
      </header>

      <section className="lesson-section">
        <h2>1. Before you read</h2>
        {deep.context_explainer?.background && <p>{deep.context_explainer.background}</p>}
        {terms.length > 0 && (
          <dl className="lesson-terms">
            {terms.map((t, i) => (
              <div key={i}><dt>{t.term}</dt><dd>{t.definition}</dd></div>
            ))}
          </dl>
        )}
        {interpretation.length > 0 && (
          <>
            <h3>Keep in mind</h3>
            <ul>{interpretation.map((point, i) => <li key={i}>{point}</li>)}</ul>
          </>
        )}
      </section>

      <section className="lesson-section">
        <h2>2. While you read</h2>
        <ol className="lesson-tasks">
          <li>Underline the one sentence that best states what happened. Compare it with: &ldquo;{deep.executive_summary?.one_sentence}&rdquo;</li>
          <li>Circle every source the article names. How many are named, and how many are anonymous?</li>
          {techniques.length > 0 && (
            <li>
              Each passage below was flagged during analysis. For each one, decide what the writer is doing and whether it is fair:
              <ul className="lesson-quotes">
                {techniques.map((t, i) => <li key={i}>&ldquo;{t.quote}&rdquo;</li>)}
              </ul>
            </li>
          )}
          {claims.length > 0 && (
            <li>
              Choose one claim and find an independent source that confirms or challenges it. Note who published the source and when.
              <ul className="lesson-quotes">
                {claims.map((c, i) => <li key={i}>&ldquo;{c.quote || c.claim}&rdquo;</li>)}
              </ul>
            </li>
          )}
        </ol>
      </section>

      {wording.length > 0 && (
        <section className="lesson-section">
          <h2>3. Same story, different words</h2>
          <p>Other outlets covered the same event. Compare how each described it. What does each choice make a reader notice or feel?</p>
          <table className="lesson-table">
            <thead><tr><th>What is being described</th><th>Outlet</th><th>Words used</th></tr></thead>
            <tbody>
              {wording.flatMap((w: any, i: number) =>
                Object.entries(w.variations || {}).map(([outlet, words], j) => (
                  <tr key={`${i}-${j}`}>
                    {j === 0 && <td rowSpan={Object.keys(w.variations).length}>{w.concept}</td>}
                    <td>{outlet}</td>
                    <td>{String(words)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      <section className="lesson-section">
        <h2>{wording.length > 0 ? '4' : '3'}. Discuss</h2>
        <ol>
          {questions.map((q, i) => <li key={i}>{q}</li>)}
          {omissions[0] && <li>What does the article leave out? One possibility: {omissions[0].replace(/[.?!]?$/, '.')} Why might that matter?</li>}
        </ol>
        {deep.reader_guidance?.media_literacy_lesson && (
          <p className="lesson-takeaway"><strong>Takeaway:</strong> {deep.reader_guidance.media_literacy_lesson}</p>
        )}
      </section>

      <section className="lesson-section lesson-key">
        <h2>Answer key</h2>
        {techniques.length === 0 ? (
          <p>No misleading techniques were found in the outlet&apos;s own wording. A good discussion point: what makes this careful reporting?</p>
        ) : (
          <ul>
            {techniques.map((t, i) => (
              <li key={i}>
                <strong>{t.name}:</strong> &ldquo;{t.quote}&rdquo; {t.why}
                {t.fair && <> <em>Fairer version:</em> {t.fair}</>}
              </li>
            ))}
          </ul>
        )}
        {claims.some((c) => c.checked) && (
          <>
            <h3>What independent sources said</h3>
            <ul>
              {claims.filter((c) => c.checked).map((c, i) => (
                <li key={i}>
                  <strong>{STATUS_LABEL[c.verification_status] || 'Checked'}:</strong> &ldquo;{c.quote || c.claim}&rdquo; {c.notes}
                  {c.sources?.[0] && <span className="lesson-url"> ({c.sources[0].url})</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <p className="lesson-footer">
        From The Daily Authentic, a daily close reading of the most-covered news stories. Method: authentic-reader.netlify.app/method
      </p>
    </div>
  );
};

export default LessonView;
