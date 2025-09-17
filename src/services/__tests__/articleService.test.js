import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as articleService from '../articleService';
// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});
// Mock fetch
global.fetch = vi.fn();
const mockArticles = [
    {
        id: '1',
        title: 'Test Article 1',
        description: 'Test description 1',
        content: 'Test content 1',
        url: 'https://example.com/1',
        source: 'Test Source',
        publishedAt: '2023-01-01T00:00:00Z',
        author: 'Test Author',
        category: 'politics',
        biasRating: 'center',
        reliability: 'high',
        tags: ['test'],
        sentiment: 'neutral',
        politicalBias: 5,
        emotionalBias: 3,
        cognitiveBias: 4
    },
    {
        id: '2',
        title: 'Test Article 2',
        description: 'Test description 2',
        content: 'Test content 2',
        url: 'https://example.com/2',
        source: 'Test Source',
        publishedAt: '2023-01-02T00:00:00Z',
        author: 'Test Author',
        category: 'technology',
        biasRating: 'left',
        reliability: 'medium',
        tags: ['test'],
        sentiment: 'positive',
        politicalBias: 3,
        emotionalBias: 4,
        cognitiveBias: 5
    }
];
describe('ArticleService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.resetAllMocks();
    });
    describe('getArticles', () => {
        it('fetches articles from backend successfully', async () => {
            const mockResponse = { articles: mockArticles };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const result = await articleService.getArticles(['politics', 'technology']);
            expect(result).toEqual(mockArticles);
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/balanced-feed?categories=politics,technology&limit=50'));
        });
        it('falls back to cached articles when backend fails', async () => {
            ;
            fetch.mockRejectedValueOnce(new Error('Network error'));
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockArticles));
            const result = await articleService.getArticles(['politics']);
            expect(result).toEqual([mockArticles[0]]); // Only politics article
            expect(localStorageMock.getItem).toHaveBeenCalledWith('cached_articles');
        });
        it('uses fallback articles when no cached articles available', async () => {
            ;
            fetch.mockRejectedValueOnce(new Error('Network error'));
            localStorageMock.getItem.mockReturnValueOnce(null);
            const result = await articleService.getArticles(['politics']);
            expect(result.length).toBeLessThanOrEqual(2); // Limited fallback articles
            expect(result[0]).toHaveProperty('title');
        });
        it('filters articles by categories correctly', async () => {
            const mockResponse = { articles: mockArticles };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const result = await articleService.getArticles(['politics']);
            expect(result).toHaveLength(1);
            expect(result[0].category).toBe('politics');
        });
        it('respects the limit parameter', async () => {
            const mockResponse = { articles: mockArticles };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const result = await articleService.getArticles(['politics', 'technology'], 1);
            expect(result).toHaveLength(1);
        });
    });
    describe('cacheArticles', () => {
        it('stores articles in localStorage', () => {
            articleService.cacheArticles(mockArticles);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('cached_articles', JSON.stringify(mockArticles));
        });
        it('stores articles in memory cache', () => {
            articleService.cacheArticles(mockArticles);
            const cached = articleService.getCachedArticles();
            expect(cached).toEqual(mockArticles);
        });
    });
    describe('getCachedArticles', () => {
        it('returns articles from memory cache', () => {
            articleService.cacheArticles(mockArticles);
            const result = articleService.getCachedArticles();
            expect(result).toEqual(mockArticles);
        });
        it('returns empty array when no cached articles', () => {
            const result = articleService.getCachedArticles();
            expect(result).toEqual([]);
        });
    });
    describe('filterArticlesByCategories', () => {
        it('filters articles by single category', () => {
            const result = articleService.filterArticlesByCategories(mockArticles, ['politics'], 10);
            expect(result).toHaveLength(1);
            expect(result[0].category).toBe('politics');
        });
        it('filters articles by multiple categories', () => {
            const result = articleService.filterArticlesByCategories(mockArticles, ['politics', 'technology'], 10);
            expect(result).toHaveLength(2);
        });
        it('respects the limit parameter', () => {
            const result = articleService.filterArticlesByCategories(mockArticles, ['politics'], 1);
            expect(result).toHaveLength(1);
        });
        it('returns all articles when no categories specified', () => {
            const result = articleService.filterArticlesByCategories(mockArticles, [], 10);
            expect(result).toEqual(mockArticles);
        });
    });
    describe('fetchFromBackend', () => {
        it('fetches articles from backend successfully', async () => {
            const mockResponse = { articles: mockArticles };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const result = await articleService.fetchFromBackend(['politics'], 10);
            expect(result).toEqual(mockArticles);
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/balanced-feed?categories=politics&limit=10'));
        });
        it('throws error when backend request fails', async () => {
            ;
            fetch.mockRejectedValueOnce(new Error('Network error'));
            await expect(articleService.fetchFromBackend(['politics'], 10)).rejects.toThrow('Network error');
        });
        it('throws error when response is not ok', async () => {
            ;
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });
            await expect(articleService.fetchFromBackend(['politics'], 10)).rejects.toThrow('HTTP error! status: 500');
        });
        it('throws error when response has no articles', async () => {
            ;
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ articles: [] }),
            });
            await expect(articleService.fetchFromBackend(['politics'], 10)).rejects.toThrow('No articles returned from backend');
        });
    });
    describe('error handling', () => {
        it('handles JSON parsing errors gracefully', async () => {
            ;
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                },
            });
            await expect(articleService.fetchFromBackend(['politics'], 10)).rejects.toThrow('Invalid JSON');
        });
        it('handles network timeout', async () => {
            ;
            fetch.mockImplementationOnce(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100)));
            await expect(articleService.fetchFromBackend(['politics'], 10)).rejects.toThrow('Timeout');
        });
    });
});
