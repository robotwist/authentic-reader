/**
 * Simplified Demo Article Service
 *
 * This service provides a curated set of 5-10 high-quality articles
 * for a fast, slick demo experience without complex analysis delays.
 */
// Curated high-quality demo articles with complete analysis
const DEMO_ARTICLES = [
    {
        title: "AI Breakthrough: New Model Achieves Human-Level Reasoning in Complex Tasks",
        link: "https://example.com/ai-breakthrough-2024",
        description: "Researchers at Stanford University have developed a new artificial intelligence model that demonstrates human-level reasoning capabilities in complex problem-solving tasks, marking a significant milestone in AI development.",
        pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        author: "Dr. Sarah Chen",
        content: "A team of researchers at Stanford University has announced a breakthrough in artificial intelligence that could fundamentally change how we approach complex problem-solving. The new model, called ReasoningNet, has demonstrated human-level performance across a wide range of cognitive tasks, from mathematical reasoning to creative problem-solving. The research, published in Nature, shows that the model can understand context, draw logical conclusions, and even generate novel solutions to previously unseen problems. This represents a significant step forward in the field of artificial general intelligence. The study involved testing the model on over 50 different reasoning tasks, including mathematical proofs, logical puzzles, and creative writing challenges. Results showed that ReasoningNet achieved 94% accuracy on standardized intelligence tests, surpassing previous AI models by a significant margin. However, critics argue that the model's performance may be overhyped, as it was tested in controlled laboratory conditions rather than real-world scenarios.",
        articleId: "demo-ai-breakthrough",
        source: "Stanford Research",
        sourceCategory: "center",
        analysis: {
            wordCount: 156,
            readingTime: 2,
            summary: "Stanford researchers develop AI model with human-level reasoning capabilities, achieving 94% accuracy on intelligence tests",
            credibility: {
                score: 0.92,
                level: "high",
                reason: "Academic research from reputable institution with peer review",
                factors: {
                    sourceReputation: 0.95,
                    factChecking: 0.90,
                    citationQuality: 0.88,
                    authorExpertise: 0.94,
                    transparency: 0.85
                }
            },
            logicalFallacies: [
                {
                    type: "Appeal to Authority",
                    explanation: "The article heavily relies on Stanford's reputation without providing sufficient independent verification of the claims",
                    excerpt: "Stanford University has announced a breakthrough... This represents a significant step forward",
                    confidence: 0.75,
                    impact: "medium"
                },
                {
                    type: "Cherry Picking",
                    explanation: "The article emphasizes the 94% accuracy score while downplaying the controlled laboratory conditions",
                    excerpt: "Results showed that ReasoningNet achieved 94% accuracy... However, critics argue that the model's performance may be overhyped",
                    confidence: 0.80,
                    impact: "high"
                }
            ],
            biasAnalysis: {
                direction: "center",
                confidence: 0.85,
                explanation: "Balanced reporting that includes both positive results and critical perspectives",
                indicators: { left: 0.15, right: 0.15 },
                enhancedAnalysis: {
                    languageBias: 0.20,
                    framingBias: 0.25,
                    sourceBias: 0.30,
                    selectionBias: 0.15,
                    overallBias: 0.22,
                    biasExplanation: "Slight positive framing of AI capabilities, but includes critical counterpoints"
                }
            },
            networkAnalysis: {
                topEntities: [
                    { name: "Stanford University", count: 4, type: "Organization" },
                    { name: "ReasoningNet", count: 3, type: "Technology" },
                    { name: "AI", count: 6, type: "Technology" },
                    { name: "Artificial General Intelligence", count: 2, type: "Concept" }
                ],
                entityCount: 12,
                keyTopics: ["artificial intelligence", "machine learning", "academic research", "technology breakthrough"],
                sentimentAnalysis: {
                    overall: "positive",
                    score: 0.75,
                    breakdown: {
                        positive: 0.75,
                        negative: 0.10,
                        neutral: 0.15
                    }
                }
            },
            timestamp: new Date().toISOString()
        }
    },
    {
        title: "Climate Study Reveals Accelerating Global Temperature Trends",
        link: "https://example.com/climate-study-2024",
        description: "Comprehensive analysis of global temperature data shows accelerating warming trends, with implications for climate policy and international cooperation.",
        pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        author: "Dr. Michael Rodriguez",
        content: "A comprehensive study analyzing global temperature data from the past century has revealed concerning trends in climate change. The research, conducted by an international team of climatologists from leading institutions including NASA, NOAA, and the IPCC, shows that global temperatures are rising at an accelerated rate compared to previous decades. The study examined data from over 1,000 weather stations worldwide and found that the rate of warming has increased by 40% since 2000. These findings have significant implications for climate policy and international cooperation efforts. The research team used advanced statistical models and machine learning algorithms to analyze temperature patterns, accounting for natural climate variability and urban heat island effects. The study's conclusions align with previous IPCC assessments but provide more granular data on regional variations. However, some climate skeptics argue that the study's methodology may overstate the rate of warming by not adequately accounting for natural climate cycles.",
        articleId: "demo-climate-study",
        source: "Nature Climate Change",
        sourceCategory: "center",
        analysis: {
            wordCount: 142,
            readingTime: 2,
            summary: "International study confirms accelerated global warming trends with 40% increase since 2000",
            credibility: {
                score: 0.94,
                level: "high",
                reason: "Peer-reviewed research from multiple reputable institutions with comprehensive methodology",
                factors: {
                    sourceReputation: 0.96,
                    factChecking: 0.94,
                    citationQuality: 0.92,
                    authorExpertise: 0.95,
                    transparency: 0.90
                }
            },
            logicalFallacies: [
                {
                    type: "Appeal to Consensus",
                    explanation: "The article emphasizes alignment with IPCC assessments without critically examining the underlying data",
                    excerpt: "The study's conclusions align with previous IPCC assessments",
                    confidence: 0.70,
                    impact: "medium"
                },
                {
                    type: "Straw Man",
                    explanation: "Briefly mentions climate skeptics without addressing their specific concerns in detail",
                    excerpt: "However, some climate skeptics argue that the study's methodology may overstate the rate of warming",
                    confidence: 0.65,
                    impact: "low"
                }
            ],
            biasAnalysis: {
                direction: "center",
                confidence: 0.90,
                explanation: "Data-driven scientific reporting with balanced presentation of findings and limitations",
                indicators: { left: 0.10, right: 0.10 },
                enhancedAnalysis: {
                    languageBias: 0.15,
                    framingBias: 0.20,
                    sourceBias: 0.25,
                    selectionBias: 0.10,
                    overallBias: 0.17,
                    biasExplanation: "Minimal bias with slight emphasis on scientific consensus"
                }
            },
            networkAnalysis: {
                topEntities: [
                    { name: "NASA", count: 2, type: "Organization" },
                    { name: "NOAA", count: 2, type: "Organization" },
                    { name: "IPCC", count: 3, type: "Organization" },
                    { name: "Climate Change", count: 4, type: "Concept" }
                ],
                entityCount: 15,
                keyTopics: ["climate change", "global warming", "scientific research", "environmental policy"],
                sentimentAnalysis: {
                    overall: "neutral",
                    score: 0.45,
                    breakdown: {
                        positive: 0.20,
                        negative: 0.35,
                        neutral: 0.45
                    }
                }
            },
            timestamp: new Date().toISOString()
        }
    },
    {
        title: "Economic Recovery Shows Strong Growth in Technology Sector",
        link: "https://example.com/tech-economic-recovery",
        description: "Latest economic indicators reveal robust growth in the technology sector, driving overall economic recovery and creating new job opportunities.",
        pubDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        author: "Jennifer Park",
        content: "The technology sector is leading the economic recovery with unprecedented growth rates, according to the latest economic indicators from the Federal Reserve and Department of Commerce. Companies in software development, artificial intelligence, and renewable energy are reporting record profits and expanding their workforces. This growth is creating new job opportunities and contributing to overall economic stability. Analysts predict this trend will continue as digital transformation accelerates across all industries. The data shows that tech companies have added over 500,000 jobs in the past quarter, with average salaries increasing by 8% year-over-year. However, some economists warn that this growth may be unsustainable and could lead to a tech bubble similar to the dot-com era. They point to high valuations and speculative investments in AI startups as potential warning signs. The Federal Reserve has also expressed concerns about inflation in the tech sector, though they maintain that the overall economic impact remains positive.",
        articleId: "demo-tech-recovery",
        source: "Economic Times",
        sourceCategory: "center",
        analysis: {
            wordCount: 134,
            readingTime: 2,
            summary: "Technology sector drives economic recovery with 500,000 new jobs and 8% salary growth",
            credibility: {
                score: 0.88,
                level: "high",
                reason: "Official economic data from government sources with expert analysis",
                factors: {
                    sourceReputation: 0.85,
                    factChecking: 0.90,
                    citationQuality: 0.88,
                    authorExpertise: 0.82,
                    transparency: 0.85
                }
            },
            logicalFallacies: [
                {
                    type: "Correlation vs Causation",
                    explanation: "The article assumes tech sector growth is driving overall recovery without proving causation",
                    excerpt: "The technology sector is leading the economic recovery... This growth is creating new job opportunities",
                    confidence: 0.80,
                    impact: "high"
                },
                {
                    type: "Hasty Generalization",
                    explanation: "Extrapolates current growth trends without considering potential economic cycles",
                    excerpt: "Analysts predict this trend will continue as digital transformation accelerates",
                    confidence: 0.75,
                    impact: "medium"
                }
            ],
            biasAnalysis: {
                direction: "center",
                confidence: 0.85,
                explanation: "Balanced reporting with both positive indicators and cautionary perspectives",
                indicators: { left: 0.20, right: 0.20 },
                enhancedAnalysis: {
                    languageBias: 0.25,
                    framingBias: 0.30,
                    sourceBias: 0.20,
                    selectionBias: 0.15,
                    overallBias: 0.22,
                    biasExplanation: "Slight positive framing of tech growth with included counterarguments"
                }
            },
            networkAnalysis: {
                topEntities: [
                    { name: "Federal Reserve", count: 3, type: "Organization" },
                    { name: "Technology Sector", count: 4, type: "Industry" },
                    { name: "AI Startups", count: 2, type: "Business" },
                    { name: "Economic Recovery", count: 3, type: "Concept" }
                ],
                entityCount: 18,
                keyTopics: ["economic recovery", "technology sector", "job growth", "inflation"],
                sentimentAnalysis: {
                    overall: "positive",
                    score: 0.70,
                    breakdown: {
                        positive: 0.70,
                        negative: 0.15,
                        neutral: 0.15
                    }
                }
            },
            timestamp: new Date().toISOString()
        }
    },
    {
        title: "Healthcare Innovation: Breakthrough in Personalized Medicine",
        link: "https://example.com/healthcare-innovation",
        description: "New advances in personalized medicine are revolutionizing treatment approaches, offering hope for patients with previously untreatable conditions.",
        pubDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        author: "Dr. Emily Watson",
        content: "Revolutionary advances in personalized medicine are transforming healthcare delivery and offering new hope for patients with complex medical conditions. Researchers at Johns Hopkins University and the Mayo Clinic have developed new techniques that allow for more precise diagnosis and treatment based on individual genetic profiles. These innovations are particularly promising for patients with rare diseases and cancer, where traditional treatment approaches have often been ineffective. The breakthrough involves advanced genomic sequencing combined with machine learning algorithms that can predict treatment responses with 85% accuracy. Clinical trials involving over 2,000 patients have shown remarkable results, with 60% of participants experiencing significant improvement in their conditions. However, the high cost of these treatments, averaging $50,000 per patient, raises concerns about accessibility and healthcare equity. Some medical ethicists worry that these expensive treatments may only be available to wealthy patients, potentially widening health disparities.",
        articleId: "demo-healthcare-innovation",
        source: "Journal of Medical Research",
        sourceCategory: "center",
        analysis: {
            wordCount: 138,
            readingTime: 2,
            summary: "Personalized medicine breakthrough shows 85% accuracy and 60% improvement rates in clinical trials",
            credibility: {
                score: 0.91,
                level: "high",
                reason: "Medical research from reputable institutions with clinical trial data",
                factors: {
                    sourceReputation: 0.93,
                    factChecking: 0.90,
                    citationQuality: 0.89,
                    authorExpertise: 0.94,
                    transparency: 0.88
                }
            },
            logicalFallacies: [
                {
                    type: "Appeal to Emotion",
                    explanation: "Uses emotional language like 'new hope' and 'revolutionary' to emphasize positive outcomes",
                    excerpt: "Revolutionary advances... offering new hope for patients",
                    confidence: 0.85,
                    impact: "medium"
                },
                {
                    type: "False Dichotomy",
                    explanation: "Presents personalized medicine as the only solution, ignoring other treatment approaches",
                    excerpt: "where traditional treatment approaches have often been ineffective",
                    confidence: 0.70,
                    impact: "medium"
                }
            ],
            biasAnalysis: {
                direction: "center",
                confidence: 0.88,
                explanation: "Balanced reporting that includes both medical benefits and ethical concerns",
                indicators: { left: 0.15, right: 0.15 },
                enhancedAnalysis: {
                    languageBias: 0.20,
                    framingBias: 0.25,
                    sourceBias: 0.30,
                    selectionBias: 0.15,
                    overallBias: 0.22,
                    biasExplanation: "Slight positive framing of medical advances with included ethical considerations"
                }
            },
            networkAnalysis: {
                topEntities: [
                    { name: "Johns Hopkins University", count: 2, type: "Organization" },
                    { name: "Mayo Clinic", count: 2, type: "Organization" },
                    { name: "Personalized Medicine", count: 4, type: "Medical Concept" },
                    { name: "Clinical Trials", count: 3, type: "Research" }
                ],
                entityCount: 14,
                keyTopics: ["personalized medicine", "healthcare innovation", "genomic sequencing", "medical ethics"],
                sentimentAnalysis: {
                    overall: "positive",
                    score: 0.75,
                    breakdown: {
                        positive: 0.75,
                        negative: 0.10,
                        neutral: 0.15
                    }
                }
            },
            timestamp: new Date().toISOString()
        }
    },
    {
        title: "Education Reform: New Approaches to Digital Learning",
        link: "https://example.com/education-reform",
        description: "Educational institutions are adopting innovative digital learning approaches to improve student outcomes and accessibility.",
        pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        author: "Professor David Kim",
        content: "Educational institutions worldwide are embracing digital learning innovations to enhance student engagement and improve learning outcomes. New technologies are making education more accessible to diverse populations while maintaining high academic standards. These reforms are particularly important in addressing educational disparities and preparing students for the digital economy. Research from MIT and Harvard shows that students using adaptive learning platforms perform 25% better on standardized tests compared to traditional classroom methods. The study involved over 10,000 students across 50 different schools, demonstrating significant improvements in both engagement and achievement. However, critics argue that digital learning may exacerbate existing inequalities, as students from lower-income families may lack access to necessary technology and internet connectivity. Some educators also worry that excessive screen time could negatively impact social development and mental health. The Department of Education has allocated $2 billion in funding to address these concerns and ensure equitable access to digital learning resources.",
        articleId: "demo-education-reform",
        source: "Education Review",
        sourceCategory: "center",
        analysis: {
            wordCount: 145,
            readingTime: 2,
            summary: "Digital learning shows 25% improvement in test scores but raises concerns about accessibility and equity",
            credibility: {
                score: 0.89,
                level: "high",
                reason: "Academic research from prestigious institutions with comprehensive study data",
                factors: {
                    sourceReputation: 0.92,
                    factChecking: 0.88,
                    citationQuality: 0.90,
                    authorExpertise: 0.91,
                    transparency: 0.85
                }
            },
            logicalFallacies: [
                {
                    type: "Appeal to Authority",
                    explanation: "Heavily relies on MIT and Harvard's reputation without detailed methodology review",
                    excerpt: "Research from MIT and Harvard shows that students using adaptive learning platforms perform 25% better",
                    confidence: 0.80,
                    impact: "medium"
                },
                {
                    type: "Oversimplification",
                    explanation: "Reduces complex educational outcomes to simple test score comparisons",
                    excerpt: "students using adaptive learning platforms perform 25% better on standardized tests",
                    confidence: 0.75,
                    impact: "high"
                }
            ],
            biasAnalysis: {
                direction: "center",
                confidence: 0.87,
                explanation: "Balanced reporting that acknowledges both benefits and potential drawbacks of digital learning",
                indicators: { left: 0.20, right: 0.20 },
                enhancedAnalysis: {
                    languageBias: 0.25,
                    framingBias: 0.30,
                    sourceBias: 0.25,
                    selectionBias: 0.20,
                    overallBias: 0.25,
                    biasExplanation: "Moderate positive framing of digital learning with included equity concerns"
                }
            },
            networkAnalysis: {
                topEntities: [
                    { name: "MIT", count: 2, type: "Organization" },
                    { name: "Harvard", count: 2, type: "Organization" },
                    { name: "Department of Education", count: 2, type: "Organization" },
                    { name: "Digital Learning", count: 4, type: "Educational Concept" }
                ],
                entityCount: 16,
                keyTopics: ["digital learning", "education reform", "student outcomes", "educational equity"],
                sentimentAnalysis: {
                    overall: "positive",
                    score: 0.70,
                    breakdown: {
                        positive: 0.70,
                        negative: 0.15,
                        neutral: 0.15
                    }
                }
            },
            timestamp: new Date().toISOString()
        }
    }
];
class ArticleService {
    constructor() {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Pre-load demo articles into cache
        this.cache.set('all', DEMO_ARTICLES);
    }
    /**
     * Get demo articles instantly - no API calls, no delays
     */
    async getArticles(categories = ['far-left', 'left', 'center', 'right', 'far-right'], limit = 10) {
        // Return demo articles immediately - all are center/balanced for demo
        const articles = DEMO_ARTICLES.slice(0, Math.min(limit, DEMO_ARTICLES.length));
        // Simulate a small delay to show loading state (optional)
        await new Promise(resolve => setTimeout(resolve, 100));
        return articles;
    }
    /**
     * Get a specific article by ID
     */
    async getArticleById(articleId) {
        const article = DEMO_ARTICLES.find(a => a.articleId === articleId);
        return article || null;
    }
    /**
     * Get cache status - always returns valid cache for demo
     */
    getCacheStatus() {
        return {
            hasCache: true,
            isValid: true,
            lastFetch: Date.now()
        };
    }
    /**
     * Get fallback articles - same as demo articles
     */
    getFallbackArticles() {
        return [...DEMO_ARTICLES];
    }
    /**
     * Clear cache - not needed for demo
     */
    clearCache() {
        // No-op for demo
    }
}
// Export singleton instance
export const articleService = new ArticleService();
// Export individual functions for compatibility
export const getArticleById = (articleId) => articleService.getArticleById(articleId);
