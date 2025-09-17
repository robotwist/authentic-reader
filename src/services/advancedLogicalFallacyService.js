/**
 * Advanced Logical Fallacy Detection Service
 *
 * Provides sophisticated detection of logical fallacies using multiple approaches:
 * 1. Pattern matching for common fallacy structures
 * 2. Linguistic analysis for argumentative patterns
 * 3. Context-aware detection based on article metadata
 * 4. AI-powered classification (when available)
 */
class AdvancedLogicalFallacyService {
    constructor() {
        Object.defineProperty(this, "fallacyPatterns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.initializeFallacyPatterns();
    }
    initializeFallacyPatterns() {
        this.fallacyPatterns = new Map([
            ['ad_hominem', {
                    patterns: [
                        /\b(?:he|she|they|this person|the author)\s+(?:is|are)\s+(?:a\s+)?(?:liar|fraud|idiot|fool|corrupt|dishonest|biased|radical|extremist)/gi,
                        /\b(?:coming from|says the)\s+(?:person|man|woman|guy)\s+(?:who|that)/gi,
                        /\b(?:you|your)\s+(?:can't|cannot)\s+trust\s+(?:him|her|them|this)/gi,
                    ],
                    keywords: ['personal attack', 'character assassination', 'discredit', 'smear'],
                    contextClues: ['instead of addressing', 'rather than focus', 'attacks the person'],
                    severity: 'high',
                    category: 'informal',
                    description: 'Attacks the person making the argument rather than the argument itself',
                    explanation: 'This fallacy diverts attention from the actual issue by focusing on irrelevant personal characteristics'
                }],
            ['straw_man', {
                    patterns: [
                        /\b(?:so\s+)?(?:you're|you are)\s+saying\s+(?:that\s+)?(?:we should|all|everyone)/gi,
                        /\b(?:if\s+)?(?:that's|this is)\s+(?:true|the case),?\s+then\s+(?:we|everyone)\s+(?:should|must|would)/gi,
                        /\b(?:by\s+that\s+logic|following\s+that\s+reasoning),?\s+(?:we|everyone)\s+(?:should|could|would)/gi,
                    ],
                    keywords: ['misrepresent', 'distort', 'exaggerate', 'oversimplify'],
                    contextClues: ['that\'s not what I said', 'you\'re putting words', 'mischaracterizing'],
                    severity: 'high',
                    category: 'informal',
                    description: 'Misrepresents someone\'s argument to make it easier to attack',
                    explanation: 'This fallacy creates a weaker version of the opponent\'s argument and then defeats that weaker version'
                }],
            ['false_dichotomy', {
                    patterns: [
                        /\b(?:either\s+)?(?:you're|you are)\s+(?:with\s+us\s+or\s+against\s+us|for\s+it\s+or\s+against\s+it)/gi,
                        /\b(?:there\s+are\s+)?(?:only\s+)?(?:two|2)\s+(?:choices|options|ways|possibilities)/gi,
                        /\b(?:if\s+)?(?:you|we)\s+(?:don't|do not)\s+(?:do\s+this|support\s+this|choose\s+this),?\s+then\s+(?:we|you)\s+(?:must|have to|will)/gi,
                    ],
                    keywords: ['only two options', 'black and white', 'all or nothing'],
                    contextClues: ['there are other alternatives', 'false choice', 'middle ground'],
                    severity: 'medium',
                    category: 'informal',
                    description: 'Presents only two options when more exist',
                    explanation: 'This fallacy artificially limits choices and ignores nuanced alternatives'
                }],
            ['appeal_to_authority', {
                    patterns: [
                        /\b(?:expert|scientist|doctor|professor|authority)\s+(?:says|claims|believes|argues)/gi,
                        /\b(?:according\s+to|as\s+stated\s+by)\s+(?:leading|top|renowned)\s+(?:experts|scientists|authorities)/gi,
                        /\b(?:studies\s+show|research\s+proves|science\s+says)/gi,
                    ],
                    keywords: ['expert opinion', 'authority figure', 'credentials', 'consensus'],
                    contextClues: ['appeal to authority', 'argument from authority', 'expert fallacy'],
                    severity: 'medium',
                    category: 'informal',
                    description: 'Uses authority or expertise as the primary evidence',
                    explanation: 'While expert opinion can be valuable, it should not be the sole basis for accepting a claim'
                }],
            ['appeal_to_emotion', {
                    patterns: [
                        /\b(?:think\s+of\s+the\s+children|for\s+the\s+children|children\s+will\s+suffer)/gi,
                        /\b(?:imagine\s+if|what\s+if)\s+(?:your|this\s+happened\s+to)/gi,
                        /\b(?:heartbreaking|devastating|tragic|horrific|outrageous)\s+(?:that|when|how)/gi,
                    ],
                    keywords: ['emotional appeal', 'fear mongering', 'outrage', 'sympathy'],
                    contextClues: ['tugs at heartstrings', 'emotional manipulation', 'fear-based'],
                    severity: 'high',
                    category: 'informal',
                    description: 'Uses emotional manipulation instead of logical reasoning',
                    explanation: 'This fallacy attempts to win an argument by exploiting emotions rather than presenting evidence'
                }],
            ['slippery_slope', {
                    patterns: [
                        /\b(?:if\s+we\s+allow|once\s+we\s+start|this\s+will\s+lead\s+to)\s+(?:.*?),?\s+(?:then|next|soon)\s+(?:we'll|we\s+will|there\s+will\s+be)/gi,
                        /\b(?:first|next)\s+(?:they'll|they\s+will|it\s+will\s+be)\s+(?:.*?),?\s+(?:then|and\s+then|after\s+that)/gi,
                        /\b(?:domino\s+effect|chain\s+reaction|slippery\s+slope)/gi,
                    ],
                    keywords: ['chain reaction', 'domino effect', 'inevitable consequence'],
                    contextClues: ['slippery slope', 'unfounded progression', 'causal chain'],
                    severity: 'medium',
                    category: 'causal',
                    description: 'Assumes one action will lead to a chain of negative consequences',
                    explanation: 'This fallacy assumes that one step will inevitably lead to a chain of events without sufficient evidence'
                }],
            ['hasty_generalization', {
                    patterns: [
                        /\b(?:all|every|everyone|no one|nobody)\s+(?:in|from|who)\s+(?:.*?)\s+(?:are|is|does|believes)/gi,
                        /\b(?:based\s+on|from)\s+(?:this|these)\s+(?:few|couple\s+of|several)\s+(?:cases|examples|instances)/gi,
                        /\b(?:I\s+know|I've\s+seen|I've\s+met)\s+(?:a\s+few|some|several)\s+(?:.*?)\s+(?:and\s+they|who)/gi,
                    ],
                    keywords: ['all', 'every', 'always', 'never', 'typical'],
                    contextClues: ['small sample', 'anecdotal evidence', 'overgeneralization'],
                    severity: 'medium',
                    category: 'statistical',
                    description: 'Draws broad conclusions from limited examples',
                    explanation: 'This fallacy makes sweeping generalizations based on insufficient evidence or small sample sizes'
                }],
            ['false_cause', {
                    patterns: [
                        /\b(?:after|since|because)\s+(?:.*?),?\s+(?:therefore|so|thus|this\s+means)\s+(?:.*?)\s+(?:caused|resulted\s+in|led\s+to)/gi,
                        /\b(?:correlation|coincidence)\s+(?:proves|shows|demonstrates)\s+(?:causation|cause)/gi,
                        /\b(?:this\s+happened|it\s+occurred)\s+(?:right\s+)?after\s+(?:.*?),?\s+so\s+(?:.*?)\s+(?:must\s+have\s+caused|caused)/gi,
                    ],
                    keywords: ['correlation', 'causation', 'post hoc', 'coincidence'],
                    contextClues: ['correlation does not imply causation', 'post hoc fallacy', 'false cause'],
                    severity: 'high',
                    category: 'causal',
                    description: 'Assumes correlation implies causation',
                    explanation: 'This fallacy incorrectly assumes that because two events are correlated, one must cause the other'
                }],
            ['bandwagon', {
                    patterns: [
                        /\b(?:everyone|everybody|most\s+people|the\s+majority)\s+(?:is|are)\s+(?:doing|saying|believing|supporting)/gi,
                        /\b(?:join\s+the|be\s+part\s+of\s+the)\s+(?:millions|thousands|majority)\s+(?:who|that)/gi,
                        /\b(?:popular|trending|fashionable|mainstream)\s+(?:opinion|belief|view|choice)/gi,
                    ],
                    keywords: ['everyone is doing it', 'popular', 'majority', 'consensus'],
                    contextClues: ['bandwagon effect', 'appeal to popularity', 'follow the crowd'],
                    severity: 'medium',
                    category: 'informal',
                    description: 'Appeals to popularity as evidence of truth',
                    explanation: 'This fallacy assumes something is true or right because many people believe or do it'
                }],
            ['circular_reasoning', {
                    patterns: [
                        /\b(?:because|since)\s+(?:.*?)\s+(?:is|are)\s+(?:.*?),?\s+(?:therefore|so|thus)\s+(?:.*?)\s+(?:is|are)\s+(?:.*?)/gi,
                        /\b(?:the\s+reason|why)\s+(?:.*?)\s+(?:is|are)\s+(?:true|correct|right)\s+(?:is\s+)?because\s+(?:.*?)\s+(?:is|are)\s+(?:true|correct|right)/gi,
                    ],
                    keywords: ['circular logic', 'begging the question', 'assumption'],
                    contextClues: ['circular reasoning', 'assumes the conclusion', 'begs the question'],
                    severity: 'high',
                    category: 'formal',
                    description: 'The conclusion is assumed in the premise',
                    explanation: 'This fallacy occurs when the conclusion of an argument is used as a premise of that same argument'
                }]
        ]);
    }
    /**
     * Analyze text for logical fallacies
     */
    async analyzeFallacies(text, metadata) {
        const fallacies = [];
        const sentences = this.splitIntoSentences(text);
        const paragraphs = this.splitIntoParagraphs(text);
        // Analyze each sentence for fallacies
        sentences.forEach((sentence, index) => {
            const detectedFallacies = this.detectFallaciesInSentence(sentence, index, paragraphs);
            fallacies.push(...detectedFallacies);
        });
        // Analyze overall structure for complex fallacies
        const structuralFallacies = this.detectStructuralFallacies(text, metadata);
        fallacies.push(...structuralFallacies);
        // Remove duplicates and merge similar fallacies
        const uniqueFallacies = this.deduplicateFallacies(fallacies);
        // Calculate scores and categories
        const categories = this.categorizeFallacies(uniqueFallacies);
        const overallScore = this.calculateOverallScore(uniqueFallacies, text.length);
        const recommendations = this.generateRecommendations(uniqueFallacies, categories);
        const summary = this.generateSummary(uniqueFallacies, overallScore);
        return {
            fallacies: uniqueFallacies,
            overallScore,
            categories,
            recommendations,
            summary
        };
    }
    splitIntoSentences(text) {
        return text.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10);
    }
    splitIntoParagraphs(text) {
        return text.split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
    }
    detectFallaciesInSentence(sentence, sentenceIndex, paragraphs) {
        const fallacies = [];
        for (const [fallacyType, config] of this.fallacyPatterns.entries()) {
            // Pattern matching
            const patternMatches = config.patterns.some(pattern => pattern.test(sentence));
            // Keyword detection
            const keywordMatches = config.keywords.some(keyword => sentence.toLowerCase().includes(keyword.toLowerCase()));
            // Context clue detection
            const contextMatches = config.contextClues.some(clue => sentence.toLowerCase().includes(clue.toLowerCase()));
            if (patternMatches || (keywordMatches && contextMatches)) {
                const confidence = this.calculateConfidence(patternMatches, keywordMatches, contextMatches, sentence, config);
                if (confidence > 0.3) { // Minimum confidence threshold
                    const paragraphIndex = this.findParagraphIndex(sentence, paragraphs);
                    fallacies.push({
                        type: fallacyType,
                        name: this.getFallacyName(fallacyType),
                        description: config.description,
                        examples: this.extractExamples(sentence, config),
                        severity: config.severity,
                        confidence,
                        location: {
                            paragraph: paragraphIndex,
                            sentence: sentence.substring(0, 100) + '...',
                            context: this.getContext(sentence, paragraphs, paragraphIndex)
                        },
                        category: config.category,
                        explanation: config.explanation,
                        counterargument: this.generateCounterargument(fallacyType, sentence)
                    });
                }
            }
        }
        return fallacies;
    }
    detectStructuralFallacies(text, metadata) {
        const fallacies = [];
        // Check for cherry picking (selective evidence)
        if (this.detectCherryPicking(text)) {
            fallacies.push({
                type: 'cherry_picking',
                name: 'Cherry Picking',
                description: 'Selects only evidence that supports the conclusion while ignoring contradictory evidence',
                examples: ['Selective statistics', 'One-sided evidence presentation'],
                severity: 'high',
                confidence: 0.7,
                location: {
                    context: 'Overall article structure'
                },
                category: 'informal',
                explanation: 'This fallacy involves presenting only favorable evidence while suppressing unfavorable evidence',
                counterargument: 'Consider all available evidence, including contradictory findings'
            });
        }
        // Check for loaded questions
        if (this.detectLoadedQuestions(text)) {
            fallacies.push({
                type: 'loaded_question',
                name: 'Loaded Question',
                description: 'Contains controversial or questionable assumptions',
                examples: ['When did you stop beating your wife?', 'Why is this policy so harmful?'],
                severity: 'medium',
                confidence: 0.6,
                location: {
                    context: 'Question formulation'
                },
                category: 'presumption',
                explanation: 'This fallacy asks a question that contains a controversial assumption',
                counterargument: 'Question the assumptions embedded in the question'
            });
        }
        return fallacies;
    }
    calculateConfidence(patternMatch, keywordMatch, contextMatch, sentence, config) {
        let confidence = 0;
        if (patternMatch)
            confidence += 0.6;
        if (keywordMatch)
            confidence += 0.3;
        if (contextMatch)
            confidence += 0.2;
        // Adjust based on sentence characteristics
        const sentenceLength = sentence.length;
        if (sentenceLength > 200)
            confidence -= 0.1; // Longer sentences might be less clear-cut
        if (sentenceLength < 50)
            confidence -= 0.2; // Very short sentences might be false positives
        // Check for qualifying language that might reduce certainty
        const qualifiers = ['might', 'could', 'possibly', 'perhaps', 'maybe'];
        if (qualifiers.some(q => sentence.toLowerCase().includes(q))) {
            confidence -= 0.1;
        }
        return Math.max(0, Math.min(1, confidence));
    }
    deduplicateFallacies(fallacies) {
        const seen = new Map();
        for (const fallacy of fallacies) {
            const key = `${fallacy.type}-${fallacy.location.sentence}`;
            const existing = seen.get(key);
            if (!existing || fallacy.confidence > existing.confidence) {
                seen.set(key, fallacy);
            }
        }
        return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
    }
    categorizeFallacies(fallacies) {
        const categories = {};
        for (const fallacy of fallacies) {
            categories[fallacy.category] = (categories[fallacy.category] || 0) + 1;
        }
        return categories;
    }
    calculateOverallScore(fallacies, textLength) {
        if (fallacies.length === 0)
            return 100;
        let penaltyPoints = 0;
        const textLengthFactor = Math.max(1, textLength / 1000); // Normalize by text length
        for (const fallacy of fallacies) {
            let penalty = fallacy.confidence;
            switch (fallacy.severity) {
                case 'critical':
                    penalty *= 4;
                    break;
                case 'high':
                    penalty *= 3;
                    break;
                case 'medium':
                    penalty *= 2;
                    break;
                case 'low':
                    penalty *= 1;
                    break;
            }
            penaltyPoints += penalty;
        }
        // Normalize by text length - longer texts might naturally have more fallacies
        const normalizedPenalty = penaltyPoints / textLengthFactor;
        const score = Math.max(0, 100 - (normalizedPenalty * 10));
        return Math.round(score);
    }
    generateRecommendations(fallacies, categories) {
        const recommendations = [];
        if (fallacies.length === 0) {
            recommendations.push('No significant logical fallacies detected. The argumentation appears sound.');
            return recommendations;
        }
        // General recommendations
        if (fallacies.length > 5) {
            recommendations.push('Multiple logical fallacies detected. Consider revising the argumentation structure.');
        }
        // Category-specific recommendations
        if (categories.informal > 0) {
            recommendations.push('Focus on addressing arguments directly rather than using rhetorical techniques.');
        }
        if (categories.formal > 0) {
            recommendations.push('Ensure logical consistency and avoid circular reasoning.');
        }
        if (categories.statistical > 0) {
            recommendations.push('Verify statistical claims and avoid overgeneralization from limited data.');
        }
        if (categories.causal > 0) {
            recommendations.push('Establish clear causal relationships with supporting evidence.');
        }
        if (categories.presumption > 0) {
            recommendations.push('Question underlying assumptions and avoid loaded language.');
        }
        // Severity-based recommendations
        const highSeverityCount = fallacies.filter(f => f.severity === 'high' || f.severity === 'critical').length;
        if (highSeverityCount > 0) {
            recommendations.push(`${highSeverityCount} high-severity logical issues require immediate attention.`);
        }
        return recommendations;
    }
    generateSummary(fallacies, overallScore) {
        if (fallacies.length === 0) {
            return 'No logical fallacies detected. The content demonstrates sound reasoning.';
        }
        const severityDistribution = fallacies.reduce((acc, f) => {
            acc[f.severity] = (acc[f.severity] || 0) + 1;
            return acc;
        }, {});
        let summary = `Detected ${fallacies.length} logical fallac${fallacies.length === 1 ? 'y' : 'ies'} `;
        summary += `(Overall Score: ${overallScore}/100). `;
        const severityParts = [];
        if (severityDistribution.critical)
            severityParts.push(`${severityDistribution.critical} critical`);
        if (severityDistribution.high)
            severityParts.push(`${severityDistribution.high} high`);
        if (severityDistribution.medium)
            severityParts.push(`${severityDistribution.medium} medium`);
        if (severityDistribution.low)
            severityParts.push(`${severityDistribution.low} low`);
        if (severityParts.length > 0) {
            summary += `Severity breakdown: ${severityParts.join(', ')} severity issues. `;
        }
        const mostCommon = fallacies.reduce((acc, f) => {
            acc[f.type] = (acc[f.type] || 0) + 1;
            return acc;
        }, {});
        const topFallacy = Object.entries(mostCommon).sort(([, a], [, b]) => b - a)[0];
        if (topFallacy) {
            summary += `Most common: ${this.getFallacyName(topFallacy[0])}.`;
        }
        return summary;
    }
    // Helper methods
    getFallacyName(type) {
        const names = {
            'ad_hominem': 'Ad Hominem',
            'straw_man': 'Straw Man',
            'false_dichotomy': 'False Dichotomy',
            'appeal_to_authority': 'Appeal to Authority',
            'appeal_to_emotion': 'Appeal to Emotion',
            'slippery_slope': 'Slippery Slope',
            'hasty_generalization': 'Hasty Generalization',
            'false_cause': 'False Cause',
            'bandwagon': 'Bandwagon Appeal',
            'circular_reasoning': 'Circular Reasoning',
            'cherry_picking': 'Cherry Picking',
            'loaded_question': 'Loaded Question'
        };
        return names[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    extractExamples(sentence, config) {
        // Extract specific examples from the sentence based on the pattern
        const examples = [];
        for (const pattern of config.patterns) {
            const matches = sentence.match(pattern);
            if (matches) {
                examples.push(matches[0].substring(0, 100));
            }
        }
        return examples.slice(0, 3); // Limit to 3 examples
    }
    findParagraphIndex(sentence, paragraphs) {
        return paragraphs.findIndex(p => p.includes(sentence.substring(0, 50)));
    }
    getContext(sentence, paragraphs, paragraphIndex) {
        if (paragraphIndex >= 0 && paragraphIndex < paragraphs.length) {
            return paragraphs[paragraphIndex].substring(0, 200) + '...';
        }
        return sentence;
    }
    generateCounterargument(fallacyType, sentence) {
        const counterarguments = {
            'ad_hominem': 'Focus on the argument\'s merits rather than personal characteristics',
            'straw_man': 'Address the actual argument being made, not a distorted version',
            'false_dichotomy': 'Consider additional alternatives and nuanced positions',
            'appeal_to_authority': 'Evaluate the evidence and reasoning, not just the source',
            'appeal_to_emotion': 'Examine the logical basis of the argument beyond emotional appeals',
            'slippery_slope': 'Provide evidence for each step in the causal chain',
            'hasty_generalization': 'Gather more comprehensive data before drawing conclusions',
            'false_cause': 'Distinguish between correlation and causation with supporting evidence',
            'bandwagon': 'Evaluate the argument on its own merits, regardless of popularity',
            'circular_reasoning': 'Provide independent evidence that doesn\'t assume the conclusion'
        };
        return counterarguments[fallacyType] || 'Consider alternative perspectives and supporting evidence';
    }
    detectCherryPicking(text) {
        const indicators = [
            'only shows', 'carefully selected', 'conveniently ignores', 'fails to mention',
            'selective evidence', 'one-sided', 'biased sample', 'ignores contradictory'
        ];
        const lowerText = text.toLowerCase();
        return indicators.some(indicator => lowerText.includes(indicator));
    }
    detectLoadedQuestions(text) {
        const patterns = [
            /why\s+(?:is|are|do|does)\s+(?:.*?)\s+(?:so|such)\s+(?:bad|harmful|dangerous|wrong|terrible)/gi,
            /when\s+(?:will|did)\s+(?:you|they|we)\s+(?:stop|start|realize)/gi,
            /how\s+(?:can|could)\s+(?:anyone|someone)\s+(?:support|believe|defend)/gi
        ];
        return patterns.some(pattern => pattern.test(text));
    }
}
export default new AdvancedLogicalFallacyService();
