import { useState, useEffect } from 'react';
import '../styles/FeedContainer.css';
import ArticleCard from './ArticleCard';
import FilterPanel from './FilterPanel';
import SubjectGuide from './SubjectGuide';
import SearchSortBar from './SearchSortBar';
import ArticleAnalysis from './ArticleAnalysis';
import { useArticles } from '../hooks/useArticles';
import { RSSArticle, ContentAnalysisResult, APIArticle } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { compareGuids, extractGuidString } from '../utils/guidUtils';
import { logger } from '../utils/logger';

interface FeedContainerProps {
  isInitialized?: boolean;
  qualityFilters?: {
    muteOutrage: boolean;
    blockDoomscroll: boolean;
    darkMode: boolean;
  };
  onQualityFilterChange?: (filters: {
    muteOutrage: boolean;
    blockDoomscroll: boolean;
  }) => void;
}

interface AnalysisState {
  isOpen: boolean;
  articleId: string | null;
  articleTitle: string;
  articleSource: string;
  articleAuthor?: string;
  articleDate?: string;
  analysis: ContentAnalysisResult | null;
}

const FeedContainer = ({ 
  isInitialized = true, 
  qualityFilters = { 
    muteOutrage: false, 
    blockDoomscroll: false,
    darkMode: false
  },
  onQualityFilterChange
}: FeedContainerProps) => {
  const { isLoggedIn } = useAuth();
  
  const { 
    articles, 
    sources, 
    loading, 
    error, 
    refreshArticles, 
    markAsRead,
    markAsSaved,
    getFullArticle,
    filterArticles,
    activeFilters,
    analyzeArticle,
    sortArticles: sortArticlesHook,
    searchArticles: searchArticlesHook
  } = useArticles();

  const [showSubjectGuide, setShowSubjectGuide] = useState(false);
  const [currentSort, setCurrentSort] = useState<string>('date');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isOpen: false,
    articleId: null,
    articleTitle: '',
    articleSource: '',
    analysis: null
  });
  
  // Add state for analysis errors
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Apply content quality filters based on parent component preferences
  const [displayedArticles, setDisplayedArticles] = useState<RSSArticle[]>([]);
  
  // MOVED OUTSIDE CONDITIONAL: loading time state
  const [loadingTime, setLoadingTime] = useState(0);
  
  // MOVED OUTSIDE CONDITIONAL: loading time effect
  useEffect(() => {
    let intervalId: ReturnType<typeof setTimeout> | null = null;
    
    // Only start the interval if we're in loading state with no articles
    if (loading && articles.length === 0) {
      intervalId = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      // Reset loading time when not in loading state
      setLoadingTime(0);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading, articles.length]);
  
  // Debug loading state
  useEffect(() => {
    console.log("⚡ FeedContainer loading state changed:", loading);
    console.log("⚡ Articles length:", articles.length);
    console.log("⚡ Sources length:", sources.length);
  }, [loading, articles.length, sources.length]);
  
  useEffect(() => {
    if (!articles.length) return;
    
    const filtered = [...articles];
    
    // Apply quality filters - in the future this will use backend filtering
    if (qualityFilters.muteOutrage || qualityFilters.blockDoomscroll) {
      // For now, we'll just show all articles as we transition to the backend
      // Later, we'll implement this with the backend API
    }
    
    setDisplayedArticles(filtered);
  }, [articles, qualityFilters]);
  
  // Handle filter preferences changes
  const handleFilterPreferencesChange = (preferences: {
    muteOutrage: boolean;
    blockDoomscroll: boolean;
  }) => {
    if (onQualityFilterChange) {
      onQualityFilterChange(preferences);
    }
  };
  
  // Function to handle tag/category filtering
  const applyFilters = (filters: string[]) => {
    const sourceFilters = filters.filter(f => 
      sources.some(source => source.name === f)
    );
    
    // Category filters (non-source filters)
    const categoryFilters = filters.filter(f => 
      !sources.some(source => source.name === f)
    );
    
    // Apply filters to the articles
    filterArticles({
      sources: sourceFilters.length > 0 ? sourceFilters : undefined,
      categories: categoryFilters.length > 0 ? categoryFilters : undefined
    });
  };

  // Handle search
  const handleSearch = (query: string) => {
    searchArticlesHook(query);
  };

  // Handle sort
  const handleSort = (sortBy: string) => {
    setCurrentSort(sortBy);
    sortArticlesHook(sortBy);
  };

  // Handle article analysis - now receives the full article object
  const handleAnalyzeArticle = async (article: RSSArticle | APIArticle) => { 
    const articleId = extractGuidString(article.guid || article.link || '');
    logger.info('📊 handleAnalyzeArticle called with GUID:', articleId);
    
    if (!articleId) {
      logger.error('❌ No valid GUID/Link/URL found for analysis');
      setAnalysisError('Could not identify article for analysis');
      return;
    }

    // Clear any previous error
    setAnalysisError(null);
    
    try {
      // Call the hook's analyzeArticle function, which now handles caching and fetching
      logger.info(`📊 Requesting analysis for: ${article.title} (ID: ${articleId})`);
      const analysis = await analyzeArticle(article as RSSArticle); // Type assertion to match expected type
      
      if (!analysis) {
        logger.error(`❌ Analysis returned null/undefined for article ${articleId}`);
        setAnalysisError('Analysis could not be completed.');
        return;
      }
      
      logger.info(`📊 Analysis complete for ${articleId}, showing modal.`);

      // Extract the source name, handling both string and object cases
      const sourceName = typeof article.source === 'string' 
        ? article.source 
        : (article.source as { name: string })?.name || 'Unknown Source';
      
      // Show the analysis modal
      setAnalysisState({
        isOpen: true,
        articleId, // Use the extracted GUID
        articleTitle: article.title,
        articleSource: sourceName,
        articleAuthor: article.author,
        articleDate: article.publishDate,
        analysis
      });
      
    } catch (error: unknown) { // Use unknown instead of any
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`❌ Error analyzing article ${articleId}:`, error);
      setAnalysisError(`Analysis failed: ${errorMessage}`);
    }
  };

  // Close analysis modal
  const handleCloseAnalysis = () => {
    setAnalysisState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Force reset loading if it's been more than 15 seconds
  const handleForceReset = () => {
    console.log("⚠️ Emergency loading reset triggered");
    // Update this to use your actual method to reset loading state
    // This assumes there's a setLoading function from useArticles
    if (loading) {
      // We don't have direct access to setLoading, so you may need to 
      // add a resetLoading function to your useArticles hook
      refreshArticles().catch(e => console.error("Error refreshing articles:", e));
    }
  };

  // Extract unique categories from all articles
  const allCategories = Array.from(
    new Set(articles.flatMap(article => 
      article.categories ? article.categories.map(c => c.toLowerCase()) : []
    ))
  ).filter(Boolean);
  
  // Extract source names for filtering
  const sourceNames = sources.map(source => source.name);

  if (!isInitialized) {
    return (
      <div className="feed-container">
        <div className="loader">
          <div className="loader-spinner"></div>
          <p>Initializing Authentic Reader...</p>
        </div>
      </div>
    );
  }

  // Show loading state (now uses the loadingTime state that's defined at the top level)
  if (loading && articles.length === 0) {
    return (
      <div className="feed-container">
        <div className="loader">
          <div className="loader-spinner"></div>
          <p>Loading articles... {loadingTime > 10 ? `(${loadingTime}s)` : ''}</p>
          
          {loadingTime > 15 && (
            <div className="emergency-reset">
              <p>Loading seems to be taking longer than expected.</p>
              <button 
                className="reset-button"
                onClick={handleForceReset}
              >
                Reset Loading State
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (error && articles.length === 0) {
    return (
      <div className="feed-container">
        <div className="error-message">
          <h3>Error loading articles</h3>
          <p>{error.message}</p>
          <button 
            className="refresh-button" 
            onClick={() => refreshArticles()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2>Your Personalized Feed</h2>
        <p>Content from sources you trust, filtered for what matters to you</p>
        
        <div className="feed-actions">
          <button 
            className="refresh-button" 
            onClick={() => refreshArticles()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Articles'}
          </button>
        </div>
      </div>

      {showSubjectGuide && sources.length > 0 && (
        <SubjectGuide 
          topics={[]}
          sources={sources.map(s => ({
            id: typeof s.id === 'number' ? s.id : 0,
            name: s.name,
            reliability: 8,
            bias: 'center',
            organizations: []
          }))} 
          title="Your Sources & Topic Analysis"
        />
      )}
      
      <SearchSortBar 
        onSearch={handleSearch}
        onSort={handleSort}
        currentSort={currentSort}
      />
      
      <div className="feed-content">
        <aside className="filter-sidebar">
          <FilterPanel
            activeFilters={[
              ...(activeFilters.sources || []),
              ...(activeFilters.categories || [])
            ]}
            contentTypes={sourceNames}
            categories={allCategories}
            onFilterChange={applyFilters}
            qualityFilters={{
              muteOutrage: qualityFilters.muteOutrage,
              blockDoomscroll: qualityFilters.blockDoomscroll
            }}
            onQualityFilterChange={handleFilterPreferencesChange}
            availableSources={sourceNames}
            availableCategories={allCategories}
            initialFilters={{
              sources: activeFilters.sources || [],
              categories: activeFilters.categories || []
            }}
          />
          
          <div className="subject-guide-toggle">
            <button 
              onClick={() => setShowSubjectGuide(!showSubjectGuide)}
              className="toggle-guide-btn"
            >
              {showSubjectGuide ? 'Hide' : 'Show'} Source Analysis
            </button>
          </div>
        </aside>
        
        <div className="articles-grid">
          {loading && !articles.length ? (
            <div className="loading-state">
              <div className="loader-spinner"></div>
              <p>Loading articles for you...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <h3>Error Loading Articles</h3>
              <p>{error.message || 'Unknown error'}</p>
              <button onClick={handleForceReset}>Try Again</button>
            </div>
          ) : displayedArticles.length > 0 ? (
            displayedArticles.map((article, index) => {
              // Generate a unique key for each article
              const keyValue = 
                (article as any).id !== undefined ? String((article as any).id) :
                article.guid ? extractGuidString(article.guid) :
                (article as any).url ? `${(article as any).url}-${index}` :
                `article-${index}-${Math.random().toString(36).substring(2, 15)}`;
              
              // Use the compareGuids function to demonstrate usage (removing unused error)
              if (article.guid && articles.length > 1 && index > 0) {
                // Compare adjacent articles to check for duplicates - important for UX
                const prevGuid = articles[index - 1].guid;
                if (article.guid && prevGuid && typeof article.guid === 'string' && typeof prevGuid === 'string') {
                  const isDuplicate = compareGuids(article.guid, prevGuid);
                  
                  if (isDuplicate) {
                    logger.debug('Duplicate article detected by GUID comparison');
                  }
                }
              }
              
              return (
                <ArticleCard 
                  key={keyValue} 
                  article={article as any} // Type assertion until we align component types
                  onRead={markAsRead}
                  onSave={markAsSaved}
                  onGetFullContent={getFullArticle}
                  onAnalyze={() => handleAnalyzeArticle(article)}
                />
              );
            })
          ) : (
            <div className="no-articles">
              <h3>No articles found</h3>
              <p>Try adjusting your filters or refresh to load new content.</p>
              <button className="refresh-button" onClick={refreshArticles}>
                Refresh Articles
              </button>
            </div>
          )}
          
          {/* Loading more indicator at bottom of grid */}
          {loading && articles.length > 0 && (
            <div className="loading-more">
              <div className="loader-spinner"></div>
              <p>Loading more articles...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Article Analysis Modal */}
      {analysisState.isOpen && analysisState.analysis && (
        <div className="analysis-modal-overlay">
          <div className="analysis-modal">
            <button 
              className="close-modal-btn" 
              onClick={handleCloseAnalysis}
              aria-label="Close analysis"
            >
              ×
            </button>
            <ArticleAnalysis 
              title={analysisState.articleTitle}
              source={analysisState.articleSource}
              author={analysisState.articleAuthor}
              date={analysisState.articleDate}
              analysis={analysisState.analysis}
              articleId={analysisState.articleId || 'unknown'}
            />
          </div>
        </div>
      )}
      
      {/* Error Toast */}
      {analysisError && (
        <div className="error-toast">
          <div className="error-toast-content">
            <span className="error-icon">⚠️</span>
            <p>{analysisError}</p>
            <button 
              className="close-toast-btn" 
              onClick={() => setAnalysisError(null)}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedContainer;