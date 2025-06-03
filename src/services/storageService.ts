import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FeedItem, Source } from './rssService';
import { ContentAnalysisResult, RSSArticle } from '../types';

interface AuthenticReaderDB extends DBSchema {
  articles: {
    key: string;
    value: RSSArticle;
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
}

// Database name and version
const DB_NAME = 'authenticReader';
const DB_VERSION = 3; // Bumped to 3 to resolve IndexedDB VersionError

// In-memory storage fallback
const inMemoryDB = {
  articles: new Map<string, FeedItem>(),
  sources: new Map<string, Source>(),
  preferences: new Map<string, any>(),
  analyses: new Map<string, { articleId: string; analysis: ContentAnalysisResult; timestamp: number }>()
};

// Create an in-memory fallback that mimics the IDBPDatabase interface
function createInMemoryFallback(): IDBPDatabase<AuthenticReaderDB> {
  return {
    objectStoreNames: {
      contains: (name: string) => ['articles', 'sources', 'preferences', 'analyses'].includes(name)
    },
    transaction: (storeNames: string | string[]) => {
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
      }
    },
    getAll: async (storeName: string) => {
      if (storeName === 'articles') {
        return Array.from(inMemoryDB.articles.values());
      } else if (storeName === 'sources') {
        return Array.from(inMemoryDB.sources.values());
      } else if (storeName === 'analyses') {
        return Array.from(inMemoryDB.analyses.values());
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
      }
    },
    getAll: async () => {
      if (name === 'articles') {
        return Array.from(inMemoryDB.articles.values());
      } else if (name === 'sources') {
        return Array.from(inMemoryDB.sources.values());
      } else if (name === 'analyses') {
        return Array.from(inMemoryDB.analyses.values());
      }
      return [];
    },
    put: async (value: unknown) => {
      if (name === 'preferences') {
        const pref = value as { id: string; value: any };
        inMemoryDB.preferences.set(pref.id, pref.value);
      } else if (name === 'articles') {
        const article = value as RSSArticle;
        inMemoryDB.articles.set(article.link, article);
      } else if (name === 'sources') {
        const source = value as Source;
        inMemoryDB.sources.set(source.name, source);
      } else if (name === 'analyses') {
        const analysis = value as { articleId: string; analysis: ContentAnalysisResult; timestamp: number };
        inMemoryDB.analyses.set(analysis.articleId, analysis);
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
    allArticles = allArticles.filter(article => {
      const sourceName = typeof article.source === 'string' ? article.source : article.source?.name;
      return filters.sources!.includes(sourceName);
    });
  }
  
  if (filters.categories && filters.categories.length > 0) {
    allArticles = allArticles.filter(article => {
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
    const aSource = typeof a.source === 'string' ? a.source : a.source?.name || '';
    const bSource = typeof b.source === 'string' ? b.source : b.source?.name || '';
    switch (sortBy) {
      case 'date':
        comparison = new Date(b.publishDate || b.pubDate || '').getTime() - 
                     new Date(a.publishDate || a.pubDate || '').getTime();
        break;
      case 'source':
        comparison = aSource.localeCompare(bSource);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      default:
        comparison = new Date(b.publishDate || b.pubDate || '').getTime() - 
                     new Date(a.publishDate || a.pubDate || '').getTime();
    }
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

// Add export for getAllSources
export async function getAllSources(): Promise<Source[]> {
  const db = await initializeDB();
  return db.getAll('sources');
}

// Add export for getArticleAnalysis
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

// Add export for markArticleAsRead
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

// Add export for markArticleAsSaved
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

// Add export for saveArticleAnalysis
export async function saveArticleAnalysis(articleId: string, analysis: ContentAnalysisResult): Promise<void> {
  const db = await initializeDB();
  const tx = db.transaction('analyses', 'readwrite');
  await tx.store.put({ articleId, analysis, timestamp: Date.now() });
  await tx.done;
}

// Add export for getPreference
export async function getPreference(id: string): Promise<any | undefined> {
  const db = await initializeDB();
  const pref = await db.get('preferences', id);
  return pref ? pref.value : undefined;
}

// Add export for savePreference
export async function savePreference(id: string, value: any): Promise<void> {
  const db = await initializeDB();
  const tx = db.transaction('preferences', 'readwrite');
  await tx.store.put({ id, value });
  await tx.done;
}