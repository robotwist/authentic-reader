/**
 * Comprehensive Analysis Service
 *
 * Orchestrates multiple AI analysis services to provide thorough article analysis:
 * 1. Advanced logical fallacy detection
 * 2. Multi-dimensional bias analysis
 * 3. Credibility assessment
 * 4. Sentiment and emotion analysis
 * 5. Fact-checking indicators
 * 6. Reading level and complexity analysis
 * 7. Source reliability scoring
 */
import advancedLogicalFallacyService from './advancedLogicalFallacyService';
import advancedBiasAnalysisService from './advancedBiasAnalysisService';
class ComprehensiveAnalysisService {
    constructor() {
        Object.defineProperty(this, "analysisVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '2.0.0'
        });
    }
    /**
     * Perform comprehensive analysis of an article
     */
    async analyzeArticle(article, options = {}) {
        const startTime = Date.now();
        const aiServicesUsed = [];
        // Default to including all analyses
        const { includeAI = true, includeFallacies = true, includeBias = true, includeCredibility = true, includeReadability = true, includeFactChecking = true } = options;
        // Extract text content for analysis
        const textContent = this.extractTextContent(article);
        if (!textContent || textContent.length < 50) {
            throw new Error('Insufficient content for comprehensive analysis');
        }
        console.log('🔍 Starting comprehensive analysis...');
        // Run analyses in parallel for better performance
        const analysisPromises = [];
        // Logical Fallacy Analysis
        let fallacyPromise;
        if (includeFallacies) {
            console.log('🎯 Analyzing logical fallacies...');
            fallacyPromise = advancedLogicalFallacyService.analyzeFallacies(textContent, {
                title: article.title,
                source: article.source?.name,
                author: article.author,
                context: 'news_article'
            });
            analysisPromises.push(fallacyPromise);
            aiServicesUsed.push('Advanced Fallacy Detection');
        }
        // Bias Analysis
        let biasPromise;
        if (includeBias) {
            console.log('⚖️ Analyzing bias patterns...');
            biasPromise = advancedBiasAnalysisService.analyzeBias(textContent, {
                title: article.title,
                source: article.source?.name,
                author: article.author,
                publishDate: article.publishedAt
            });
            analysisPromises.push(biasPromise);
            aiServicesUsed.push('Multi-Dimensional Bias Analysis');
        }
        // Wait for core analyses to complete
        await Promise.allSettled(analysisPromises);
        // Get results (with fallbacks for failed analyses)
        const logicalFallacies = includeFallacies ? await fallacyPromise.catch(this.createFallbackFallacyResult) : this.createFallbackFallacyResult();
        const biasAnalysis = includeBias ? await biasPromise.catch(this.createFallbackBiasResult) : this.createFallbackBiasResult();
        // Synchronous analyses
        console.log('📊 Analyzing credibility and readability...');
        const credibility = includeCredibility ? this.assessCredibility(article, biasAnalysis, logicalFallacies) : this.createFallbackCredibilityResult();
        const readability = includeReadability ? this.analyzeReadability(textContent) : this.createFallbackReadabilityResult();
        const factChecking = includeFactChecking ? this.analyzeFactCheckingIndicators(textContent, article) : this.createFallbackFactCheckingResult();
        // Calculate overall quality
        const overallQuality = this.calculateOverallQuality(logicalFallacies, biasAnalysis, credibility, readability, factChecking);
        // Generate recommendations
        const recommendations = this.generateRecommendations(logicalFallacies, biasAnalysis, credibility, readability, factChecking);
        const processingTime = Date.now() - startTime;
        console.log(`✅ Analysis complete in ${processingTime}ms`);
        return {
            logicalFallacies,
            biasAnalysis,
            credibility,
            readability,
            factChecking,
            overallQuality,
            recommendations,
            metadata: {
                analysisVersion: this.analysisVersion,
                timestamp: Date.now(),
                processingTime,
                confidence: this.calculateOverallConfidence(logicalFallacies, biasAnalysis, credibility),
                aiServicesUsed
            }
        };
    }
    extractTextContent(article) {
        const parts = [];
        if (article.title)
            parts.push(article.title);
        if (article.description)
            parts.push(article.description);
        if (article.content)
            parts.push(article.content);
        if (article.summary)
            parts.push(article.summary);
        return parts.join(' ').trim();
    }
    assessCredibility(article, biasAnalysis, fallacyAnalysis) {
        const factors = {
            sourceReliability: this.assessSourceReliability(article.source?.name || ''),
            authorCredentials: this.assessAuthorCredentials(article.author || ''),
            factualAccuracy: this.assessFactualAccuracy(article, fallacyAnalysis),
            transparency: this.assessTransparency(article),
            bias: Math.max(0, 100 - biasAnalysis.scores.overall)
        };
        const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;
        const warnings = [];
        const strengths = [];
        if (factors.sourceReliability < 60)
            warnings.push('Source has questionable reliability');
        else if (factors.sourceReliability > 80)
            strengths.push('Reputable news source');
        if (factors.bias < 50)
            warnings.push('High bias detected in content');
        else if (factors.bias > 80)
            strengths.push('Content appears relatively unbiased');
        if (fallacyAnalysis.fallacies.length > 3)
            warnings.push('Multiple logical fallacies detected');
        else if (fallacyAnalysis.fallacies.length === 0)
            strengths.push('No significant logical fallacies found');
        if (factors.transparency < 50)
            warnings.push('Limited transparency in sourcing');
        else if (factors.transparency > 70)
            strengths.push('Good transparency and sourcing');
        let overall;
        if (score > 80)
            overall = 'Highly credible source with reliable content';
        else if (score > 60)
            overall = 'Generally credible but some concerns noted';
        else if (score > 40)
            overall = 'Moderate credibility with significant concerns';
        else
            overall = 'Low credibility - read with extreme caution';
        return { score, factors, warnings, strengths, overall };
    }
    assessSourceReliability(sourceName) {
        // Simplified source reliability assessment
        const reliableSources = [
            'reuters', 'associated press', 'ap', 'bbc', 'npr', 'pbs', 'cspan',
            'wall street journal', 'financial times', 'economist'
        ];
        const moderatelySources = [
            'cnn', 'fox news', 'msnbc', 'new york times', 'washington post',
            'usa today', 'abc news', 'cbs news', 'nbc news'
        ];
        const unreliableSources = [
            'infowars', 'breitbart', 'dailykos', 'newsmax', 'oann'
        ];
        const lowerName = sourceName.toLowerCase();
        if (reliableSources.some(source => lowerName.includes(source)))
            return 90;
        if (moderatelySources.some(source => lowerName.includes(source)))
            return 70;
        if (unreliableSources.some(source => lowerName.includes(source)))
            return 20;
        return 50; // Unknown source
    }
    assessAuthorCredentials(author) {
        if (!author)
            return 40;
        // Basic assessment based on author information
        const hasCredentials = /\b(dr\.|prof\.|phd|journalist|correspondent|editor)\b/i.test(author);
        const hasTitle = /\b(senior|chief|managing|staff)\b/i.test(author);
        let score = 50;
        if (hasCredentials)
            score += 30;
        if (hasTitle)
            score += 20;
        return Math.min(100, score);
    }
    assessFactualAccuracy(article, fallacyAnalysis) {
        let score = 70; // Start with neutral
        // Penalize for logical fallacies
        const fallacyPenalty = Math.min(40, fallacyAnalysis.fallacies.length * 8);
        score -= fallacyPenalty;
        // Look for fact-checking indicators
        const content = this.extractTextContent(article).toLowerCase();
        // Positive indicators
        if (content.includes('according to') || content.includes('data shows') ||
            content.includes('study found') || content.includes('research indicates')) {
            score += 15;
        }
        // Negative indicators
        if (content.includes('allegedly') || content.includes('reportedly') ||
            content.includes('sources say') || content.includes('anonymous sources')) {
            score -= 10;
        }
        return Math.max(0, Math.min(100, score));
    }
    assessTransparency(article) {
        let score = 30; // Start low
        if (article.author)
            score += 25;
        if (article.publishedAt)
            score += 15;
        if (article.source?.name)
            score += 20;
        const content = this.extractTextContent(article);
        const hasExternalLinks = /https?:\/\//.test(content);
        if (hasExternalLinks)
            score += 10;
        return Math.min(100, score);
    }
    analyzeReadability(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const wordCount = words.length;
        const sentenceCount = sentences.length;
        const avgWordsPerSentence = wordCount / sentenceCount;
        // Estimate syllables (simplified)
        const avgSyllablesPerWord = words.reduce((sum, word) => {
            return sum + this.estimateSyllables(word);
        }, 0) / wordCount;
        // Flesch Reading Ease approximation
        const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        let complexity;
        let gradeLevel;
        if (fleschScore >= 90) {
            complexity = 'very_easy';
            gradeLevel = 5;
        }
        else if (fleschScore >= 80) {
            complexity = 'easy';
            gradeLevel = 6;
        }
        else if (fleschScore >= 70) {
            complexity = 'moderate';
            gradeLevel = 8;
        }
        else if (fleschScore >= 60) {
            complexity = 'difficult';
            gradeLevel = 10;
        }
        else {
            complexity = 'very_difficult';
            gradeLevel = 13;
        }
        const readingTime = Math.ceil(wordCount / 200); // 200 words per minute average
        const recommendations = [];
        if (avgWordsPerSentence > 25) {
            recommendations.push('Consider shorter sentences for better readability');
        }
        if (complexity === 'very_difficult') {
            recommendations.push('Content may be too complex for general audience');
        }
        if (readingTime > 15) {
            recommendations.push('Long article - consider breaking into sections');
        }
        return {
            gradeLevel,
            readingTime,
            complexity,
            wordCount,
            sentenceCount,
            avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
            avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
            recommendations
        };
    }
    estimateSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3)
            return 1;
        const vowels = 'aeiouy';
        let syllableCount = 0;
        let previousWasVowel = false;
        for (let i = 0; i < word.length; i++) {
            const isVowel = vowels.includes(word[i]);
            if (isVowel && !previousWasVowel) {
                syllableCount++;
            }
            previousWasVowel = isVowel;
        }
        if (word.endsWith('e'))
            syllableCount--;
        return Math.max(1, syllableCount);
    }
    analyzeFactCheckingIndicators(text, article) {
        const lowerText = text.toLowerCase();
        // Detect potential claims
        const claimPatterns = [
            /\b(?:according to|data shows|study found|research indicates|statistics show|evidence suggests)\b/gi,
            /\b(?:\d+(?:\.\d+)?%|\d+\s+(?:percent|million|billion|thousand))\b/gi,
            /\b(?:experts say|scientists believe|researchers found)\b/gi
        ];
        let claimsDetected = 0;
        const verifiableClaims = [];
        const unverifiableClaims = [];
        const suspiciousClaims = [];
        for (const pattern of claimPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                claimsDetected += matches.length;
                matches.forEach(match => {
                    if (this.isVerifiableClaim(match)) {
                        verifiableClaims.push(match);
                    }
                    else if (this.isSuspiciousClaim(match)) {
                        suspiciousClaims.push(match);
                    }
                    else {
                        unverifiableClaims.push(match);
                    }
                });
            }
        }
        const sourcesProvided = /\b(?:source|citation|reference|link|url)\b/i.test(text);
        const externalLinksCount = (text.match(/https?:\/\//g) || []).length;
        const recommendedFactChecks = [];
        if (suspiciousClaims.length > 0) {
            recommendedFactChecks.push('Verify suspicious statistical claims');
        }
        if (claimsDetected > 5 && externalLinksCount === 0) {
            recommendedFactChecks.push('Check claims with original sources');
        }
        if (lowerText.includes('breaking') || lowerText.includes('exclusive')) {
            recommendedFactChecks.push('Verify breaking news with multiple sources');
        }
        return {
            claimsDetected,
            verifiableClaims: verifiableClaims.slice(0, 5),
            unverifiableClaims: unverifiableClaims.slice(0, 5),
            suspiciousClaims: suspiciousClaims.slice(0, 5),
            sourcesProvided,
            externalLinksCount,
            recommendedFactChecks
        };
    }
    isVerifiableClaim(claim) {
        return /\b(?:according to|data shows|study found|statistics show)\b/i.test(claim);
    }
    isSuspiciousClaim(claim) {
        return /\b(?:some say|many believe|it's rumored|allegedly)\b/i.test(claim);
    }
    calculateOverallQuality(fallacies, bias, credibility, readability, factChecking) {
        // Weighted scoring
        const weights = {
            fallacies: 0.25,
            bias: 0.25,
            credibility: 0.30,
            readability: 0.10,
            factChecking: 0.10
        };
        const scores = {
            fallacies: fallacies.overallScore,
            bias: bias.summary.neutralityScore,
            credibility: credibility.score,
            readability: Math.max(0, 100 - (readability.gradeLevel - 8) * 10), // Penalty for very high grade level
            factChecking: factChecking.sourcesProvided ? 80 : 50
        };
        const weightedScore = Object.entries(weights).reduce((sum, [key, weight]) => {
            return sum + (scores[key] * weight);
        }, 0);
        const score = Math.round(weightedScore);
        let grade;
        let summary;
        if (score >= 90) {
            grade = 'A';
            summary = 'Excellent quality content with high credibility and minimal bias';
        }
        else if (score >= 80) {
            grade = 'B';
            summary = 'Good quality content with some minor issues';
        }
        else if (score >= 70) {
            grade = 'C';
            summary = 'Average quality content with moderate concerns';
        }
        else if (score >= 60) {
            grade = 'D';
            summary = 'Below average quality with significant issues';
        }
        else {
            grade = 'F';
            summary = 'Poor quality content with major credibility and bias issues';
        }
        return { score, grade, summary };
    }
    generateRecommendations(fallacies, bias, credibility, readability, factChecking) {
        const forReaders = [];
        const forAuthors = [];
        const forFactCheckers = [];
        // Reader recommendations
        if (bias.scores.overall > 60) {
            forReaders.push('Be aware of potential bias - seek alternative viewpoints');
        }
        if (fallacies.fallacies.length > 0) {
            forReaders.push('Watch for logical fallacies that may weaken arguments');
        }
        if (credibility.score < 70) {
            forReaders.push('Verify claims with additional sources');
        }
        if (readability.complexity === 'very_difficult') {
            forReaders.push('Complex content - take time to understand key points');
        }
        // Author recommendations
        if (fallacies.fallacies.length > 2) {
            forAuthors.push('Review argumentation for logical consistency');
        }
        if (bias.indicators.length > 3) {
            forAuthors.push('Consider more balanced language and perspectives');
        }
        if (readability.avgWordsPerSentence > 25) {
            forAuthors.push('Use shorter sentences to improve readability');
        }
        if (!factChecking.sourcesProvided) {
            forAuthors.push('Add sources and citations to support claims');
        }
        // Fact-checker recommendations
        if (factChecking.suspiciousClaims.length > 0) {
            forFactCheckers.push('Priority: Verify suspicious statistical claims');
        }
        if (factChecking.claimsDetected > 5 && factChecking.externalLinksCount === 0) {
            forFactCheckers.push('Check all major claims with original sources');
        }
        if (credibility.score < 50) {
            forFactCheckers.push('High priority for fact-checking due to low credibility');
        }
        return { forReaders, forAuthors, forFactCheckers };
    }
    calculateOverallConfidence(fallacies, bias, credibility) {
        // Average confidence from different analyses
        const confidences = [
            bias.metadata.confidence,
            credibility.score / 100, // Convert to 0-1 scale
        ];
        if (fallacies.fallacies.length > 0) {
            const avgFallacyConfidence = fallacies.fallacies.reduce((sum, f) => sum + f.confidence, 0) / fallacies.fallacies.length;
            confidences.push(avgFallacyConfidence);
        }
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }
    // Fallback methods for failed analyses
    createFallbackFallacyResult() {
        return {
            fallacies: [],
            overallScore: 75,
            categories: {},
            recommendations: ['Analysis service unavailable - manual review recommended'],
            summary: 'Fallacy analysis could not be completed'
        };
    }
    createFallbackBiasResult() {
        return {
            indicators: [],
            scores: {
                overall: 50,
                political: { leftRight: 50, confidence: 0.5, indicators: [] },
                emotional: { fear: 0, anger: 0, hope: 0, disgust: 0, sadness: 0, joy: 0, overall: 0 },
                cognitive: { confirmationBias: 0, availabilityHeuristic: 0, anchoringBias: 0, framingEffect: 0, overall: 0 },
                linguistic: { loadedLanguage: 0, euphemisms: 0, emotionalWords: 0, certaintyLanguage: 0, overall: 0 }
            },
            summary: {
                overallAssessment: 'Bias analysis could not be completed',
                primaryBiases: [],
                recommendations: ['Manual bias review recommended'],
                neutralityScore: 50
            },
            metadata: {
                analysisMethod: 'fallback',
                confidence: 0.3,
                timestamp: Date.now(),
                textLength: 0
            }
        };
    }
    createFallbackCredibilityResult() {
        return {
            score: 50,
            factors: {
                sourceReliability: 50,
                authorCredentials: 50,
                factualAccuracy: 50,
                transparency: 50,
                bias: 50
            },
            warnings: ['Credibility analysis unavailable'],
            strengths: [],
            overall: 'Unable to assess credibility automatically'
        };
    }
    createFallbackReadabilityResult() {
        return {
            gradeLevel: 10,
            readingTime: 5,
            complexity: 'moderate',
            wordCount: 0,
            sentenceCount: 0,
            avgWordsPerSentence: 0,
            avgSyllablesPerWord: 0,
            recommendations: ['Readability analysis unavailable']
        };
    }
    createFallbackFactCheckingResult() {
        return {
            claimsDetected: 0,
            verifiableClaims: [],
            unverifiableClaims: [],
            suspiciousClaims: [],
            sourcesProvided: false,
            externalLinksCount: 0,
            recommendedFactChecks: ['Manual fact-checking recommended']
        };
    }
}
export default new ComprehensiveAnalysisService();
