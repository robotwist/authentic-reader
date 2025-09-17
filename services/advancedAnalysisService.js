/**
 * Advanced Analysis Service
 * 
 * This service provides enhanced content analysis using Playwright for extraction
 * and advanced NLP techniques for deeper article analysis.
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const { sequelize } = require('../models');
const onnxService = require('./onnxService');
const axios = require('axios');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/advanced-analysis.log' })
  ]
});

// Cache for analysis results to improve performance
const analysisCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class AdvancedAnalysisService {
  constructor() {
    this.browser = null;
    this.analysisCacheEnabled = process.env.ENABLE_ANALYSIS_CACHE === 'true';
    this.initialized = false;
    this.HF_API_KEY = process.env.HF_API_KEY;
    this.BIAS_DETECTION_MODEL = 'roberta-base-openai-detector'; // Example model
    this.cacheEnabled = true; // Set to false to disable caching
    
    // Keywords for entity type classification when NER doesn't provide type
    this.entityTypeKeywords = {
      person: ['mr', 'mrs', 'ms', 'dr', 'prof', 'president', 'ceo', 'director', 'senator', 'congressman', 'leader'],
      organization: ['inc', 'corp', 'llc', 'company', 'organization', 'association', 'foundation', 'institute', 'university', 'school', 'group', 'agency', 'committee'],
      location: ['street', 'avenue', 'road', 'boulevard', 'city', 'town', 'village', 'county', 'state', 'province', 'country', 'region', 'district']
    };
  }

  /**
   * Initialize the service and launch browser
   */
  async initialize() {
    try {
      if (this.initialized) return true;
      
      logger.info('Initializing Advanced Analysis Service');
      this.browser = await chromium.launch({ 
        headless: true,
        // These options improve execution in containerized environments
        args: ['--disable-dev-shm-usage', '--no-sandbox']
      });
      
      this.initialized = true;
      logger.info('Advanced Analysis Service initialized successfully');
      return true;
    } catch (err) {
      logger.error('Failed to initialize Advanced Analysis Service:', err);
      return false;
    }
  }

  /**
   * Extract article content using Playwright for better accuracy
   * @param {string} url URL of the article to extract
   * @returns {Object} Extracted content with metadata
   */
  async extractArticleContent(url) {
    try {
      await this.initialize();
      
      logger.info(`Extracting content from URL: ${url}`);
      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
      
      const page = await context.newPage();
      
      // Add evasion scripts to bypass paywalls and bot detection
      await page.addInitScript(() => {
        window.localStorage.clear();
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });
      
      // Navigate to URL with a timeout
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Extract metadata from the page
      const metadata = await page.evaluate(() => {
        const getMetaContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.content : null;
        };
        
        // Extract author with fallback options
        const getAuthor = () => {
          const metaAuthor = getMetaContent('meta[name="author"]') || 
                             getMetaContent('meta[property="article:author"]');
          if (metaAuthor) return metaAuthor;
          
          // Try common author selectors
          const authorSelectors = [
            '[class*="author"]', 
            '[class*="byline"]',
            '[rel="author"]',
            '[itemprop="author"]'
          ];
          
          for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element) return element.textContent.trim();
          }
          
          return null;
        };
        
        // Extract publication date with fallbacks
        const getPublishDate = () => {
          return getMetaContent('meta[property="article:published_time"]') || 
                 getMetaContent('meta[name="pubdate"]') ||
                 document.querySelector('time[datetime]')?.getAttribute('datetime') ||
                 document.querySelector('[class*="date"], [class*="time"]')?.textContent;
        };
        
        return {
          title: document.title,
          author: getAuthor(),
          publishDate: getPublishDate(),
          siteName: getMetaContent('meta[property="og:site_name"]') || 
                    new URL(window.location.href).hostname,
          description: getMetaContent('meta[name="description"]') || 
                       getMetaContent('meta[property="og:description"]'),
          language: document.documentElement.lang || 'en',
          canonicalUrl: document.querySelector('link[rel="canonical"]')?.href || window.location.href
        };
      });
      
      // Add Readability to page and extract content
      await page.addScriptTag({
        url: 'https://unpkg.com/@mozilla/readability@0.4.2/Readability.js'
      });
      
      const content = await page.evaluate(() => {
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        const article = reader.parse();
        
        return article ? {
          title: article.title,
          content: article.content,
          textContent: article.textContent,
          excerpt: article.excerpt,
          byline: article.byline,
          length: article.length,
          siteName: article.siteName
        } : null;
      });
      
      // Extract all images with context
      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt || '',
          width: img.width,
          height: img.height,
          caption: img.closest('figure')?.querySelector('figcaption')?.textContent || null
        })).filter(img => img.src && img.width > 50 && img.height > 50); // Filter out tiny images
      });
      
      // Perform network analysis
      const networkData = await this.analyzeNetworkRequests(page);
      
      // Take a screenshot for visual analysis
      const screenshot = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
      
      // Clean up
      await context.close();
      
      return {
        metadata,
        content,
        images,
        networkData,
        screenshot: screenshot.toString('base64')
      };
    } catch (error) {
      logger.error(`Error extracting content from ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Analyze network requests to identify third-party connections
   * @param {Page} page Playwright page object
   * @returns {Object} Network analysis data
   */
  async analyzeNetworkRequests(page) {
    // Get all requests that have been made
    const requests = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries.map(entry => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        duration: entry.duration,
        size: entry.transferSize || 0
      }));
    });
    
    // Analyze domains
    const domains = {};
    const pageUrl = new URL(page.url());
    const baseDomain = pageUrl.hostname;
    
    requests.forEach(req => {
      try {
        const url = new URL(req.name);
        const domain = url.hostname;
        
        if (!domains[domain]) {
          domains[domain] = {
            count: 0,
            size: 0,
            isFirstParty: domain === baseDomain || domain.endsWith(`.${baseDomain}`) || baseDomain.endsWith(`.${domain}`)
          };
        }
        
        domains[domain].count++;
        domains[domain].size += req.size;
      } catch (e) {
        // Invalid URL, skip
      }
    });
    
    return {
      totalRequests: requests.length,
      domains,
      thirdPartyDomains: Object.entries(domains)
        .filter(([_, data]) => !data.isFirstParty)
        .map(([domain, data]) => ({ domain, ...data }))
    };
  }
  
  /**
   * Analyze text for biases using AI
   * @param {string} text - The text to analyze
   * @returns {Promise<Array>} - Array of detected biases with confidence scores
   */
  async analyzeBias(text) {
    try {
      // Check cache first if enabled
      if (this.cacheEnabled) {
        const cacheKey = `bias_${this._hashString(text)}`;
        const cachedResult = analysisCache.get(cacheKey);
        
        if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRY) {
          logger.debug('Using cached bias analysis result');
          return cachedResult.data;
        }
      }

      // Define bias categories to check for
      const biasCategories = [
        { id: 'loaded-language', name: 'Loaded Language' },
        { id: 'name-calling', name: 'Name Calling' },
        { id: 'exaggeration', name: 'Exaggeration' },
        { id: 'appeal-to-fear', name: 'Appeal to Fear' },
        { id: 'appeal-to-authority', name: 'Appeal to Authority' },
        { id: 'bandwagon', name: 'Bandwagon' },
        { id: 'false-dilemma', name: 'False Dilemma' },
        { id: 'straw-man', name: 'Straw Man' },
        { id: 'slippery-slope', name: 'Slippery Slope' }
      ];

      // Make API request to Hugging Face
      const response = await this._callHuggingFace(text);
      
      // Process the response - this would depend on the exact model you're using
      // This is a simplified example
      const results = [];
      
      // In a real implementation, you would parse the model's response
      // For now, we'll simulate bias detection results
      for (const category of biasCategories) {
        // Generate a random confidence score for demonstration
        // In production, this would come from the AI model
        const detected = Math.random() > 0.7;
        
        if (detected) {
          results.push({
            type: category.id,
            confidence: 0.5 + (Math.random() * 0.5) // Random confidence between 0.5 and 1.0
          });
        }
      }
      
      // Sort by confidence (highest first)
      results.sort((a, b) => b.confidence - a.confidence);
      
      // Cache the result if caching is enabled
      if (this.cacheEnabled) {
        const cacheKey = `bias_${this._hashString(text)}`;
        analysisCache.set(cacheKey, {
          data: results,
          timestamp: Date.now()
        });
      }
      
      return results;
    } catch (error) {
      logger.error('Error in bias analysis:', error);
      throw new Error('Bias analysis failed');
    }
  }
  
  /**
   * Call Hugging Face API for text analysis
   * @private
   */
  async _callHuggingFace(text) {
    try {
      // Check if API key is available
      if (!this.HF_API_KEY) {
        throw new Error('Hugging Face API key not configured');
      }
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.BIAS_DETECTION_MODEL}`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${this.HF_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Hugging Face API error:', error);
      throw new Error('Error calling Hugging Face API');
    }
  }

  /**
   * Simple hash function for creating cache keys
   * @private
   */
  _hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash;
  }
  
  /**
   * Analyze rhetorical techniques used in the article
   * @param {string} text Article text content
   * @returns {Object} Rhetorical analysis results
   */
  async analyzeRhetoric(text) {
    try {
      logger.info('Starting rhetorical analysis');
      
      // Break text into structural elements
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      
      // Analyze rhetorical strategies
      const rhetoricalStrategies = {
        repetition: this.detectRepetition(text),
        metaphors: this.detectMetaphors(text),
        appeals: {
          ethos: this.detectEthosAppeals(text),
          pathos: this.detectPathosAppeals(text),
          logos: this.detectLogosAppeals(text)
        },
        rhetoricalQuestions: sentences.filter(s => this.isRhetoricalQuestion(s))
      };
      
      // Analyze argument structure
      const argumentStructure = {
        claims: this.extractClaims(text),
        evidence: this.extractEvidence(text),
        counterarguments: this.extractCounterarguments(text)
      };
      
      // Analyze persuasive techniques
      const persuasiveTechniques = this.analyzePersuasiveTechniques(text);
      
      return {
        rhetoricalStrategies,
        argumentStructure,
        persuasiveTechniques,
        overallStrategy: this.determineOverallStrategy(rhetoricalStrategies, argumentStructure)
      };
    } catch (error) {
      logger.error('Error in rhetorical analysis:', error);
      throw error;
    }
  }
  
  /**
   * Extract named entities from text using ONNX models or external NLP services
   * @param {string} text Article text content
   * @returns {Array} Array of extracted entities with type, mentions, and sentiment
   */
  async extractEntities(text) {
    try {
      logger.info('Extracting entities from text');
      
      // Try to use ONNX NER model if available
      if (onnxService.available && onnxService.modelExists('ner')) {
        return await this.extractEntitiesWithOnnx(text);
      }
      
      // Fallback to rule-based entity extraction
      return await this.extractEntitiesWithRules(text);
    } catch (error) {
      logger.error('Error in entity extraction:', error);
      // Return empty array on error to allow other analyses to continue
      return [];
    }
  }
  
  /**
   * Extract entities using the ONNX NER model
   * @param {string} text Article text content
   * @returns {Array} Array of extracted entities
   */
  async extractEntitiesWithOnnx(text) {
    try {
      // Prepare text for NER by splitting into manageable chunks
      const chunks = this.splitTextIntoChunks(text, 512); // Typical BERT model max length
      
      const allEntities = [];
      
      // Process each chunk
      for (const chunk of chunks) {
        // Tokenize and prepare input for ONNX NER model
        const inputs = await onnxService.prepareNerInputs(chunk);
        
        // Run inference
        const result = await onnxService.runInference('ner', inputs);
        
        // If we need to fallback to original model
        if (result.fallback) {
          logger.info('Falling back to rule-based entity extraction');
          return this.extractEntitiesWithRules(text);
        }
        
        // Process entities from ONNX result
        // This is a simplified example - actual implementation would depend on your NER model's output format
        const entities = await onnxService.processNerResults(result.results, chunk);
        
        // Add to collection
        allEntities.push(...entities);
      }
      
      // Merge duplicate entities and calculate statistics
      return this.mergeAndProcessEntities(allEntities);
    } catch (error) {
      logger.error('Error in ONNX entity extraction:', error);
      // Fall back to rule-based extraction
      return this.extractEntitiesWithRules(text);
    }
  }
  
  /**
   * Extract entities using rule-based methods as fallback
   * @param {string} text Article text content
   * @returns {Array} Array of extracted entities
   */
  async extractEntitiesWithRules(text) {
    const entities = [];
    
    // Get potential entity names (capitalized phrases)
    const potentialEntities = this.extractCapitalizedPhrases(text);
    
    // Process each potential entity
    for (const phrase of potentialEntities) {
      // Skip short phrases and common words
      if (phrase.length < 2 || this.isCommonWord(phrase)) continue;
      
      // Count mentions
      const mentions = this.countMentions(text, phrase);
      if (mentions < 2) continue; // Only include entities mentioned multiple times
      
      // Calculate positivity/negativity around mentions
      const sentiment = this.calculateSentiment(text, phrase);
      
      // Determine entity type
      const type = this.determineEntityType(phrase, text);
      
      entities.push({
        id: phrase,
        type,
        mentions,
        sentiment
      });
    }
    
    return entities;
  }
  
  /**
   * Split text into manageable chunks for NER processing
   * @param {string} text Full text
   * @param {number} maxLength Maximum chunk length
   * @returns {Array} Array of text chunks
   */
  splitTextIntoChunks(text, maxLength = 512) {
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    let currentChunk = '';
    for (const sentence of sentences) {
      // If adding this sentence would exceed max length, save current chunk and start a new one
      if (currentChunk.length + sentence.length > maxLength) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    // Add the final chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
  
  /**
   * Extract capitalized phrases that might be entities
   * @param {string} text Article text
   * @returns {Array} Array of potential entity names
   */
  extractCapitalizedPhrases(text) {
    const potentialEntities = new Set();
    
    // Match phrases where words start with capital letters
    const capitalizedRegex = /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\b/g;
    let match;
    
    while ((match = capitalizedRegex.exec(text)) !== null) {
      if (match[1] && match[1].length > 1) {
        potentialEntities.add(match[1]);
      }
    }
    
    return Array.from(potentialEntities);
  }
  
  /**
   * Check if a word is too common to be an entity
   * @param {string} word Word to check
   * @returns {boolean} True if word is common
   */
  isCommonWord(word) {
    const commonWords = ['The', 'A', 'An', 'This', 'That', 'These', 'Those', 'It', 'They', 'We', 'You', 'I', 'He', 'She'];
    return commonWords.includes(word);
  }
  
  /**
   * Count number of mentions of an entity in text
   * @param {string} text Full text
   * @param {string} entity Entity name
   * @returns {number} Number of mentions
   */
  countMentions(text, entity) {
    const regex = new RegExp(`\\b${this.escapeRegExp(entity)}\\b`, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }
  
  /**
   * Calculate sentiment around entity mentions
   * @param {string} text Full text
   * @param {string} entity Entity name
   * @returns {number} Sentiment score (-1 to 1)
   */
  calculateSentiment(text, entity) {
    // This is a simplified sentiment calculation
    // In a production system, you would use a proper NLP sentiment model
    
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial', 'success', 'win', 'happy', 'best', 'right'];
    const negativeWords = ['bad', 'terrible', 'poor', 'negative', 'harmful', 'failure', 'lose', 'sad', 'worst', 'wrong'];
    
    const regex = new RegExp(`[^.!?]*(?:\\b${this.escapeRegExp(entity)}\\b)[^.!?]*[.!?]`, 'gi');
    let match;
    let sentenceCount = 0;
    let sentimentSum = 0;
    
    // Find sentences containing the entity
    while ((match = regex.exec(text)) !== null) {
      const sentence = match[0].toLowerCase();
      sentenceCount++;
      
      let sentimentScore = 0;
      
      // Count positive and negative words
      for (const word of positiveWords) {
        if (sentence.includes(word)) sentimentScore += 0.1;
      }
      
      for (const word of negativeWords) {
        if (sentence.includes(word)) sentimentScore -= 0.1;
      }
      
      sentimentSum += sentimentScore;
    }
    
    // Return average sentiment, bounded to [-1, 1]
    return sentenceCount > 0 
      ? Math.max(-1, Math.min(1, sentimentSum / sentenceCount)) 
      : 0;
  }
  
  /**
   * Escape special regex characters in a string
   * @param {string} string String to escape
   * @returns {string} Escaped string
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Determine entity type based on context and keywords
   * @param {string} entity Entity name
   * @param {string} text Article text for context
   * @returns {string} Entity type (person, organization, location, event, other)
   */
  determineEntityType(entity, text) {
    // Check for common indicators in entity name
    const entityLower = entity.toLowerCase();
    
    // Look for person indicators (Mr., Dr., etc.)
    for (const keyword of this.entityTypeKeywords.person) {
      if (entityLower.includes(keyword) || 
          text.match(new RegExp(`\\b${keyword}\\.?\\s+${this.escapeRegExp(entity)}\\b`, 'i'))) {
        return 'person';
      }
    }
    
    // Look for organization indicators (Inc, Corp, etc.)
    for (const keyword of this.entityTypeKeywords.organization) {
      if (entityLower.includes(keyword)) {
        return 'organization';
      }
    }
    
    // Look for location indicators
    for (const keyword of this.entityTypeKeywords.location) {
      if (entityLower.includes(keyword)) {
        return 'location';
      }
    }
    
    // Contextual clues for person
    const personContextPatterns = [
      `\\b${this.escapeRegExp(entity)} (said|stated|commented|argued|claimed)\\b`,
      `\\baccording to ${this.escapeRegExp(entity)}\\b`,
    ];
    
    for (const pattern of personContextPatterns) {
      if (text.match(new RegExp(pattern, 'i'))) {
        return 'person';
      }
    }
    
    // Contextual clues for organization
    const orgContextPatterns = [
      `\\b${this.escapeRegExp(entity)} (announced|reported|published|released)\\b`,
      `\\brepresentative(s)? (of|from) ${this.escapeRegExp(entity)}\\b`,
    ];
    
    for (const pattern of orgContextPatterns) {
      if (text.match(new RegExp(pattern, 'i'))) {
        return 'organization';
      }
    }
    
    // Default to "other" if no specific type detected
    return 'other';
  }
  
  /**
   * Merge duplicate entities and calculate final statistics
   * @param {Array} entities Raw extracted entities
   * @returns {Array} Processed and merged entities
   */
  mergeAndProcessEntities(entities) {
    const entityMap = new Map();
    
    // Group by name (case-insensitive)
    for (const entity of entities) {
      const key = entity.id.toLowerCase();
      
      if (!entityMap.has(key)) {
        entityMap.set(key, {
          id: entity.id,
          type: entity.type,
          mentions: entity.mentions,
          sentiment: entity.sentiment,
          count: 1
        });
      } else {
        const existing = entityMap.get(key);
        existing.mentions += entity.mentions;
        existing.sentiment = (existing.sentiment * existing.count + entity.sentiment) / (existing.count + 1);
        existing.count += 1;
        
        // Use the most common type if available
        if (entity.type !== 'other') {
          existing.type = entity.type;
        }
      }
    }
    
    // Convert map to array and sort by mentions
    return Array.from(entityMap.values())
      .sort((a, b) => b.mentions - a.mentions)
      .map(({ id, type, mentions, sentiment }) => ({ id, type, mentions, sentiment }));
  }
  
  /**
   * Build a network graph of entity relationships
   * @param {Array} entities Array of entities
   * @param {string} text Original text
   * @returns {Object} Network graph with nodes and edges
   */
  buildNetworkGraph(entities, text) {
    try {
      logger.info('Building network graph from entities');
      
      if (!entities || entities.length === 0) {
        return { nodes: [], edges: [] };
      }
      
      // Create nodes from entities
      const nodes = entities.map(entity => ({
        id: entity.id,
        label: entity.id,
        type: entity.type,
        mentions: entity.mentions,
        sentiment: entity.sentiment,
        size: this.calculateNodeSize(entity.mentions)
      }));
      
      // Create edges based on co-occurrence in sentences
      const edges = this.findEntityCooccurrences(entities, text);
      
      // Calculate network statistics
      const networkStats = this.calculateNetworkStatistics(nodes, edges);
      
      return {
        nodes,
        edges,
        stats: networkStats
      };
    } catch (error) {
      logger.error('Error building network graph:', error);
      return { nodes: [], edges: [] };
    }
  }
  
  /**
   * Calculate appropriate node size based on mention count
   * @param {number} mentions Number of entity mentions
   * @returns {number} Node size for visualization
   */
  calculateNodeSize(mentions) {
    // Logarithmic scaling to prevent huge nodes
    return Math.max(5, Math.min(50, Math.log2(mentions + 1) * 10));
  }
  
  /**
   * Find co-occurrences of entities in the same sentences
   * @param {Array} entities Array of entities
   * @param {string} text Original text
   * @returns {Array} Array of edges between co-occurring entities
   */
  findEntityCooccurrences(entities, text) {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const cooccurrenceMatrix = {};
    
    // Initialize co-occurrence matrix
    for (const entity1 of entities) {
      cooccurrenceMatrix[entity1.id] = {};
      for (const entity2 of entities) {
        if (entity1.id !== entity2.id) {
          cooccurrenceMatrix[entity1.id][entity2.id] = 0;
        }
      }
    }
    
    // Count co-occurrences in sentences
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const entitiesInSentence = entities.filter(entity => 
        sentenceLower.includes(entity.id.toLowerCase())
      );
      
      // If there's more than one entity in the sentence, they co-occur
      if (entitiesInSentence.length > 1) {
        for (let i = 0; i < entitiesInSentence.length; i++) {
          for (let j = i + 1; j < entitiesInSentence.length; j++) {
            const entity1 = entitiesInSentence[i];
            const entity2 = entitiesInSentence[j];
            
            cooccurrenceMatrix[entity1.id][entity2.id] += 1;
            cooccurrenceMatrix[entity2.id][entity1.id] += 1;
          }
        }
      }
    }
    
    // Convert matrix to edge list
    const edges = [];
    const edgeSet = new Set(); // To avoid duplicates
    
    for (const sourceId in cooccurrenceMatrix) {
      for (const targetId in cooccurrenceMatrix[sourceId]) {
        const weight = cooccurrenceMatrix[sourceId][targetId];
        
        if (weight > 0) {
          // Create unique edge ID
          const edgeId = [sourceId, targetId].sort().join('-');
          
          if (!edgeSet.has(edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceId,
              target: targetId,
              weight,
              width: Math.max(1, Math.min(10, Math.log2(weight + 1) * 2))
            });
            
            edgeSet.add(edgeId);
          }
        }
      }
    }
    
    return edges;
  }
  
  /**
   * Calculate network statistics for the entity graph
   * @param {Array} nodes Graph nodes
   * @param {Array} edges Graph edges
   * @returns {Object} Network statistics
   */
  calculateNetworkStatistics(nodes, edges) {
    // Calculate basic network metrics
    const stats = {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      density: 0,
      avgDegree: 0,
      centralNodes: [],
      communities: []
    };
    
    if (nodes.length <= 1) {
      return stats;
    }
    
    // Calculate density
    const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
    stats.density = stats.edgeCount / maxPossibleEdges;
    
    // Calculate node degrees
    const degrees = {};
    for (const node of nodes) {
      degrees[node.id] = 0;
    }
    
    for (const edge of edges) {
      degrees[edge.source]++;
      degrees[edge.target]++;
    }
    
    // Calculate average degree
    stats.avgDegree = Object.values(degrees).reduce((sum, deg) => sum + deg, 0) / nodes.length;
    
    // Find central nodes (top 3 by degree)
    stats.centralNodes = Object.entries(degrees)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, degree]) => {
        const node = nodes.find(n => n.id === id);
        return {
          id,
          label: node.label,
          type: node.type,
          degree
        };
      });
    
    // Identify communities (simplified)
    // In a real implementation, you'd use a proper community detection algorithm
    stats.communities = this.identifySimpleCommunities(nodes, edges, degrees);
    
    return stats;
  }
  
  /**
   * Simple community detection based on shared connections
   * @param {Array} nodes Graph nodes
   * @param {Array} edges Graph edges
   * @param {Object} degrees Node degrees
   * @returns {Array} Identified communities
   */
  identifySimpleCommunities(nodes, edges, degrees) {
    // This is a simplified community detection
    // For production, use a proper algorithm like Louvain or label propagation
    
    const communities = [];
    const nodesToProcess = new Set(nodes.map(n => n.id));
    
    // Create adjacency list
    const adjacency = {};
    for (const node of nodes) {
      adjacency[node.id] = [];
    }
    
    for (const edge of edges) {
      adjacency[edge.source].push(edge.target);
      adjacency[edge.target].push(edge.source);
    }
    
    // Simple greedy community detection
    while (nodesToProcess.size > 0) {
      // Start with highest degree unassigned node
      const seedNodeId = Array.from(nodesToProcess)
        .sort((a, b) => degrees[b] - degrees[a])[0];
      
      // Create new community with this seed
      const community = [seedNodeId];
      nodesToProcess.delete(seedNodeId);
      
      // Queue for BFS
      const queue = [...adjacency[seedNodeId]];
      
      // Process queue
      while (queue.length > 0 && community.length < 8) { // Limit community size
        const currentId = queue.shift();
        
        if (nodesToProcess.has(currentId)) {
          community.push(currentId);
          nodesToProcess.delete(currentId);
        }
      }
      
      if (community.length > 1) {
        // Get the types of nodes in this community
        const types = community.map(id => 
          nodes.find(n => n.id === id).type
        );
        
        // Get the most common type
        const typeCounts = {};
        let maxCount = 0;
        let dominantType = null;
        
        for (const type of types) {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
          if (typeCounts[type] > maxCount) {
            maxCount = typeCounts[type];
            dominantType = type;
          }
        }
        
        communities.push({
          nodes: community,
          size: community.length,
          dominantType
        });
      }
      
      if (communities.length >= 5) break; // Limit to top 5 communities
    }
    
    return communities;
  }
  
  analyzePowerStructures(networkGraph) {
    // Analyze centrality and community detection
    if (!networkGraph || !networkGraph.nodes || networkGraph.nodes.length === 0) {
      return { centralEntities: [], communities: [] };
    }
    
    const centralEntities = networkGraph.stats?.centralNodes || [];
    const communities = networkGraph.stats?.communities || [];
    
    return {
      centralEntities,
      communities,
      powerDynamics: this.analyzePowerDynamics(networkGraph)
    };
  }
  
  analyzePowerDynamics(networkGraph) {
    // This would be a sophisticated analysis of power relationships
    // For now, we'll return a simplified analysis
    if (!networkGraph || !networkGraph.nodes || networkGraph.nodes.length < 3) {
      return { type: 'insufficient-data' };
    }
    
    const personNodes = networkGraph.nodes.filter(n => n.type === 'person');
    const orgNodes = networkGraph.nodes.filter(n => n.type === 'organization');
    const locNodes = networkGraph.nodes.filter(n => n.type === 'location');
    
    // Determine the dominant node type
    const dominantType = 
      personNodes.length > orgNodes.length && personNodes.length > locNodes.length ? 'person-centric' :
      orgNodes.length > personNodes.length && orgNodes.length > locNodes.length ? 'organization-centric' :
      locNodes.length > personNodes.length && locNodes.length > orgNodes.length ? 'location-centric' :
      'balanced';
    
    // Calculate the power concentration
    const totalMentions = networkGraph.nodes.reduce((sum, node) => sum + node.mentions, 0);
    const top3Mentions = networkGraph.nodes
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 3)
      .reduce((sum, node) => sum + node.mentions, 0);
    
    const concentrationRatio = top3Mentions / totalMentions;
    
    let powerStructure;
    if (concentrationRatio > 0.6) {
      powerStructure = 'highly-concentrated';
    } else if (concentrationRatio > 0.4) {
      powerStructure = 'moderately-concentrated';
    } else {
      powerStructure = 'distributed';
    }
    
    return {
      dominantType,
      powerStructure,
      concentrationRatio
    };
  }
  
  detectFraming(text) {
    // Detect political framing techniques
    return { framingType: 'neutral', confidence: 0.5 };
  }
  
  identifyBiasedLanguage(text) {
    // Identify biased language patterns
    return { biasedTerms: [], sentiment: {} };
  }
  
  analyzeNarrativeStructure(text) {
    // Analyze the narrative structure for bias
    return { structure: 'balanced', confidence: 0.5 };
  }
  
  determineBiasType(framing, biasedLanguage) {
    // Determine overall bias type
    return 'center';
  }
  
  calculateBiasConfidence(framing, biasedLanguage, narrativeAnalysis) {
    // Calculate confidence in bias assessment
    return 0.5;
  }
  
  detectRepetition(text) {
    // Detect repeated phrases and terms
    return [];
  }
  
  detectMetaphors(text) {
    // Detect metaphors and analogies
    return [];
  }
  
  detectEthosAppeals(text) {
    // Detect appeals to authority or credibility
    return [];
  }
  
  detectPathosAppeals(text) {
    // Detect emotional appeals
    return [];
  }
  
  detectLogosAppeals(text) {
    // Detect logical appeals
    return [];
  }
  
  isRhetoricalQuestion(sentence) {
    // Check if a sentence is a rhetorical question
    return false;
  }
  
  extractClaims(text) {
    // Extract main claims
    return [];
  }
  
  extractEvidence(text) {
    // Extract supporting evidence
    return [];
  }
  
  extractCounterarguments(text) {
    // Extract counterarguments
    return [];
  }
  
  analyzePersuasiveTechniques(text) {
    // Analyze persuasive techniques
    return {};
  }
  
  determineOverallStrategy(rhetoricalStrategies, argumentStructure) {
    // Determine overall rhetorical strategy
    return 'balanced';
  }
  
  /**
   * Clean up resources when service is no longer needed
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.initialized = false;
    logger.info('Advanced Analysis Service closed');
  }
}

module.exports = new AdvancedAnalysisService(); 