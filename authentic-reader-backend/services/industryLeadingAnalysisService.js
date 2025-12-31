/**
 * Industry-Leading Article Analysis Service
 * 
 * Comprehensive media literacy analysis using Groq/Llama 3.3 70B.
 * This is the PREMIUM analysis - thorough, educational, and actionable.
 * 
 * Features:
 * - Deep rhetorical analysis (15+ manipulation techniques)
 * - Claim-by-claim verification flags
 * - Emotional manipulation scoring
 * - Narrative framing analysis
 * - Source credibility assessment
 * - Stakeholder analysis
 * - Logic score with detailed breakdown
 * - Educational guidance for critical readers
 */

import axios from 'axios';
import logger from '../utils/logger.js';

// Comprehensive taxonomy of manipulation techniques
const MANIPULATION_TAXONOMY = {
  // Logical Fallacies
  LOGICAL: [
    'Ad Hominem', 'Straw Man', 'False Dichotomy', 'Slippery Slope',
    'Circular Reasoning', 'Red Herring', 'Tu Quoque', 'Appeal to Authority',
    'Hasty Generalization', 'False Cause', 'Begging the Question'
  ],
  // Emotional Manipulation
  EMOTIONAL: [
    'Fear Mongering', 'Appeal to Pity', 'Outrage Bait', 'Moral Panic',
    'Nostalgia Manipulation', 'Us vs Them Framing', 'Victim Narrative'
  ],
  // Rhetorical Techniques
  RHETORICAL: [
    'Loaded Language', 'Weasel Words', 'Anonymous Sources', 'Cherry Picking',
    'Selective Omission', 'False Balance', 'Headline Mismatch', 'Buried Lede',
    'Euphemism', 'Dysphemism', 'Glittering Generalities'
  ],
  // Propaganda Techniques
  PROPAGANDA: [
    'Bandwagon', 'Card Stacking', 'Transfer', 'Testimonial',
    'Plain Folks', 'Name Calling', 'Repetition'
  ]
};

class IndustryLeadingAnalysisService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.lastCallTime = 0;
    this.minDelayMs = 2000;
  }

  /**
   * Build the comprehensive analysis prompt
   */
  buildSystemPrompt() {
    return `You are the world's foremost Media Literacy Expert and Cognitive Bias Researcher. Your analysis is used by journalists, fact-checkers, and educators.

Analyze the article with EXTREME thoroughness and return a comprehensive JSON analysis:

{
  "executive_summary": {
    "one_sentence": "The core claim in one neutral sentence",
    "key_claims": ["Claim 1", "Claim 2", "Claim 3"],
    "what_happened": "Factual summary of events (2-3 sentences)",
    "why_it_matters": "Significance and implications"
  },
  
  "logic_score": {
    "overall": 0-100,
    "breakdown": {
      "factual_accuracy": 0-100,
      "logical_coherence": 0-100,
      "source_quality": 0-100,
      "emotional_neutrality": 0-100,
      "completeness": 0-100
    },
    "grade": "A/B/C/D/F",
    "explanation": "Why this score"
  },
  
  "bias_analysis": {
    "political_lean": "left | center-left | center | center-right | right",
    "confidence": 0-100,
    "evidence": ["Specific evidence 1", "Evidence 2"],
    "framing": "How the story is framed (hero/villain narrative, conflict framing, etc.)",
    "what_perspectives_missing": ["Missing viewpoint 1", "Missing viewpoint 2"]
  },
  
  "emotional_manipulation": {
    "score": 0-100,
    "techniques_used": [
      {
        "technique": "Fear Mongering | Outrage Bait | etc.",
        "quote": "Exact text",
        "impact": "How this affects the reader",
        "severity": "low | medium | high"
      }
    ],
    "emotional_words": ["word1", "word2"],
    "intended_emotional_response": "What the reader is meant to feel"
  },
  
  "rhetorical_analysis": {
    "manipulation_techniques": [
      {
        "type": "Technique name",
        "category": "logical | emotional | rhetorical | propaganda",
        "quote": "Exact text from article",
        "explanation": "Why this is manipulative",
        "neutral_rewrite": "How to say this fairly",
        "severity": "low | medium | high"
      }
    ],
    "headline_accuracy": {
      "matches_content": true/false,
      "clickbait_score": 0-100,
      "issues": "Description of any headline problems"
    },
    "source_transparency": {
      "named_sources": 0,
      "anonymous_sources": 0,
      "documents_cited": 0,
      "concerns": "Any source quality issues"
    }
  },
  
  "claim_verification": [
    {
      "claim": "Specific claim from article",
      "verification_status": "verified | unverified | disputed | false | needs_context",
      "confidence": 0-100,
      "notes": "What readers should know"
    }
  ],
  
  "stakeholder_analysis": {
    "who_benefits": ["Entity 1", "Entity 2"],
    "who_is_harmed": ["Entity 1", "Entity 2"],
    "author_perspective": "Where does the author seem to stand?",
    "potential_conflicts": "Any conflicts of interest?"
  },
  
  "missing_context": {
    "critical_omissions": ["What's missing 1", "What's missing 2"],
    "historical_context_needed": "Background readers need",
    "alternative_interpretations": "Other ways to view this story",
    "questions_unanswered": ["Question 1", "Question 2"]
  },
  
  "reader_guidance": {
    "critical_questions": ["Question to ask 1", "Question to ask 2", "Question 3"],
    "what_to_verify": ["Claim to check 1", "Claim to check 2"],
    "recommended_sources": "Where to get more balanced info",
    "media_literacy_lesson": "What this article teaches about reading news critically"
  },
  
  "overall_assessment": {
    "reliability": "high | medium | low",
    "recommended_action": "trust | verify | skeptical | disregard",
    "summary": "2-3 sentence overall assessment"
  }
}

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no preamble
2. Be EXHAUSTIVE - find ALL manipulation techniques
3. Quote EXACTLY from the article for evidence
4. Be FAIR - acknowledge when articles are well-written
5. Provide ACTIONABLE guidance for readers
6. Score HONESTLY - don't be afraid to give low scores when deserved
7. Focus on EDUCATION - help readers become better media consumers`;
  }

  /**
   * Perform comprehensive analysis
   */
  async analyzeArticle(article) {
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const articleText = article.content || article.description || '';
    const title = article.title || '';
    const sourceName = article.source?.name || article.source || 'Unknown';

    // Use more content for DEEP analysis - increased for quality-focused approach
    // Since we're processing fewer articles, we can afford deeper analysis
    const maxContentLength = 8000; // Increased from 6000 for more comprehensive analysis
    const truncatedText = articleText.length > maxContentLength 
      ? articleText.substring(0, maxContentLength) + '...' 
      : articleText;

    const systemPrompt = this.buildSystemPrompt();

    let userPrompt = `TITLE: ${title}\n`;
    userPrompt += `SOURCE: ${sourceName}\n`;
    userPrompt += `\nARTICLE TEXT:\n${truncatedText}`;

    // Wait for rate limit
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < this.minDelayMs) {
      await new Promise(resolve => setTimeout(resolve, this.minDelayMs - timeSinceLastCall));
    }
    this.lastCallTime = Date.now();

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
          max_tokens: 6000, // Increased for DEEP analysis - quality over quantity approach
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for thorough analysis
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Groq response');
      }

      const analysis = JSON.parse(content);
      
      // Add metadata
      analysis.metadata = {
        analyzed_at: new Date().toISOString(),
        model: this.groqModel,
        service: 'industry-leading',
        article_length: articleText.length,
        analysis_version: '2.0'
      };

      return analysis;

    } catch (error) {
      logger.error('Industry-leading analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Calculate a composite Logic Score from the analysis
   */
  calculateLogicScore(analysis) {
    const breakdown = analysis.logic_score?.breakdown || {};
    const weights = {
      factual_accuracy: 0.25,
      logical_coherence: 0.25,
      source_quality: 0.20,
      emotional_neutrality: 0.15,
      completeness: 0.15
    };

    let weighted = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (breakdown[key] !== undefined) {
        weighted += breakdown[key] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round(weighted / totalWeight) : 50;
  }

  /**
   * Get a letter grade from score
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Convert to legacy format for backward compatibility
   */
  toLegacyFormat(analysis) {
    return {
      summary: analysis.executive_summary?.one_sentence || '',
      bias: {
        overall: analysis.bias_analysis?.political_lean || 'center',
        rating: analysis.bias_analysis?.political_lean || 'center',
        confidence: analysis.bias_analysis?.confidence || 50
      },
      sentiment: {
        label: analysis.emotional_manipulation?.intended_emotional_response || 'neutral',
        score: (100 - (analysis.emotional_manipulation?.score || 50)) / 100
      },
      credibility: {
        overall: analysis.overall_assessment?.reliability || 'medium',
        score: (analysis.logic_score?.overall || 50) / 100
      },
      fallacies: (analysis.rhetorical_analysis?.manipulation_techniques || []).map(t => ({
        type: t.type,
        quote: t.quote,
        subtext: t.explanation,
        better_alternative: t.neutral_rewrite
      })),
      confidence: (analysis.logic_score?.overall || 50) / 100,
      service: 'groq-industry-leading',
      timestamp: Date.now(),
      educational_insight: analysis.reader_guidance?.media_literacy_lesson || '',
      missing_context: analysis.missing_context?.critical_omissions?.join('. ') || '',
      
      // NEW fields for enhanced UI
      logic_score: analysis.logic_score,
      executive_summary: analysis.executive_summary,
      emotional_manipulation: analysis.emotional_manipulation,
      claim_verification: analysis.claim_verification,
      stakeholder_analysis: analysis.stakeholder_analysis,
      reader_guidance: analysis.reader_guidance,
      full_analysis: analysis
    };
  }
}

export default new IndustryLeadingAnalysisService();
