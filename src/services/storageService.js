import { openDB } from 'idb';
// Database name and version
const DB_NAME = 'authenticReader';
const DB_VERSION = 3; // Bumped to 3 to resolve IndexedDB VersionError
// In-memory storage fallback
const inMemoryDB = {
    articles: new Map(),
    sources: new Map(),
    preferences: new Map(),
    analyses: new Map()
};
// Create an in-memory fallback that mimics the IDBPDatabase interface
function createInMemoryFallback() {
    return {
        objectStoreNames: {
            contains: (name) => ['articles', 'sources', 'preferences', 'analyses'].includes(name)
        },
        transaction: (storeNames) => {
            return {
                objectStore: (name) => createMockObjectStore(name),
                store: createMockObjectStore(Array.isArray(storeNames) ? storeNames[0] : storeNames),
                done: Promise.resolve()
            };
        },
        get: async (storeName, key) => {
            if (storeName === 'preferences') {
                const value = inMemoryDB.preferences.get(key);
                return value ? { id: key, value } : undefined;
            }
            else if (storeName === 'articles') {
                return inMemoryDB.articles.get(key);
            }
            else if (storeName === 'sources') {
                return inMemoryDB.sources.get(key);
            }
            else if (storeName === 'analyses') {
                return inMemoryDB.analyses.get(key);
            }
        },
        getAll: async (storeName) => {
            if (storeName === 'articles') {
                return Array.from(inMemoryDB.articles.values());
            }
            else if (storeName === 'sources') {
                return Array.from(inMemoryDB.sources.values());
            }
            else if (storeName === 'analyses') {
                return Array.from(inMemoryDB.analyses.values());
            }
            return [];
        },
        put: async (storeName, value) => {
            if (storeName === 'preferences') {
                inMemoryDB.preferences.set(value.id, value.value);
            }
            else if (storeName === 'articles') {
                inMemoryDB.articles.set(value.id, value);
            }
            else if (storeName === 'sources') {
                inMemoryDB.sources.set(value.id, value);
            }
            else if (storeName === 'analyses') {
                inMemoryDB.analyses.set(value.articleId, value);
            }
            return '';
        },
        delete: async (storeName, key) => {
            if (storeName === 'preferences') {
                inMemoryDB.preferences.delete(key);
            }
            else if (storeName === 'articles') {
                inMemoryDB.articles.delete(key);
            }
            else if (storeName === 'sources') {
                inMemoryDB.sources.delete(key);
            }
            else if (storeName === 'analyses') {
                inMemoryDB.analyses.delete(key);
            }
        },
        clear: async (storeName) => {
            if (storeName === 'preferences') {
                inMemoryDB.preferences.clear();
            }
            else if (storeName === 'articles') {
                inMemoryDB.articles.clear();
            }
            else if (storeName === 'sources') {
                inMemoryDB.sources.clear();
            }
            else if (storeName === 'analyses') {
                inMemoryDB.analyses.clear();
            }
        },
        close: () => { },
        name: 'inMemoryDB',
        version: DB_VERSION
    };
}
// Helper to create mock object store
function createMockObjectStore(name) {
    return {
        get: async (key) => {
            if (name === 'preferences') {
                const value = inMemoryDB.preferences.get(key);
                return value ? { id: key, value } : undefined;
            }
            else if (name === 'articles') {
                return inMemoryDB.articles.get(key);
            }
            else if (name === 'sources') {
                return inMemoryDB.sources.get(key);
            }
            else if (name === 'analyses') {
                return inMemoryDB.analyses.get(key);
            }
        },
        getAll: async () => {
            if (name === 'articles') {
                return Array.from(inMemoryDB.articles.values());
            }
            else if (name === 'sources') {
                return Array.from(inMemoryDB.sources.values());
            }
            else if (name === 'analyses') {
                return Array.from(inMemoryDB.analyses.values());
            }
            return [];
        },
        put: async (value) => {
            if (name === 'preferences') {
                const pref = value;
                inMemoryDB.preferences.set(pref.id, pref.value);
            }
            else if (name === 'articles') {
                const article = value;
                inMemoryDB.articles.set(article.link, article);
            }
            else if (name === 'sources') {
                const source = value;
                inMemoryDB.sources.set(source.name, source);
            }
            else if (name === 'analyses') {
                const analysis = value;
                inMemoryDB.analyses.set(analysis.articleId, analysis);
            }
            return '';
        },
        delete: async (key) => {
            if (name === 'preferences') {
                inMemoryDB.preferences.delete(key);
            }
            else if (name === 'articles') {
                inMemoryDB.articles.delete(key);
            }
            else if (name === 'sources') {
                inMemoryDB.sources.delete(key);
            }
            else if (name === 'analyses') {
                inMemoryDB.analyses.delete(key);
            }
        },
        clear: async () => {
            if (name === 'preferences') {
                inMemoryDB.preferences.clear();
            }
            else if (name === 'articles') {
                inMemoryDB.articles.clear();
            }
            else if (name === 'sources') {
                inMemoryDB.sources.clear();
            }
            else if (name === 'analyses') {
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
export async function initializeDB() {
    try {
        return await openDB(DB_NAME, DB_VERSION, {
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
    }
    catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        // Create a fallback in-memory storage when IndexedDB fails
        console.log('Using in-memory fallback storage');
        return createInMemoryFallback();
    }
}
// Save articles to IndexedDB
export async function saveArticles(articles) {
    const db = await initializeDB();
    const tx = db.transaction('articles', 'readwrite');
    // Add all articles in one transaction
    await Promise.all(articles.map(article => tx.store.put(article)));
    await tx.done;
    console.log(`Saved ${articles.length} articles to IndexedDB`);
}
// Get all articles
export async function getAllArticles() {
    const db = await initializeDB();
    return db.getAll('articles');
}
// Get articles with filters
export async function getArticles(filters = {}) {
    const db = await initializeDB();
    const tx = db.transaction('articles', 'readonly');
    // Get all articles first, then filter in memory
    let allArticles = await tx.store.getAll();
    // Apply filters
    if (filters.sources && filters.sources.length > 0) {
        allArticles = allArticles.filter(article => {
            const sourceName = typeof article.source === 'string' ? article.source : article.source?.name;
            return filters.sources.includes(sourceName);
        });
    }
    if (filters.categories && filters.categories.length > 0) {
        allArticles = allArticles.filter(article => {
            return article.categories && article.categories.some(category => filters.categories.includes(category.toLowerCase()));
        });
    }
    if (filters.isRead !== undefined) {
        allArticles = allArticles.filter(article => article.isRead === filters.isRead);
    }
    if (filters.isSaved !== undefined) {
        allArticles = allArticles.filter(article => article.isSaved === filters.isSaved);
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
export async function saveSources(sources) {
    const db = await initializeDB();
    const tx = db.transaction('sources', 'readwrite');
    await Promise.all(sources.map(source => tx.store.put(source)));
    await tx.done;
    console.log(`Saved ${sources.length} sources to IndexedDB`);
}
// Add export for getAllSources
export async function getAllSources() {
    const db = await initializeDB();
    return db.getAll('sources');
}
// Add export for getArticleAnalysis
export async function getArticleAnalysis(articleId) {
    const db = await initializeDB();
    try {
        const analysisRecord = await db.get('analyses', articleId);
        return analysisRecord ? analysisRecord.analysis : null;
    }
    catch (error) {
        console.error(`Error getting analysis for article ${articleId}:`, error);
        return null;
    }
}
// Add export for markArticleAsRead
export async function markArticleAsRead(id, isRead = true) {
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
export async function markArticleAsSaved(id, isSaved = true) {
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
export async function saveArticleAnalysis(articleId, analysis) {
    const db = await initializeDB();
    const tx = db.transaction('analyses', 'readwrite');
    await tx.store.put({ articleId, analysis, timestamp: Date.now() });
    await tx.done;
}
// Add export for getPreference
export async function getPreference(id) {
    const db = await initializeDB();
    const pref = await db.get('preferences', id);
    return pref ? pref.value : undefined;
}
// Add export for savePreference
export async function savePreference(id, value) {
    const db = await initializeDB();
    const tx = db.transaction('preferences', 'readwrite');
    await tx.store.put({ id, value });
    await tx.done;
}
// Get extracted content for an article
export async function getExtractedContent(articleId) {
    const db = await initializeDB();
    const article = await db.get('articles', articleId);
    return article || null;
}
// Get passage analyses for an article
export async function getPassageAnalyses(articleId) {
    const db = await initializeDB();
    const analysis = await db.get('analyses', articleId);
    return analysis?.analysis || null;
}
// Get all user preferences
export async function getUserPreferences() {
    const db = await initializeDB();
    const preferences = await db.getAll('preferences');
    const defaultPreferences = {
        textSize: 'medium',
        darkMode: true,
        theme: 'dark',
        focusMode: false,
        dyslexicFont: false,
        autoSaveHighlights: true,
        notificationsEnabled: true
    };
    if (!preferences || preferences.length === 0) {
        return defaultPreferences;
    }
    return preferences.reduce((acc, pref) => ({
        ...acc,
        [pref.id]: pref.value
    }), defaultPreferences);
}
// Save user preferences
export async function saveUserPreferences(preferences) {
    const db = await initializeDB();
    const tx = db.transaction('preferences', 'readwrite');
    const store = tx.objectStore('preferences');
    for (const [key, value] of Object.entries(preferences)) {
        await store.put({ id: key, value });
    }
    await tx.done;
}
