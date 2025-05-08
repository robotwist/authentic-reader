import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FeedItem, Source } from './rssService';
import { ContentAnalysisResult } from '../types';
import { UserPreferences } from '../types';

interface AuthenticReaderDB extends DBSchema {
  articles: {
    key: string;
    value: FeedItem;
    indexes: {
      'by-source': string;
      'by-date': string;
      'by-read-status': boolean;
      'by-saved-status': boolean;
    };
  };
  sources: {
    key: string;
    value: Source;
    indexes: {
      'by-category': string;
    };
  };
  preferences: {
    key: string;
    value: {
      id: string;
      value: any;
    };
  };
  analyses: {
    key: string;
    value: {
      articleId: string;
      analysis: ContentAnalysisResult;
      timestamp: number;
    };
  };
  extractedContent: {
    key: string;
    value: {
      id: string;
      content: string;
      metadata: {
        title: string;
        byline: string;
        siteName: string;
        date: string;
        url: string;
        excerpt: string;
        imageUrl?: string;
      };
      darkPatterns?: {
        patterns: any[];
        score: number;
      };
      timestamp: number;
    };
    indexes: {
      'by-timestamp': number;
    }
  };
  passageAnalyses: {
    key: string;
    value: {
      articleId: string;
      passages: Array<{
        text: string;
        element?: string;
        startIndex: number;
        endIndex: number;
        analyses: {
          bias?: any;
          rhetoric?: any;
          manipulation?: any;
          darkPatterns?: any[];
          keyEntities?: string[];
        }
      }>;
      timestamp: number;
    };
    indexes: {
      'by-article-id': string;
    }
  };
  biasCorpus: {
    key: string;
    value: {
      id: string;
      content: string;
      knownBiases?: any;
      features?: any;
      processed: boolean;
      timestamp: number;
    };
    indexes: {
      'by-timestamp': number;
      'by-processed': boolean;
    }
  };
}

// Database name and version
const DB_NAME = 'authenticReader';
const DB_VERSION = 3; // Incremented to add new stores

// In-memory storage fallback
const inMemoryDB = {
  articles: new Map<string, FeedItem>(),
  sources: new Map<string, Source>(),
  preferences: new Map<string, any>(),
  analyses: new Map<string, { articleId: string; analysis: ContentAnalysisResult; timestamp: number }>(),
  extractedContent: new Map<string, any>(),
  passageAnalyses: new Map<string, any>(),
  biasCorpus: new Map<string, any>()
};

// Create an in-memory fallback that mimics the IDBPDatabase interface
function createInMemoryFallback(): IDBPDatabase<AuthenticReaderDB> {
  return {
    // Basic mock implementation of IDBPDatabase
    objectStoreNames: {
      contains: (name: string) => ['articles', 'sources', 'preferences', 'analyses', 'extractedContent', 'passageAnalyses', 'biasCorpus'].includes(name)
    },
    transaction: (storeNames: string | string[], mode?: 'readonly' | 'readwrite') => {
      return {
        objectStore: (name: string) => createMockObjectStore(name),
        store: createMockObjectStore(Array.isArray(storeNames) ? storeNames[0] : storeNames),
        done: Promise.resolve()
      };
    },
    get: async (storeName: string, key: string) => {
      if (storeName === 'preferences') {
        const value = inMemoryDB.preferences.get(key);
        return value ? { id: key, value } : undefined;
      } else if (storeName === 'articles') {
        return inMemoryDB.articles.get(key);
      } else if (storeName === 'sources') {
        return inMemoryDB.sources.get(key);
      } else if (storeName === 'analyses') {
        return inMemoryDB.analyses.get(key);
      } else if (storeName === 'extractedContent') {
        return inMemoryDB.extractedContent.get(key);
      } else if (storeName === 'passageAnalyses') {
        return inMemoryDB.passageAnalyses.get(key);
      } else if (storeName === 'biasCorpus') {
        return inMemoryDB.biasCorpus.get(key);
      }
    },
    getAll: async (storeName: string) => {
      if (storeName === 'articles') {
        return Array.from(inMemoryDB.articles.values());
      } else if (storeName === 'sources') {
        return Array.from(inMemoryDB.sources.values());
      } else if (storeName === 'analyses') {
        return Array.from(inMemoryDB.analyses.values());
      } else if (storeName === 'extractedContent') {
        return Array.from(inMemoryDB.extractedContent.values());
      } else if (storeName === 'passageAnalyses') {
        return Array.from(inMemoryDB.passageAnalyses.values());
      } else if (storeName === 'biasCorpus') {
        return Array.from(inMemoryDB.biasCorpus.values());
      }
      return [];
    },
    put: async (storeName: string, value: any) => {
      if (storeName === 'preferences') {
        inMemoryDB.preferences.set(value.id, value.value);
      } else if (storeName === 'articles') {
        inMemoryDB.articles.set(value.id, value);
      } else if (storeName === 'sources') {
        inMemoryDB.sources.set(value.id, value);
      } else if (storeName === 'analyses') {
        inMemoryDB.analyses.set(value.articleId, value);
      } else if (storeName === 'extractedContent') {
        inMemoryDB.extractedContent.set(value.id, value);
      } else if (storeName === 'passageAnalyses') {
        inMemoryDB.passageAnalyses.set(value.articleId, value);
      } else if (storeName === 'biasCorpus') {
        inMemoryDB.biasCorpus.set(value.id, value);
      }
      return '';
    },
    delete: async (storeName: string, key: string) => {
      if (storeName === 'preferences') {
        inMemoryDB.preferences.delete(key);
      } else if (storeName === 'articles') {
        inMemoryDB.articles.delete(key);
      } else if (storeName === 'sources') {
        inMemoryDB.sources.delete(key);
      } else if (storeName === 'analyses') {
        inMemoryDB.analyses.delete(key);
      } else if (storeName === 'extractedContent') {
        inMemoryDB.extractedContent.delete(key);
      } else if (storeName === 'passageAnalyses') {
        inMemoryDB.passageAnalyses.delete(key);
      } else if (storeName === 'biasCorpus') {
        inMemoryDB.biasCorpus.delete(key);
      }
    },
    clear: async (storeName: string) => {
      if (storeName === 'preferences') {
        inMemoryDB.preferences.clear();
      } else if (storeName === 'articles') {
        inMemoryDB.articles.clear();
      } else if (storeName === 'sources') {
        inMemoryDB.sources.clear();
      } else if (storeName === 'analyses') {
        inMemoryDB.analyses.clear();
      } else if (storeName === 'extractedContent') {
        inMemoryDB.extractedContent.clear();
      } else if (storeName === 'passageAnalyses') {
        inMemoryDB.passageAnalyses.clear();
      } else if (storeName === 'biasCorpus') {
        inMemoryDB.biasCorpus.clear();
      }
    },
    close: () => {},
    name: 'inMemoryDB',
    version: DB_VERSION
  } as unknown as IDBPDatabase<AuthenticReaderDB>;
}

// Helper to create mock object store
function createMockObjectStore(name: string) {
  return {
    get: async (key: string) => {
      if (name === 'preferences') {
        const value = inMemoryDB.preferences.get(key);
        return value ? { id: key, value } : undefined;
      } else if (name === 'articles') {
        return inMemoryDB.articles.get(key);
      } else if (name === 'sources') {
        return inMemoryDB.sources.get(key);
      } else if (name === 'analyses') {
        return inMemoryDB.analyses.get(key);
      } else if (name === 'extractedContent') {
        return inMemoryDB.extractedContent.get(key);
      } else if (name === 'passageAnalyses') {
        return inMemoryDB.passageAnalyses.get(key);
      } else if (name === 'biasCorpus') {
        return inMemoryDB.biasCorpus.get(key);
      }
    },
    getAll: async () => {
      if (name === 'articles') {
        return Array.from(inMemoryDB.articles.values());
      } else if (name === 'sources') {
        return Array.from(inMemoryDB.sources.values());
      } else if (name === 'analyses') {
        return Array.from(inMemoryDB.analyses.values());
      } else if (name === 'extractedContent') {
        return Array.from(inMemoryDB.extractedContent.values());
      } else if (name === 'passageAnalyses') {
        return Array.from(inMemoryDB.passageAnalyses.values());
      } else if (name === 'biasCorpus') {
        return Array.from(inMemoryDB.biasCorpus.values());
      }
      return [];
    },
    put: async (value: any) => {
      if (name === 'preferences') {
        inMemoryDB.preferences.set(value.id, value.value);
      } else if (name === 'articles') {
        inMemoryDB.articles.set(value.id, value);
      } else if (name === 'sources') {
        inMemoryDB.sources.set(value.id, value);
      } else if (name === 'analyses') {
        inMemoryDB.analyses.set(value.articleId, value);
      } else if (name === 'extractedContent') {
        inMemoryDB.extractedContent.set(value.id, value);
      } else if (name === 'passageAnalyses') {
        inMemoryDB.passageAnalyses.set(value.articleId, value);
      } else if (name === 'biasCorpus') {
        inMemoryDB.biasCorpus.set(value.id, value);
      }
      return '';
    },
    delete: async (key: string) => {
      if (name === 'preferences') {
        inMemoryDB.preferences.delete(key);
      } else if (name === 'articles') {
        inMemoryDB.articles.delete(key);
      } else if (name === 'sources') {
        inMemoryDB.sources.delete(key);
      } else if (name === 'analyses') {
        inMemoryDB.analyses.delete(key);
      } else if (name === 'extractedContent') {
        inMemoryDB.extractedContent.delete(key);
      } else if (name === 'passageAnalyses') {
        inMemoryDB.passageAnalyses.delete(key);
      } else if (name === 'biasCorpus') {
        inMemoryDB.biasCorpus.delete(key);
      }
    },
    clear: async () => {
      if (name === 'preferences') {
        inMemoryDB.preferences.clear();
      } else if (name === 'articles') {
        inMemoryDB.articles.clear();
      } else if (name === 'sources') {
        inMemoryDB.sources.clear();
      } else if (name === 'analyses') {
        inMemoryDB.analyses.clear();
      } else if (name === 'extractedContent') {
        inMemoryDB.extractedContent.clear();
      } else if (name === 'passageAnalyses') {
        inMemoryDB.passageAnalyses.clear();
      } else if (name === 'biasCorpus') {
        inMemoryDB.biasCorpus.clear();
      }
    },
    index: () => ({
      getAll: async () => [],
      getAllKeys: async () => []
    })
  };
}

// Initialize the database
export async function initializeDB(): Promise<IDBPDatabase<AuthenticReaderDB>> {
  try {
    return await openDB<AuthenticReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Create articles store with indexes
        if (!db.objectStoreNames.contains('articles')) {
          const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
          articleStore.createIndex('by-source', 'source');
          articleStore.createIndex('by-date', 'publishDate');
          articleStore.createIndex('by-read-status', 'isRead');
          articleStore.createIndex('by-saved-status', 'isSaved');
        }
        
        // Create sources store with indexes
        if (!db.objectStoreNames.contains('sources')) {
          const sourcesStore = db.createObjectStore('sources', { keyPath: 'id' });
          sourcesStore.createIndex('by-category', 'category');
        }
        
        // Create preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' });
        }
        
        // Create analyses store in version 2
        if (oldVersion < 2 && !db.objectStoreNames.contains('analyses')) {
          db.createObjectStore('analyses', { keyPath: 'articleId' });
        }
        
        // Create new stores for enhanced functionality in version 3
        if (oldVersion < 3) {
          // Store for extracted article content
          if (!db.objectStoreNames.contains('extractedContent')) {
            const extractedStore = db.createObjectStore('extractedContent', { keyPath: 'id' });
            extractedStore.createIndex('by-timestamp', 'timestamp');
          }
          
          // Store for passage-level analyses
          if (!db.objectStoreNames.contains('passageAnalyses')) {
            const passageStore = db.createObjectStore('passageAnalyses', { keyPath: 'articleId' });
            passageStore.createIndex('by-article-id', 'articleId');
          }
          
          // Store for bias training corpus
          if (!db.objectStoreNames.contains('biasCorpus')) {
            const corpusStore = db.createObjectStore('biasCorpus', { keyPath: 'id' });
            corpusStore.createIndex('by-timestamp', 'timestamp');
            corpusStore.createIndex('by-processed', 'processed');
          }
        }
      },
      blocked() {
        console.warn('Database opening is blocked until other tabs close the database');
      },
      blocking() {
        console.warn('This tab is blocking other tabs from opening the database');
      },
      terminated() {
        console.error('Database connection was terminated unexpectedly');
      }
    });
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    // Create a fallback in-memory storage when IndexedDB fails
    console.log('Using in-memory fallback storage');
    return createInMemoryFallback();
  }
}

// Save articles to IndexedDB
export async function saveArticles(articles: FeedItem[]): Promise<void> {
  const db = await initializeDB();
  const tx = db.transaction('articles', 'readwrite');
  
  // Add all articles in one transaction
  await Promise.all(
    articles.map(article => tx.store.put(article))
  );
  
  await tx.done;
  console.log(`Saved ${articles.length} articles to IndexedDB`);
}

// Get all articles
export async function getAllArticles(): Promise<FeedItem[]> {
  const db = await initializeDB();
  return db.getAll('articles');
}

// Interface for article filters
export interface ArticleFilters {
  sources?: string[];
  categories?: string[];
  isRead?: boolean;
  isSaved?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'source' | 'title';
  sortDirection?: 'asc' | 'desc';
}

// Get articles with filters
export async function getArticles(filters: ArticleFilters = {}): Promise<FeedItem[]> {
  const db = await initializeDB();
  const tx = db.transaction('articles', 'readonly');
  
  // Get all articles first, then filter in memory
  let allArticles = await tx.store.getAll();
  
  // Apply filters
  if (filters.sources && filters.sources.length > 0) {
    allArticles = allArticles.filter(article => 
      filters.sources!.includes(article.source)
    );
  }
  
  if (filters.categories && filters.categories.length > 0) {
    allArticles = allArticles.filter(article => {
      // Check if any of the article categories match any of the filter categories
      return article.categories && article.categories.some(category => 
        filters.categories!.includes(category.toLowerCase())
      );
    });
  }
  
  if (filters.isRead !== undefined) {
    allArticles = allArticles.filter(article => 
      article.isRead === filters.isRead
    );
  }
  
  if (filters.isSaved !== undefined) {
    allArticles = allArticles.filter(article => 
      article.isSaved === filters.isSaved
    );
  }
  
  // Apply sorting
  const sortBy = filters.sortBy || 'date';
  const sortDirection = filters.sortDirection || 'desc';
  
  allArticles.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(b.publishDate || b.pubDate || b.isoDate || '').getTime() - 
                     new Date(a.publishDate || a.pubDate || a.isoDate || '').getTime();
        break;
      case 'source':
        comparison = (a.source || '').localeCompare(b.source || '');
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      default:
        comparison = new Date(b.publishDate || b.pubDate || b.isoDate || '').getTime() - 
                     new Date(a.publishDate || a.pubDate || a.isoDate || '').getTime();
    }
    
    // Reverse comparison for ascending order
    return sortDirection === 'asc' ? -comparison : comparison;
  });
  
  // Apply pagination
  const { offset = 0, limit = 50 } = filters;
  return allArticles.slice(offset, offset + limit);
}

// Save sources to IndexedDB
export async function saveSources(sources: Source[]): Promise<void> {
  const db = await initializeDB();
  const tx = db.transaction('sources', 'readwrite');
  
  await Promise.all(
    sources.map(source => tx.store.put(source))
  );
  
  await tx.done;
  console.log(`Saved ${sources.length} sources to IndexedDB`);
}

// Get all sources
export async function getAllSources(): Promise<Source[]> {
  const db = await initializeDB();
  return db.getAll('sources');
}

// Get sources by category
export async function getSourcesByCategory(category: string): Promise<Source[]> {
  const db = await initializeDB();
  const tx = db.transaction('sources', 'readonly');
  const index = tx.store.index('by-category');
  return index.getAll(category);
}

// Save a preference
export async function savePreference(id: string, value: any): Promise<void> {
  const db = await initializeDB();
  await db.put('preferences', { id, value });
}

// Get a preference
export async function getPreference(id: string): Promise<any> {
  const db = await initializeDB();
  try {
    const pref = await db.get('preferences', id);
    return pref ? pref.value : null;
  } catch (error) {
    console.error(`Error getting preference ${id}:`, error);
    return null;
  }
}

// Mark article as read
export async function markArticleAsRead(id: string, isRead: boolean = true): Promise<void> {
  const db = await initializeDB();
  const tx = db.transaction('articles', 'readwrite');
  const article = await tx.store.get(id);
  
  if (article) {
    article.isRead = isRead;
    await tx.store.put(article);
  }
  
  await tx.done;
}

// Mark article as saved
export async function markArticleAsSaved(id: string, isSaved: boolean = true): Promise<void> {
  const db = await initializeDB();
  const tx = db.transaction('articles', 'readwrite');
  const article = await tx.store.get(id);
  
  if (article) {
    article.isSaved = isSaved;
    await tx.store.put(article);
  }
  
  await tx.done;
}

// Save article analysis
export async function saveArticleAnalysis(articleId: string, analysis: ContentAnalysisResult): Promise<void> {
  const db = await initializeDB();
  
  await db.put('analyses', {
    articleId,
    analysis,
    timestamp: Date.now()
  });
  
  console.log(`Saved analysis for article ${articleId}`);
}

// Get article analysis
export async function getArticleAnalysis(articleId: string): Promise<ContentAnalysisResult | null> {
  const db = await initializeDB();
  
  try {
    const analysisRecord = await db.get('analyses', articleId);
    return analysisRecord ? analysisRecord.analysis : null;
  } catch (error) {
    console.error(`Error getting analysis for article ${articleId}:`, error);
    return null;
  }
}

// Get all article analyses
export async function getAllArticleAnalyses(): Promise<{ articleId: string; analysis: ContentAnalysisResult; timestamp: number }[]> {
  const db = await initializeDB();
  return db.getAll('analyses');
}

// Delete article analysis
export async function deleteArticleAnalysis(articleId: string): Promise<void> {
  const db = await initializeDB();
  await db.delete('analyses', articleId);
}

// New functions for enhanced functionality

// Store extracted article content
export async function saveExtractedContent(content: any): Promise<string> {
  const db = await initializeDB();
  const id = content.id || `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const contentToStore = {
    id,
    ...content,
    timestamp: Date.now()
  };
  
  const tx = db.transaction('extractedContent', 'readwrite');
  await tx.store.put(contentToStore);
  await tx.done;
  
  return id;
}

// Get extracted content
export async function getExtractedContent(id: string): Promise<any | null> {
  const db = await initializeDB();
  const content = await db.get('extractedContent', id);
  return content || null;
}

// Store passage-level analyses
export async function savePassageAnalyses(articleId: string, analyses: any): Promise<void> {
  const db = await initializeDB();
  const tx = db.transaction('passageAnalyses', 'readwrite');
  
  await tx.store.put({
    articleId,
    ...analyses,
    timestamp: Date.now()
  });
  await tx.done;
}

// Get passage-level analyses
export async function getPassageAnalyses(articleId: string): Promise<any | null> {
  const db = await initializeDB();
  const analysis = await db.get('passageAnalyses', articleId);
  return analysis || null;
}

// Store article for bias analysis (temporarily)
export async function storeForBiasAnalysis(content: string): Promise<string> {
  const db = await initializeDB();
  const id = `bias_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.put('biasCorpus', {
    id,
    content,
    processed: false,
    timestamp: Date.now()
  });
  
  return id;
}

// Update bias corpus with analysis results but remove content
export async function processBiasArticle(id: string, features: any, knownBiases: any): Promise<void> {
  const db = await initializeDB();
  
  // Get the existing entry
  const existing = await db.get('biasCorpus', id);
  if (!existing) return;
  
  // Update with features but remove full content
  await db.put('biasCorpus', {
    ...existing,
    content: '', // Removed for privacy
    features,
    knownBiases,
    processed: true,
    timestamp: Date.now()
  });
}

// Clean up old content (privacy-preserving)
export async function pruneOldData(maxAgeInDays = 7): Promise<{ extracted: number, corpus: number }> {
  const db = await initializeDB();
  const cutoffTime = Date.now() - (maxAgeInDays * 24 * 60 * 60 * 1000);
  
  // Clean extractedContent
  const extractedTx = db.transaction('extractedContent', 'readwrite');
  const extractedIndex = extractedTx.store.index('by-timestamp');
  let extractedCursor = await extractedIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
  
  let extractedCount = 0;
  while (extractedCursor) {
    await extractedCursor.delete();
    extractedCount++;
    extractedCursor = await extractedCursor.continue();
  }
  await extractedTx.done;
  
  // Clean biasCorpus
  const corpusTx = db.transaction('biasCorpus', 'readwrite');
  const corpusIndex = corpusTx.store.index('by-timestamp');
  let corpusCursor = await corpusIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
  
  let corpusCount = 0;
  while (corpusCursor) {
    await corpusCursor.delete();
    corpusCount++;
    corpusCursor = await corpusCursor.continue();
  }
  await corpusTx.done;
  
  return { extracted: extractedCount, corpus: corpusCount };
}

/**
 * Retrieve all user preferences as a single object
 * @returns A UserPreferences object with all saved preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const db = await initializeDB();

    // The preference keys that make up the UserPreferences object
    const preferenceKeys = [
      'theme',
      'fontSize',
      'textSize', // Alternative name used in App.tsx
      'layout',
      'defaultView',
      'showImages',
      'sortBy',
      'hideReadArticles',
      'articlesPerPage',
      'darkMode',
      'focusMode',
      'dyslexicFont',
      'autoSaveHighlights',
      'notificationsEnabled'
    ];

    // Create default preferences object
    const preferences: UserPreferences = {
      theme: 'dark',
      fontSize: 'medium',
      textSize: 'medium',
      layout: 'list',
      defaultView: 'all',
      showImages: true,
      sortBy: 'date',
      hideReadArticles: false,
      articlesPerPage: 20,
      darkMode: true,
      focusMode: false,
      dyslexicFont: false,
      autoSaveHighlights: true,
      notificationsEnabled: true
    };

    // Get each preference and fill in the object
    for (const key of preferenceKeys) {
      try {
        const value = await getPreference(key);
        if (value !== undefined) {
          // @ts-ignore - Dynamic assignment
          preferences[key] = value;
        }
      } catch (err) {
        console.warn(`Failed to get preference: ${key}`, err);
      }
    }

    return preferences;
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    // Return default preferences if we can't access the database
    return {
      theme: 'dark',
      fontSize: 'medium',
      textSize: 'medium',
      layout: 'list',
      defaultView: 'all',
      showImages: true,
      sortBy: 'date',
      hideReadArticles: false,
      articlesPerPage: 20,
      darkMode: true,
      focusMode: false,
      dyslexicFont: false,
      autoSaveHighlights: true,
      notificationsEnabled: true
    };
  }
}

/**
 * Save all user preferences as a single object
 * @param preferences The UserPreferences object to save
 */
export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    // Save each preference individually
    const entries = Object.entries(preferences);
    for (const [key, value] of entries) {
      // Skip internal properties like id, userId, createdAt, etc.
      if (['id', 'userId', 'createdAt', 'updatedAt'].includes(key)) {
        continue;
      }
      
      try {
        await savePreference(key, value);
      } catch (err) {
        console.warn(`Failed to save preference: ${key}`, err);
      }
    }
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw error;
  }
} 