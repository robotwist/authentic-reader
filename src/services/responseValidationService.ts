/**
 * Response Validation Service
 * 
 * Validates and enhances LLM responses for the Intellectual Self Defense Course
 * Ensures high-quality, educational analysis with proper error handling
 */

export interface ValidationResult {
  isValid: boolean;
  qualityScore: number; // 0-100
  errors: string[];
  warnings: string[];
  suggestions: string[];
  enhancedResponse?: any;
}

export interface QualityMetrics {
  completeness: number; // 0-100
  specificity: number; // 0-100
  educationalValue: number; // 0-100
  analyticalDepth: number; // 0-100
  clarity: number; // 0-100
}

class ResponseValidationService {
  
  /**
   * Comprehensive response validation for Chomsky analysis
   */
  validateChomskyAnalysis(response: string, article: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    try {
      const parsed = JSON.parse(response);
      
      // Check structural completeness
      const requiredSections = [
        'structuralAnalysis',
        'linguisticAnalysis', 
        'historicalContext',
        'criticalAnalysis',
        'synthesis'
      ];
      
      for (const section of requiredSections) {
        if (!parsed[section]) {
          errors.push(`Missing required section: ${section}`);
        } else {
          // Validate section content
          this.validateSectionContent(parsed[section], section, errors, warnings, suggestions);
        }
      }
      
      // Check educational value
      if (!parsed.educationalValue && !parsed.educationalInsights) {
        errors.push('Missing educational insights for user learning');
        suggestions.push('Include specific learning objectives and critical thinking tools');
      }
      
      // Check for specific examples
      const hasSpecificExamples = this.checkForSpecificExamples(parsed, article);
      if (!hasSpecificExamples) {
        warnings.push('Analysis lacks specific examples from the text');
        suggestions.push('Include direct quotes and specific examples from the article');
      }
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(parsed, article);
      const qualityScore = this.calculateOverallQualityScore(qualityMetrics);
      
      // Enhance response if valid
      let enhancedResponse = parsed;
      if (errors.length === 0) {
        enhancedResponse = this.enhanceResponse(parsed, article);
      }
      
      return {
        isValid: errors.length === 0,
        qualityScore,
        errors,
        warnings,
        suggestions,
        enhancedResponse
      };
      
    } catch (parseError) {
      return {
        isValid: false,
        qualityScore: 0,
        errors: ['Invalid JSON format - unable to parse response'],
        warnings: [],
        suggestions: [
          'Ensure response is valid JSON with proper structure',
          'Check for unescaped quotes or malformed JSON',
          'Verify all required fields are present'
        ]
      };
    }
  }
  
  /**
   * Validate individual section content
   */
  private validateSectionContent(section: any, sectionName: string, errors: string[], warnings: string[], suggestions: string[]): void {
    if (typeof section !== 'object' || section === null) {
      errors.push(`${sectionName} must be an object with specific analysis fields`);
      return;
    }
    
    const sectionRequirements = {
      structuralAnalysis: ['powerStructures', 'institutionalBias', 'manufacturingConsent'],
      linguisticAnalysis: ['framing', 'loadedLanguage', 'presuppositions'],
      historicalContext: ['historicalPrecedents', 'longTermTrends', 'systemicPatterns'],
      criticalAnalysis: ['whatIsNotSaid', 'alternativePerspectives', 'powerInterests'],
      synthesis: ['keyInsights', 'broaderImplications', 'systemicConnections']
    };
    
    const requirements = sectionRequirements[sectionName as keyof typeof sectionRequirements] || [];
    
    for (const field of requirements) {
      if (!section[field]) {
        warnings.push(`${sectionName} missing field: ${field}`);
      } else if (Array.isArray(section[field]) && section[field].length === 0) {
        warnings.push(`${sectionName}.${field} is empty - should contain specific analysis`);
      }
    }
  }
  
  /**
   * Check for specific examples from the article
   */
  private checkForSpecificExamples(parsed: any, article: any): boolean {
    const responseText = JSON.stringify(parsed).toLowerCase();
    const articleText = article.content.toLowerCase();
    
    // Look for specific phrases or terms from the article
    const articleWords = articleText.split(/\s+/).filter(word => word.length > 4);
    const foundWords = articleWords.filter(word => responseText.includes(word));
    
    // Should have at least 5% of significant words from the article
    return foundWords.length / articleWords.length > 0.05;
  }
  
  /**
   * Calculate quality metrics for the response
   */
  private calculateQualityMetrics(parsed: any, article: any): QualityMetrics {
    const responseText = JSON.stringify(parsed);
    
    // Completeness: Check for all required sections and fields
    const requiredFields = [
      'structuralAnalysis.powerStructures',
      'linguisticAnalysis.framing',
      'historicalContext.historicalPrecedents',
      'criticalAnalysis.whatIsNotSaid',
      'synthesis.keyInsights'
    ];
    
    const foundFields = requiredFields.filter(field => {
      const parts = field.split('.');
      let current = parsed;
      for (const part of parts) {
        if (current && current[part]) {
          current = current[part];
        } else {
          return false;
        }
      }
      return true;
    });
    
    const completeness = (foundFields.length / requiredFields.length) * 100;
    
    // Specificity: Check for specific examples and detailed analysis
    const specificity = this.calculateSpecificity(responseText, article);
    
    // Educational Value: Check for learning objectives and insights
    const educationalValue = this.calculateEducationalValue(parsed);
    
    // Analytical Depth: Check for deep, nuanced analysis
    const analyticalDepth = this.calculateAnalyticalDepth(responseText);
    
    // Clarity: Check for clear, well-structured analysis
    const clarity = this.calculateClarity(responseText);
    
    return {
      completeness,
      specificity,
      educationalValue,
      analyticalDepth,
      clarity
    };
  }
  
  private calculateSpecificity(responseText: string, article: any): number {
    // Check for specific examples, quotes, and detailed analysis
    const hasQuotes = responseText.includes('"') && responseText.split('"').length > 4;
    const hasSpecificTerms = responseText.length > 2000; // Substantial analysis
    const hasExamples = responseText.includes('example') || responseText.includes('instance');
    
    let score = 0;
    if (hasQuotes) score += 40;
    if (hasSpecificTerms) score += 30;
    if (hasExamples) score += 30;
    
    return Math.min(score, 100);
  }
  
  private calculateEducationalValue(parsed: any): number {
    let score = 0;
    
    if (parsed.educationalValue || parsed.educationalInsights) {
      score += 50;
    }
    
    if (parsed.recommendations || parsed.suggestions) {
      score += 30;
    }
    
    if (parsed.criticalQuestions || parsed.learningObjectives) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }
  
  private calculateAnalyticalDepth(responseText: string): number {
    // Check for sophisticated analytical terms and concepts
    const depthIndicators = [
      'systemic', 'structural', 'institutional', 'ideological',
      'hegemonic', 'paradigm', 'framework', 'methodology',
      'contextual', 'historical', 'sociological', 'psychological'
    ];
    
    const foundIndicators = depthIndicators.filter(indicator => 
      responseText.toLowerCase().includes(indicator)
    );
    
    return Math.min((foundIndicators.length / depthIndicators.length) * 100, 100);
  }
  
  private calculateClarity(responseText: string): number {
    // Check for clear structure and readable analysis
    const hasStructure = responseText.includes('{') && responseText.includes('}');
    const hasLists = responseText.includes('[') && responseText.includes(']');
    const isReadable = responseText.length > 1000 && responseText.length < 10000;
    
    let score = 0;
    if (hasStructure) score += 40;
    if (hasLists) score += 30;
    if (isReadable) score += 30;
    
    return Math.min(score, 100);
  }
  
  /**
   * Calculate overall quality score
   */
  private calculateOverallQualityScore(metrics: QualityMetrics): number {
    const weights = {
      completeness: 0.25,
      specificity: 0.25,
      educationalValue: 0.25,
      analyticalDepth: 0.15,
      clarity: 0.10
    };
    
    return Math.round(
      metrics.completeness * weights.completeness +
      metrics.specificity * weights.specificity +
      metrics.educationalValue * weights.educationalValue +
      metrics.analyticalDepth * weights.analyticalDepth +
      metrics.clarity * weights.clarity
    );
  }
  
  /**
   * Enhance response with additional educational value
   */
  private enhanceResponse(parsed: any, article: any): any {
    const enhanced = { ...parsed };
    
    // Add educational context if missing
    if (!enhanced.educationalValue) {
      enhanced.educationalValue = {
        learningObjectives: [
          'Develop critical thinking about media content',
          'Learn to identify power structures in media',
          'Build intellectual self-defense skills',
          'Understand how language shapes perception'
        ],
        criticalThinkingSkills: [
          'Structural analysis of media',
          'Linguistic analysis of framing',
          'Historical contextualization',
          'Alternative perspective seeking'
        ],
        mediaLiteracyTools: [
          'Power structure identification',
          'Bias detection techniques',
          'Source credibility assessment',
          'Fact-checking strategies'
        ]
      };
    }
    
    // Add analysis metadata
    enhanced.analysisMetadata = {
      timestamp: new Date().toISOString(),
      articleId: article.id,
      analysisVersion: '2.0.0',
      qualityAssurance: 'validated'
    };
    
    return enhanced;
  }
  
  /**
   * Generate fallback response for failed analysis
   */
  generateFallbackResponse(article: any, error: string): any {
    return {
      structuralAnalysis: {
        powerStructures: ['Analysis temporarily unavailable - please try again'],
        institutionalBias: ['Unable to analyze institutional bias at this time'],
        manufacturingConsent: ['Consent analysis requires AI service connection'],
        propagandaModel: ['Propaganda model analysis unavailable']
      },
      linguisticAnalysis: {
        framing: ['Linguistic analysis temporarily unavailable'],
        loadedLanguage: ['Language analysis requires AI service'],
        presuppositions: ['Presupposition analysis unavailable'],
        ideologicalAssumptions: ['Ideological analysis requires connection']
      },
      historicalContext: {
        historicalPrecedents: ['Historical analysis temporarily unavailable'],
        longTermTrends: ['Trend analysis requires AI service'],
        systemicPatterns: ['Systemic analysis unavailable'],
        contextualFactors: ['Context analysis requires connection']
      },
      criticalAnalysis: {
        whatIsNotSaid: ['Critical analysis temporarily unavailable'],
        alternativePerspectives: ['Alternative analysis requires AI service'],
        powerInterests: ['Power analysis unavailable'],
        ideologicalFunction: ['Ideological analysis requires connection']
      },
      synthesis: {
        keyInsights: ['Analysis temporarily unavailable - please try again'],
        broaderImplications: ['Implications analysis requires AI service'],
        systemicConnections: ['Systemic analysis unavailable'],
        intellectualSignificance: 'Analysis temporarily unavailable due to service issues'
      },
      educationalValue: {
        learningObjectives: ['Develop patience with technical issues'],
        criticalThinkingSkills: ['Learn to work with limited information'],
        mediaLiteracyTools: ['Practice analysis with available information']
      },
      error: {
        message: error,
        fallback: true,
        retryRecommended: true
      }
    };
  }
}

export const responseValidationService = new ResponseValidationService();
export default responseValidationService;
