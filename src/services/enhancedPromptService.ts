/**
 * Enhanced Prompt Service for Intellectual Self Defense Course
 * 
 * Provides sophisticated, Chomsky-inspired prompts with better structure,
 * validation, and educational focus for critical thinking development.
 */

export interface PromptContext {
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  analysisDepth: 'surface' | 'deep' | 'profound';
  focusAreas: string[];
  learningObjectives: string[];
}

export interface EnhancedPrompt {
  systemPrompt: string;
  userPrompt: string;
  expectedFormat: string;
  validationRules: string[];
  educationalNotes: string[];
}

class EnhancedPromptService {
  
  /**
   * Generate Chomsky-inspired structural analysis prompt
   */
  generateStructuralAnalysisPrompt(article: any, context: PromptContext): EnhancedPrompt {
    const systemPrompt = `You are a critical media analyst trained in Noam Chomsky's analytical frameworks. Your role is to help users develop intellectual self-defense skills through rigorous analysis of media content.

ANALYTICAL FRAMEWORK:
- Apply Chomsky's "Manufacturing Consent" model
- Examine power structures and institutional bias
- Identify propaganda model filters (ownership, advertising, sourcing, flak, anti-communism)
- Focus on how consent is manufactured through media

RESPONSE REQUIREMENTS:
- Provide specific examples from the text
- Explain the analytical framework being applied
- Connect findings to broader power structures
- Offer educational insights for critical thinking development
- Use clear, accessible language appropriate for ${context.userLevel} level

CRITICAL THINKING FOCUS:
- Question underlying assumptions
- Examine what is NOT said
- Identify alternative perspectives
- Connect to historical patterns
- Assess power interests served`;

    const userPrompt = `Analyze the following article using Chomsky's structural analysis framework:

ARTICLE TITLE: "${article.title}"
SOURCE: "${article.source}"
CONTENT: "${article.content.substring(0, 2000)}..."

STRUCTURAL ANALYSIS REQUIRED:
1. Power Structures: Who owns/controls this media outlet? What interests might they serve?
2. Institutional Bias: How do professional journalism norms limit critical analysis?
3. Manufacturing Consent: How is public opinion being shaped through this content?
4. Propaganda Model: Which of the five filters are evident in this piece?

Provide your analysis in this exact JSON format:
{
  "powerStructures": {
    "ownershipAnalysis": "Analysis of media ownership and potential conflicts of interest",
    "corporateInterests": "How corporate ownership might influence content",
    "institutionalPower": "How institutional power operates through this content"
  },
  "institutionalBias": {
    "professionalNorms": "How journalism norms limit critical analysis",
    "accessDependency": "Dependency on power sources for information",
    "structuralConstraints": "Structural factors that shape content"
  },
  "manufacturingConsent": {
    "consentMechanisms": "How consent is being manufactured",
    "omissionAnalysis": "What important information is omitted",
    "emphasisPatterns": "What gets emphasized vs. marginalized"
  },
  "propagandaModel": {
    "ownershipFilter": "How ownership influences content",
    "advertisingFilter": "How advertising pressures shape content",
    "sourcingFilter": "Dependency on official sources",
    "flakFilter": "Pressure from powerful groups",
    "antiCommunismFilter": "Ideological filtering mechanisms"
  },
  "educationalInsights": {
    "keyLearnings": ["3-4 key insights for critical thinking development"],
    "criticalQuestions": ["Questions readers should ask about this content"],
    "broaderImplications": "How this analysis applies to media consumption generally"
  },
  "confidenceLevel": "high|medium|low",
  "analysisQuality": "Assessment of the depth and rigor of this analysis"
}`;

    return {
      systemPrompt,
      userPrompt,
      expectedFormat: 'JSON with specific structural analysis fields',
      validationRules: [
        'Must include all required JSON fields',
        'Power structures analysis must be specific to the content',
        'Educational insights must be actionable for users',
        'Confidence level must be justified'
      ],
      educationalNotes: [
        'This analysis helps users understand how media ownership shapes content',
        'Focus on teaching users to identify institutional bias patterns',
        'Connect findings to broader media literacy concepts'
      ]
    };
  }

  /**
   * Generate linguistic analysis prompt with Chomsky's linguistic insights
   */
  generateLinguisticAnalysisPrompt(article: any, context: PromptContext): EnhancedPrompt {
    const systemPrompt = `You are a linguistic analyst specializing in Chomsky's approach to language and power. Your expertise lies in examining how language shapes thought and serves ideological functions.

LINGUISTIC ANALYSIS FRAMEWORK:
- Examine framing and presuppositions
- Identify loaded language and ideological assumptions
- Analyze how language choices influence perception
- Connect linguistic patterns to power relations

EDUCATIONAL APPROACH:
- Help users develop linguistic awareness
- Teach critical language analysis skills
- Show how language can manipulate thought
- Provide tools for linguistic self-defense`;

    const userPrompt = `Perform a linguistic analysis of this article using Chomsky's approach to language and power:

ARTICLE: "${article.title}" - "${article.content.substring(0, 2000)}..."

LINGUISTIC ANALYSIS REQUIRED:
1. Framing Analysis: How are issues framed? What questions are asked vs. ignored?
2. Loaded Language: What emotionally charged or ideologically loaded terms are used?
3. Presuppositions: What assumptions are embedded in the language?
4. Ideological Function: How does the language serve ideological purposes?

Provide analysis in this JSON format:
{
  "framing": {
    "issueFraming": "How the main issue is framed and presented",
    "questionSelection": "What questions are asked vs. ignored",
    "perspectiveLimitation": "How framing limits perspective"
  },
  "loadedLanguage": {
    "emotionallyCharged": ["Specific emotionally charged terms used"],
    "ideologicallyLoaded": ["Terms with ideological baggage"],
    "euphemisms": ["Euphemisms that sanitize controversial content"],
    "dysphemisms": ["Terms that make things sound worse"]
  },
  "presuppositions": {
    "embeddedAssumptions": ["Unstated assumptions in the language"],
    "ideologicalPresuppositions": ["Ideological assumptions taken for granted"],
    "worldviewAssumptions": ["Assumptions about how the world works"]
  },
  "ideologicalFunction": {
    "powerInterests": "How language serves power interests",
    "thoughtShaping": "How language shapes thought patterns",
    "realityConstruction": "How language constructs a particular reality"
  },
  "educationalInsights": {
    "linguisticTools": ["Tools users can use to analyze language critically"],
    "redFlags": ["Language patterns that should raise red flags"],
    "defensiveStrategies": ["Strategies for linguistic self-defense"]
  }
}`;

    return {
      systemPrompt,
      userPrompt,
      expectedFormat: 'JSON with linguistic analysis fields',
      validationRules: [
        'Must identify specific linguistic examples from the text',
        'Analysis must connect to broader linguistic patterns',
        'Educational insights must be practical and actionable'
      ],
      educationalNotes: [
        'Focus on teaching users to recognize linguistic manipulation',
        'Provide specific examples they can look for in other content',
        'Connect linguistic analysis to critical thinking skills'
      ]
    };
  }

  /**
   * Generate comprehensive Chomsky-style analysis prompt
   */
  generateComprehensiveAnalysisPrompt(article: any, context: PromptContext): EnhancedPrompt {
    const systemPrompt = `You are conducting a comprehensive intellectual self-defense analysis inspired by Noam Chomsky's approach to media criticism. Your goal is to provide users with deep, educational analysis that builds their critical thinking skills.

COMPREHENSIVE ANALYSIS FRAMEWORK:
- Structural analysis (power, institutions, manufacturing consent)
- Linguistic analysis (framing, presuppositions, ideological function)
- Historical context (precedents, trends, systemic patterns)
- Critical analysis (what's not said, alternatives, power interests)
- Synthesis (broader implications, systemic connections)

EDUCATIONAL MISSION:
- Help users develop intellectual self-defense skills
- Teach critical media literacy
- Build analytical thinking capabilities
- Provide tools for informed citizenship`;

    const userPrompt = `Conduct a comprehensive Chomsky-inspired analysis of this article for intellectual self-defense education:

ARTICLE: "${article.title}"
SOURCE: "${article.source}"
CONTENT: "${article.content.substring(0, 3000)}..."

COMPREHENSIVE ANALYSIS REQUIRED:

1. STRUCTURAL ANALYSIS:
   - Power structures and institutional bias
   - Manufacturing consent mechanisms
   - Propaganda model application

2. LINGUISTIC ANALYSIS:
   - Framing and presuppositions
   - Loaded language and ideological assumptions
   - Language serving power interests

3. HISTORICAL CONTEXT:
   - Historical precedents and patterns
   - Long-term trends and systemic factors
   - Contextual factors and implications

4. CRITICAL ANALYSIS:
   - What is not said (silence analysis)
   - Alternative perspectives and explanations
   - Power interests and ideological functions

5. SYNTHESIS:
   - Key insights and broader implications
   - Systemic connections and patterns
   - Intellectual significance and learning value

Provide your comprehensive analysis in this JSON format:
{
  "structuralAnalysis": {
    "powerStructures": ["Analysis of power structures at play"],
    "institutionalBias": ["How institutions shape this content"],
    "manufacturingConsent": ["How consent is being manufactured"],
    "propagandaModel": ["Application of propaganda model filters"]
  },
  "linguisticAnalysis": {
    "framing": ["How issues are framed and presented"],
    "loadedLanguage": ["Emotionally charged or ideologically loaded terms"],
    "presuppositions": ["Unstated assumptions in the language"],
    "ideologicalAssumptions": ["Ideological assumptions embedded in language"]
  },
  "historicalContext": {
    "historicalPrecedents": ["Historical patterns and precedents"],
    "longTermTrends": ["Long-term trends this content reflects"],
    "systemicPatterns": ["Systemic patterns and structures"],
    "contextualFactors": ["Important contextual factors"]
  },
  "criticalAnalysis": {
    "whatIsNotSaid": ["Important information that is omitted"],
    "alternativePerspectives": ["Alternative ways to understand this issue"],
    "powerInterests": ["Power interests served by this content"],
    "ideologicalFunction": ["How this content serves ideological purposes"]
  },
  "synthesis": {
    "keyInsights": ["Key insights for critical thinking"],
    "broaderImplications": ["Broader implications and connections"],
    "systemicConnections": ["How this connects to larger systems"],
    "intellectualSignificance": "Overall significance for intellectual development"
  },
  "educationalValue": {
    "learningObjectives": ["What users will learn from this analysis"],
    "criticalThinkingSkills": ["Critical thinking skills being developed"],
    "mediaLiteracyTools": ["Media literacy tools being taught"],
    "selfDefenseStrategies": ["Intellectual self-defense strategies"]
  },
  "analysisQuality": {
    "depth": "deep|profound",
    "rigor": 8-10,
    "educationalValue": "high|medium|low",
    "confidenceLevel": "high|medium|low"
  }
}`;

    return {
      systemPrompt,
      userPrompt,
      expectedFormat: 'Comprehensive JSON with all analysis dimensions',
      validationRules: [
        'Must include all six analysis dimensions',
        'Each dimension must have specific examples from the text',
        'Educational value must be clearly articulated',
        'Analysis quality must be justified'
      ],
      educationalNotes: [
        'This is the core analysis for the Intellectual Self Defense Course',
        'Focus on building users\' critical thinking capabilities',
        'Connect all findings to broader media literacy concepts',
        'Provide actionable insights for informed citizenship'
      ]
    };
  }

  /**
   * Validate LLM response against expected format
   */
  validateResponse(response: string, expectedFormat: string): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      const parsed = JSON.parse(response);
      
      // Check for required fields based on expected format
      if (expectedFormat.includes('structuralAnalysis')) {
        if (!parsed.structuralAnalysis) {
          errors.push('Missing structural analysis section');
        }
      }
      
      if (expectedFormat.includes('linguisticAnalysis')) {
        if (!parsed.linguisticAnalysis) {
          errors.push('Missing linguistic analysis section');
        }
      }
      
      // Check for educational value
      if (!parsed.educationalValue && !parsed.educationalInsights) {
        errors.push('Missing educational insights for user learning');
        suggestions.push('Include specific learning objectives and critical thinking tools');
      }
      
      // Check for specific examples
      const hasSpecificExamples = JSON.stringify(parsed).includes('"') && 
        JSON.stringify(parsed).length > 500;
      if (!hasSpecificExamples) {
        errors.push('Analysis lacks specific examples from the text');
        suggestions.push('Include direct quotes and specific examples from the article');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        suggestions
      };
    } catch (parseError) {
      return {
        isValid: false,
        errors: ['Invalid JSON format'],
        suggestions: ['Ensure response is valid JSON with proper structure']
      };
    }
  }

  /**
   * Enhance response with educational context
   */
  enhanceResponseWithEducation(response: any, context: PromptContext): any {
    if (!response.educationalValue) {
      response.educationalValue = {
        learningObjectives: [
          'Develop critical thinking about media content',
          'Learn to identify power structures in media',
          'Build intellectual self-defense skills'
        ],
        criticalThinkingSkills: [
          'Structural analysis of media',
          'Linguistic analysis of framing',
          'Historical contextualization'
        ],
        mediaLiteracyTools: [
          'Power structure identification',
          'Bias detection techniques',
          'Alternative perspective seeking'
        ]
      };
    }
    
    return response;
  }
}

export const enhancedPromptService = new EnhancedPromptService();
export default enhancedPromptService;
