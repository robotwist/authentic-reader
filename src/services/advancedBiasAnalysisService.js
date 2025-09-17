/**
 * Advanced Bias Analysis Service
 *
 * Provides comprehensive bias detection using multiple analytical approaches:
 * 1. Political bias detection (left-right spectrum)
 * 2. Emotional bias analysis (fear, anger, hope, etc.)
 * 3. Cognitive bias identification (confirmation bias, availability heuristic, etc.)
 * 4. Source bias assessment based on known patterns
 * 5. Linguistic bias markers (loaded language, framing, etc.)
 * 6. Statistical bias in data presentation
 */
class AdvancedBiasAnalysisService {
    constructor() {
        Object.defineProperty(this, "politicalKeywords", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "emotionalKeywords", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cognitivePatterns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "loadedLanguagePatterns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.initializeBiasPatterns();
    }
    initializeBiasPatterns() {
        // Political bias keywords
        this.politicalKeywords = new Map([
            // Left-leaning terms
            ['progressive', { lean: 'left', weight: 0.7 }],
            ['social justice', { lean: 'left', weight: 0.8 }],
            ['equality', { lean: 'left', weight: 0.6 }],
            ['climate change', { lean: 'left', weight: 0.5 }],
            ['universal healthcare', { lean: 'left', weight: 0.8 }],
            ['wealth inequality', { lean: 'left', weight: 0.7 }],
            ['corporate greed', { lean: 'left', weight: 0.8 }],
            ['systemic racism', { lean: 'left', weight: 0.8 }],
            ['living wage', { lean: 'left', weight: 0.7 }],
            ['public option', { lean: 'left', weight: 0.6 }],
            // Right-leaning terms
            ['traditional values', { lean: 'right', weight: 0.7 }],
            ['free market', { lean: 'right', weight: 0.8 }],
            ['personal responsibility', { lean: 'right', weight: 0.6 }],
            ['law and order', { lean: 'right', weight: 0.7 }],
            ['strong defense', { lean: 'right', weight: 0.6 }],
            ['fiscal responsibility', { lean: 'right', weight: 0.7 }],
            ['job creators', { lean: 'right', weight: 0.8 }],
            ['constitutional rights', { lean: 'right', weight: 0.5 }],
            ['border security', { lean: 'right', weight: 0.8 }],
            ['tax relief', { lean: 'right', weight: 0.7 }]
        ]);
        // Emotional keywords
        this.emotionalKeywords = new Map([
            // Fear
            ['terrifying', { emotion: 'fear', intensity: 0.9 }],
            ['dangerous', { emotion: 'fear', intensity: 0.7 }],
            ['threat', { emotion: 'fear', intensity: 0.8 }],
            ['crisis', { emotion: 'fear', intensity: 0.7 }],
            ['disaster', { emotion: 'fear', intensity: 0.8 }],
            ['catastrophe', { emotion: 'fear', intensity: 0.9 }],
            // Anger
            ['outrageous', { emotion: 'anger', intensity: 0.9 }],
            ['infuriating', { emotion: 'anger', intensity: 0.8 }],
            ['disgusting', { emotion: 'anger', intensity: 0.8 }],
            ['betrayal', { emotion: 'anger', intensity: 0.7 }],
            ['scandal', { emotion: 'anger', intensity: 0.7 }],
            // Hope
            ['inspiring', { emotion: 'hope', intensity: 0.8 }],
            ['breakthrough', { emotion: 'hope', intensity: 0.7 }],
            ['promising', { emotion: 'hope', intensity: 0.6 }],
            ['opportunity', { emotion: 'hope', intensity: 0.5 }],
            ['bright future', { emotion: 'hope', intensity: 0.8 }],
            // Disgust
            ['revolting', { emotion: 'disgust', intensity: 0.9 }],
            ['sickening', { emotion: 'disgust', intensity: 0.8 }],
            ['repulsive', { emotion: 'disgust', intensity: 0.8 }],
            // Sadness
            ['heartbreaking', { emotion: 'sadness', intensity: 0.8 }],
            ['tragic', { emotion: 'sadness', intensity: 0.7 }],
            ['devastating', { emotion: 'sadness', intensity: 0.8 }],
            // Joy
            ['wonderful', { emotion: 'joy', intensity: 0.7 }],
            ['amazing', { emotion: 'joy', intensity: 0.6 }],
            ['fantastic', { emotion: 'joy', intensity: 0.7 }],
            ['incredible', { emotion: 'joy', intensity: 0.6 }]
        ]);
        // Cognitive bias patterns
        this.cognitivePatterns = new Map([
            ['confirmation_bias', {
                    bias: 'Confirmation Bias',
                    patterns: [
                        /\b(?:as\s+expected|predictably|not\s+surprisingly|obviously|clearly)\b/gi,
                        /\b(?:proves\s+what\s+we\s+already\s+knew|confirms\s+our\s+suspicions)\b/gi
                    ],
                    weight: 0.7
                }],
            ['availability_heuristic', {
                    bias: 'Availability Heuristic',
                    patterns: [
                        /\b(?:everyone\s+knows|we\s+all\s+remember|recent\s+events\s+show)\b/gi,
                        /\b(?:just\s+look\s+at|for\s+example|take\s+the\s+case\s+of)\b/gi
                    ],
                    weight: 0.6
                }],
            ['anchoring_bias', {
                    bias: 'Anchoring Bias',
                    patterns: [
                        /\b(?:starting\s+from|based\s+on\s+the\s+assumption|given\s+that)\b/gi,
                        /\b(?:first\s+impression|initial\s+estimate|benchmark)\b/gi
                    ],
                    weight: 0.5
                }],
            ['framing_effect', {
                    bias: 'Framing Effect',
                    patterns: [
                        /\b(?:death\s+tax|job\s+creators|climate\s+change\s+hoax)\b/gi,
                        /\b(?:pro-life|pro-choice|undocumented\s+workers|illegal\s+aliens)\b/gi
                    ],
                    weight: 0.8
                }]
        ]);
        // Loaded language patterns
        this.loadedLanguagePatterns = [
            /\b(?:radical|extremist|fanatic|zealot)\s+(?:left|right|liberal|conservative)\b/gi,
            /\b(?:so-called|alleged|supposed|claimed)\b/gi,
            /\b(?:notorious|infamous|controversial)\b/gi,
            /\b(?:unprecedented|historic|groundbreaking)\s+(?:without\s+evidence)\b/gi
        ];
    }
    /**
     * Perform comprehensive bias analysis
     */
    async analyzeBias(text, metadata) {
        const indicators = [];
        // Analyze different types of bias
        const politicalIndicators = this.analyzePoliticalBias(text);
        const emotionalIndicators = this.analyzeEmotionalBias(text);
        const cognitiveIndicators = this.analyzeCognitiveBias(text);
        const linguisticIndicators = this.analyzeLinguisticBias(text);
        const statisticalIndicators = this.analyzeStatisticalBias(text);
        const sourceIndicators = this.analyzeSourceBias(metadata);
        indicators.push(...politicalIndicators, ...emotionalIndicators, ...cognitiveIndicators, ...linguisticIndicators, ...statisticalIndicators, ...sourceIndicators);
        // Calculate bias scores
        const scores = this.calculateBiasScores(text, indicators);
        // Generate summary and recommendations
        const summary = this.generateSummary(indicators, scores);
        return {
            indicators: indicators.sort((a, b) => b.confidence - a.confidence),
            scores,
            summary,
            metadata: {
                analysisMethod: 'advanced_multi_dimensional',
                confidence: this.calculateOverallConfidence(indicators),
                timestamp: Date.now(),
                textLength: text.length
            }
        };
    }
    analyzePoliticalBias(text) {
        const indicators = [];
        const lowerText = text.toLowerCase();
        let leftScore = 0;
        let rightScore = 0;
        const evidence = [];
        for (const [keyword, data] of this.politicalKeywords.entries()) {
            if (lowerText.includes(keyword.toLowerCase())) {
                if (data.lean === 'left') {
                    leftScore += data.weight;
                }
                else {
                    rightScore += data.weight;
                }
                evidence.push(keyword);
            }
        }
        const totalScore = leftScore + rightScore;
        if (totalScore > 1.5) { // Threshold for detecting political bias
            const isLeftBiased = leftScore > rightScore;
            const biasStrength = Math.abs(leftScore - rightScore) / totalScore;
            indicators.push({
                type: 'political',
                name: isLeftBiased ? 'Left-leaning Political Bias' : 'Right-leaning Political Bias',
                description: `Content shows ${isLeftBiased ? 'progressive' : 'conservative'} political orientation`,
                severity: biasStrength > 0.7 ? 'high' : biasStrength > 0.4 ? 'medium' : 'low',
                confidence: Math.min(0.9, totalScore / 5),
                evidence: evidence.slice(0, 5),
                location: { context: 'Throughout the text' },
                impact: 'May influence reader perception of political issues',
                mitigation: 'Seek diverse political perspectives and fact-check claims'
            });
        }
        return indicators;
    }
    analyzeEmotionalBias(text) {
        const indicators = [];
        const lowerText = text.toLowerCase();
        const emotionalScores = {
            fear: 0, anger: 0, hope: 0, disgust: 0, sadness: 0, joy: 0
        };
        const evidence = {
            fear: [], anger: [], hope: [], disgust: [], sadness: [], joy: []
        };
        for (const [keyword, data] of this.emotionalKeywords.entries()) {
            if (lowerText.includes(keyword.toLowerCase())) {
                emotionalScores[data.emotion] += data.intensity;
                evidence[data.emotion].push(keyword);
            }
        }
        // Check for dominant emotions
        for (const [emotion, score] of Object.entries(emotionalScores)) {
            if (score > 1.0) { // Threshold for emotional bias
                const severity = score > 3.0 ? 'high' : score > 2.0 ? 'medium' : 'low';
                indicators.push({
                    type: 'emotional',
                    name: `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} Bias`,
                    description: `Content heavily uses ${emotion}-inducing language`,
                    severity,
                    confidence: Math.min(0.9, score / 4),
                    evidence: evidence[emotion].slice(0, 3),
                    location: { context: 'Emotional language throughout text' },
                    impact: `May manipulate reader emotions to influence opinion`,
                    mitigation: 'Read with emotional distance and focus on factual content'
                });
            }
        }
        return indicators;
    }
    analyzeCognitiveBias(text) {
        const indicators = [];
        for (const [biasType, config] of this.cognitivePatterns.entries()) {
            let matchCount = 0;
            const evidence = [];
            for (const pattern of config.patterns) {
                const matches = text.match(pattern);
                if (matches) {
                    matchCount += matches.length;
                    evidence.push(...matches.slice(0, 2));
                }
            }
            if (matchCount > 0) {
                const confidence = Math.min(0.9, (matchCount * config.weight) / 3);
                const severity = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';
                indicators.push({
                    type: 'cognitive',
                    name: config.bias,
                    description: `Shows patterns of ${config.bias.toLowerCase()}`,
                    severity,
                    confidence,
                    evidence: evidence.slice(0, 3),
                    location: { context: 'Reasoning patterns in text' },
                    impact: 'May lead to flawed reasoning and conclusions',
                    mitigation: 'Question assumptions and seek alternative perspectives'
                });
            }
        }
        return indicators;
    }
    analyzeLinguisticBias(text) {
        const indicators = [];
        let loadedLanguageCount = 0;
        const evidence = [];
        for (const pattern of this.loadedLanguagePatterns) {
            const matches = text.match(pattern);
            if (matches) {
                loadedLanguageCount += matches.length;
                evidence.push(...matches.slice(0, 2));
            }
        }
        // Check for excessive use of superlatives
        const superlativePattern = /\b(?:most|least|best|worst|greatest|smallest|largest|always|never|everyone|nobody)\b/gi;
        const superlatives = text.match(superlativePattern);
        if (superlatives && superlatives.length > text.split(' ').length * 0.02) { // More than 2% superlatives
            indicators.push({
                type: 'linguistic',
                name: 'Excessive Superlatives',
                description: 'Overuse of absolute terms and superlatives',
                severity: 'medium',
                confidence: 0.6,
                evidence: superlatives.slice(0, 5),
                location: { context: 'Language choices throughout text' },
                impact: 'May exaggerate claims and reduce nuance',
                mitigation: 'Look for specific evidence and qualified statements'
            });
        }
        if (loadedLanguageCount > 0) {
            indicators.push({
                type: 'linguistic',
                name: 'Loaded Language',
                description: 'Uses emotionally charged or prejudicial language',
                severity: loadedLanguageCount > 3 ? 'high' : 'medium',
                confidence: Math.min(0.9, loadedLanguageCount / 5),
                evidence: evidence.slice(0, 3),
                location: { context: 'Word choices throughout text' },
                impact: 'May prejudice reader opinion before presenting facts',
                mitigation: 'Focus on neutral descriptions and factual content'
            });
        }
        return indicators;
    }
    analyzeStatisticalBias(text) {
        const indicators = [];
        // Check for cherry-picked statistics
        const statisticPattern = /\b(?:\d+(?:\.\d+)?%|\d+\s+(?:times|percent|million|billion|thousand))\b/gi;
        const statistics = text.match(statisticPattern);
        if (statistics && statistics.length > 0) {
            // Look for context that suggests cherry-picking
            const cherryPickingClues = [
                'carefully selected', 'handpicked data', 'specific examples',
                'ignores other data', 'selective reporting'
            ];
            const hasCherryPickingClues = cherryPickingClues.some(clue => text.toLowerCase().includes(clue));
            if (hasCherryPickingClues) {
                indicators.push({
                    type: 'statistical',
                    name: 'Statistical Cherry-Picking',
                    description: 'May be selectively presenting favorable statistics',
                    severity: 'high',
                    confidence: 0.7,
                    evidence: statistics.slice(0, 3),
                    location: { context: 'Statistical claims in text' },
                    impact: 'May mislead readers about true statistical picture',
                    mitigation: 'Verify statistics with original sources and look for comprehensive data'
                });
            }
        }
        return indicators;
    }
    analyzeSourceBias(metadata) {
        const indicators = [];
        if (!metadata?.source)
            return indicators;
        // Known biased sources (this would be expanded with a comprehensive database)
        const knownBiases = {
            'breitbart': { lean: 'right', severity: 'high' },
            'infowars': { lean: 'right', severity: 'high' },
            'dailykos': { lean: 'left', severity: 'high' },
            'thinkprogress': { lean: 'left', severity: 'medium' },
            'newsmax': { lean: 'right', severity: 'medium' },
            'motherjones': { lean: 'left', severity: 'medium' }
        };
        const sourceLower = metadata.source.toLowerCase();
        for (const [source, bias] of Object.entries(knownBiases)) {
            if (sourceLower.includes(source)) {
                indicators.push({
                    type: 'source',
                    name: 'Source Bias',
                    description: `Source has known ${bias.lean}-leaning bias`,
                    severity: bias.severity,
                    confidence: 0.8,
                    evidence: [metadata.source],
                    location: { context: 'Publication source' },
                    impact: 'Source bias may influence content presentation and selection',
                    mitigation: 'Cross-reference with sources across the political spectrum'
                });
            }
        }
        return indicators;
    }
    calculateBiasScores(text, indicators) {
        const words = text.split(/\s+/).length;
        // Calculate political bias
        const politicalIndicators = indicators.filter(i => i.type === 'political');
        let leftRightScore = 50; // Start neutral
        if (politicalIndicators.length > 0) {
            const leftBias = politicalIndicators.filter(i => i.name.includes('Left')).length;
            const rightBias = politicalIndicators.filter(i => i.name.includes('Right')).length;
            if (leftBias > rightBias) {
                leftRightScore = Math.max(0, 50 - (leftBias * 15));
            }
            else if (rightBias > leftBias) {
                leftRightScore = Math.min(100, 50 + (rightBias * 15));
            }
        }
        // Calculate emotional scores
        const emotionalIndicators = indicators.filter(i => i.type === 'emotional');
        const emotional = {
            fear: this.calculateEmotionalScore('fear', emotionalIndicators),
            anger: this.calculateEmotionalScore('anger', emotionalIndicators),
            hope: this.calculateEmotionalScore('hope', emotionalIndicators),
            disgust: this.calculateEmotionalScore('disgust', emotionalIndicators),
            sadness: this.calculateEmotionalScore('sadness', emotionalIndicators),
            joy: this.calculateEmotionalScore('joy', emotionalIndicators),
            overall: 0
        };
        emotional.overall = Object.values(emotional).reduce((a, b) => a + b, 0) / 6;
        // Calculate cognitive bias scores
        const cognitiveIndicators = indicators.filter(i => i.type === 'cognitive');
        const cognitive = {
            confirmationBias: this.calculateCognitiveScore('Confirmation Bias', cognitiveIndicators),
            availabilityHeuristic: this.calculateCognitiveScore('Availability Heuristic', cognitiveIndicators),
            anchoringBias: this.calculateCognitiveScore('Anchoring Bias', cognitiveIndicators),
            framingEffect: this.calculateCognitiveScore('Framing Effect', cognitiveIndicators),
            overall: 0
        };
        cognitive.overall = Object.values(cognitive).reduce((a, b) => a + b, 0) / 4;
        // Calculate linguistic bias scores
        const linguisticIndicators = indicators.filter(i => i.type === 'linguistic');
        const linguistic = {
            loadedLanguage: this.calculateLinguisticScore('Loaded Language', linguisticIndicators),
            euphemisms: this.calculateLinguisticScore('Euphemisms', linguisticIndicators),
            emotionalWords: emotional.overall,
            certaintyLanguage: this.calculateLinguisticScore('Excessive Superlatives', linguisticIndicators),
            overall: 0
        };
        linguistic.overall = Object.values(linguistic).reduce((a, b) => a + b, 0) / 4;
        // Calculate overall score
        const overall = (Math.abs(leftRightScore - 50) + // Political deviation from center
            emotional.overall +
            cognitive.overall +
            linguistic.overall) / 4;
        return {
            overall,
            political: {
                leftRight: leftRightScore,
                confidence: politicalIndicators.length > 0 ?
                    politicalIndicators.reduce((sum, i) => sum + i.confidence, 0) / politicalIndicators.length : 0.5,
                indicators: politicalIndicators.map(i => i.name)
            },
            emotional,
            cognitive,
            linguistic
        };
    }
    calculateEmotionalScore(emotion, indicators) {
        const relevantIndicators = indicators.filter(i => i.name.toLowerCase().includes(emotion.toLowerCase()));
        if (relevantIndicators.length === 0)
            return 0;
        return relevantIndicators.reduce((sum, i) => sum + (i.confidence * 100), 0) / relevantIndicators.length;
    }
    calculateCognitiveScore(biasName, indicators) {
        const relevantIndicators = indicators.filter(i => i.name === biasName);
        if (relevantIndicators.length === 0)
            return 0;
        return relevantIndicators.reduce((sum, i) => sum + (i.confidence * 100), 0) / relevantIndicators.length;
    }
    calculateLinguisticScore(type, indicators) {
        const relevantIndicators = indicators.filter(i => i.name.includes(type));
        if (relevantIndicators.length === 0)
            return 0;
        return relevantIndicators.reduce((sum, i) => sum + (i.confidence * 100), 0) / relevantIndicators.length;
    }
    calculateOverallConfidence(indicators) {
        if (indicators.length === 0)
            return 0.5;
        return indicators.reduce((sum, i) => sum + i.confidence, 0) / indicators.length;
    }
    generateSummary(indicators, scores) {
        const neutralityScore = Math.max(0, 100 - scores.overall);
        let overallAssessment;
        if (neutralityScore > 80) {
            overallAssessment = 'Content appears largely neutral with minimal bias detected.';
        }
        else if (neutralityScore > 60) {
            overallAssessment = 'Content shows moderate bias that readers should be aware of.';
        }
        else if (neutralityScore > 40) {
            overallAssessment = 'Content contains significant bias that may influence reader perception.';
        }
        else {
            overallAssessment = 'Content shows strong bias and should be read critically.';
        }
        const primaryBiases = indicators
            .filter(i => i.severity === 'high' || i.severity === 'critical')
            .map(i => i.name)
            .slice(0, 3);
        const recommendations = [];
        if (indicators.some(i => i.type === 'political')) {
            recommendations.push('Seek sources across the political spectrum for balanced perspective');
        }
        if (indicators.some(i => i.type === 'emotional')) {
            recommendations.push('Be aware of emotional manipulation and focus on factual content');
        }
        if (indicators.some(i => i.type === 'cognitive')) {
            recommendations.push('Question underlying assumptions and reasoning patterns');
        }
        if (indicators.some(i => i.type === 'statistical')) {
            recommendations.push('Verify statistics with original sources and look for comprehensive data');
        }
        if (recommendations.length === 0) {
            recommendations.push('Continue reading critically and fact-checking claims');
        }
        return {
            overallAssessment,
            primaryBiases,
            recommendations,
            neutralityScore
        };
    }
}
export default new AdvancedBiasAnalysisService();
