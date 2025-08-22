import React, { useState, useEffect, useMemo } from 'react';
import { FiBarChart2, FiCheckCircle, FiInfo, FiTarget, FiUsers, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import { useLlamaAnalysis } from '../hooks/useLlamaAnalysis';
import './ComparativeAnalysis.css';

interface Article {
  title: string;
  content?: string;
  description?: string;
  link: string;
  source?: string;
  pubDate: string;
  analysis?: any;
}

interface ComparativeResult {
  similarities: {
    topics: string[];
    keyPhrases: string[];
    sharedClaims: string[];
  };
  differences: {
    conflictingClaims: string[];
    differentPerspectives: string[];
    biasVariations: Array<{
      source: string;
      biasScore: number;
      biasType: string;
    }>;
  };
  analysis: {
    overallConsensus: number;
    reliabilityScore: number;
    recommendations: string[];
  };
}

interface TopicGroup {
  topic: string;
  articles: Article[];
  similarity: number;
  keywords: string[];
}

interface ComparativeAnalysisProps {
  articles: Article[];
  onAnalysisComplete?: (result: ComparativeResult) => void;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ 
  articles, 
  onAnalysisComplete 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparativeResult, setComparativeResult] = useState<ComparativeResult | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
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
    'sports': ['sport', 'football', 'basketball', 'baseball', 'athlete', 'team', 'championship', 'game']
  };

  // Group articles by topic using intelligent keyword matching
  const groupedArticles = useMemo(() => {
    if (articles.length === 0) return [];

    const groups: { [key: string]: { articles: Article[]; keywords: string[]; similarity: number } } = {};

    articles.forEach(article => {
      const text = `${article.title} ${article.content || article.description || ''}`.toLowerCase();
      
      // Find the best matching topic
      let bestTopic = 'general';
      let bestScore = 0;
      let matchedKeywords: string[] = [];

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
  const calculateArticleSimilarity = (article1: Article, article2: Article): number => {
    const text1 = `${article1.title} ${article1.content || article1.description || ''}`.toLowerCase();
    const text2 = `${article2.title} ${article2.content || article2.description || ''}`.toLowerCase();
    
    // Extract key terms (words longer than 4 characters)
    const words1 = new Set(text1.match(/\b\w{5,}\b/g) || []);
    const words2 = new Set(text2.match(/\b\w{5,}\b/g) || []);
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
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

  const handleTopicSelect = (topic: string) => {
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
    } catch (error) {
      console.error('Comparative analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateComparativeResult = async (articleAnalyses: any[]): Promise<ComparativeResult> => {
    // Extract common topics and phrases
    const allTexts = articleAnalyses.map(a => a.textContent.toLowerCase());
    const commonTopics = extractCommonTopics(allTexts);
    const keyPhrases = extractKeyPhrases(allTexts);
    const sharedClaims = extractSharedClaims(allTexts);

    // Find differences and conflicts
    const conflictingClaims = findConflictingClaims(articleAnalyses);
    const differentPerspectives = findDifferentPerspectives(articleAnalyses);
    const biasVariations = articleAnalyses.map(a => ({
      source: a.article.source || new URL(a.article.link).hostname,
      biasScore: a.biasResult?.bias_scores?.political || 0,
      biasType: determineBiasType(a.biasResult)
    }));

    // Calculate overall metrics
    const overallConsensus = calculateConsensus(articleAnalyses);
    const reliabilityScore = calculateReliability(articleAnalyses);
    const recommendations = generateRecommendations(articleAnalyses, conflictingClaims);

    return {
      similarities: {
        topics: commonTopics,
        keyPhrases,
        sharedClaims
      },
      differences: {
        conflictingClaims,
        differentPerspectives,
        biasVariations
      },
      analysis: {
        overallConsensus,
        reliabilityScore,
        recommendations
      }
    };
  };

  const extractCommonTopics = (texts: string[]): string[] => {
    const topics = Object.keys(topicKeywords);
    const commonTopics = topics.filter(topic => 
      texts.every(text => 
        topicKeywords[topic as keyof typeof topicKeywords].some(keyword => text.includes(keyword))
      )
    );
    return commonTopics.slice(0, 3);
  };

  const extractKeyPhrases = (texts: string[]): string[] => {
    // Extract common phrases (3-5 word sequences)
    const phrases = new Map<string, number>();
    
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

  const extractSharedClaims = (texts: string[]): string[] => {
    const claims = [];
    const claimPatterns = [
      /\d+%/g,
      /\$\d+/g,
      /according to [^,]+/gi,
      /study shows/gi,
      /research indicates/gi
    ];
    
    const allClaims = new Map<string, number>();
    
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

  const findConflictingClaims = (articleAnalyses: any[]): string[] => {
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

  const findDifferentPerspectives = (articleAnalyses: any[]): string[] => {
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

  const determineBiasType = (biasResult: any): string => {
    if (!biasResult?.bias_scores?.political) return 'Unknown';
    const score = biasResult.bias_scores.political;
    if (score < 0.3) return 'Left-leaning';
    if (score > 0.7) return 'Right-leaning';
    return 'Center';
  };

  const calculateConsensus = (articleAnalyses: any[]): number => {
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

  const calculateReliability = (articleAnalyses: any[]): number => {
    // Calculate overall reliability based on source diversity and bias consistency
    const sources = new Set(articleAnalyses.map(a => a.article.source));
    const sourceDiversity = Math.min(sources.size / articleAnalyses.length, 1);
    
    const biasScores = articleAnalyses.map(a => a.biasResult?.bias_scores?.political || 0.5);
    const biasVariance = Math.sqrt(biasScores.reduce((sum, score) => sum + Math.pow(score - 0.5, 2), 0) / biasScores.length);
    
    return (sourceDiversity + (1 - biasVariance)) / 2;
  };

  const generateRecommendations = (articleAnalyses: any[], conflictingClaims: string[]): string[] => {
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

  const toggleArticleSelection = (article: Article) => {
    setSelectedArticles(prev => {
      const isSelected = prev.some(a => a.link === article.link);
      if (isSelected) {
        return prev.filter(a => a.link !== article.link);
      } else {
        return [...prev, article];
      }
    });
  };

  return (
    <div className="comparative-analysis">
      <div className="analysis-header">
        <div className="header-content">
          <FiBarChart2 className="header-icon" />
          <div>
            <h2>Comparative Analysis</h2>
            <p>Compare multiple articles on the same subject to identify similarities, differences, and potential biases</p>
          </div>
        </div>
      </div>

      {/* Topic Grouping */}
      {topicGroups.length > 0 && (
        <div className="topic-grouping">
          <h3>Articles Grouped by Topic</h3>
          <div className="topic-groups">
            {topicGroups.map((group) => (
              <div 
                key={group.topic}
                className={`topic-group ${selectedTopic === group.topic ? 'selected' : ''}`}
                onClick={() => handleTopicSelect(group.topic)}
              >
                <div className="topic-header">
                  <FiTarget className="topic-icon" />
                  <h4>{group.topic.charAt(0).toUpperCase() + group.topic.slice(1)}</h4>
                  <span className="article-count">{group.articles.length} articles</span>
                </div>
                <div className="topic-metrics">
                  <div className="similarity-score">
                    <FiTrendingUp />
                    {(group.similarity * 100).toFixed(0)}% similarity
                  </div>
                  <div className="keywords">
                    {group.keywords.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Article Selection */}
      <div className="article-selection">
        <h3>Select Articles for Comparison (2-5 articles)</h3>
        <div className="articles-grid">
          {selectedTopic && topicGroups.find(g => g.topic === selectedTopic)?.articles.map((article, index) => {
            const isSelected = selectedArticles.some(a => a.link === article.link);
            return (
              <div 
                key={index} 
                className={`article-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleArticleSelection(article)}
              >
                <div className="article-info">
                  <h4>{article.title}</h4>
                  <p className="article-source">{article.source || new URL(article.link).hostname}</p>
                  <p className="article-date">{new Date(article.pubDate).toLocaleDateString()}</p>
                </div>
                <div className="selection-indicator">
                  {isSelected ? <FiCheckCircle /> : <FiInfo />}
                </div>
              </div>
            );
          })}
        </div>
        
        <button 
          className="analyze-button"
          onClick={performComparativeAnalysis}
          disabled={isAnalyzing || selectedArticles.length < 2}
        >
          {isAnalyzing ? 'Analyzing...' : `Compare ${selectedArticles.length} Articles`}
        </button>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="analysis-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
          <p>Analyzing articles... {analysisProgress.toFixed(0)}%</p>
        </div>
      )}

      {/* Results */}
      {comparativeResult && (
        <div className="analysis-results">
          <h3>Comparative Analysis Results</h3>
          
          <div className="results-grid">
            <div className="result-section">
              <h4><FiUsers /> Similarities</h4>
              <div className="similarities">
                <div className="topics">
                  <h5>Common Topics</h5>
                  <ul>
                    {comparativeResult.similarities.topics.map((topic, index) => (
                      <li key={index}>{topic}</li>
                    ))}
                  </ul>
                </div>
                <div className="key-phrases">
                  <h5>Key Phrases</h5>
                  <ul>
                    {comparativeResult.similarities.keyPhrases.map((phrase, index) => (
                      <li key={index}>{phrase}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="result-section">
              <h4><FiAlertTriangle /> Differences</h4>
              <div className="differences">
                <div className="conflicting-claims">
                  <h5>Conflicting Claims</h5>
                  <ul>
                    {comparativeResult.differences.conflictingClaims.map((claim, index) => (
                      <li key={index}>{claim}</li>
                    ))}
                  </ul>
                </div>
                <div className="bias-variations">
                  <h5>Bias Variations</h5>
                  <ul>
                    {comparativeResult.differences.biasVariations.map((variation, index) => (
                      <li key={index}>
                        {variation.source}: {variation.biasType} ({(variation.biasScore * 100).toFixed(0)}%)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="analysis-summary">
            <h4>Analysis Summary</h4>
            <div className="summary-metrics">
              <div className="metric">
                <span>Consensus Level:</span>
                <span>{(comparativeResult.analysis.overallConsensus * 100).toFixed(0)}%</span>
              </div>
              <div className="metric">
                <span>Reliability Score:</span>
                <span>{(comparativeResult.analysis.reliabilityScore * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="recommendations">
              <h5>Recommendations</h5>
              <ul>
                {comparativeResult.analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparativeAnalysis;
