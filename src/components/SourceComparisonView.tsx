/**
 * SourceComparisonView - Side-by-Side Source Comparison
 * 
 * Three-column layout:
 * - LEFT: Source A (e.g., left-leaning) with headline + key spin
 * - CENTER: "The Facts" - AI synthesized neutral truth
 * - RIGHT: Source B (e.g., right-leaning) with headline + key spin
 * 
 * Visual Diff: Highlights specific words where spin differs
 * (e.g., "Protest" vs "Riot", "Activist" vs "Agitator")
 */

import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.config';
import './SourceComparisonView.css';

interface SourceData {
  name: string;
  category: 'left' | 'center' | 'right' | 'center-left' | 'center-right';
  headline: string;
  url?: string;
  keySpins: string[];
  loadedWords: string[];
  framing: string;
}

interface LanguageDiff {
  concept: string;
  variations: Record<string, string>;
}

interface ComparisonData {
  sourceA: SourceData;
  sourceB: SourceData;
  neutralFacts: {
    coreFacts: string[];
    context: string;
    disputed: string[];
  };
  languageDiffs: LanguageDiff[];
  generated_at: string;
}

interface Props {
  primaryArticle: {
    title: string;
    content: string;
    source: string;
    url?: string;
  };
  keywords: string[];
  onClose?: () => void;
}

const SourceComparisonView: React.FC<Props> = ({ primaryArticle, keywords, onClose }) => {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparison();
  }, [primaryArticle.title]);

  const fetchComparison = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get related sources
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/ai/compare-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: primaryArticle,
          keywords
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comparison');
      }

      const data = await response.json();
      
      if (!data.success || !data.comparison?.found) {
        setError('No comparable coverage found from other sources');
        return;
      }

      // Transform the API response into our comparison format
      const relatedSources = data.comparison.related_sources || [];
      const analysis = data.comparison.comparison_analysis || {};

      // Filter out sources that match the primary article
      const otherSources = relatedSources.filter((s: any) => 
        s.name !== primaryArticle.source && 
        s.url !== primaryArticle.url &&
        s.title !== primaryArticle.title
      );

      if (otherSources.length === 0) {
        setError('No contrasting sources found');
        return;
      }

      // Find a contrasting source - prefer different political lean
      // Assume primary article is "center" if unknown, look for left or right
      const contrastingSource = 
        otherSources.find((s: any) => s.category === 'left') ||
        otherSources.find((s: any) => s.category === 'right') ||
        otherSources.find((s: any) => s.category === 'center-left') ||
        otherSources.find((s: any) => s.category === 'center-right') ||
        otherSources[0];

      // Get framing info for primary and contrasting source
      const framingPrimary = analysis.framing_comparison?.find((f: any) => 
        f.source === primaryArticle.source
      );
      const framingContrast = analysis.framing_comparison?.find((f: any) => 
        f.source === contrastingSource?.name
      );

      // Build comparison data
      // LEFT = Primary article (what user is reading)
      // RIGHT = Contrasting source (different political lean)
      const comparisonData: ComparisonData = {
        sourceA: {
          name: primaryArticle.source || 'Current Article',
          category: 'center', // Assume center for the article user is reading
          headline: primaryArticle.title || '',
          url: primaryArticle.url,
          keySpins: framingPrimary ? [
            framingPrimary.emphasis && `Emphasizes: ${framingPrimary.emphasis}`,
            framingPrimary.downplayed && `Downplays: ${framingPrimary.downplayed}`,
            framingPrimary.unique_angle && `Unique angle: ${framingPrimary.unique_angle}`
          ].filter(Boolean) : ['This is the article you are currently reading'],
          loadedWords: [],
          framing: framingPrimary?.headline_framing || 'Your current article'
        },
        sourceB: {
          name: contrastingSource?.name || 'Contrasting Source',
          category: contrastingSource?.category || 'unknown',
          headline: contrastingSource?.title || '',
          url: contrastingSource?.url,
          keySpins: framingContrast ? [
            framingContrast.emphasis && `Emphasizes: ${framingContrast.emphasis}`,
            framingContrast.downplayed && `Downplays: ${framingContrast.downplayed}`,
            framingContrast.unique_angle && `Unique angle: ${framingContrast.unique_angle}`
          ].filter(Boolean) : [],
          loadedWords: [],
          framing: framingContrast?.headline_framing || ''
        },
        neutralFacts: {
          coreFacts: analysis.story_core?.common_facts || [
            'Both sources agree on the basic facts of the story.'
          ],
          context: analysis.reader_takeaway?.recommendation || '',
          disputed: analysis.story_core?.disputed_facts || []
        },
        languageDiffs: analysis.language_differences || [],
        generated_at: data.comparison.generated_at || new Date().toISOString()
      };

      setComparison(comparisonData);

    } catch (err) {
      console.error('Comparison fetch failed:', err);
      setError('Failed to load source comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'left': return 'LEFT';
      case 'center-left': return 'CENTER-LEFT';
      case 'center': return 'CENTER';
      case 'center-right': return 'CENTER-RIGHT';
      case 'right': return 'RIGHT';
      default: return category.toUpperCase();
    }
  };

  if (isLoading) {
    return (
      <div className="source-comparison-view loading">
        <div className="comparison-loading-content">
          <div className="comparison-spinner" />
          <p>[ANALYZING MULTIPLE SOURCES...]</p>
          <p className="loading-sub">[SYNTHESIZING NEUTRAL FACTS...]</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="source-comparison-view error">
        <p className="comparison-error">[{error.toUpperCase()}]</p>
        {onClose && (
          <button className="close-button" onClick={onClose}>[CLOSE]</button>
        )}
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  return (
    <div className="source-comparison-view">
      <header className="comparison-header">
        <h2 className="comparison-title">[SOURCE COMPARISON]</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>[CLOSE]</button>
        )}
      </header>

      <div className="comparison-grid">
        {/* LEFT COLUMN - Your Article */}
        <div className="source-column source-a">
          <div className="column-header">
            <span className="source-name">{comparison.sourceA.name}</span>
            <span className="source-lean">[YOUR ARTICLE]</span>
          </div>
          
          <div className="column-content">
            <h3 className="source-headline">{comparison.sourceA.headline}</h3>
            
            {comparison.sourceA.framing && (
              <div className="framing-block">
                <span className="block-label">[FRAMING]</span>
                <p>{comparison.sourceA.framing}</p>
              </div>
            )}
            
            {comparison.sourceA.keySpins.length > 0 && (
              <div className="spin-block">
                <span className="block-label">[KEY SPIN]</span>
                <ul>
                  {comparison.sourceA.keySpins.map((spin, i) => (
                    <li key={i}>{spin}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {comparison.sourceA.url && (
              <a 
                href={comparison.sourceA.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                [READ FULL ARTICLE]
              </a>
            )}
          </div>
        </div>

        {/* CENTER COLUMN - Neutral Facts */}
        <div className="source-column neutral-facts">
          <div className="column-header">
            <span className="source-name">[THE FACTS]</span>
            <span className="source-lean">[AI SYNTHESIZED]</span>
          </div>
          
          <div className="column-content">
            <div className="facts-block">
              <span className="block-label">[AGREED FACTS]</span>
              <ul>
                {comparison.neutralFacts.coreFacts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </div>
            
            {comparison.neutralFacts.disputed.length > 0 && (
              <div className="disputed-block">
                <span className="block-label">[DISPUTED]</span>
                <ul>
                  {comparison.neutralFacts.disputed.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {comparison.neutralFacts.context && (
              <div className="context-block">
                <span className="block-label">[CONTEXT]</span>
                <p>{comparison.neutralFacts.context}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Contrasting Source */}
        <div className="source-column source-b">
          <div className="column-header">
            <span className="source-name">{comparison.sourceB.name}</span>
            <span className="source-lean">[{getCategoryLabel(comparison.sourceB.category)} CONTRAST]</span>
          </div>
          
          <div className="column-content">
            <h3 className="source-headline">{comparison.sourceB.headline}</h3>
            
            {comparison.sourceB.framing && (
              <div className="framing-block">
                <span className="block-label">[FRAMING]</span>
                <p>{comparison.sourceB.framing}</p>
              </div>
            )}
            
            {comparison.sourceB.keySpins.length > 0 && (
              <div className="spin-block">
                <span className="block-label">[KEY SPIN]</span>
                <ul>
                  {comparison.sourceB.keySpins.map((spin, i) => (
                    <li key={i}>{spin}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {comparison.sourceB.url && (
              <a 
                href={comparison.sourceB.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                [READ FULL ARTICLE]
              </a>
            )}
          </div>
        </div>
      </div>

      {/* WORD DIFF SECTION */}
      {comparison.languageDiffs && comparison.languageDiffs.length > 0 && (
        <section className="word-diff-section">
          <h3 className="diff-title">[LANGUAGE DIFFERENCES]</h3>
          <p className="diff-subtitle">Same concept, different words:</p>
          
          <div className="diff-grid">
            {comparison.languageDiffs.map((diff, i) => (
              <div key={i} className="diff-item">
                <span className="diff-concept">{diff.concept}</span>
                <div className="diff-variations">
                  {Object.entries(diff.variations).map(([source, word], j) => (
                    <div key={j} className="variation">
                      <span className="variation-source">{source}:</span>
                      <span className="variation-word">"{word}"</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="comparison-footer">
        <span className="footer-timestamp">
          [GENERATED: {new Date(comparison.generated_at).toLocaleString()}]
        </span>
      </footer>
    </div>
  );
};

export default SourceComparisonView;
