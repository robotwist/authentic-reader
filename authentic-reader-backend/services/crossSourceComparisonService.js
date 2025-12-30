/**
 * Cross-Source Comparison Service
 * 
 * Compares how different news sources cover the same story.
 * Reveals framing differences, bias variations, and missing perspectives.
 * 
 * This is a KEY differentiator for industry-leading media literacy.
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import rssService from './rssService.js';

// Diverse source pool for comparison
const COMPARISON_SOURCES = {
  // Left-leaning
  left: [
    { name: 'MSNBC', url: 'https://www.msnbc.com/feeds/latest' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
    { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' }
  ],
  // Center
  center: [
    { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best' },
    { name: 'AP News', url: 'https://rsshub.app/apnews/topics/apf-topnews' },
    { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' }
  ],
  // Right-leaning
  right: [
    { name: 'Fox News', url: 'https://moxie.foxnews.com/google-publisher/world.xml' },
    { name: 'The Hill', url: 'https://thehill.com/homenews/feed/' },
    { name: 'Washington Examiner', url: 'https://www.washingtonexaminer.com/feed' }
  ],
  // International
  international: [
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-en-all' },
    { name: 'France 24', url: 'https://www.france24.com/en/rss' }
  ]
};

class CrossSourceComparisonService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Find similar articles across different sources for a given story
   */
  async findRelatedCoverage(story, keywords) {
    const relatedArticles = [];
    const seenUrls = new Set([story.url]);
    
    // Search across all source categories
    for (const [category, sources] of Object.entries(COMPARISON_SOURCES)) {
      for (const source of sources) {
        try {
          const feedData = await rssService.fetchFeed(source.url, {
            maxItems: 15,
            timeout: 10000
          });
          
          if (!feedData?.items) continue;
          
          // Find articles matching the keywords
          for (const item of feedData.items) {
            const normalized = rssService.normalizeItem(item, source.name);
            
            if (seenUrls.has(normalized.link)) continue;
            
            // Check keyword match
            const text = `${normalized.title} ${normalized.description || ''}`.toLowerCase();
            const matches = keywords.filter(kw => text.includes(kw.toLowerCase()));
            
            if (matches.length >= 2) { // At least 2 keyword matches
              relatedArticles.push({
                ...normalized,
                source: {
                  name: source.name,
                  category: category,
                  url: source.url
                },
                matchScore: matches.length / keywords.length
              });
              seenUrls.add(normalized.link);
              
              // Limit to 1 per source
              break;
            }
          }
        } catch (error) {
          logger.debug(`Error fetching from ${source.name}: ${error.message}`);
          continue;
        }
      }
    }
    
    // Sort by match score
    return relatedArticles.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }

  /**
   * Generate a comparative analysis of how different sources covered the same story
   */
  async generateComparison(primaryArticle, relatedArticles) {
    if (!this.groqApiKey || relatedArticles.length === 0) {
      return null;
    }
    
    const systemPrompt = `You are a Media Bias Expert analyzing how different news sources cover the same story.

Compare the coverage and return JSON with this structure:
{
  "story_core": {
    "common_facts": ["Fact all sources agree on 1", "Fact 2"],
    "disputed_facts": ["Fact where sources disagree"]
  },
  "framing_comparison": [
    {
      "source": "Source name",
      "political_lean": "left | center | right",
      "headline_framing": "How they frame it in the headline",
      "emphasis": "What they emphasize",
      "downplayed": "What they minimize",
      "unique_angle": "Any unique perspective"
    }
  ],
  "language_differences": [
    {
      "concept": "The same thing described differently",
      "variations": {
        "Source A": "Their term",
        "Source B": "Their term"
      }
    }
  ],
  "missing_from_each": [
    {
      "source": "Source name",
      "omits": ["Important aspect they don't cover"]
    }
  ],
  "reader_takeaway": {
    "most_balanced": "Which source is most balanced",
    "most_context": "Which provides most context",
    "recommendation": "How a reader should approach this story"
  }
}

CRITICAL: Return ONLY valid JSON.`;

    const articlesContext = relatedArticles.map(a => 
      `SOURCE: ${a.source?.name || 'Unknown'} (${a.source?.category || 'unknown'} leaning)\nHEADLINE: ${a.title}\nSNIPPET: ${(a.description || '').substring(0, 300)}`
    ).join('\n\n---\n\n');

    const userPrompt = `PRIMARY ARTICLE:
SOURCE: ${primaryArticle.source || 'Unknown'}
HEADLINE: ${primaryArticle.title}
CONTENT: ${(primaryArticle.content || primaryArticle.description || '').substring(0, 1000)}

RELATED COVERAGE FROM OTHER SOURCES:
${articlesContext}

Analyze how these different sources frame the same story.`;

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) return null;
      
      return JSON.parse(content);
    } catch (error) {
      logger.error('Cross-source comparison failed:', error.message);
      return null;
    }
  }

  /**
   * Full comparison pipeline: find related coverage + analyze differences
   */
  async compareStoryCoverage(article, keywords) {
    // Check cache
    const cacheKey = `comparison:${article.url || article.title}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    logger.info(`🔄 Finding cross-source coverage for: ${article.title?.substring(0, 50)}...`);
    
    // Step 1: Find related articles
    const relatedArticles = await this.findRelatedCoverage(article, keywords);
    
    if (relatedArticles.length === 0) {
      logger.info('No related coverage found from other sources');
      return {
        found: false,
        message: 'No comparable coverage found from other sources'
      };
    }
    
    logger.info(`Found ${relatedArticles.length} related articles from other sources`);
    
    // Step 2: Generate comparison analysis
    const comparison = await this.generateComparison(article, relatedArticles);
    
    const result = {
      found: true,
      primary_source: article.source,
      related_sources: relatedArticles.map(a => ({
        name: a.source?.name,
        category: a.source?.category,
        title: a.title,
        url: a.link
      })),
      comparison_analysis: comparison,
      generated_at: new Date().toISOString()
    };
    
    // Cache result
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });
    
    return result;
  }
}

export default new CrossSourceComparisonService();
