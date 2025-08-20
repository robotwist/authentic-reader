import enhancedStorage from './enhancedStorageService.js';

class ComprehensiveAnalysisService {
  constructor() {
    this.analysisCache = new Map();
    this.sourceAccuracyHistory = new Map();
    this.credibilityFactors = {
      domainReputation: {
        high: ['bbc.com', 'reuters.com', 'ap.org', 'npr.org', 'pbs.org', 'nytimes.com', 'washingtonpost.com', 'wsj.com', 'economist.com', 'nature.com', 'science.org', 'propublica.org', 'factcheck.org', 'snopes.com'],
        medium: ['cnn.com', 'msnbc.com', 'foxnews.com', 'abcnews.go.com', 'cbsnews.com', 'nbcnews.com', 'usatoday.com', 'latimes.com', 'chicagotribune.com'],
        low: ['infowars.com', 'breitbart.com', 'dailywire.com', 'theblaze.com', 'occupy.com', 'truthdig.com']
      },
      sensationalistPatterns: [
        /!\s*$/,
        /BREAKING/,
        /URGENT/,
        /\d+\s+ways/,
        /you'll never guess/,
        /shocking/,
        /amazing/,
        /incredible/,
        /secret/,
        /conspiracy/,
        /exposed/,
        /revealed/,
        /scandal/
      ],
      credibilityIndicators: {
        positive: ['fact-check', 'verified', 'confirmed', 'official', 'study', 'research', 'data', 'statistics', 'expert', 'professor', 'doctor', 'scientist'],
        negative: ['rumor', 'allegedly', 'unconfirmed', 'anonymous', 'source says', 'insider', 'leak', 'whistleblower']
      }
    };
  }

  async analyzeFullArticle(articleData) {
    const articleId = articleData.articleId || this.generateId();
    
    // Check cache first
    if (this.analysisCache.has(articleId)) {
      return this.analysisCache.get(articleId);
    }

    const analysis = {
      articleId,
      timestamp: new Date().toISOString(),
      contentAnalysis: await this.analyzeContent(articleData),
      credibilityAssessment: await this.assessCredibility(articleData),
      politicalAnalysis: await this.analyzePoliticalContent(articleData),
      networkContext: await this.analyzeNetworkContext(articleData),
      factChecking: await this.performFactChecking(articleData),
      biasDetection: await this.detectBias(articleData),
      sourceHistory: await this.getSourceHistory(articleData),
      recommendations: await this.generateRecommendations(articleData)
    };

    // Cache the analysis
    this.analysisCache.set(articleId, analysis);
    
    // Store in database
    await enhancedStorage.saveAnalysis(articleId, analysis);
    
    return analysis;
  }

  async analyzeContent(articleData) {
    const { title, content, description } = articleData;
    const fullText = `${title || ''} ${description || ''} ${content || ''}`;
    
    return {
      wordCount: fullText.split(/\s+/).length,
      readingTime: Math.ceil(fullText.split(/\s+/).length / 200), // 200 words per minute
      keyTopics: this.extractKeyTopics(fullText),
      complexity: this.analyzeComplexity(fullText),
      hasExternalLinks: this.hasExternalLinks(content),
      hasCitations: this.hasCitations(content),
      contentQuality: this.assessContentQuality(fullText),
      languageAnalysis: this.analyzeLanguage(fullText)
    };
  }

  async assessCredibility(articleData) {
    const { url, title, content, author, source } = articleData;
    const domain = url ? new URL(url).hostname.toLowerCase() : '';
    
    const credibility = {
      overallScore: 0,
      level: 'medium',
      detailedReasons: [],
      sourceReputation: await this.assessSourceReputation(domain, source),
      contentQuality: this.assessContentCredibility(title, content),
      authorCredibility: await this.assessAuthorCredibility(author),
      factChecking: await this.assessFactChecking(articleData),
      historicalAccuracy: await this.getHistoricalAccuracy(domain),
      transparency: this.assessTransparency(articleData),
      biasIndicators: this.detectCredibilityBias(title, content)
    };

    // Calculate overall score
    credibility.overallScore = this.calculateCredibilityScore(credibility);
    credibility.level = this.getCredibilityLevel(credibility.overallScore);
    
    return credibility;
  }

  async assessSourceReputation(domain, sourceName) {
    const reputation = {
      score: 0.5,
      level: 'medium',
      factors: [],
      history: await this.getSourceHistory(domain),
      factCheckingRecord: { totalChecks: 0, accurate: 0, misleading: 0, false: 0 },
      editorialStandards: { score: 0.5, factors: ['Standard editorial practices'] }
    };

    // Domain reputation
    if (this.credibilityFactors.domainReputation.high.some(d => domain.includes(d))) {
      reputation.score += 0.3;
      reputation.factors.push('Established reputable news organization');
    } else if (this.credibilityFactors.domainReputation.medium.some(d => domain.includes(d))) {
      reputation.score += 0.1;
      reputation.factors.push('Mainstream news organization');
    } else if (this.credibilityFactors.domainReputation.low.some(d => domain.includes(d))) {
      reputation.score -= 0.3;
      reputation.factors.push('Known for sensationalist or unreliable content');
    }

    // Historical accuracy
    if (reputation.history.accuracyRate > 0.8) {
      reputation.score += 0.2;
      reputation.factors.push(`High historical accuracy (${Math.round(reputation.history.accuracyRate * 100)}%)`);
    } else if (reputation.history.accuracyRate < 0.6) {
      reputation.score -= 0.2;
      reputation.factors.push(`Low historical accuracy (${Math.round(reputation.history.accuracyRate * 100)}%)`);
    }

    reputation.level = this.getCredibilityLevel(reputation.score);
    return reputation;
  }

  assessContentCredibility(title, content) {
    const assessment = {
      score: 0.5,
      factors: [],
      sensationalistScore: 0,
      clickbaitScore: 0
    };

    const text = `${title || ''} ${content || ''}`.toLowerCase();

    // Check for sensationalist language
    const sensationalistCount = this.credibilityFactors.sensationalistPatterns.filter(pattern => 
      pattern.test(text)
    ).length;
    
    if (sensationalistCount > 0) {
      assessment.sensationalistScore = sensationalistCount / this.credibilityFactors.sensationalistPatterns.length;
      assessment.score -= assessment.sensationalistScore * 0.3;
      assessment.factors.push(`${sensationalistCount} sensationalist patterns detected`);
    }

    // Check for credibility indicators
    const positiveIndicators = this.credibilityFactors.credibilityIndicators.positive.filter(word => 
      text.includes(word)
    ).length;
    
    const negativeIndicators = this.credibilityFactors.credibilityIndicators.negative.filter(word => 
      text.includes(word)
    ).length;

    if (positiveIndicators > 0) {
      assessment.score += positiveIndicators * 0.05;
      assessment.factors.push(`${positiveIndicators} positive credibility indicators`);
    }

    if (negativeIndicators > 0) {
      assessment.score -= negativeIndicators * 0.1;
      assessment.factors.push(`${negativeIndicators} negative credibility indicators`);
    }

    // Content length and structure
    if (content && content.length > 1000) {
      assessment.score += 0.1;
      assessment.factors.push('Substantial content length');
    }

    if (content && (content.includes('http') || content.includes('www'))) {
      assessment.score += 0.1;
      assessment.factors.push('Contains external references');
    }

    assessment.score = Math.max(0.1, Math.min(1.0, assessment.score));
    return assessment;
  }

  async assessAuthorCredibility(author) {
    if (!author) return { score: 0.5, factors: ['No author information available'] };

    const authorData = await enhancedStorage.getAuthor(author);
    const assessment = {
      score: 0.5,
      factors: [],
      expertise: 'unknown',
      trackRecord: 'unknown'
    };

    if (authorData) {
      // Check author's historical accuracy
      if (authorData.historicalAccuracy > 0.8) {
        assessment.score += 0.2;
        assessment.factors.push(`High historical accuracy (${Math.round(authorData.historicalAccuracy * 100)}%)`);
        assessment.trackRecord = 'excellent';
      } else if (authorData.historicalAccuracy < 0.6) {
        assessment.score -= 0.2;
        assessment.factors.push(`Low historical accuracy (${Math.round(authorData.historicalAccuracy * 100)}%)`);
        assessment.trackRecord = 'poor';
      }

      // Check author's expertise
      if (authorData.expertise) {
        assessment.expertise = authorData.expertise;
        assessment.factors.push(`Expertise in: ${authorData.expertise}`);
      }

      // Check author's affiliations
      if (authorData.affiliations && authorData.affiliations.length > 0) {
        assessment.factors.push(`Affiliations: ${authorData.affiliations.join(', ')}`);
      }
    } else {
      assessment.factors.push('Author not found in database');
    }

    return assessment;
  }

  async getHistoricalAccuracy(domain) {
    // This would integrate with fact-checking databases
    const accuracyData = {
      accuracyRate: 0.7, // Default
      factChecks: 0,
      corrections: 0,
      lastUpdated: new Date().toISOString()
    };

    // Simulate historical data
    const historicalData = this.sourceAccuracyHistory.get(domain);
    if (historicalData) {
      accuracyData.accuracyRate = historicalData.accuracyRate;
      accuracyData.factChecks = historicalData.factChecks;
      accuracyData.corrections = historicalData.corrections;
    }

    return accuracyData;
  }



  async analyzePoliticalContent(articleData) {
    const { title, content } = articleData;
    const text = `${title || ''} ${content || ''}`.toLowerCase();

    return {
      economicPosition: this.analyzeEconomicPosition(text),
      socialPosition: this.analyzeSocialPosition(text),
      foreignPolicyPosition: this.analyzeForeignPolicyPosition(text),
      environmentalPosition: this.analyzeEnvironmentalPosition(text),
      biasIndicators: this.detectPoliticalBias(text),
      framingAnalysis: this.analyzeFraming(text),
      sourceSelection: this.analyzeSourceSelection(text)
    };
  }

  analyzeEconomicPosition(text) {
    const indicators = {
      left: ['worker', 'labor', 'union', 'minimum wage', 'wealth tax', 'income inequality', 'socialism', 'progressive tax'],
      right: ['free market', 'deregulation', 'tax cuts', 'business friendly', 'entrepreneur', 'capitalism', 'supply side']
    };

    const leftScore = indicators.left.filter(word => text.includes(word)).length;
    const rightScore = indicators.right.filter(word => text.includes(word)).length;

    return {
      position: leftScore > rightScore ? -Math.min(leftScore * 10, 100) : Math.min(rightScore * 10, 100),
      confidence: Math.min((leftScore + rightScore) * 0.1, 1.0),
      indicators: { left: leftScore, right: rightScore }
    };
  }

  analyzeSocialPosition(text) {
    const indicators = {
      libertarian: ['freedom', 'rights', 'privacy', 'individual', 'choice', 'autonomy'],
      authoritarian: ['order', 'security', 'tradition', 'authority', 'control', 'regulation']
    };

    const libertarianScore = indicators.libertarian.filter(word => text.includes(word)).length;
    const authoritarianScore = indicators.authoritarian.filter(word => text.includes(word)).length;

    return {
      position: libertarianScore > authoritarianScore ? Math.min(libertarianScore * 10, 100) : -Math.min(authoritarianScore * 10, 100),
      confidence: Math.min((libertarianScore + authoritarianScore) * 0.1, 1.0),
      indicators: { libertarian: libertarianScore, authoritarian: authoritarianScore }
    };
  }

  analyzeForeignPolicyPosition(text) {
    const indicators = {
      isolationist: ['domestic', 'america first', 'isolation', 'withdrawal', 'national interest'],
      interventionist: ['global', 'international', 'alliance', 'intervention', 'world leadership']
    };

    const isolationistScore = indicators.isolationist.filter(word => text.includes(word)).length;
    const interventionistScore = indicators.interventionist.filter(word => text.includes(word)).length;

    return {
      position: isolationistScore > interventionistScore ? -Math.min(isolationistScore * 10, 100) : Math.min(interventionistScore * 10, 100),
      confidence: Math.min((isolationistScore + interventionistScore) * 0.1, 1.0),
      indicators: { isolationist: isolationistScore, interventionist: interventionistScore }
    };
  }

  analyzeEnvironmentalPosition(text) {
    const indicators = {
      antiRegulation: ['business friendly', 'deregulation', 'economic growth', 'jobs', 'industry'],
      proRegulation: ['climate change', 'environmental protection', 'sustainability', 'green', 'carbon']
    };

    const antiRegulationScore = indicators.antiRegulation.filter(word => text.includes(word)).length;
    const proRegulationScore = indicators.proRegulation.filter(word => text.includes(word)).length;

    return {
      position: antiRegulationScore > proRegulationScore ? -Math.min(antiRegulationScore * 10, 100) : Math.min(proRegulationScore * 10, 100),
      confidence: Math.min((antiRegulationScore + proRegulationScore) * 0.1, 1.0),
      indicators: { antiRegulation: antiRegulationScore, proRegulation: proRegulationScore }
    };
  }

  calculateCredibilityScore(credibility) {
    const weights = {
      sourceReputation: 0.3,
      contentQuality: 0.25,
      authorCredibility: 0.2,
      factChecking: 0.15,
      historicalAccuracy: 0.1
    };

    return (
      credibility.sourceReputation.score * weights.sourceReputation +
      credibility.contentQuality.score * weights.contentQuality +
      credibility.authorCredibility.score * weights.authorCredibility +
      (credibility.factChecking.score || 0.5) * weights.factChecking +
      (credibility.historicalAccuracy.accuracyRate || 0.5) * weights.historicalAccuracy
    );
  }

  getCredibilityLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  extractKeyTopics(text) {
    const topics = [];
    const keywords = {
      'politics': ['election', 'vote', 'democrat', 'republican', 'congress', 'senate', 'president', 'government', 'policy', 'legislation'],
      'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'digital', 'computer', 'algorithm', 'machine learning', 'automation'],
      'health': ['health', 'medical', 'doctor', 'hospital', 'disease', 'vaccine', 'treatment', 'medicine', 'healthcare'],
      'economy': ['economy', 'market', 'stock', 'business', 'finance', 'money', 'inflation', 'recession', 'employment'],
      'environment': ['climate', 'environment', 'green', 'pollution', 'sustainability', 'carbon', 'renewable'],
      'science': ['research', 'study', 'scientists', 'discovery', 'experiment', 'data', 'analysis'],
      'education': ['school', 'university', 'education', 'student', 'learning', 'academic'],
      'entertainment': ['movie', 'music', 'celebrity', 'film', 'entertainment', 'culture'],
      'sports': ['sport', 'football', 'basketball', 'baseball', 'athlete', 'team', 'championship'],
      'international': ['world', 'global', 'international', 'foreign', 'diplomacy', 'trade']
    };

    for (const [topic, words] of Object.entries(keywords)) {
      if (words.some(word => text.toLowerCase().includes(word))) {
        topics.push(topic);
      }
    }

    return topics.length > 0 ? topics : ['general'];
  }

  analyzeComplexity(text) {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    if (avgSentenceLength > 25 || avgWordLength > 6) return 'hard';
    if (avgSentenceLength < 15 && avgWordLength < 5) return 'easy';
    return 'medium';
  }

  hasExternalLinks(content) {
    return content && (content.includes('http') || content.includes('www'));
  }

  hasCitations(content) {
    return content && (content.includes('according to') || content.includes('study') || content.includes('research'));
  }

  assessContentQuality(text) {
    const quality = {
      score: 0.5,
      factors: []
    };

    if (text.length > 1000) {
      quality.score += 0.2;
      quality.factors.push('Substantial content length');
    }

    if (text.includes('according to') || text.includes('study') || text.includes('research')) {
      quality.score += 0.2;
      quality.factors.push('Contains citations or references');
    }

    if (text.includes('http') || text.includes('www')) {
      quality.score += 0.1;
      quality.factors.push('Contains external links');
    }

    return quality;
  }

  analyzeLanguage(text) {
    return {
      emotionalIntensity: this.assessEmotionalIntensity(text),
      objectivity: this.assessObjectivity(text),
      clarity: this.assessClarity(text)
    };
  }

  assessEmotionalIntensity(text) {
    const emotionalWords = ['outrageous', 'disgusting', 'terrible', 'wonderful', 'amazing', 'horrible', 'fantastic', 'awful'];
    const count = emotionalWords.filter(word => text.toLowerCase().includes(word)).length;
    return Math.min(count / emotionalWords.length, 1.0);
  }

  assessObjectivity(text) {
    const subjectiveWords = ['clearly', 'obviously', 'undoubtedly', 'certainly', 'definitely', 'clearly', 'obviously'];
    const count = subjectiveWords.filter(word => text.toLowerCase().includes(word)).length;
    return Math.max(0, 1 - (count / subjectiveWords.length));
  }

  assessClarity(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    return avgLength < 100 ? 1.0 : Math.max(0.3, 1 - (avgLength - 100) / 200);
  }

  detectBias(articleData) {
    const { title, content } = articleData;
    const text = `${title || ''} ${content || ''}`.toLowerCase();
    
    return {
      emotional: this.detectEmotionalBias(text),
      political: this.detectPoliticalBias(text),
      sensationalist: this.detectSensationalistBias(text),
      opinionated: this.detectOpinionatedBias(text)
    };
  }

  detectEmotionalBias(text) {
    const emotionalWords = ['outrageous', 'disgusting', 'terrible', 'wonderful', 'amazing', 'horrible'];
    return emotionalWords.filter(word => text.includes(word));
  }

  detectPoliticalBias(text) {
    const politicalWords = ['liberal', 'conservative', 'left-wing', 'right-wing', 'democrat', 'republican'];
    return politicalWords.filter(word => text.includes(word));
  }

  detectSensationalistBias(text) {
    const sensationalistWords = ['shocking', 'scandal', 'exposed', 'revealed', 'secret'];
    return sensationalistWords.filter(word => text.includes(word));
  }

  detectOpinionatedBias(text) {
    const opinionatedWords = ['clearly', 'obviously', 'undoubtedly', 'certainly', 'definitely'];
    return opinionatedWords.filter(word => text.includes(word));
  }

  async getSourceHistory(articleData) {
    const domain = articleData.url ? new URL(articleData.url).hostname.toLowerCase() : '';
    return await this.getHistoricalAccuracy(domain);
  }

  async generateRecommendations(articleData) {
    const recommendations = [];

    const analysis = await this.analyzeFullArticle(articleData);
    
    if (analysis.credibilityAssessment.overallScore < 0.6) {
      recommendations.push('Verify claims with multiple sources');
    }

    if (analysis.biasDetection.emotional.length > 0) {
      recommendations.push('Be aware of emotional language that may influence perception');
    }

    if (analysis.contentAnalysis.complexity === 'hard') {
      recommendations.push('This content may require background knowledge to fully understand');
    }

    return recommendations;
  }

  async performFactChecking(articleData) {
    // This would integrate with fact-checking APIs
    return {
      score: 0.7,
      checkedClaims: 0,
      verifiedClaims: 0,
      disputedClaims: 0,
      sources: []
    };
  }

  async analyzeNetworkContext(articleData) {
    // This would analyze the network context of the article
    return {
      authorNetwork: null,
      sourceNetwork: null,
      topicNetwork: null,
      influenceMetrics: {
        reach: 0,
        credibility: 0,
        controversy: 0
      }
    };
  }

  assessTransparency(articleData) {
    const transparency = {
      score: 0.5,
      factors: []
    };

    if (articleData.author) {
      transparency.score += 0.2;
      transparency.factors.push('Author identified');
    }

    if (articleData.url) {
      transparency.score += 0.1;
      transparency.factors.push('Source URL provided');
    }

    if (articleData.content && articleData.content.includes('http')) {
      transparency.score += 0.2;
      transparency.factors.push('Contains external references');
    }

    return transparency;
  }

  detectCredibilityBias(title, content) {
    const text = `${title || ''} ${content || ''}`.toLowerCase();
    const biasIndicators = [];

    if (this.credibilityFactors.sensationalistPatterns.some(pattern => pattern.test(text))) {
      biasIndicators.push('Sensationalist language detected');
    }

    if (text.includes('anonymous') || text.includes('source says')) {
      biasIndicators.push('Anonymous sources used');
    }

    return biasIndicators;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default new ComprehensiveAnalysisService();
