import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReaderView from '../components/ReaderView';
import DeepAnalysisPanel from '../components/DeepAnalysisPanel';
import SourceComparisonView from '../components/SourceComparisonView';
import StorySoFar from '../components/StorySoFar';
import SubscribeBox from '../components/SubscribeBox';
import OpinionView from '../components/OpinionView';
import { API_CONFIG } from '../config/api.config';
import { recordView } from '../lib/stats';
import { BriefingStory, DailyBriefing, FallacyData } from '../types/briefing';
import './DailyBriefingPage.css';

interface ArchiveDate {
  date: string;
  formatted: string;
}

const LEAN_POSITION: Record<string, string> = {
  left: '10%',
  'center-left': '30%',
  center: '50%',
  'center-right': '70%',
  right: '90%'
};

const formatLongDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function storyOrder(briefing: DailyBriefing): string[] {
  return (briefing.order || Object.keys(briefing.topics)).filter((key) => briefing.topics[key]);
}

/** Highlights for the reader view: the stored deep analysis when loaded, else the briefing summary. */
function highlightsFor(story: BriefingStory, deep: any): FallacyData[] {
  if (deep) {
    const rhetorical = (deep.rhetorical_analysis?.manipulation_techniques || []).map((t: any, i: number) => ({
      id: `rhetoric-${i}`,
      type: t.type,
      excerpt: t.quote,
      explanation: t.explanation,
      betterAlternative: t.neutral_rewrite,
      severity: t.severity
    }));
    const emotional = (deep.emotional_manipulation?.techniques_used || []).map((t: any, i: number) => ({
      id: `emotion-${i}`,
      type: t.technique,
      excerpt: t.quote,
      explanation: t.impact,
      severity: t.severity
    }));
    return [...rhetorical, ...emotional].filter((f) => f.excerpt);
  }
  return (story.analysis?.manipulationAnalysis?.logicalFallacies || []).map((f, i) => ({
    id: `fallacy-${i}`,
    type: f.type,
    excerpt: f.location,
    explanation: f.explanation,
    severity: 'medium' as const
  }));
}

const DailyBriefingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDate = searchParams.get('date');
  const selectedKey = searchParams.get('story');
  const showArchive = searchParams.get('view') === 'archive';
  const opinionParam = searchParams.get('opinion');
  const selectedSide = opinionParam === 'left' || opinionParam === 'right' ? opinionParam : null;

  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [archiveDates, setArchiveDates] = useState<ArchiveDate[] | null>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<any>(null);
  const [isLoadingDeep, setIsLoadingDeep] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadBriefing = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const endpoint = requestedDate
        ? `${API_CONFIG.BASE_URL}/api/daily-briefing/archive/${requestedDate}`
        : `${API_CONFIG.BASE_URL}/api/daily-briefing`;
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(response.status === 404 ? 'No briefing was published for this date.' : `Server error ${response.status}`);
      setBriefing(await response.json());
    } catch (error) {
      setBriefing(null);
      setLoadError(error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'The briefing took too long to load.');
    } finally {
      setLoading(false);
    }
  }, [requestedDate]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  useEffect(() => {
    if (!showArchive || archiveDates) return;
    fetch(`${API_CONFIG.BASE_URL}/api/daily-briefing/archive`)
      .then((response) => (response.ok ? response.json() : { dates: [] }))
      .then((data) => setArchiveDates(data.dates || []))
      .catch(() => setArchiveDates([]));
  }, [showArchive, archiveDates]);

  const story = briefing && selectedKey ? briefing.topics[selectedKey] : null;
  const opinion = briefing && selectedSide ? briefing.opinions?.[selectedSide] ?? null : null;

  useEffect(() => {
    if (opinion) window.scrollTo(0, 0);
  }, [opinion]);

  useEffect(() => {
    setDeepAnalysis(null);
    if (!story) return;
    let cancelled = false;
    setIsLoadingDeep(true);
    fetch(`${API_CONFIG.BASE_URL}/api/analysis/analyze-deep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article: { title: story.article.title } })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.success) setDeepAnalysis(data.analysis);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoadingDeep(false);
      });
    window.scrollTo(0, 0);
    return () => {
      cancelled = true;
    };
  }, [story]);

  const highlights = useMemo(() => (story ? highlightsFor(story, deepAnalysis) : []), [story, deepAnalysis]);

  const lastRecordedView = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;
    const view = showArchive || briefing?.isArchive ? 'archive' : opinion && selectedSide ? 'opinion' : story && selectedKey ? 'story' : briefing ? 'home' : null;
    if (!view) return;
    const detail = view === 'story' ? selectedKey : view === 'opinion' ? selectedSide : null;
    const signature = `${view}:${detail || ''}:${requestedDate || ''}`;
    if (lastRecordedView.current === signature) return;
    lastRecordedView.current = signature;
    recordView(view, detail || undefined);
  }, [loading, showArchive, briefing, story, opinion, selectedKey, selectedSide, requestedDate]);

  const navigate = (params: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="daily-briefing-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <h2>Loading the briefing...</h2>
        </div>
      </div>
    );
  }

  if (showArchive) {
    return (
      <div className="daily-briefing-page archive-mode">
        <div className="archive-modal">
          <div className="archive-header">
            <h2>BRIEFING ARCHIVE</h2>
            <button className="close-button" onClick={() => navigate({ view: null })}>(CLOSE)</button>
          </div>
          {archiveDates === null ? (
            <div className="archive-loading"><div className="loading-spinner small" /><p>Loading archive...</p></div>
          ) : archiveDates.length === 0 ? (
            <div className="archive-empty"><p>NO ARCHIVED BRIEFINGS YET.</p></div>
          ) : (
            <div className="archive-list">
              {archiveDates.map(({ date, formatted }) => (
                <button key={date} className="archive-date-button" onClick={() => navigate({ view: null, story: null, date })}>
                  <span className="archive-date-icon">[DATE]</span>
                  <span className="archive-date-text">{formatted}</span>
                  <span className="archive-date-arrow">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="daily-briefing-page dashboard-mode">
        <div className="dashboard-header">
          <h1 className="dashboard-subtitle">THE DAILY AUTHENTIC</h1>
          <div className="error-banner" role="alert">
            <span>[UNAVAILABLE] {loadError || 'The briefing could not be loaded.'}</span>
            <button className="retry-link" onClick={loadBriefing}>(RETRY)</button>
          </div>
          {requestedDate && <button className="back-to-today" onClick={() => navigate({ date: null })}>← Back to today</button>}
        </div>
      </div>
    );
  }

  if (selectedSide && opinion) {
    const related = opinion.relatedStory ? briefing.topics[opinion.relatedStory] : null;
    return (
      <OpinionView
        opinion={opinion}
        relatedLabel={related?.topic}
        onBack={() => navigate({ opinion: null })}
        onOpenStory={related ? () => navigate({ opinion: null, story: opinion.relatedStory }) : undefined}
        onCopyLink={copyLink}
        copied={copied}
      />
    );
  }

  if ((selectedKey && !story) || (selectedSide && !opinion)) {
    return (
      <div className="daily-briefing-page dashboard-mode">
        <div className="dashboard-header">
          <div className="error-banner" role="alert">
            <span>[NOT FOUND] That story is not in this briefing.</span>
            <button className="retry-link" onClick={() => navigate({ story: null })}>(SEE ALL STORIES)</button>
          </div>
        </div>
      </div>
    );
  }

  if (story) {
    const lean = deepAnalysis?.bias_analysis?.political_lean || story.analysis?.biasAnalysis?.direction;
    const leanConfidence = deepAnalysis?.bias_analysis?.confidence ?? (story.analysis?.biasAnalysis ? Math.round(story.analysis.biasAnalysis.confidence * 100) : null);
    const tone = deepAnalysis?.tone;

    return (
      <div className="daily-briefing-page reader-mode">
        <div className="reader-nav">
          <button className="back-button" onClick={() => navigate({ story: null })}>← All stories</button>
          <button className="back-button" onClick={copyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
          {briefing.isArchive && <span className="archive-badge">Archive</span>}
        </div>

        <article className="briefing-article">
          <header className="article-header">
            <div className="topic-badge">
              <span className="topic-label">[{(story.category || 'NEWS').toUpperCase()}] {story.topic.toUpperCase()}</span>
            </div>
            <h1 className="article-title">{story.article.title}</h1>
            <div className="article-meta">
              <span className="article-source">{story.article.source}</span>
              {story.article.publishDate && (
                <span className="article-date">
                  {new Date(story.article.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {tone && <span className="tone-badge">{tone}</span>}
              {story.outlets && story.outlets.length > 1 && <span className="analysis-timestamp">Covered by {story.outlets.length} outlets</span>}
            </div>

            {lean && LEAN_POSITION[lean] && (
              <div className="bias-meter-container" aria-label={`Political lean: ${lean}`}>
                <div className="bias-meter">
                  <span className="bias-label-left">LEFT</span>
                  <div className="bias-track">
                    <div className={`bias-indicator bias-${lean.replace('-', '')}`} style={{ left: LEAN_POSITION[lean] }} />
                  </div>
                  <span className="bias-label-right">RIGHT</span>
                </div>
                <span className="bias-confidence">
                  Leans {lean}{leanConfidence !== null ? ` · ${leanConfidence}% confidence` : ''} · <Link to="/method#bias">how this is judged</Link>
                </span>
              </div>
            )}
          </header>

          {deepAnalysis?.executive_summary && (
            <div className="quick-scan-area">
              <DeepAnalysisPanel analysis={deepAnalysis} isLoading={false} showOnlySummary={true} />
            </div>
          )}

          {selectedKey && <StorySoFar topicKey={selectedKey} currentUrl={story.article.url} />}

          <div className="quick-scan-divider"></div>

          <div className="deep-dive-area">
            <ReaderView articleContent={story.article.content} fallacyData={highlights} />
            {(deepAnalysis || isLoadingDeep) && (
              <DeepAnalysisPanel analysis={deepAnalysis} isLoading={isLoadingDeep} showOnlySummary={false} />
            )}
          </div>

          <SourceComparisonView
            primaryArticle={{
              title: story.article.title,
              content: story.article.content,
              source: story.article.source,
              url: story.article.url
            }}
            keywords={[]}
          />

          <footer className="article-footer">
            <a href={story.article.url} target="_blank" rel="noopener noreferrer" className="original-link">
              [READ THE ORIGINAL AT {story.article.source.toUpperCase()}]
            </a>
          </footer>
        </article>
      </div>
    );
  }

  const keys = storyOrder(briefing);
  const date = briefing.briefingDate || briefing.generatedAt.slice(0, 10);

  return (
    <div className="daily-briefing-page dashboard-mode">
      <div className="dashboard-header">
        <p className="briefing-date">{formatLongDate(date)}</p>
        <h1 className="dashboard-subtitle">{briefing.isArchive ? 'THE ARCHIVE' : 'THE DAILY AUTHENTIC'}</h1>
        <p className="masthead-dek">
          The day&apos;s most-covered stories, read closely for logic, rhetoric, and framing.
          Analyzed once, the same for everyone. <Link to="/method">How this works</Link>
        </p>
        <p className="masthead-meta">
          {keys.length} STORIES
          {briefing.selection ? ` · CHOSEN FROM ${briefing.selection.headlineCount} HEADLINES${briefing.selection.outletCount ? ` ACROSS ${briefing.selection.outletCount} OUTLETS` : ''}` : ''}
          {` · UPDATED ${formatTime(briefing.generatedAt).toUpperCase()}`}
        </p>
        {briefing.isArchive && (
          <button className="back-to-today" onClick={() => navigate({ date: null })}>← Back to today</button>
        )}
      </div>

      <div className="topic-grid">
        {keys.map((key) => {
          const item = briefing.topics[key];
          return (
            <button key={key} className="topic-card" onClick={() => navigate({ story: key })} aria-label={`Read: ${item.article.title}`}>
              <h3 className="card-topic">[{(item.category || 'NEWS').toUpperCase()}] {item.topic}</h3>
              <p className="card-headline">{item.article.title}</p>
              {item.why && <p className="card-dek">{item.why}</p>}
              <div className="card-meta">
                <span className="card-source">{item.article.source}</span>
                {item.outlets && item.outlets.length > 1 && <span className="card-flag">{item.outlets.length} OUTLETS</span>}
                {item.dayCount && item.dayCount > 1 ? (
                  <span className="card-flag">DAY {item.dayCount}</span>
                ) : item.dayCount === 1 ? (
                  <span className="card-flag">NEW STORY</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {briefing.opinions && (briefing.opinions.left || briefing.opinions.right) && (
        <section className="opinion-section" aria-labelledby="opinion-title">
          <h2 id="opinion-title" className="opinion-section-title">[OPINION, WEIGHED]</h2>
          <p className="opinion-section-dek">
            One column from each side of the spectrum, judged on how well it makes its case, not on its conclusion.
          </p>
          <div className="opinion-grid">
            {(['left', 'right'] as const).map((side) => {
              const item = briefing.opinions?.[side];
              if (!item) return null;
              const related = item.relatedStory ? briefing.topics[item.relatedStory] : null;
              return (
                <button key={side} className="topic-card" onClick={() => navigate({ opinion: side })} aria-label={`Read: ${item.article.title}`}>
                  <h3 className="card-topic">[FROM THE {side.toUpperCase()}] {item.article.source}</h3>
                  <p className="card-headline">{item.article.title}</p>
                  <p className="card-dek">{item.thesis}</p>
                  <div className="card-meta">
                    <span className="card-flag">ARGUMENT {item.argumentScore.overall}/100</span>
                    {related && <span className="card-source">On: {related.topic}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="dashboard-actions">
        <button className="archive-button" onClick={() => navigate({ view: 'archive' })}>[ARCHIVE] BROWSE PAST BRIEFINGS</button>
      </div>

      <SubscribeBox />
    </div>
  );
};

export default DailyBriefingPage;
