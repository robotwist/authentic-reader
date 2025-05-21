import { useState, useEffect, useCallback, useRef } from 'react';
import rssService from '../services/rssService';
import { 
  RSSArticle, 
  RSSSource, 
  ContentAnalysisResult,
  ArticleFilters,
  toRSSArticle,
  ExtractedContent
} from '../types';
import { analyzeContent } from '../services/contentAnalysisService';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveArticles, 
  getArticles, 
  saveSources, 
  getAllSources,
  markArticleAsRead,
  markArticleAsSaved,
  saveArticleAnalysis,
  getArticleAnalysis
} from '../services/storageService';
import { compareGuids, extractGuidString } from '../utils/guidUtils';
import { logger } from '../utils/logger';
import axios from 'axios';

// Base URL for your backend API - use Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'; 

interface UseArticlesReturn {
  articles: RSSArticle[];
  sources: RSSSource[];
  loading: boolean;
  error: Error | null;
  refreshArticles: () => Promise<void>;
  getFullArticle: (url: string) => Promise<ExtractedContent | null>;
  markAsRead: (guid: string) => Promise<void>;
  markAsSaved: (guid: string) => Promise<void>;
  filterArticles: (filters: ArticleFilters) => Promise<void>;
  activeFilters: ArticleFilters;
  analyzeArticle: (article: RSSArticle) => Promise<ContentAnalysisResult>;
  getAnalysis: (articleId: string) => Promise<ContentAnalysisResult | null>;
  sortArticles: (sortBy: string) => void;
  searchArticles: (query: string) => void;
}

export function useArticles(): UseArticlesReturn {
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<RSSArticle[]>([]);
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeFilters, setActiveFilters] = useState<ArticleFilters>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { isLoggedIn } = useAuth();
  
  // Use refs to avoid circular dependencies in useEffect
  const sourcesRef = useRef<RSSSource[]>([]);
  
  // Update ref when sources state changes
  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  // Function to refresh articles - defined outside useEffect to avoid deps issues
  const refreshArticles = useCallback(async (): Promise<void> => {
    const currentSources = sourcesRef.current;
    
    if (!currentSources || currentSources.length === 0) {
      logger.info("📌 refreshArticles: No sources available, returning early");
      return;
    }
    
    try {
      logger.info("📌 refreshArticles: Starting refresh with", currentSources.length, "sources");
      setLoading(true);
      setError(null);
      
      // Set a global timeout for the entire refresh operation
      const timeoutPromise = new Promise<RSSArticle[][]>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Article refresh operation timed out after 20 seconds'));
        }, 20000); // Increased timeout to 20 seconds
      });
      
      // Create a race-protected version of each article fetching promise
      const articlePromises = currentSources.map(async (source) => {
        try {
          logger.info(`📌 Fetching articles from source: ${source.name}`);
          
          // Create a timeout promise for this specific source
          const sourceTimeoutPromise = new Promise<RSSArticle[]>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Timeout fetching from ${source.name} after 8 seconds`));
            }, 8000); // Increased timeout to 8 seconds
          });
          
          // Check if source id exists and is valid
          if (source.id !== undefined && source.id !== null) {
            try {
              // Race between fetch and timeout
              return await Promise.race([
                rssService.getArticlesFromSource(source.id),
                sourceTimeoutPromise
              ]);
            } catch (apiError) {
              logger.warn(`API error fetching from source ${source.name}, falling back to direct RSS:`, apiError);
              // Only fall back to direct fetch if we have a URL
              if (source.url) {
                return await Promise.race([
                  rssService.getArticlesFromUrl(source.url),
                  sourceTimeoutPromise
                ]);
              } else {
                logger.error(`No URL available for source ${source.name}, skipping...`);
                return [] as RSSArticle[];
              }
            }
          } else if (source.url) {
            // If no ID but we have a URL, fetch directly from URL with timeout
            return await Promise.race([
              rssService.getArticlesFromUrl(source.url),
              sourceTimeoutPromise
            ]);
          } else {
            logger.error(`No ID or URL available for source ${source.name}, skipping...`);
            return [] as RSSArticle[];
          }
        } catch (error) {
          logger.error(`Error fetching articles from ${source.name}:`, error);
          return [] as RSSArticle[];
        }
      });
      
      logger.info("📌 Waiting for all article promises to resolve (with global timeout)");
      
      // Race between all article fetches and the global timeout
      // Make sure Promise.all doesn't fail if some sources fail
      const articlesBySource = await Promise.race([
        Promise.allSettled(articlePromises).then(results => 
          results.map(result => 
            result.status === 'fulfilled' ? result.value : []
          )
        ),
        timeoutPromise
      ]);
      
      const freshArticles = articlesBySource.flat();
      logger.info(`📌 Total articles fetched: ${freshArticles.length}`);
      
      // After fetching articles, add this debugging

      // Add URL debugging
      freshArticles.forEach((article, index) => {
        if (index < 5) { // Limit to first 5 articles to avoid console spam
          logger.debug(`Article ${index} URL info:`, {
            url: article.url,
            link: (article as any).link,
            guid: (article as any).guid
          });
        }
      });
      
      // Update state
      setArticles(freshArticles);
      setFilteredArticles(freshArticles);
      
      // Save to local storage as a fallback
      try {
        logger.info("📌 Saving articles to local storage");
        // Convert to the format expected by storage service
        await saveArticles(freshArticles);
      } catch (storageError) {
        logger.warn('Could not save articles to local storage:', storageError);
      }
    } catch (e) {
      logger.error('Error refreshing articles:', e);
      setError(e instanceof Error ? e : new Error('Unknown error refreshing articles'));
      
      // Try to load from local storage as fallback
      try {
        logger.info("📌 Attempting to load articles from local storage");
        const storedArticles = await getArticles();
        if (storedArticles.length > 0) {
          logger.info(`📌 Loaded ${storedArticles.length} articles from storage`);
          
          // Convert to RSSArticle type
          const rssArticles = storedArticles.map(article => toRSSArticle(article));
          setArticles(rssArticles);
          setFilteredArticles(rssArticles);
        }
      } catch (storageError) {
        logger.error('Could not load articles from storage:', storageError);
      }
    } finally {
      logger.info("📌 Setting loading to false in refreshArticles()");
      setLoading(false);
    }
  }, []);

  // Initialize sources and articles
  useEffect(() => {
    let isMounted = true;
    
    async function initialize() {
      logger.info("📌 useArticles initialize() called");
      
      // Set a 20-second timeout for the entire initialization
      const initTimeoutId = setTimeout(() => {
        logger.error("📌 initialize() timed out after 20 seconds");
        if (isMounted) {
          setError(new Error("Initialization timed out. Please try refreshing."));
          setLoading(false);
        }
      }, 20000); // Increased from 15s to 20s
      
      try {
        if (isMounted) setLoading(true);
        
        // Try to get sources from the backend API first
        try {
          logger.info("📌 Attempting to fetch sources from API");
          
          // Set a 8-second timeout for API calls (increased from 5s)
          const apiPromise = rssService.getSources();
          const timeoutPromise = new Promise<RSSSource[]>((_, reject) => {
            setTimeout(() => reject(new Error("API call timed out")), 8000);
          });
          
          // Race between API call and timeout
          const apiSources = await Promise.race([apiPromise, timeoutPromise]);
          logger.info(`📌 API returned ${apiSources?.length || 0} sources`);
          
          if (apiSources && apiSources.length > 0 && isMounted) {
            setSources(apiSources);
            
            // If authenticated, try to get user's sources
            if (isLoggedIn) {
              try {
                logger.info("📌 User is logged in, fetching user sources");
                const userSourcesPromise = rssService.getUserSources();
                const userSourcesTimeout = new Promise<RSSSource[]>((_, reject) => {
                  setTimeout(() => reject(new Error("User sources API timed out")), 8000);
                });
                
                const userSources = await Promise.race([userSourcesPromise, userSourcesTimeout]);
                logger.info(`📌 API returned ${userSources?.length || 0} user sources`);
                
                if (userSources && userSources.length > 0 && isMounted) {
                  setSources(userSources);
                }
              } catch (err) {
                logger.warn('Could not fetch user sources, using all sources:', err);
              }
            }
          }
        } catch (apiError) {
          logger.warn('Backend API not available, falling back to local storage:', apiError);
          
          // Fall back to local storage
          logger.info("📌 Falling back to local storage for sources");
          let storedSources = await getAllSources();
          logger.info(`📌 Local storage has ${storedSources?.length || 0} sources`);
          
          // If no sources are stored, use defaults
          if (!storedSources || storedSources.length === 0) {
            logger.info("📌 No sources in storage, using DEFAULT_SOURCES");
            const DEFAULT_SOURCES: RSSSource[] = [
              { 
                id: 1,
                name: 'NPR News',
                url: 'https://feeds.npr.org/1001/rss.xml',
                category: 'news'
              },
              {
                id: 2,
                name: 'Reuters',
                url: 'https://feeds.reuters.com/reuters/topNews',
                category: 'news'
              },
              {
                id: 3,
                name: 'BBC News',
                url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
                category: 'news'
              },
              {
                id: 4,
                name: 'TechCrunch',
                url: 'https://techcrunch.com/feed/',
                category: 'technology'
              }
            ];
            
            await saveSources(DEFAULT_SOURCES);
            storedSources = DEFAULT_SOURCES;
          }
          
          if (isMounted) {
            setSources(storedSources as RSSSource[]);
          }
        }
        
        // After getting sources, fetch articles - we'll do this in a separate useEffect
        // This breaks the dependency cycle
      } catch (e) {
        logger.error('Error initializing articles:', e);
        if (isMounted) {
          setError(e instanceof Error ? e : new Error('Unknown error initializing articles'));
        }
      } finally {
        clearTimeout(initTimeoutId);
        logger.info("📌 Setting loading to false in initialize()");
        if (isMounted) setLoading(false);
      }
    }
    
    initialize();
    
    // Clean up function
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]); // Removed refreshArticles from dependencies
  
  // Separate effect to handle initial article refresh after sources are loaded
  useEffect(() => {
    let isMounted = true;
    
    // Only run this effect when sources are available and initialization has completed
    if (sources.length > 0 && !loading) {
      const loadArticles = async () => {
        if (isMounted) setLoading(true);
        
        try {
          await refreshArticles();
        } catch (error) {
          logger.error('Error in initial article refresh:', error);
          if (isMounted) {
            setError(error instanceof Error ? error : new Error('Failed to load articles'));
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      
      loadArticles();
    }
    
    return () => {
      isMounted = false;
    };
  }, [sources, refreshArticles]);

  // Function to get full article content via backend API
  const getFullArticle = useCallback(async (url: string): Promise<ExtractedContent | null> => {
    if (!url) return null;
    logger.info(`[Hook] Requesting full content extraction for: ${url}`);
    try {
      // Make API call to the backend /extract endpoint
      const response = await axios.get<ExtractedContent>(`${API_BASE_URL}/articles/extract`, {
        params: { url },
        timeout: 20000 // Timeout for the extraction API call
      });
      logger.info(`[Hook] Received extracted content for ${url}`);
      return response.data;
    } catch (error: any) {
      logger.error(`[Hook] Error fetching/extracting full content via API for ${url}: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }, []);

  // UPDATED Function to analyze article content using backend extraction
  const analyzeArticle = useCallback(async (article: RSSArticle): Promise<ContentAnalysisResult> => {
    const articleGuid = extractGuidString(article.guid || article.link || article.url);
    if (!articleGuid) {
      throw new Error('Could not determine a unique ID for the article.');
    }

    logger.info(`[Hook] analyzeArticle called for GUID: ${articleGuid}`);
    
    try {
      // Check if analysis already exists in storage
      logger.debug(`[Hook] Checking cache for analysis of ${articleGuid}`);
      const existingAnalysis = await getArticleAnalysis(articleGuid);
      if (existingAnalysis) {
        logger.info(`[Hook] Using cached analysis for ${articleGuid}`);
        return existingAnalysis;
      }
      
      logger.info(`[Hook] No cached analysis found for ${articleGuid}. Requesting extraction...`);
      let contentToAnalyze: string | undefined = undefined;
      let contentSource = 'snippet'; // Track where the content came from
      
      // Try to get the article URL
      const articleUrl = article.url || article.link;
      
      if (articleUrl) {
        const extractedData = await getFullArticle(articleUrl); // Use the API call function
        if (extractedData?.textContent) {
          contentToAnalyze = extractedData.textContent; // Use plain text for analysis
          contentSource = 'full_extracted_api';
          logger.info(`[Hook] Successfully extracted full content via API (${contentToAnalyze.length} chars) for ${articleGuid}`);
        } else {
          logger.warn(`[Hook] Full content extraction via API failed for ${articleGuid}. Falling back to snippet.`);
        }
      }

      // Fallback to snippet/summary if full extraction failed or no URL
      if (!contentToAnalyze) {
        contentToAnalyze = article.content || article.contentSnippet || article.summary || '';
        contentSource = article.content ? 'content' : article.contentSnippet ? 'contentSnippet' : 'summary';
        logger.warn(`[Hook] Using fallback content (${contentSource}, ${contentToAnalyze.length} chars) for ${articleGuid}`);
      }

      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
         logger.error(`[Hook] No content available to analyze for article ${articleGuid}`);
         throw new Error('No content available for analysis after attempting fetch and fallback.');
      }
      
      // Perform content analysis using the best available content (via backend service)
      logger.info(`[Hook] Performing analysis on ${contentSource} content (${contentToAnalyze.length} chars) for ${articleGuid}`);
      const analysis = await analyzeContent(contentToAnalyze);
      
      // Save analysis to storage
      logger.debug(`[Hook] Saving analysis result for ${articleGuid}`);
      await saveArticleAnalysis(articleGuid, analysis);
      
      return analysis;
    } catch (e) {
      logger.error(`[Hook] Error in analyzeArticle for ${articleGuid}:`, e);
      throw e instanceof Error ? e : new Error('Unknown error analyzing article');
    }
  }, [getFullArticle]); // Add getFullArticle as dependency

  // Function to get article analysis
  const getAnalysis = useCallback(async (articleGuid: string): Promise<ContentAnalysisResult | null> => {
    try {
      return await getArticleAnalysis(articleGuid);
    } catch (e) {
      logger.error('Error getting article analysis:', e);
      return null;
    }
  }, []);

  // Function to mark article as read
  const markAsRead = useCallback(async (guid: string) => {
    try {
      // If the user is logged in, use the API
      if (isLoggedIn) {
        await rssService.markAsRead(guid);
      } else {
        // Otherwise, use local storage
        await markArticleAsRead(guid, true);
      }
      
      // Update local state
      const updatedArticles = articles.map(article => 
        compareGuids(article.guid, guid) ? { ...article, isRead: true } : article
      );
      
      setArticles(updatedArticles);
      setFilteredArticles(prevFiltered => 
        prevFiltered.map(article => 
          compareGuids(article.guid, guid) ? { ...article, isRead: true } : article
        )
      );
    } catch (e) {
      logger.error('Error marking article as read:', e);
    }
  }, [articles, isLoggedIn]);

  // Function to mark article as saved
  const markAsSaved = useCallback(async (guid: string) => {
    try {
      // If the user is logged in, use the API
      if (isLoggedIn) {
        await rssService.saveArticle(guid);
      } else {
        // Otherwise, use local storage
        await markArticleAsSaved(guid, true);
      }
      
      // Update local state
      const updatedArticles = articles.map(article => 
        compareGuids(article.guid, guid) ? { ...article, isSaved: true } : article
      );
      
      setArticles(updatedArticles);
      setFilteredArticles(prevFiltered => 
        prevFiltered.map(article => 
          compareGuids(article.guid, guid) ? { ...article, isSaved: true } : article
        )
      );
    } catch (e) {
      logger.error('Error marking article as saved:', e);
    }
  }, [articles, isLoggedIn]);

  // Function to filter articles
  const filterArticles = useCallback(async (filters: ArticleFilters) => {
    try {
      setLoading(true);
      setActiveFilters(filters);
      
      // If there are no filters, use all articles
      if (!filters.sources?.length && !filters.categories?.length) {
        setFilteredArticles(articles);
        return;
      }
      
      // Apply filters
      let filteredResults = [...articles];
      
      // Filter by source - handle both string and object sources
      if (filters.sources && filters.sources.length > 0) {
        filteredResults = filteredResults.filter(article => {
          // Check if the article's source matches any of the selected sources
          if (typeof article.source === 'string') {
            return filters.sources!.includes(article.source);
          } else if (article.source && typeof article.source === 'object') {
            // Handle source as an object with a name property
            return filters.sources!.includes((article.source as any).name);
          }
          return false;
        });
      }
      
      // Filter by category
      if (filters.categories && filters.categories.length > 0) {
        filteredResults = filteredResults.filter(article => 
          article.categories && article.categories.some(category => 
            filters.categories!.includes(category.toLowerCase())
          )
        );
      }
      
      // Apply search query if exists
      if (searchQuery) {
        filteredResults = filteredResults.filter(article => 
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setFilteredArticles(filteredResults);
    } catch (e) {
      logger.error('Error filtering articles:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, articles]);

  // Function to search articles
  const searchArticles = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // If query is empty, reset to all articles with current filters
      filterArticles(activeFilters);
      return;
    }
    
    // Apply search query to the currently filtered articles
    const searchedArticles = filteredArticles.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.summary.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredArticles(searchedArticles);
  }, [filteredArticles, activeFilters, filterArticles]); // Add filterArticles dependency

  // Function to sort articles
  const sortArticles = useCallback((sortBy: string) => {
    // Assuming sortBy corresponds to SortOption enum values
    const sortOption = sortBy as SortOption; // Type assertion, consider proper validation
    const sortFn = getSortFunction(sortOption);
    
    // Sort the currently displayed articles
    const sortedArticles = [...filteredArticles].sort(sortFn);
    setFilteredArticles(sortedArticles);
  }, [filteredArticles]);

  return {
    articles: filteredArticles, // Return filtered articles for display
    sources,
    loading,
    error,
    refreshArticles,
    getFullArticle, // Expose the API call function
    markAsRead,
    markAsSaved,
    filterArticles,
    activeFilters,
    analyzeArticle, // Uses the API call indirectly
    getAnalysis,
    sortArticles,
    searchArticles
  };
}

// Helper function to get sort function based on option (assuming this exists elsewhere or needs adding)
import { SortOption } from '../types'; // Assuming SortOption enum is defined

function getSortFunction(option: SortOption) {
  // Placeholder - implement actual sorting logic based on SortOption enum
  switch (option) {
    case SortOption.NEWEST_FIRST:
      return (a: RSSArticle, b: RSSArticle) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime();
    // Add other cases for SortOption...
    default:
      return (a: RSSArticle, b: RSSArticle) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime();
  }
} 