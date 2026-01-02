import React, { useState, useMemo, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { FallacyData } from '../utils/llmParser';
import { Analysis } from '../types/Article';
import './ReaderView.css';

interface ReaderViewProps {
  articleContent: string; // HTML content
  fallacyData?: FallacyData[];
  analysis?: Analysis; // Rich LLM analysis payload from Postgres
}

const ReaderView: React.FC<ReaderViewProps> = ({ 
  articleContent, 
  fallacyData = [],
  analysis
}) => {
  const [activeFallacyId, setActiveFallacyId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Convert Analysis fallacies to FallacyData format for display
  const analysisFallacies = useMemo(() => {
    if (!analysis?.fallacies) return [];
    return analysis.fallacies.map((fallacy, index) => ({
      id: `analysis-fallacy-${index}`,
      type: fallacy.type,
      excerpt: fallacy.quote,
      explanation: fallacy.why_it_matters,
      severity: (fallacy.severity?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
      betterAlternative: fallacy.better_alternative,
      missingContext: fallacy.missing_context
    }));
  }, [analysis]);

  // Merge fallacyData with analysis fallacies (analysis takes precedence)
  const allFallacies = useMemo(() => {
    if (analysisFallacies.length > 0) return analysisFallacies;
    return fallacyData;
  }, [analysisFallacies, fallacyData]);

  // Find active fallacy from merged list
  const activeFallacy = useMemo(() => {
    if (!activeFallacyId || !allFallacies) return null;
    return allFallacies.find(f => f.id === activeFallacyId) || null;
  }, [activeFallacyId, allFallacies]);

  // Sanitize and inject fallacy triggers into HTML
  const processedHtml = useMemo(() => {
    if (!articleContent) return '';

    // If content appears to be plain text (no HTML tags), format it into paragraphs
    let formattedContent = articleContent;
    if (!/<[a-z][\s\S]*>/i.test(articleContent)) {
      // First try splitting on double newlines
      let paragraphs = formattedContent
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
      
      // If no double newlines, try splitting on sentence boundaries (period + space + capital)
      if (paragraphs.length === 1 && paragraphs[0].length > 200) {
        paragraphs = formattedContent
          .replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2')
          .split(/\n\n+/)
          .map(p => p.trim())
          .filter(p => p.length > 20); // Filter out very short fragments
      }
      
      // Format into HTML paragraphs
      if (paragraphs.length > 0) {
        formattedContent = paragraphs.map(p => `<p>${p}</p>`).join('\n');
      } else {
        formattedContent = `<p>${formattedContent}</p>`;
      }
    }

    // Sanitize HTML for security (preserve formatting)
    const sanitized = DOMPurify.sanitize(formattedContent, {
      ALLOWED_TAGS: [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'br', 'strong', 'em', 'b', 'i', 'u', 'sub', 'sup',
        'blockquote', 'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'a', 'span', 'div', 'article', 'section',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'code', 'pre', 'hr'
      ],
      ALLOWED_ATTR: ['href', 'class', 'id', 'title', 'alt'],
      KEEP_CONTENT: true
    });

    // If no fallacies, return sanitized HTML as-is
    if (!allFallacies || allFallacies.length === 0) {
      return sanitized;
    }

    // Create a temporary DOM to work with
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, 'text/html');
    const body = doc.body || doc.documentElement;

    // Normalize text for searching (handles HTML entities)
    const normalizeForSearch = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    };

    // Walk through text nodes and wrap matches
    const walkAndWrap = (node: Node, fallacy: FallacyData): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent || '';
        if (!textContent.trim() || !fallacy.excerpt) return;

        const normalizedText = textContent.toLowerCase();
        const normalizedSearch = normalizeForSearch(fallacy.excerpt);
        const searchIndex = normalizedText.indexOf(normalizedSearch);

        if (searchIndex !== -1) {
          const parent = node.parentNode;
          if (!parent) return;

          // Split the text node
          const beforeText = textContent.substring(0, searchIndex);
          const matchLength = fallacy.excerpt.length;
          const matchText = textContent.substring(searchIndex, searchIndex + matchLength);
          const afterText = textContent.substring(searchIndex + matchLength);

          // Create new nodes
          if (beforeText) {
            parent.insertBefore(doc.createTextNode(beforeText), node);
          }

          // Create fallacy trigger span
          const triggerSpan = doc.createElement('span');
          triggerSpan.className = 'fallacy-trigger';
          triggerSpan.setAttribute('data-fid', fallacy.id);
          triggerSpan.setAttribute('role', 'button');
          triggerSpan.setAttribute('tabindex', '0');
          triggerSpan.setAttribute('aria-label', `Fallacy detected: ${fallacy.type}. Click to view details.`);
          triggerSpan.appendChild(doc.createTextNode(matchText));

          parent.insertBefore(triggerSpan, node);

          if (afterText) {
            parent.insertBefore(doc.createTextNode(afterText), node);
          }

          // Remove original node
          parent.removeChild(node);
        }
      } else {
        // Recursively process child nodes
        const children = Array.from(node.childNodes);
        children.forEach(child => walkAndWrap(child, fallacy));
      }
    };

    // Process each fallacy - use allFallacies for proper ID mapping
    allFallacies.forEach((fallacy) => {
      if (!fallacy.excerpt) return;
      
      const children = Array.from(body.childNodes);
      children.forEach(child => walkAndWrap(child, fallacy));
    });

    return body.innerHTML;
  }, [articleContent, allFallacies]);

  // Handle clicks on fallacy triggers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trigger = target.closest('.fallacy-trigger') as HTMLElement;
      
      if (trigger) {
        const fallacyId = trigger.getAttribute('data-fid');
        if (fallacyId) {
          e.stopPropagation();
          setActiveFallacyId(activeFallacyId === fallacyId ? null : fallacyId);
        }
      } else {
        // Click outside - close sidebar if clicking on main content
        const sidebar = sidebarRef.current;
        if (sidebar && !sidebar.contains(target)) {
          setActiveFallacyId(null);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('fallacy-trigger')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const fallacyId = target.getAttribute('data-fid');
          if (fallacyId) {
            setActiveFallacyId(activeFallacyId === fallacyId ? null : fallacyId);
          }
        }
      }
      
      // Close on Escape
      if (e.key === 'Escape' && activeFallacyId) {
        setActiveFallacyId(null);
      }
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFallacyId]);

  return (
    <div className="reader-view" ref={containerRef}>
      <div className="reader-content-wrapper">
        <div 
          className="reader-content prose"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />

        {/* Educational Insight Section - Receipt Style */}
        {analysis?.educational_insight && (
          <div className="analysis-educational-insight">
            <div className="receipt-section-header">
              <span className="receipt-section-label">EDUCATIONAL_INSIGHT</span>
            </div>
            <p className="receipt-section-text">{analysis.educational_insight}</p>
          </div>
        )}

        {/* Analysis Summary Section - Receipt Style */}
        {analysis?.summary && (
          <div className="analysis-summary-section">
            <div className="receipt-section-header">
              <span className="receipt-section-label">SUMMARY</span>
            </div>
            <p className="receipt-section-text">{analysis.summary}</p>
          </div>
        )}
      </div>
      
      {/* Sidebar for fallacy analysis */}
      {activeFallacy && (
        <div 
          className="fallacy-sidebar"
          ref={sidebarRef}
          role="dialog"
          aria-labelledby="fallacy-sidebar-title"
          aria-modal="true"
        >
          <div className="fallacy-sidebar-header">
            <h2 id="fallacy-sidebar-title" className="fallacy-sidebar-title">
              [PATTERN_DETECTED]
            </h2>
            <button
              className="fallacy-sidebar-close"
              onClick={() => setActiveFallacyId(null)}
              aria-label="Close sidebar"
            >
              [CLOSE_VIEW]
            </button>
          </div>

          <div className="fallacy-sidebar-content">
            <div className="fallacy-type-label">
              TYPE: {activeFallacy.type.toUpperCase()}
            </div>
            
            {activeFallacy.explanation && (
              <div className="fallacy-section">
                <h3 className="fallacy-section-title">EXPLANATION</h3>
                <p className="fallacy-section-text">{activeFallacy.explanation}</p>
              </div>
            )}

            {activeFallacy.mechanism && (
              <div className="fallacy-section">
                <h3 className="fallacy-section-title">MECHANISM</h3>
                <p className="fallacy-section-text">{activeFallacy.mechanism}</p>
              </div>
            )}

            {activeFallacy.motive && (
              <div className="fallacy-section">
                <h3 className="fallacy-section-title">MOTIVE</h3>
                <p className="fallacy-section-text">{activeFallacy.motive}</p>
              </div>
            )}

            {/* Missing Context - Warning Box */}
            {activeFallacy.missingContext && (
              <div className="fallacy-section fallacy-missing-context">
                <div className="missing-context-header">
                  <span className="missing-context-icon">⚠️</span>
                  <h3 className="fallacy-section-title">MISSING_CONTEXT</h3>
                </div>
                <p className="missing-context-text">{activeFallacy.missingContext}</p>
              </div>
            )}

            {/* Better Alternative - Neutral Rewrite */}
            {activeFallacy.betterAlternative && (
              <div className="fallacy-section fallacy-neutral-rewrite">
                <h3 className="fallacy-section-title neutral-rewrite-label">NEUTRAL REWRITE:</h3>
                <p className="neutral-rewrite-text">{activeFallacy.betterAlternative}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderView;
