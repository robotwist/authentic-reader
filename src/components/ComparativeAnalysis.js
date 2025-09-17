import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { FiBarChart2, FiCheckCircle, FiInfo, FiTarget, FiUsers, FiAlertTriangle, FiTrendingUp, FiShield } from 'react-icons/fi';
import { useLlamaAnalysis } from '../hooks/useLlamaAnalysis';
import AnalysisTooltip from './AnalysisTooltip';
import '../styles/ComparativeAnalysis.css';
const ComparativeAnalysis = ({ articles, onAnalysisComplete }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [comparativeResult, setComparativeResult] = useState(null);
    const [selectedArticles, setSelectedArticles] = useState([]);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [topicGroups, setTopicGroups] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const { analyzeBias } = useLlamaAnalysis();
    // Topic keywords for intelligent grouping
    const topicKeywords = {
        'politics': ['election', 'president', 'congress', 'senate', 'vote', 'campaign', 'policy', 'democrat', 'republican', 'government'],
        'economy': ['economy', 'market', 'stock', 'inflation', 'recession', 'gdp', 'employment', 'business', 'finance', 'trade'],
        'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'startup', 'innovation', 'digital', 'computer', 'algorithm'],
        'health': ['health', 'medical', 'covid', 'vaccine', 'hospital', 'doctor', 'treatment', 'disease', 'medicine', 'healthcare'],
        'environment': ['climate', 'environment', 'pollution', 'renewable', 'carbon', 'sustainability', 'green', 'energy'],
        'international': ['foreign', 'international', 'diplomacy', 'trade', 'war', 'peace', 'global', 'world', 'nation'],
        'crime': ['crime', 'police', 'arrest', 'investigation', 'court', 'justice', 'law', 'criminal'],
        'education': ['education', 'school', 'university', 'student', 'learning', 'academic', 'college'],
        'entertainment': ['movie', 'music', 'celebrity', 'film', 'entertainment', 'culture', 'artist'],
        'sports': ['sport', 'football', 'basketball', 'baseball', 'athlete', 'team', 'championship', 'game'],
        'breaking-news': ['breaking', 'update', 'developing', 'just in', 'latest', 'reports', 'announcement', 'statement'],
        'investigation': ['investigation', 'probe', 'inquiry', 'allegation', 'accusation', 'charges', 'evidence', 'witness'],
        'disaster': ['disaster', 'accident', 'tragedy', 'emergency', 'crisis', 'casualty', 'victim', 'damage']
    };
    // Enhanced claim patterns for truth detection
    const claimPatterns = {
        factual: [
            /\d+ people/gi,
            /\d+ percent/gi,
            /\$\d+/g,
            /on \w+ \d{1,2},? \d{4}/gi,
            /at \d{1,2}:\d{2}/gi,
            /according to [^,]+/gi,
            /officials said/gi,
            /police reported/gi,
            /witnesses said/gi,
            /the investigation found/gi,
            /data shows/gi,
            /statistics indicate/gi
        ],
        conflicting: [
            /denied/gi,
            /contradicts/gi,
            /disputed/gi,
            /challenged/gi,
            /refuted/gi,
            /rejected/gi,
            /disagreed/gi,
            /conflicting/gi,
            /different/gi,
            /alternative/gi
        ],
        sources: [
            /police/gi,
            /officials/gi,
            /witnesses/gi,
            /experts/gi,
            /authorities/gi,
            /investigators/gi,
            /spokesperson/gi,
            /anonymous/gi,
            /sources/gi
        ]
    };
    // Enhanced similarity calculation for event-based grouping
    const calculateEventSimilarity = (article1, article2) => {
        const text1 = `${article1.title} ${article1.content || article1.description || ''}`.toLowerCase();
        const text2 = `${article2.title} ${article2.content || article2.description || ''}`.toLowerCase();
        // Extract key event identifiers
        const extractEventIdentifiers = (text) => {
            const identifiers = new Set();
            // Extract dates
            const dates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\w+ \d{1,2},? \d{4}\b/g) || [];
            dates.forEach(date => identifiers.add(date));
            // Extract locations
            const locations = text.match(/\b[A-Z][a-z]+(?: [A-Z][a-z]+)*,? [A-Z]{2}\b|\b[A-Z][a-z]+(?: [A-Z][a-z]+)*,? [A-Z][a-z]+\b/g) || [];
            locations.forEach(location => identifiers.add(location));
            // Extract names (simple pattern)
            const names = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [];
            names.forEach(name => identifiers.add(name));
            // Extract key terms (words longer than 5 characters)
            const words = text.match(/\b\w{6,}\b/g) || [];
            words.forEach(word => identifiers.add(word));
            return identifiers;
        };
        const identifiers1 = extractEventIdentifiers(text1);
        const identifiers2 = extractEventIdentifiers(text2);
        if (identifiers1.size === 0 || identifiers2.size === 0)
            return 0;
        const intersection = new Set([...identifiers1].filter(x => identifiers2.has(x)));
        const union = new Set([...identifiers1, ...identifiers2]);
        return intersection.size / union.size;
    };
    // Enhanced claim extraction for truth detection
    const extractClaimsForTruthDetection = (texts) => {
        const claims = [];
        texts.forEach((text, textIndex) => {
            // Extract factual claims
            claimPatterns.factual.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        // Find the sentence containing this claim
                        const sentences = text.split(/[.!?]+/);
                        const sentence = sentences.find(s => s.includes(match)) || match;
                        // Extract sources mentioned
                        const sources = [];
                        claimPatterns.sources.forEach(sourcePattern => {
                            const sourceMatches = sentence.match(sourcePattern);
                            if (sourceMatches) {
                                sources.push(...sourceMatches);
                            }
                        });
                        claims.push({
                            claim: sentence.trim(),
                            type: 'factual',
                            sources: [...new Set(sources)],
                            confidence: sources.length > 0 ? 0.8 : 0.5
                        });
                    });
                }
            });
            // Extract conflicting claims
            claimPatterns.conflicting.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        const sentences = text.split(/[.!?]+/);
                        const sentence = sentences.find(s => s.includes(match)) || match;
                        claims.push({
                            claim: sentence.trim(),
                            type: 'conflicting',
                            sources: [],
                            confidence: 0.7
                        });
                    });
                }
            });
        });
        return claims;
    };
    // Enhanced conflict detection for truth analysis
    const detectConflictingClaims = (articleAnalyses) => {
        const conflicts = [];
        const allClaims = extractClaimsForTruthDetection(articleAnalyses.map(a => a.textContent));
        // Group claims by similar topics
        const claimGroups = new Map();
        allClaims.forEach(({ claim }) => {
            const keyTerms = claim.toLowerCase().match(/\b\w{5,}\b/g) || [];
            const key = keyTerms.slice(0, 3).join(' ');
            if (!claimGroups.has(key)) {
                claimGroups.set(key, []);
            }
            claimGroups.get(key).push(claim);
        });
        // Find conflicts within each group
        claimGroups.forEach((claims, key) => {
            if (claims.length > 1) {
                for (let i = 0; i < claims.length; i++) {
                    for (let j = i + 1; j < claims.length; j++) {
                        const conflict = analyzeClaimConflict(claims[i], claims[j]);
                        if (conflict) {
                            conflicts.push(conflict);
                        }
                    }
                }
            }
        });
        return conflicts.slice(0, 5); // Return top 5 conflicts
    };
    // Analyze conflict between two claims
    const analyzeClaimConflict = (claim1, claim2) => {
        const text1 = claim1.toLowerCase();
        const text2 = claim2.toLowerCase();
        // Check for direct contradictions
        const contradictions = [
            { positive: ['confirmed', 'verified', 'true', 'accurate'], negative: ['denied', 'false', 'inaccurate', 'wrong'] },
            { positive: ['increased', 'rose', 'grew'], negative: ['decreased', 'fell', 'dropped'] },
            { positive: ['support', 'agree', 'endorse'], negative: ['oppose', 'disagree', 'reject'] },
            { positive: ['guilty', 'convicted', 'responsible'], negative: ['innocent', 'acquitted', 'not responsible'] }
        ];
        for (const contradiction of contradictions) {
            const hasPositive1 = contradiction.positive.some(word => text1.includes(word));
            const hasNegative1 = contradiction.negative.some(word => text1.includes(word));
            const hasPositive2 = contradiction.positive.some(word => text2.includes(word));
            const hasNegative2 = contradiction.negative.some(word => text2.includes(word));
            if ((hasPositive1 && hasNegative2) || (hasNegative1 && hasPositive2)) {
                return {
                    claim1,
                    claim2,
                    type: 'direct_contradiction',
                    severity: 'high'
                };
            }
        }
        // Check for different numbers/statistics
        const numbers1 = text1.match(/\d+/g) || [];
        const numbers2 = text2.match(/\d+/g) || [];
        if (numbers1.length > 0 && numbers2.length > 0) {
            const num1 = parseInt(numbers1[0]);
            const num2 = parseInt(numbers2[0]);
            if (Math.abs(num1 - num2) > Math.max(num1, num2) * 0.2) { // 20% difference threshold
                return {
                    claim1,
                    claim2,
                    type: 'statistical_discrepancy',
                    severity: 'medium'
                };
            }
        }
        // Check for different sources/citations
        const sources1 = claim1.match(/(?:according to|said by|reported by) ([^,]+)/gi) || [];
        const sources2 = claim2.match(/(?:according to|said by|reported by) ([^,]+)/gi) || [];
        if (sources1.length > 0 && sources2.length > 0 && sources1[0] !== sources2[0]) {
            return {
                claim1,
                claim2,
                type: 'different_sources',
                severity: 'low'
            };
        }
        return null;
    };
    // Enhanced reliability scoring for truth detection
    const calculateTruthReliability = (articleAnalyses) => {
        const factors = [];
        let score = 0.5; // Start with neutral score
        // Factor 1: Source diversity
        const sources = new Set(articleAnalyses.map(a => a.article.source));
        const sourceDiversity = sources.size / articleAnalyses.length;
        if (sourceDiversity > 0.6) {
            score += 0.2;
            factors.push(`High source diversity (${sources.size} different sources)`);
        }
        else if (sourceDiversity < 0.3) {
            score -= 0.1;
            factors.push(`Low source diversity (${sources.size} sources)`);
        }
        // Factor 2: Citation quality
        const allClaims = extractClaimsForTruthDetection(articleAnalyses.map(a => a.textContent));
        const claimsWithSources = allClaims.filter(claim => claim.sources.length > 0);
        const citationRate = claimsWithSources.length / allClaims.length;
        if (citationRate > 0.5) {
            score += 0.15;
            factors.push(`Good citation rate (${(citationRate * 100).toFixed(0)}% of claims cited)`);
        }
        else if (citationRate < 0.2) {
            score -= 0.1;
            factors.push(`Poor citation rate (${(citationRate * 100).toFixed(0)}% of claims cited)`);
        }
        // Factor 3: Conflict level
        const conflicts = detectConflictingClaims(articleAnalyses);
        const highSeverityConflicts = conflicts.filter(c => c.severity === 'high').length;
        if (highSeverityConflicts === 0) {
            score += 0.1;
            factors.push('No high-severity conflicts detected');
        }
        else if (highSeverityConflicts > 2) {
            score -= 0.2;
            factors.push(`${highSeverityConflicts} high-severity conflicts detected`);
        }
        // Factor 4: Bias consistency
        const biasTypes = articleAnalyses.map(a => determineBiasType(a.biasResult));
        const biasDiversity = new Set(biasTypes).size;
        if (biasDiversity > 1) {
            score += 0.1;
            factors.push('Multiple bias perspectives present');
        }
        else {
            score -= 0.05;
            factors.push('Limited bias diversity');
        }
        return {
            score: Math.max(0, Math.min(1, score)),
            factors
        };
    };
    // Enhanced recommendations for truth detection
    const generateTruthRecommendations = (articleAnalyses, conflicts, reliability) => {
        const recommendations = [];
        // Based on conflicts
        const highSeverityConflicts = conflicts.filter(c => c.severity === 'high').length;
        if (highSeverityConflicts > 0) {
            recommendations.push(`⚠️ ${highSeverityConflicts} high-severity conflicts detected - verify claims with additional sources`);
        }
        // Based on source diversity
        const sources = new Set(articleAnalyses.map(a => a.article.source));
        if (sources.size < 3) {
            recommendations.push(`📰 Seek additional sources (currently only ${sources.size} sources)`);
        }
        // Based on citation quality
        const allClaims = extractClaimsForTruthDetection(articleAnalyses.map(a => a.textContent));
        const claimsWithSources = allClaims.filter(claim => claim.sources.length > 0);
        const citationRate = claimsWithSources.length / allClaims.length;
        if (citationRate < 0.3) {
            recommendations.push(`🔍 Many claims lack citations - fact-check key statements`);
        }
        // Based on reliability score
        if (reliability.score < 0.4) {
            recommendations.push(`⚠️ Low reliability score - exercise caution and verify independently`);
        }
        else if (reliability.score > 0.7) {
            recommendations.push(`✅ High reliability score - information appears trustworthy`);
        }
        // General recommendations
        recommendations.push(`📊 Cross-reference statistics and numbers with official sources`);
        recommendations.push(`👥 Check for eyewitness accounts and official statements`);
        return recommendations;
    };
    // Group articles by topic using intelligent keyword matching
    const groupedArticles = useMemo(() => {
        if (articles.length === 0)
            return [];
        const groups = {};
        articles.forEach(article => {
            const text = `${article.title} ${article.content || article.description || ''}`.toLowerCase();
            // Find the best matching topic
            let bestTopic = 'general';
            let bestScore = 0;
            const matchedKeywords = [];
            Object.entries(topicKeywords).forEach(([topic, keywords]) => {
                const score = keywords.reduce((total, keyword) => {
                    if (text.includes(keyword)) {
                        matchedKeywords.push(keyword);
                        return total + 1;
                    }
                    return total;
                }, 0);
                if (score > bestScore) {
                    bestScore = score;
                    bestTopic = topic;
                }
            });
            if (!groups[bestTopic]) {
                groups[bestTopic] = { articles: [], keywords: [], similarity: 0 };
            }
            groups[bestTopic].articles.push(article);
            groups[bestTopic].keywords = [...new Set([...groups[bestTopic].keywords, ...matchedKeywords])];
        });
        // Calculate similarity scores for each group
        Object.keys(groups).forEach(topic => {
            const group = groups[topic];
            if (group.articles.length > 1) {
                // Calculate average similarity between articles in the group
                let totalSimilarity = 0;
                let comparisons = 0;
                for (let i = 0; i < group.articles.length; i++) {
                    for (let j = i + 1; j < group.articles.length; j++) {
                        const similarity = calculateArticleSimilarity(group.articles[i], group.articles[j]);
                        totalSimilarity += similarity;
                        comparisons++;
                    }
                }
                group.similarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
            }
        });
        // Convert to array and sort by similarity
        return Object.entries(groups)
            .map(([topic, data]) => ({
            topic,
            articles: data.articles,
            similarity: data.similarity,
            keywords: data.keywords
        }))
            .filter(group => group.articles.length >= 2) // Only show groups with 2+ articles
            .sort((a, b) => b.similarity - a.similarity);
    }, [articles]);
    // Calculate similarity between two articles
    const calculateArticleSimilarity = (article1, article2) => {
        const text1 = `${article1.title} ${article1.content || article1.description || ''}`.toLowerCase();
        const text2 = `${article2.title} ${article2.content || article2.description || ''}`.toLowerCase();
        // Extract key terms (words longer than 4 characters)
        const words1 = new Set(text1.match(/\b\w{5,}\b/g) || []);
        const words2 = new Set(text2.match(/\b\w{5,}\b/g) || []);
        if (words1.size === 0 || words2.size === 0)
            return 0;
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    };
    useEffect(() => {
        setTopicGroups(groupedArticles);
        // Auto-select the first topic group if available
        if (groupedArticles.length > 0 && !selectedTopic) {
            setSelectedTopic(groupedArticles[0].topic);
            setSelectedArticles(groupedArticles[0].articles.slice(0, Math.min(5, groupedArticles[0].articles.length)));
        }
    }, [groupedArticles, selectedTopic]);
    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        const group = topicGroups.find(g => g.topic === topic);
        if (group) {
            setSelectedArticles(group.articles.slice(0, Math.min(5, group.articles.length)));
        }
    };
    const performComparativeAnalysis = async () => {
        if (selectedArticles.length < 2) {
            alert('Please select at least 2 articles for comparison');
            return;
        }
        setIsAnalyzing(true);
        setAnalysisProgress(0);
        try {
            // Step 1: Analyze each article individually
            const articleAnalyses = [];
            for (let i = 0; i < selectedArticles.length; i++) {
                const article = selectedArticles[i];
                const textContent = article.content || article.description || article.title;
                const biasResult = await analyzeBias(textContent);
                articleAnalyses.push({
                    article,
                    biasResult,
                    textContent
                });
                setAnalysisProgress(((i + 1) / selectedArticles.length) * 50);
            }
            // Step 2: Generate comparative analysis
            const result = await generateComparativeResult(articleAnalyses);
            setComparativeResult(result);
            if (onAnalysisComplete) {
                onAnalysisComplete(result);
            }
            setAnalysisProgress(100);
        }
        catch (error) {
            console.error('Comparative analysis failed:', error);
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const generateComparativeResult = async (articleAnalyses) => {
        // Extract common topics and phrases
        const allTexts = articleAnalyses.map(a => a.textContent.toLowerCase());
        const commonTopics = extractCommonTopics(allTexts);
        const keyPhrases = extractKeyPhrases(allTexts);
        const sharedClaims = extractSharedClaims(allTexts);
        // Enhanced truth detection analysis
        const conflicts = detectConflictingClaims(articleAnalyses);
        const differentPerspectives = findDifferentPerspectives(articleAnalyses);
        const biasVariations = articleAnalyses.map(a => ({
            source: a.article.source || new URL(a.article.link).hostname,
            biasScore: a.biasResult?.bias_scores?.political || 0,
            biasType: determineBiasType(a.biasResult)
        }));
        // Enhanced reliability scoring for truth detection
        const reliability = calculateTruthReliability(articleAnalyses);
        const overallConsensus = calculateConsensus(articleAnalyses);
        const recommendations = generateTruthRecommendations(articleAnalyses, conflicts, reliability);
        return {
            similarities: {
                topics: commonTopics,
                keyPhrases,
                sharedClaims
            },
            differences: {
                conflictingClaims: conflicts.map(c => `${c.type.toUpperCase()}: ${c.claim1.substring(0, 100)}... vs ${c.claim2.substring(0, 100)}...`),
                differentPerspectives,
                biasVariations
            },
            analysis: {
                overallConsensus,
                reliabilityScore: reliability.score,
                recommendations
            }
        };
    };
    const extractCommonTopics = (texts) => {
        const topics = Object.keys(topicKeywords);
        const commonTopics = topics.filter(topic => texts.every(text => topicKeywords[topic].some(keyword => text.includes(keyword))));
        return commonTopics.slice(0, 3);
    };
    const extractKeyPhrases = (texts) => {
        // Extract common phrases (3-5 word sequences)
        const phrases = new Map();
        texts.forEach(text => {
            const words = text.split(/\s+/);
            for (let i = 0; i <= words.length - 3; i++) {
                for (let len = 3; len <= 5 && i + len <= words.length; len++) {
                    const phrase = words.slice(i, i + len).join(' ');
                    phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
                }
            }
        });
        return Array.from(phrases.entries())
            .filter(([_, count]) => count >= 2)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 5)
            .map(([phrase, _]) => phrase);
    };
    const extractSharedClaims = (texts) => {
        const claims = [];
        const claimPatterns = [
            /\d+%/g,
            /\$\d+/g,
            /according to [^,]+/gi,
            /study shows/gi,
            /research indicates/gi
        ];
        const allClaims = new Map();
        texts.forEach(text => {
            claimPatterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        allClaims.set(match, (allClaims.get(match) || 0) + 1);
                    });
                }
            });
        });
        return Array.from(allClaims.entries())
            .filter(([_, count]) => count >= 2)
            .slice(0, 3)
            .map(([claim, _]) => claim);
    };
    const findConflictingClaims = (articleAnalyses) => {
        const conflicts = [];
        // Simple conflict detection - look for opposing statements
        const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'win'];
        const negativeWords = ['bad', 'terrible', 'negative', 'failure', 'lose', 'problem'];
        for (let i = 0; i < articleAnalyses.length; i++) {
            for (let j = i + 1; j < articleAnalyses.length; j++) {
                const text1 = articleAnalyses[i].textContent.toLowerCase();
                const text2 = articleAnalyses[j].textContent.toLowerCase();
                const pos1 = positiveWords.some(word => text1.includes(word));
                const neg1 = negativeWords.some(word => text1.includes(word));
                const pos2 = positiveWords.some(word => text2.includes(word));
                const neg2 = negativeWords.some(word => text2.includes(word));
                if ((pos1 && neg2) || (neg1 && pos2)) {
                    conflicts.push(`Conflicting perspectives between ${articleAnalyses[i].article.source} and ${articleAnalyses[j].article.source}`);
                }
            }
        }
        return conflicts.slice(0, 3);
    };
    const findDifferentPerspectives = (articleAnalyses) => {
        const perspectives = [];
        const sources = articleAnalyses.map(a => a.article.source || new URL(a.article.link).hostname);
        if (new Set(sources).size > 1) {
            perspectives.push(`Articles from ${new Set(sources).size} different sources with varying perspectives`);
        }
        // Check for different bias types
        const biasTypes = articleAnalyses.map(a => determineBiasType(a.biasResult));
        if (new Set(biasTypes).size > 1) {
            perspectives.push(`Different bias orientations detected: ${new Set(biasTypes).join(', ')}`);
        }
        return perspectives;
    };
    const determineBiasType = (biasResult) => {
        if (!biasResult?.bias_scores?.political)
            return 'Unknown';
        const score = biasResult.bias_scores.political;
        if (score < 0.3)
            return 'Left-leaning';
        if (score > 0.7)
            return 'Right-leaning';
        return 'Center';
    };
    const calculateConsensus = (articleAnalyses) => {
        // Calculate how much the articles agree on key points
        const allTexts = articleAnalyses.map(a => a.textContent.toLowerCase());
        const commonWords = new Set();
        // Find words that appear in all articles
        const firstText = allTexts[0];
        const words = firstText.match(/\b\w{5,}\b/g) || [];
        words.forEach(word => {
            if (allTexts.every(text => text.includes(word))) {
                commonWords.add(word);
            }
        });
        return Math.min(commonWords.size / 10, 1); // Normalize to 0-1
    };
    const calculateReliability = (articleAnalyses) => {
        // Calculate overall reliability based on source diversity and bias consistency
        const sources = new Set(articleAnalyses.map(a => a.article.source));
        const sourceDiversity = Math.min(sources.size / articleAnalyses.length, 1);
        const biasScores = articleAnalyses.map(a => a.biasResult?.bias_scores?.political || 0.5);
        const biasVariance = Math.sqrt(biasScores.reduce((sum, score) => sum + Math.pow(score - 0.5, 2), 0) / biasScores.length);
        return (sourceDiversity + (1 - biasVariance)) / 2;
    };
    const generateRecommendations = (articleAnalyses, conflictingClaims) => {
        const recommendations = [];
        if (conflictingClaims.length > 0) {
            recommendations.push('Consider fact-checking conflicting claims with additional sources');
        }
        const sources = new Set(articleAnalyses.map(a => a.article.source));
        if (sources.size < 3) {
            recommendations.push('Seek additional sources for a more balanced perspective');
        }
        const biasTypes = articleAnalyses.map(a => determineBiasType(a.biasResult));
        if (new Set(biasTypes).size === 1) {
            recommendations.push('All articles show similar bias - consider seeking opposing viewpoints');
        }
        return recommendations;
    };
    const toggleArticleSelection = (article) => {
        setSelectedArticles(prev => {
            const isSelected = prev.some(a => a.link === article.link);
            if (isSelected) {
                return prev.filter(a => a.link !== article.link);
            }
            else {
                return [...prev, article];
            }
        });
    };
    return (_jsxs("div", { className: "comparative-analysis", children: [_jsx("div", { className: "analysis-header", children: _jsxs("div", { className: "header-content", children: [_jsx(FiBarChart2, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h2", { children: "Truth Detection Analysis" }), _jsx("p", { children: "When multiple news sources report on the same event with conflicting information, this tool helps identify who is telling the truth by analyzing claims, sources, and discrepancies" })] })] }) }), topicGroups.length > 0 && (_jsxs("div", { className: "topic-grouping", children: [_jsx("h3", { children: "Articles Grouped by Topic" }), _jsx("div", { className: "topic-groups", children: topicGroups.map((group) => (_jsxs("div", { className: `topic-group ${selectedTopic === group.topic ? 'selected' : ''}`, onClick: () => handleTopicSelect(group.topic), children: [_jsxs("div", { className: "topic-header", children: [_jsx(FiTarget, { className: "topic-icon" }), _jsx("h4", { children: group.topic.charAt(0).toUpperCase() + group.topic.slice(1) }), _jsxs("span", { className: "article-count", children: [group.articles.length, " articles"] })] }), _jsxs("div", { className: "topic-metrics", children: [_jsxs("div", { className: "similarity-score", children: [_jsx(FiTrendingUp, {}), (group.similarity * 100).toFixed(0), "% similarity"] }), _jsx("div", { className: "keywords", children: group.keywords.slice(0, 3).join(', ') })] })] }, group.topic))) })] })), _jsxs("div", { className: "article-selection", children: [_jsx("h3", { children: "Select Articles for Comparison (2-5 articles)" }), _jsx("div", { className: "articles-grid", children: selectedTopic && topicGroups.find(g => g.topic === selectedTopic)?.articles.map((article, index) => {
                            const isSelected = selectedArticles.some(a => a.link === article.link);
                            return (_jsxs("div", { className: `article-card ${isSelected ? 'selected' : ''}`, onClick: () => toggleArticleSelection(article), children: [_jsxs("div", { className: "article-info", children: [_jsx("h4", { children: article.title }), _jsx("p", { className: "article-source", children: article.source || new URL(article.link).hostname }), _jsx("p", { className: "article-date", children: new Date(article.pubDate).toLocaleDateString() })] }), _jsx("div", { className: "selection-indicator", children: isSelected ? _jsx(FiCheckCircle, {}) : _jsx(FiInfo, {}) })] }, index));
                        }) }), _jsx("button", { className: "analyze-button", onClick: performComparativeAnalysis, disabled: isAnalyzing || selectedArticles.length < 2, children: isAnalyzing ? 'Analyzing...' : `Compare ${selectedArticles.length} Articles` })] }), isAnalyzing && (_jsxs("div", { className: "analysis-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${analysisProgress}%` } }) }), _jsxs("p", { children: ["Analyzing articles... ", analysisProgress.toFixed(0), "%"] })] })), comparativeResult && (_jsxs("div", { className: "analysis-results", children: [_jsx("h3", { children: "Truth Detection Analysis Results" }), _jsxs("div", { className: "results-grid", children: [_jsxs("div", { className: "result-section", children: [_jsx(AnalysisTooltip, { title: "Event Similarities", explanation: "This section shows what different sources agree on about the event, including common topics, key phrases, and shared factual claims. High similarity suggests reliable reporting, while low similarity may indicate different events or conflicting information.", icon: _jsx(FiUsers, {}), className: "metric-tooltip", children: _jsxs("h4", { children: [_jsx(FiUsers, {}), " Event Similarities"] }) }), _jsxs("div", { className: "similarities", children: [_jsxs("div", { className: "topics", children: [_jsx("h5", { children: "Common Topics" }), _jsx("ul", { children: comparativeResult.similarities.topics.map((topic, index) => (_jsx("li", { children: topic }, index))) })] }), _jsxs("div", { className: "key-phrases", children: [_jsx("h5", { children: "Key Phrases" }), _jsx("ul", { children: comparativeResult.similarities.keyPhrases.map((phrase, index) => (_jsx("li", { children: phrase }, index))) })] }), _jsxs("div", { className: "shared-claims", children: [_jsx("h5", { children: "Shared Claims" }), _jsx("ul", { children: comparativeResult.similarities.sharedClaims.map((claim, index) => (_jsx("li", { children: claim }, index))) })] })] })] }), _jsxs("div", { className: "result-section", children: [_jsx(AnalysisTooltip, { title: "Conflicts & Discrepancies", explanation: "This section highlights disagreements between sources, including conflicting claims, different perspectives, and bias variations. These discrepancies are crucial for identifying potential misinformation or different interpretations of events.", icon: _jsx(FiAlertTriangle, {}), className: "fallacy-tooltip", children: _jsxs("h4", { children: [_jsx(FiAlertTriangle, {}), " Conflicts & Discrepancies"] }) }), _jsxs("div", { className: "differences", children: [_jsxs("div", { className: "conflicting-claims", children: [_jsx("h5", { children: "Conflicting Claims" }), _jsx("ul", { children: comparativeResult.differences.conflictingClaims.map((claim, index) => (_jsxs("li", { className: "conflict-item", children: [_jsx("span", { className: "conflict-type", children: claim.split(':')[0] }), _jsx("div", { className: "conflict-content", children: claim.split(':').slice(1).join(':') })] }, index))) })] }), _jsxs("div", { className: "bias-variations", children: [_jsx("h5", { children: "Source Bias Analysis" }), _jsx("ul", { children: comparativeResult.differences.biasVariations.map((variation, index) => (_jsxs("li", { className: "bias-item", children: [_jsx("span", { className: "source-name", children: variation.source }), _jsx("span", { className: "bias-type", children: variation.biasType }), _jsxs("span", { className: "bias-score", children: [(variation.biasScore * 100).toFixed(0), "%"] })] }, index))) })] })] })] })] }), _jsxs("div", { className: "analysis-summary", children: [_jsx("h4", { children: "Truth Detection Summary" }), _jsxs("div", { className: "summary-metrics", children: [_jsx(AnalysisTooltip, { title: "Event Consensus", explanation: "This percentage indicates how much the different sources agree on the basic facts of the event. Higher consensus suggests more reliable reporting, while low consensus may indicate conflicting information or different interpretations of events.", icon: _jsx(FiUsers, {}), className: "metric-tooltip", children: _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Event Consensus:" }), _jsxs("span", { children: [(comparativeResult.analysis.overallConsensus * 100).toFixed(0), "%"] })] }) }), _jsx(AnalysisTooltip, { title: "Truth Reliability Score", explanation: `This ${(comparativeResult.analysis.reliabilityScore * 100).toFixed(0)}% reliability score is based on source diversity, citation quality, conflict level, and bias consistency. Higher scores indicate more trustworthy information, while lower scores suggest potential misinformation or bias.`, icon: _jsx(FiShield, {}), className: "credibility-tooltip", children: _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Truth Reliability:" }), _jsxs("span", { className: comparativeResult.analysis.reliabilityScore > 0.7 ? 'high-reliability' :
                                                        comparativeResult.analysis.reliabilityScore < 0.4 ? 'low-reliability' : 'medium-reliability', children: [(comparativeResult.analysis.reliabilityScore * 100).toFixed(0), "%"] })] }) })] }), _jsxs("div", { className: "recommendations", children: [_jsx("h5", { children: "Truth Detection Recommendations" }), _jsx("ul", { children: comparativeResult.analysis.recommendations.map((rec, index) => (_jsx("li", { className: "recommendation-item", children: rec }, index))) })] })] })] }))] }));
};
export default ComparativeAnalysis;
