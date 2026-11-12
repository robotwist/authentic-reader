import React from 'react';
import { Link } from 'react-router-dom';
import ReaderView from './ReaderView';
import { BriefingOpinion, CheckedClaim } from '../types/briefing';
import { argumentVerdict, partVerdict } from '../lib/verdicts';
import './OpinionView.css';

const SIDE_LABEL = { left: 'FROM THE LEFT', right: 'FROM THE RIGHT' } as const;

const STATUS_LABEL: Record<CheckedClaim['verification_status'], string> = {
  verified: '[SUPPORTED BY SOURCES]',
  false: '[CONTRADICTED BY SOURCES]',
  disputed: '[DISPUTED]',
  needs_context: '[NEEDS CONTEXT]',
  unverified: '[NO SOURCE FOUND]'
};

const SCORE_PARTS: Array<[keyof BriefingOpinion['argumentScore'], string]> = [
  ['evidence', 'EVIDENCE'],
  ['logic', 'LOGIC'],
  ['fairness', 'FAIRNESS TO OPPONENTS'],
  ['clarity', 'CLARITY']
];

interface Props {
  opinion: BriefingOpinion;
  relatedLabel?: string;
  onBack: () => void;
  onOpenStory?: () => void;
  onCopyLink: () => void;
  copied: boolean;
}

const OpinionView: React.FC<Props> = ({ opinion, relatedLabel, onBack, onOpenStory, onCopyLink, copied }) => {
  const { article, argumentScore: score } = opinion;
  const highlights = opinion.weaknesses.map((w, i) => ({
    id: `weakness-${i}`,
    type: w.type,
    excerpt: w.quote,
    explanation: w.explanation,
    betterAlternative: w.fair_version,
    severity: w.severity
  }));

  return (
    <div className="daily-briefing-page reader-mode">
      <div className="reader-nav">
        <button className="back-button" onClick={onBack}>← All stories</button>
        <button className="back-button" onClick={onCopyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
      </div>

      <article className="briefing-article opinion-view">
        <header className="article-header">
          <div className="topic-badge">
            <span className="topic-label">[OPINION, WEIGHED] {SIDE_LABEL[opinion.side]}</span>
          </div>
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span className="article-source">{article.source}</span>
            {article.author && <span className="article-date">{article.author}</span>}
            {article.publishDate && (
              <span className="article-date">
                {new Date(article.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
          {relatedLabel && onOpenStory && (
            <p className="opinion-related">
              On today&apos;s story: <button className="opinion-link" onClick={onOpenStory}>{relatedLabel}</button>
            </p>
          )}
        </header>

        <section className="opinion-block opinion-summary">
          <h2 className="opinion-heading">[THE ARGUMENT]</h2>
          <p className="opinion-thesis">{opinion.thesis}</p>

          <div className="opinion-score">
            <p className="opinion-verdict-label">{argumentVerdict(score.overall)}</p>
            <dl className="opinion-score-parts">
              {SCORE_PARTS.map(([key, label]) => (
                <div key={key} className="opinion-part">
                  <dt>{label}</dt>
                  <dd className={`part-${partVerdict(score[key] as number)}`}>{partVerdict(score[key] as number)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="opinion-verdict">{opinion.verdict}</p>
          <p className="context-note">
            Judged on how well the case is made, not on its conclusion. Both columns are held to the same rubric.{' '}
            <Link to="/method#opinion">How this works</Link>
          </p>
        </section>

        {opinion.strengths.length > 0 && (
          <section className="opinion-block">
            <h2 className="opinion-heading">[WHAT IT DOES WELL]</h2>
            {opinion.strengths.map((s, i) => (
              <div key={i} className="opinion-item">
                <p className="opinion-point">{s.point}</p>
                <blockquote className="opinion-quote">&ldquo;{s.quote}&rdquo;</blockquote>
              </div>
            ))}
          </section>
        )}

        <section className="opinion-block">
          <h2 className="opinion-heading">[WHERE IT FALLS SHORT]</h2>
          {opinion.weaknesses.length === 0 ? (
            <p className="opinion-point">No misleading techniques were found in the argument.</p>
          ) : (
            opinion.weaknesses.map((w, i) => (
              <div key={i} className="opinion-item">
                <p className="opinion-type">{w.type.toUpperCase()}{w.severity ? ` · ${w.severity.toUpperCase()}` : ''}</p>
                <blockquote className="opinion-quote">&ldquo;{w.quote}&rdquo;</blockquote>
                <p className="opinion-point">{w.explanation}</p>
                {w.fair_version && <p className="opinion-fair"><span>[FAIRER VERSION]</span> {w.fair_version}</p>}
              </div>
            ))
          )}
        </section>

        {opinion.strongestCounterargument && (
          <section className="opinion-block">
            <h2 className="opinion-heading">[THE STRONGEST REPLY]</h2>
            <p className="opinion-point">{opinion.strongestCounterargument}</p>
          </section>
        )}

        {opinion.claims.length > 0 && (
          <section className="opinion-block">
            <h2 className="opinion-heading">[FACT CHECK]</h2>
            {opinion.claims.map((claim, i) => (
              <div key={i} className={`claim-item status-${claim.verification_status}`}>
                <div className="claim-header">
                  <span className="claim-status">{claim.checked ? STATUS_LABEL[claim.verification_status] : '[NOT YET CHECKED]'}</span>
                </div>
                <p className="claim-text">&ldquo;{claim.quote || claim.claim}&rdquo;</p>
                {claim.notes && <p className="claim-notes">{claim.notes}</p>}
                {claim.sources && claim.sources.length > 0 && (
                  <ul className="claim-sources">
                    {claim.sources.map((source, j) => (
                      <li key={j}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || new URL(source.url).hostname}</a></li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        <div className="quick-scan-divider"></div>
        <div className="deep-dive-area">
          <ReaderView articleContent={article.content} fallacyData={highlights} />
        </div>

        <footer className="article-footer">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="original-link">
            [READ THE ORIGINAL AT {article.source.toUpperCase()}]
          </a>
          <p className="full-text-note">
            Shown in full for reading and analysis, without ads or page clutter. The article belongs to {article.source}, and
            the original remains the authoritative version.{article.republishable ? ' This outlet permits republishing with attribution.' : ''}{' '}
            Publishers can <Link to="/method#full-text">request removal</Link>.
          </p>
        </footer>
      </article>
    </div>
  );
};

export default OpinionView;
