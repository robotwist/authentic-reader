/**
 * NLP/ML Analysis Service (Backend Version)
 * 
 * Simplified version for backend use with basic analysis capabilities.
 */

import logger from '../utils/logger.js';
import { RSS_CONFIG, CREDIBILITY_SOURCES } from '../config/rssConfig.js';

class NLPAnalysisService {
  constructor() {
    this.analysisVersion = '1.0.0';
  }

  /**
   * Perform basic NLP/ML analysis of an article
   */
  async analyzeArticle(article) {
    const startTime = Date.now();
    
    try {
      const textContent = this.extractTextContent(article);
      if (!textContent || textContent.length < RSS_CONFIG.MIN_CONTENT_LENGTH) {
        throw new Error('Insufficient content for analysis');
      }
      
      logger.info('🔍 Starting NLP/ML analysis...');
      
      // Run basic analyses
      const linguisticAnalysis = this.analyzeLinguistics(textContent);
      const statisticalAnalysis = this.analyzeStatistics(textContent);
      const credibilityIndicators = this.assessCredibility(article, textContent);
      const biasPatterns = this.detectBiasPatterns(textContent);
      const factCheckingMetrics = this.analyzeFactChecking(textContent);
      const logicalFallacies = this.detectLogicalFallacies(textContent, article);
      
      // Calculate overall quality
      const overallQuality = this.calculateOverallQuality(
        linguisticAnalysis,
        credibilityIndicators,
        biasPatterns,
        factCheckingMetrics,
        logicalFallacies
      );
      
      const processingTime = Date.now() - startTime;
      logger.info(`✅ NLP/ML analysis complete in ${processingTime}ms`);
      
      return {
        linguisticAnalysis,
        statisticalAnalysis,
        credibilityIndicators,
        biasPatterns,
        factCheckingMetrics,
        logicalFallacies,
        overallQuality,
        metadata: {
          analysisVersion: this.analysisVersion,
          timestamp: Date.now(),
          processingTime,
          confidence: this.calculateConfidence(linguisticAnalysis, credibilityIndicators),
          methodsUsed: [
            'Linguistic Analysis',
            'Statistical Analysis', 
            'Credibility Assessment',
            'Bias Pattern Detection',
            'Fact-Checking Metrics',
            'Logical Fallacy Detection'
          ]
        }
      };
    } catch (error) {
      logger.error('Error in NLP analysis:', error);
      throw error;
    }
  }
  
  extractTextContent(article) {
    const parts = [];
    if (article.title) parts.push(article.title);
    if (article.content) parts.push(article.content);
    if (article.summary) parts.push(article.summary);
    return parts.join(' ');
  }

   analyzeLinguistics(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      readability: {
        fleschScore: this.calculateFleschScore(text),
        gradeLevel: this.calculateGradeLevel(text),
        complexity: this.assessComplexity(text),
        avgWordsPerSentence: words.length / sentences.length,
        avgSyllablesPerWord: this.calculateAvgSyllables(words)
      },
      vocabulary: {
        uniqueWords: new Set(words.map(w => w.toLowerCase())).size,
        totalWords: words.length,
        lexicalDiversity: new Set(words.map(w => w.toLowerCase())).size / words.length,
        academicWords: this.countAcademicWords(words),
        emotionalWords: this.countEmotionalWords(words),
        loadedWords: this.countLoadedWords(words)
      }
    };
  }

   analyzeStatistics(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      contentMetrics: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        paragraphCount: text.split(/\n\s*\n/).length,
        readingTime: Math.ceil(words.length / RSS_CONFIG.WORDS_PER_MINUTE),
        characterCount: text.length
      },
      textStructure: {
        avgWordsPerSentence: words.length / sentences.length,
        avgSentencesPerParagraph: sentences.length / Math.max(1, text.split(/\n\s*\n/).length),
        avgCharactersPerWord: text.length / words.length
      }
    };
  }

   assessCredibility(article, text) {
    const sourceName = article.source?.name || '';
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    
    let score = 0.5;
    let level = 'medium';
    let reason = 'Standard content';
    
    // Source-based scoring - use centralized config
    if (CREDIBILITY_SOURCES.HIGH.some(s => domain.includes(s))) {
      score = 0.8;
      level = 'high';
      reason = 'Established reputable source';
    } else if (CREDIBILITY_SOURCES.MEDIUM.some(s => domain.includes(s))) {
      score = 0.6;
      level = 'medium';
      reason = 'Mainstream news source';
    } else if (CREDIBILITY_SOURCES.LOW.some(s => domain.includes(s))) {
      score = 0.3;
      level = 'low';
      reason = 'Questionable source reputation';
    }
    
    // Content-based adjustments
    if (text.length > RSS_CONFIG.SHORT_CONTENT_THRESHOLD) {
      score += 0.1;
      reason += ', substantial content';
    }
    
    return {
      overallScore: Math.min(1.0, score),
      level,
      reason,
      sourceReliability: level,
      contentQuality: text.length > 1000 ? 'high' : 'medium',
      transparency: 'medium'
    };
  }

   detectBiasPatterns(text) {
    const lowerText = text.toLowerCase();
    
    const leftBiasWords = ['progressive', 'liberal', 'democrat', 'left-wing', 'socialist'];
    const rightBiasWords = ['conservative', 'republican', 'right-wing', 'traditional', 'capitalist'];
    
    const leftCount = leftBiasWords.filter(word => lowerText.includes(word)).length;
    const rightCount = rightBiasWords.filter(word => lowerText.includes(word)).length;
    
    let direction = 'neutral';
    let confidence = 0.5;
    
    if (leftCount > rightCount) {
      direction = 'left';
      confidence = Math.min(0.8, leftCount * 0.2);
    } else if (rightCount > leftCount) {
      direction = 'right';
      confidence = Math.min(0.8, rightCount * 0.2);
    }
    
    return {
      overallBiasScore: Math.max(0, 100 - (confidence * 100)),
      direction,
      confidence,
      indicators: {
        political: leftCount + rightCount > 0 ? 'present' : 'none',
        emotional: this.detectEmotionalLanguage(lowerText),
        loaded: this.detectLoadedLanguage(lowerText)
      }
    };
  }

   analyzeFactChecking(text) {
    const claims = this.extractClaims(text);
    
    return {
      claimDetection: {
        totalClaims: claims.length,
        verifiableClaims: claims.filter(c => c.verifiable).length,
        unverifiableClaims: claims.filter(c => !c.verifiable).length,
        suspiciousClaims: claims.filter(c => c.suspicious).length
      },
      evidenceQuality: {
        strongEvidence: claims.filter(c => c.evidence === 'strong').length,
        weakEvidence: claims.filter(c => c.evidence === 'weak').length,
        noEvidence: claims.filter(c => c.evidence === 'none').length,
        contradictoryEvidence: claims.filter(c => c.evidence === 'contradictory').length
      },
      sourceVerification: {
        primarySources: claims.filter(c => c.sourceType === 'primary').length,
        secondarySources: claims.filter(c => c.sourceType === 'secondary').length,
        tertiarySources: claims.filter(c => c.sourceType === 'tertiary').length,
        unverifiedSources: claims.filter(c => c.sourceType === 'unverified').length
      },
      overallReliability: this.calculateReliability(claims)
    };
  }

   detectLogicalFallacies(text, article) {
    const fallacies = [];
    const lowerText = text.toLowerCase();
    
    // Simple fallacy detection patterns
    const fallacyPatterns = {
      appealToAuthority: ['experts say', 'authorities agree', 'scientists confirm'],
      falseDichotomy: ['either', 'or', 'choice between', 'only two options'],
      appealToEmotion: ['think of the children', 'for the sake of', 'imagine if'],
      adHominem: ['typical', 'as expected from', 'clearly biased'],
      slipperySlope: ['if we allow', 'next thing you know', 'will lead to'],
      strawMan: ['some people say', 'critics argue', 'opponents claim'],
      hastyGeneralization: ['all', 'every', 'none', 'never', 'always'],
      postHoc: ['since then', 'after that', 'caused by', 'led to'],
      bandwagon: ['everyone knows', 'most people agree', 'popular opinion'],
      redHerring: ['but what about', 'speaking of', 'by the way']
    };
    
    Object.entries(fallacyPatterns).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        if (lowerText.includes(pattern)) {
          fallacies.push({
            type: this.formatFallacyType(type),
            description: this.formatFallacyType(type),
            excerpt: this.extractExcerpt(text, pattern, 50),
            context: this.extractContext(text, pattern, 100),
            impact: this.getFallacyImpact(type),
            confidence: 70,
            explanation: this.getFallacyExplanation(type),
            counterargument: this.getFallacyCounterargument(type),
            category: 'informal'
          });
        }
      });
    });
    
    return {
      fallacies: fallacies.slice(0, 10), // Limit to 10 fallacies
      overallScore: Math.max(0, 100 - (fallacies.length * 10)),
      categories: {
        informal: fallacies.length,
        formal: 0,
        cognitive: 0
      },
      severity: fallacies.length > 5 ? 'high' : fallacies.length > 2 ? 'medium' : 'low',
      summary: this.generateFallacySummary(fallacies),
      recommendations: this.generateFallacyRecommendations(fallacies)
    };
  }

  // Helper methods
   calculateFleschScore(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  }

   calculateGradeLevel(text) {
    const fleschScore = this.calculateFleschScore(text);
    if (fleschScore >= 90) return 5;
    if (fleschScore >= 80) return 6;
    if (fleschScore >= 70) return 7;
    if (fleschScore >= 60) return 8;
    if (fleschScore >= 50) return 9;
    if (fleschScore >= 30) return 10;
    return 12;
  }

   assessComplexity(text) {
    const gradeLevel = this.calculateGradeLevel(text);
    if (gradeLevel <= 6) return 'very_easy';
    if (gradeLevel <= 8) return 'easy';
    if (gradeLevel <= 10) return 'moderate';
    if (gradeLevel <= 12) return 'difficult';
    return 'very_difficult';
  }

   calculateAvgSyllables(words) {
    const totalSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    return words.length > 0 ? totalSyllables / words.length : 0;
  }

   countSyllables(word) {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    return Math.max(1, count);
  }

   countAcademicWords(words) {
    const academicWords = ['analysis', 'research', 'study', 'data', 'evidence', 'theory', 'hypothesis'];
    return words.filter(word => academicWords.includes(word.toLowerCase())).length;
  }

   countEmotionalWords(words) {
    const emotionalWords = ['amazing', 'terrible', 'shocking', 'incredible', 'devastating', 'outrageous'];
    return words.filter(word => emotionalWords.includes(word.toLowerCase())).length;
  }

   countLoadedWords(words) {
    const loadedWords = ['obviously', 'clearly', 'undoubtedly', 'certainly', 'definitely'];
    return words.filter(word => loadedWords.includes(word.toLowerCase())).length;
  }

   detectEmotionalLanguage(text) {
    const emotionalWords = ['amazing', 'terrible', 'shocking', 'incredible', 'devastating'];
    return emotionalWords.some(word => text.includes(word)) ? 'high' : 'low';
  }

   detectLoadedLanguage(text) {
    const loadedWords = ['obviously', 'clearly', 'undoubtedly', 'certainly', 'definitely'];
    return loadedWords.some(word => text.includes(word)) ? 'high' : 'low';
  }

   extractClaims(text) {
    // Simple claim extraction - in a real implementation, this would be more sophisticated
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.map(sentence => ({
      text: sentence.trim(),
      verifiable: sentence.includes('according to') || sentence.includes('study shows'),
      suspicious: sentence.includes('sources say') || sentence.includes('rumors'),
      evidence: sentence.includes('according to') ? 'strong' : 'weak',
      sourceType: sentence.includes('according to') ? 'secondary' : 'unverified'
    }));
  }

   calculateReliability(claims) {
    if (claims.length === 0) return 50;
    const verifiableCount = claims.filter(c => c.verifiable).length;
    return Math.round((verifiableCount / claims.length) * 100);
  }

   extractExcerpt(text, pattern, length) {
    const index = text.toLowerCase().indexOf(pattern.toLowerCase());
    if (index === -1) return '';
    const start = Math.max(0, index - length / 2);
    const end = Math.min(text.length, index + pattern.length + length / 2);
    return text.substring(start, end).trim();
  }

   extractContext(text, pattern, length) {
    return this.extractExcerpt(text, pattern, length);
  }

   formatFallacyType(type) {
    return type.split(/(?=[A-Z])/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

   getFallacyImpact(type) {
    const highImpact = ['falseDichotomy', 'adHominem', 'slipperySlope', 'strawMan', 'postHoc'];
    return highImpact.includes(type) ? 'high' : 'medium';
  }

   getFallacyExplanation(type) {
    const explanations = {
      appealToAuthority: 'The argument relies on authority figures rather than presenting concrete evidence.',
      falseDichotomy: 'The text presents a situation as having only two possible outcomes.',
      appealToEmotion: 'The argument uses emotional language rather than logical evidence.',
      adHominem: 'The argument attacks the person rather than addressing the claim.',
      slipperySlope: 'The argument suggests a small step will inevitably lead to significant impact.',
      strawMan: 'The argument misrepresents an opponent\'s position to make it easier to attack.',
      hastyGeneralization: 'The argument makes broad generalizations based on limited evidence.',
      postHoc: 'The argument assumes correlation implies causation.',
      bandwagon: 'The argument suggests something is true because many people believe it.',
      redHerring: 'The argument introduces irrelevant information to distract from the main issue.'
    };
    return explanations[type] || 'This is a logical fallacy that weakens the argument.';
  }

   getFallacyCounterargument(type) {
    const counterarguments = {
      appealToAuthority: 'Consider whether the authority is actually an expert in the relevant field.',
      falseDichotomy: 'Look for middle ground options and alternative perspectives.',
      appealToEmotion: 'Separate emotional appeals from factual claims.',
      adHominem: 'Focus on the substance of the argument rather than personal attacks.',
      slipperySlope: 'Examine whether each step in the chain is actually inevitable.',
      strawMan: 'Seek out the original arguments to evaluate them fairly.',
      hastyGeneralization: 'Consider whether the evidence is sufficient to support broad claims.',
      postHoc: 'Look for other possible explanations and evidence of causation.',
      bandwagon: 'Evaluate the argument based on its merits rather than popularity.',
      redHerring: 'Stay focused on the original issue and don\'t be distracted.'
    };
    return counterarguments[type] || 'Evaluate the argument based on evidence and logic.';
  }

   generateFallacySummary(fallacies) {
    if (fallacies.length === 0) {
      return 'No significant logical fallacies detected. The argumentation appears sound.';
    }
    return `Detected ${fallacies.length} logical fallacy${fallacies.length > 1 ? 'ies' : ''}. This may weaken the overall argument.`;
  }

   generateFallacyRecommendations(fallacies) {
    if (fallacies.length === 0) {
      return ['Continue to evaluate arguments critically and look for evidence-based reasoning.'];
    }
    return [
      'Consider seeking additional sources to verify claims',
      'Evaluate the overall logical structure of the argument',
      'Look for evidence-based reasoning rather than emotional appeals'
    ];
  }

   calculateOverallQuality(linguistic, credibility, bias, factChecking, logicalFallacies) {
    const weights = {
      credibility: 0.30,
      bias: 0.20,
      factChecking: 0.20,
      logicalFallacies: 0.20,
      readability: 0.10
    };
    
    const scores = {
      credibility: credibility.overallScore * 100,
      bias: bias.overallBiasScore,
      factChecking: factChecking.overallReliability,
      logicalFallacies: logicalFallacies.overallScore,
      readability: Math.max(0, 100 - (linguistic.readability.gradeLevel - 8) * 10)
    };
    
    const weightedScore = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (scores[key] * weight);
    }, 0);
    
    const grade = weightedScore >= 80 ? 'A' : weightedScore >= 60 ? 'B' : 
                  weightedScore >= 40 ? 'C' : weightedScore >= 20 ? 'D' : 'F';
    
    return {
      score: Math.round(weightedScore),
      grade,
      summary: this.generateQualitySummary(grade, weightedScore)
    };
  }

   generateQualitySummary(grade, score) {
    const summaries = {
      'A': 'Excellent content quality with strong credibility and minimal bias.',
      'B': 'Good content quality with reliable information and balanced perspective.',
      'C': 'Average content quality with some concerns about bias or credibility.',
      'D': 'Below average content quality with significant bias or credibility issues.',
      'F': 'Poor content quality with major bias, credibility, or logical issues.'
    };
    return summaries[grade] || 'Content quality assessment completed.';
  }

   calculateConfidence(linguistic, credibility) {
    let confidence = 0.7; // Base confidence
    
    // Adjust based on content length
    if (linguistic.vocabulary.totalWords > 500) confidence += 0.1;
    if (linguistic.vocabulary.totalWords > 1000) confidence += 0.1;
    
    // Adjust based on credibility
    if (credibility.level === 'high') confidence += 0.1;
    if (credibility.level === 'low') confidence -= 0.1;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }
}

export const nlpAnalysisService = new NLPAnalysisService();
export default nlpAnalysisService;
