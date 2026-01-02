/**
 * SourceComparisonView - Side-by-Side Source Comparison
 * 
 * Three-column layout with collapsible sections:
 * - LEFT: Your Article (what you're reading)
 * - CENTER: "The Facts" - AI synthesized neutral truth
 * - RIGHT: Contrasting Source (different political lean)
 * 
 * Visual Diff: Highlights specific words where spin differs
 */

import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.config';
import './SourceComparisonView.css';

/**
 * Format article content for display
 * Handles both plain text and HTML content
 */
const formatArticleContent = (content: string): React.ReactNode[] => {
  if (!content) return [];
  
  // Check if content contains HTML tags
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  
  if (hasHtml) {
    // Strip HTML tags and convert to plain text paragraphs
    const textContent = content
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split into paragraphs (double newlines or sentence boundaries)
    const paragraphs = textContent
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (paragraphs.length === 0) {
      return [<p key="0">{textContent}</p>];
    }
    
    return paragraphs.map((para, i) => (
      <p key={i}>{para}</p>
    ));
  } else {
    // Plain text - split by newlines
    const paragraphs = content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (paragraphs.length === 0) {
      return [<p key="0">{content}</p>];
    }
    
    return paragraphs.map((para, i) => (
      <p key={i}>{para}</p>
    ));
  }
};

interface SourceData {
  name: string;
  category: string;
  headline: string;
  url?: string;
  content?: string; // Full article content
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
  allSources: Array<{ name: string; category: string; title: string; url?: string }>;
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
  
  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['your-article', 'facts', 'contrast', 'language-diffs', 'all-sources'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  useEffect(() => {
    fetchComparison();
  }, [primaryArticle.title]);

  const fetchComparison = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/ai/compare-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: primaryArticle,
          keywords
        })
      });

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.success || !data.comparison?.found) {
        setError('No comparable coverage found from other sources');
        return;
      }

      const relatedSources = data.comparison.related_sources || [];
      const analysis = data.comparison.comparison_analysis || {};

      // Filter out sources that match the primary article
      const otherSources = relatedSources.filter((s: any) => {
        const nameMatch = s.name?.toLowerCase() === primaryArticle.source?.toLowerCase();
        const urlMatch = s.url === primaryArticle.url;
        const titleMatch = s.title === primaryArticle.title;
        return !nameMatch && !urlMatch && !titleMatch;
      });

      if (otherSources.length === 0) {
        setError('No contrasting sources found for comparison');
        return;
      }

      // Find a contrasting source - prefer different political lean
      const contrastingSource = 
        otherSources.find((s: any) => s.category === 'left') ||
        otherSources.find((s: any) => s.category === 'right') ||
        otherSources.find((s: any) => s.category === 'center-left') ||
        otherSources.find((s: any) => s.category === 'center-right') ||
        otherSources.find((s: any) => s.category === 'international') ||
        otherSources[0];

      // Get framing info - try multiple matching strategies
      const framingPrimary = analysis.framing_comparison?.find((f: any) => 
        f.source?.toLowerCase() === primaryArticle.source?.toLowerCase() ||
        f.source?.includes(primaryArticle.source) ||
        primaryArticle.source?.includes(f.source)
      );
      
      const framingContrast = analysis.framing_comparison?.find((f: any) => 
        f.source?.toLowerCase() === contrastingSource?.name?.toLowerCase() ||
        f.source?.includes(contrastingSource?.name) ||
        contrastingSource?.name?.includes(f.source)
      );

      // Build comparison data
      const comparisonData: ComparisonData = {
        sourceA: {
          name: primaryArticle.source || 'Current Article',
          category: 'your-source',
          headline: primaryArticle.title || '',
          url: primaryArticle.url,
          content: primaryArticle.content || '', // Full article content
          keySpins: framingPrimary ? [
            framingPrimary.emphasis && `Emphasizes: ${framingPrimary.emphasis}`,
            framingPrimary.downplayed && `Downplays: ${framingPrimary.downplayed}`,
            framingPrimary.unique_angle && `Unique angle: ${framingPrimary.unique_angle}`
          ].filter(Boolean) as string[] : [],
          loadedWords: [],
          framing: framingPrimary?.headline_framing || ''
        },
        sourceB: {
          name: contrastingSource?.name || 'Contrasting Source',
          category: contrastingSource?.category || 'unknown',
          headline: contrastingSource?.title || '',
          url: contrastingSource?.url,
          content: contrastingSource?.content || '', // Full article content
          keySpins: framingContrast ? [
            framingContrast.emphasis && `Emphasizes: ${framingContrast.emphasis}`,
            framingContrast.downplayed && `Downplays: ${framingContrast.downplayed}`,
            framingContrast.unique_angle && `Unique angle: ${framingContrast.unique_angle}`
          ].filter(Boolean) as string[] : [],
          loadedWords: [],
          framing: framingContrast?.headline_framing || ''
        },
        neutralFacts: {
          coreFacts: analysis.story_core?.common_facts || [
            'Both sources cover the same underlying story.'
          ],
          context: analysis.reader_takeaway?.recommendation || '',
          disputed: analysis.story_core?.disputed_facts || []
        },
        languageDiffs: analysis.language_differences || [],
        allSources: otherSources.map((s: any) => ({
          name: s.name,
          category: s.category,
          title: s.title,
          url: s.url
        })),
        generated_at: data.comparison.generated_at || new Date().toISOString()
      };

      setComparison(comparisonData);

    } catch (err) {
      console.error('Comparison fetch failed:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load source comparison';
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // Network error (CORS, connection failure, etc.)
        errorMessage = 'Network error: Unable to connect to the server. Please check your connection.';
      } else if (err instanceof Error) {
        // Use the error message from the API or the caught error
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="source-comparison-view loading">
        <div className="comparison-loading-content">
          <div className="comparison-spinner" />
          <p>[SEARCHING SOURCES...]</p>
          <p className="loading-sub">[ANALYZING FRAMING DIFFERENCES...]</p>
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
        <div className="header-actions">
          <span className="source-count">{comparison.allSources.length + 1} SOURCES</span>
          {onClose && (
            <button className="close-button" onClick={onClose}>[CLOSE]</button>
          )}
        </div>
      </header>

      {/* SIDE-BY-SIDE COMPARISON: YOUR ARTICLE */}
      <section className="comparison-section">
        <header 
          className="section-header clickable"
          onClick={() => toggleSection('your-article')}
        >
          <h3 className="section-title">
            [YOUR ARTICLE] {comparison.sourceA.name}
          </h3>
          <span className="section-toggle">
            {expandedSections.has('your-article') ? '[-]' : '[+]'}
          </span>
        </header>
        
        {expandedSections.has('your-article') && (
          <div className="section-content">
            <h4 className="source-headline">{comparison.sourceA.headline}</h4>
            
            {comparison.sourceA.framing && (
              <div className="info-block">
                <span className="block-label">[FRAMING]</span>
                <p>{comparison.sourceA.framing}</p>
              </div>
            )}
            
            {comparison.sourceA.keySpins.length > 0 && (
              <div className="info-block">
                <span className="block-label">[KEY SPIN]</span>
                <ul>
                  {comparison.sourceA.keySpins.map((spin, i) => (
                    <li key={i}>{spin}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {comparison.sourceA.content && (
              <div className="info-block article-content">
                <span className="block-label">[FULL ARTICLE]</span>
                <div className="article-text">
                  {formatArticleContent(comparison.sourceA.content)}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SIDE-BY-SIDE COMPARISON: CONTRASTING SOURCE */}
      <section className="comparison-section contrast-section">
        <header 
          className="section-header clickable"
          onClick={() => toggleSection('contrast')}
        >
          <h3 className="section-title">
            [CONTRAST] {comparison.sourceB.name}
          </h3>
          <span className="section-toggle">
            {expandedSections.has('contrast') ? '[-]' : '[+]'}
          </span>
        </header>
        
        {expandedSections.has('contrast') && (
          <div className="section-content">
            <h4 className="source-headline">{comparison.sourceB.headline}</h4>
            
            {comparison.sourceB.framing && (
              <div className="info-block">
                <span className="block-label">[FRAMING]</span>
                <p>{comparison.sourceB.framing}</p>
              </div>
            )}
            
            {comparison.sourceB.keySpins.length > 0 && (
              <div className="info-block">
                <span className="block-label">[KEY SPIN]</span>
                <ul>
                  {comparison.sourceB.keySpins.map((spin, i) => (
                    <li key={i}>{spin}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {comparison.sourceB.content && (
              <div className="info-block article-content">
                <span className="block-label">[FULL ARTICLE]</span>
                <div className="article-text">
                  {formatArticleContent(comparison.sourceB.content)}
                </div>
              </div>
            )}
            
            {comparison.sourceB.url && (
              <a 
                href={comparison.sourceB.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                [READ ORIGINAL SOURCE]
              </a>
            )}
          </div>
        )}
      </section>

      {/* LANGUAGE DIFFERENCES SECTION - ELEVATED PROMINENCE */}
      {comparison.languageDiffs && comparison.languageDiffs.length > 0 && (
        <section className="comparison-section language-diffs-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('language-diffs')}
          >
            <h3 className="section-title">
              [LANGUAGE DIFFERENCES] 
              <span className="count-badge">{comparison.languageDiffs.length}</span>
            </h3>
            <span className="section-toggle">
              {expandedSections.has('language-diffs') ? '[-]' : '[+]'}
            </span>
          </header>
          
          {expandedSections.has('language-diffs') && (
            <div className="section-content">
              <p className="section-subtitle">Same concept, different words:</p>
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
            </div>
          )}
        </section>
      )}

      {/* THE FACTS SECTION - CONSENSUS FACTS */}
      <section className="comparison-section facts-section">
        <header 
          className="section-header clickable"
          onClick={() => toggleSection('facts')}
        >
          <h3 className="section-title">[THE FACTS] AI SYNTHESIZED</h3>
          <span className="section-toggle">
            {expandedSections.has('facts') ? '[-]' : '[+]'}
          </span>
        </header>
        
        {expandedSections.has('facts') && (
          <div className="section-content">
            <div className="info-block">
              <span className="block-label">[AGREED FACTS]</span>
              <ul>
                {comparison.neutralFacts.coreFacts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </div>
            
            {comparison.neutralFacts.disputed.length > 0 && (
              <div className="info-block disputed">
                <span className="block-label">[DISPUTED]</span>
                <ul>
                  {comparison.neutralFacts.disputed.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {comparison.neutralFacts.context && (
              <div className="info-block context">
                <span className="block-label">[RECOMMENDATION]</span>
                <p>{comparison.neutralFacts.context}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ALL SOURCES FOUND */}
      {comparison.allSources.length > 1 && (
        <section className="comparison-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('all-sources')}
          >
            <h3 className="section-title">
              [OTHER SOURCES FOUND]
              <span className="count-badge">{comparison.allSources.length}</span>
            </h3>
            <span className="section-toggle">
              {expandedSections.has('all-sources') ? '[-]' : '[+]'}
            </span>
          </header>
          
          {expandedSections.has('all-sources') && (
            <div className="section-content">
              <div className="sources-list">
                {comparison.allSources.map((source, i) => (
                  <div key={i} className="source-item">
                    <div className="source-meta">
                      <span className="source-name">{source.name}</span>
                    </div>
                    <p className="source-title">{source.title}</p>
                    {source.url && (
                      <a 
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-link-small"
                      >
                        [READ]
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
