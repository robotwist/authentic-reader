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

      // Find a left-leaning and right-leaning source for contrast
      const leftSource = relatedSources.find((s: any) => 
        s.category === 'left' || s.category === 'center-left'
      );
      const rightSource = relatedSources.find((s: any) => 
        s.category === 'right' || s.category === 'center-right'
      );

      // If we don't have both, use any two different sources
      const sourceA = leftSource || relatedSources[0];
      const sourceB = rightSource || relatedSources[1] || relatedSources[0];

      if (!sourceA) {
        setError('Not enough sources found for comparison');
        return;
      }

      // Extract framing info for each source
      const framingA = analysis.framing_comparison?.find((f: any) => 
        f.source === sourceA?.name
      );
      const framingB = analysis.framing_comparison?.find((f: any) => 
        f.source === sourceB?.name
      );

      // Build comparison data
      const comparisonData: ComparisonData = {
        sourceA: {
          name: sourceA?.name || 'Source A',
          category: sourceA?.category || 'left',
          headline: sourceA?.title || '',
          url: sourceA?.url,
          keySpins: framingA ? [
            framingA.emphasis && `Emphasizes: ${framingA.emphasis}`,
            framingA.downplayed && `Downplays: ${framingA.downplayed}`,
            framingA.unique_angle && `Unique angle: ${framingA.unique_angle}`
          ].filter(Boolean) : [],
          loadedWords: [],
          framing: framingA?.headline_framing || ''
        },
        sourceB: {
          name: sourceB?.name || 'Source B',
          category: sourceB?.category || 'right',
          headline: sourceB?.title || '',
          url: sourceB?.url,
          keySpins: framingB ? [
            framingB.emphasis && `Emphasizes: ${framingB.emphasis}`,
            framingB.downplayed && `Downplays: ${framingB.downplayed}`,
            framingB.unique_angle && `Unique angle: ${framingB.unique_angle}`
          ].filter(Boolean) : [],
          loadedWords: [],
          framing: framingB?.headline_framing || ''
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
        {/* LEFT COLUMN - Source A */}
        <div className="source-column source-a">
          <div className="column-header">
            <span className="source-name">{comparison.sourceA.name}</span>
            <span className="source-lean">[{getCategoryLabel(comparison.sourceA.category)}]</span>
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

        {/* RIGHT COLUMN - Source B */}
        <div className="source-column source-b">
          <div className="column-header">
            <span className="source-name">{comparison.sourceB.name}</span>
            <span className="source-lean">[{getCategoryLabel(comparison.sourceB.category)}]</span>
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
