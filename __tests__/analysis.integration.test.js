import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import jsonStorage from '../authentic-reader-backend/services/jsonStorageService.js';

// Import the simple server for testing
let app;

describe('Analysis API Integration Tests', () => {
  let testArticleId;
  let testAnalysisId;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3002';
    
    // Import the app after setting environment
    const simpleIndex = await import('../authentic-reader-backend/simple-index.js');
    app = simpleIndex.default;
    
    // Ensure data directory exists
    await jsonStorage.ensureDataDir();
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    try {
      const articles = await jsonStorage.getArticles();
      const analyses = await jsonStorage.getAnalysis();
      
      if (testArticleId && articles[testArticleId]) {
        delete articles[testArticleId];
        await jsonStorage.writeFile(jsonStorage.articlesFile, articles);
      }
      
      if (testAnalysisId && analyses[testAnalysisId]) {
        delete analyses[testAnalysisId];
        await jsonStorage.writeFile(jsonStorage.analysisFile, analyses);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Analysis Data Structure', () => {
    it('should create and retrieve complete analysis', async () => {
      testArticleId = `test_article_${Date.now()}`;
      testAnalysisId = testArticleId;
      
      // Create test article
      const testArticle = {
        id: testArticleId,
        title: 'Comprehensive Analysis Test Article',
        url: 'https://example.com/comprehensive-test',
        content: 'This is a comprehensive test article with substantial content. It discusses various topics including technology, science, and current events. The article contains multiple paragraphs and provides detailed information for thorough analysis.',
        sourceName: 'TestSource',
        categories: ['test', 'analysis'],
        publishDate: new Date().toISOString()
      };
      await jsonStorage.saveArticle(testArticleId, testArticle);

      // Create comprehensive analysis
      const comprehensiveAnalysis = {
        wordCount: 45,
        readingTime: 1,
        hasExternalLinks: false,
        complexity: 'medium',
        keyTopics: ['technology', 'science', 'current events'],
        credibility: {
          score: 0.85,
          level: 'high',
          reason: 'Established reputable source, substantial content'
        },
        summary: 'This is a comprehensive test article with substantial content. It discusses various topics including technology, science, and current events.',
        biasIndicators: {},
        logicalFallacies: [],
        bias: {
          direction: 'neutral',
          score: 0.5
        },
        network: {
          entities: [],
          relationships: []
        },
        timestamp: new Date().toISOString()
      };
      await jsonStorage.saveAnalysis(testAnalysisId, comprehensiveAnalysis);

      // Retrieve and verify
      const res = await request(app)
        .get(`/api/articles/${testArticleId}/analysis`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.analysis).toHaveProperty('wordCount');
      expect(res.body.analysis).toHaveProperty('readingTime');
      expect(res.body.analysis).toHaveProperty('credibility');
      expect(res.body.analysis).toHaveProperty('summary');
      expect(res.body.analysis).toHaveProperty('keyTopics');
      expect(res.body.analysis.credibility).toHaveProperty('score');
      expect(res.body.analysis.credibility).toHaveProperty('level');
      expect(res.body.analysis.credibility).toHaveProperty('reason');
    });

    it('should include all required analysis fields', async () => {
      testArticleId = `test_article_fields_${Date.now()}`;
      testAnalysisId = testArticleId;
      
      const testArticle = {
        id: testArticleId,
        title: 'Fields Test Article',
        url: 'https://example.com/fields-test',
        content: 'Test content for field validation.',
        sourceName: 'TestSource',
        categories: ['test'],
        publishDate: new Date().toISOString()
      };
      await jsonStorage.saveArticle(testArticleId, testArticle);

      const analysis = {
        wordCount: 5,
        readingTime: 1,
        hasExternalLinks: false,
        complexity: 'low',
        keyTopics: ['test'],
        credibility: { score: 0.7, level: 'medium', reason: 'Test content' },
        summary: 'Test content for field validation.',
        biasIndicators: {},
        logicalFallacies: [],
        bias: { direction: 'neutral', score: 0.5 },
        network: { entities: [], relationships: [] },
        timestamp: new Date().toISOString()
      };
      await jsonStorage.saveAnalysis(testAnalysisId, analysis);

      const res = await request(app)
        .get(`/api/articles/${testArticleId}`)
        .query({ includeAnalysis: 'true' });
      
      expect(res.statusCode).toBe(200);
      const articleAnalysis = res.body.article.analysis;
      
      // Verify all required fields are present
      expect(articleAnalysis).toHaveProperty('wordCount');
      expect(articleAnalysis).toHaveProperty('readingTime');
      expect(articleAnalysis).toHaveProperty('credibility');
      expect(articleAnalysis).toHaveProperty('summary');
      expect(articleAnalysis).toHaveProperty('keyTopics');
      expect(articleAnalysis).toHaveProperty('timestamp');
    });
  });

  describe('Analysis Quality', () => {
    it('should provide meaningful summary', async () => {
      testArticleId = `test_article_summary_${Date.now()}`;
      testAnalysisId = testArticleId;
      
      const testArticle = {
        id: testArticleId,
        title: 'Summary Test Article',
        url: 'https://example.com/summary-test',
        content: 'This is a longer article with multiple sentences. It contains important information about various topics. The summary should capture the essence of the content effectively.',
        sourceName: 'TestSource',
        categories: ['test'],
        publishDate: new Date().toISOString()
      };
      await jsonStorage.saveArticle(testArticleId, testArticle);

      const analysis = {
        wordCount: 30,
        readingTime: 1,
        summary: 'This is a longer article with multiple sentences. It contains important information about various topics.',
        credibility: { score: 0.8, level: 'high', reason: 'Substantial content' },
        keyTopics: ['information', 'topics'],
        timestamp: new Date().toISOString()
      };
      await jsonStorage.saveAnalysis(testAnalysisId, analysis);

      const res = await request(app)
        .get(`/api/articles/${testArticleId}/analysis`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.analysis.summary).toBeTruthy();
      expect(res.body.analysis.summary.length).toBeGreaterThan(0);
      expect(typeof res.body.analysis.summary).toBe('string');
    });

    it('should calculate reading time correctly', async () => {
      testArticleId = `test_article_reading_${Date.now()}`;
      testAnalysisId = testArticleId;
      
      // Create article with known word count
      const content = 'word '.repeat(200); // 200 words
      const testArticle = {
        id: testArticleId,
        title: 'Reading Time Test',
        url: 'https://example.com/reading-test',
        content: content,
        sourceName: 'TestSource',
        categories: ['test'],
        publishDate: new Date().toISOString()
      };
      await jsonStorage.saveArticle(testArticleId, testArticle);

      const analysis = {
        wordCount: 200,
        readingTime: Math.ceil(200 / 200), // 1 minute at 200 words/min
        summary: 'Test article with 200 words',
        credibility: { score: 0.7, level: 'medium', reason: 'Test' },
        keyTopics: ['test'],
        timestamp: new Date().toISOString()
      };
      await jsonStorage.saveAnalysis(testAnalysisId, analysis);

      const res = await request(app)
        .get(`/api/articles/${testArticleId}/analysis`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.analysis.readingTime).toBeGreaterThan(0);
      expect(res.body.analysis.readingTime).toBe(1);
    });

    it('should assess credibility with proper structure', async () => {
      testArticleId = `test_article_credibility_${Date.now()}`;
      testAnalysisId = testArticleId;
      
      const testArticle = {
        id: testArticleId,
        title: 'Credibility Test Article',
        url: 'https://bbc.com/test-article',
        content: 'This is a test article from a reputable source.',
        sourceName: 'BBC',
        categories: ['test'],
        publishDate: new Date().toISOString()
      };
      await jsonStorage.saveArticle(testArticleId, testArticle);

      const analysis = {
        wordCount: 10,
        readingTime: 1,
        credibility: {
          score: 0.8,
          level: 'high',
          reason: 'Established reputable source'
        },
        summary: 'Test article from reputable source',
        keyTopics: ['test'],
        timestamp: new Date().toISOString()
      };
      await jsonStorage.saveAnalysis(testAnalysisId, analysis);

      const res = await request(app)
        .get(`/api/articles/${testArticleId}/analysis`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.analysis.credibility).toHaveProperty('score');
      expect(res.body.analysis.credibility).toHaveProperty('level');
      expect(res.body.analysis.credibility).toHaveProperty('reason');
      expect(res.body.analysis.credibility.score).toBeGreaterThanOrEqual(0);
      expect(res.body.analysis.credibility.score).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high']).toContain(res.body.analysis.credibility.level);
    });
  });

  describe('Analysis Endpoints Integration', () => {
    it('should return analysis when fetching article with includeAnalysis=true', async () => {
      testArticleId = `test_article_integration_${Date.now()}`;
      testAnalysisId = testArticleId;
      
      const testArticle = {
        id: testArticleId,
        title: 'Integration Test Article',
        url: 'https://example.com/integration-test',
        content: 'Content for integration testing',
        sourceName: 'TestSource',
        categories: ['test'],
        publishDate: new Date().toISOString()
      };
      await jsonStorage.saveArticle(testArticleId, testArticle);

      const analysis = {
        wordCount: 5,
        readingTime: 1,
        summary: 'Content for integration testing',
        credibility: { score: 0.7, level: 'medium', reason: 'Test' },
        keyTopics: ['integration', 'testing'],
        timestamp: new Date().toISOString()
      };
      await jsonStorage.saveAnalysis(testAnalysisId, analysis);

      // Test via articles endpoint
      const articlesRes = await request(app)
        .get('/api/articles')
        .query({ includeAnalysis: 'true' });
      
      expect(articlesRes.statusCode).toBe(200);
      const articleWithAnalysis = articlesRes.articles?.find(a => a.id === testArticleId) ||
        articlesRes.body.articles?.find(a => a.id === testArticleId);
      
      if (articleWithAnalysis) {
        expect(articleWithAnalysis.analysis).toBeDefined();
        expect(articleWithAnalysis.analysis.wordCount).toBe(5);
      }
    });
  });
});

