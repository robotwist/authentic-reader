import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiRefreshCw, FiBookOpen, FiTarget, FiTrendingUp, FiEye, FiZap, FiBarChart2, FiFilter, FiDownload } from 'react-icons/fi';
import '../styles/DynamicArticleGenerator.css';
const DynamicArticleGenerator = ({ onArticlesGenerated, onArticleSelected }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedArticles, setGeneratedArticles] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedBiasLevel, setSelectedBiasLevel] = useState('all');
    const [selectedComplexity, setSelectedComplexity] = useState('all');
    const [generationProgress, setGenerationProgress] = useState(0);
    useEffect(() => {
        generateArticles();
    }, []);
    const generateArticles = async () => {
        setIsGenerating(true);
        setGenerationProgress(0);
        try {
            // Step 1: Generate article templates
            setGenerationProgress(25);
            const templates = await createArticleTemplates();
            // Step 2: Apply filters
            setGenerationProgress(75);
            const filteredTemplates = applyFilters(templates);
            // Step 3: Complete generation
            setGenerationProgress(100);
            setGeneratedArticles(filteredTemplates);
            if (onArticlesGenerated) {
                onArticlesGenerated(filteredTemplates);
            }
        }
        catch (error) {
            console.error('Article generation failed:', error);
        }
        finally {
            setIsGenerating(false);
            setGenerationProgress(0);
        }
    };
    const createArticleTemplates = async () => {
        const templates = [
            {
                id: 'tech-ai-ethics-1',
                title: 'AI Ethics: Balancing Innovation with Responsibility',
                content: `Artificial intelligence continues to advance at an unprecedented pace, raising important questions about ethics and responsibility. Recent developments in machine learning have demonstrated both the incredible potential and the significant risks associated with AI systems.

Leading researchers emphasize the need for comprehensive ethical frameworks that can guide AI development. "We're at a critical juncture where the decisions we make today will shape the future of AI for decades to come," says Dr. Sarah Chen, a prominent AI ethicist at Stanford University.

The debate centers around several key issues: algorithmic bias, privacy concerns, and the potential for job displacement. While some argue that AI will create more jobs than it eliminates, others point to historical precedents where technological revolutions led to significant economic disruption.

Companies like Google, Microsoft, and OpenAI have established AI ethics boards, but critics argue that self-regulation is insufficient. "We need government oversight to ensure that AI development serves the public interest," argues Professor Michael Rodriguez of the Center for Technology Policy.

The European Union's AI Act represents one of the most comprehensive attempts to regulate AI development. The legislation categorizes AI systems by risk level and imposes different requirements based on potential harm. However, implementation challenges remain significant.

Experts agree that education and public awareness are crucial. "People need to understand both the capabilities and limitations of AI systems," notes Dr. Emily Watson, director of the AI Literacy Initiative. "This knowledge is essential for informed public discourse and policy-making."

The path forward requires collaboration between technologists, policymakers, ethicists, and the public. Only through such cooperation can we ensure that AI development benefits humanity while minimizing potential harms.`,
                source: 'Tech Ethics Journal',
                category: 'technology',
                biasLevel: 'low',
                complexity: 'intermediate',
                topics: ['AI Ethics', 'Technology Policy', 'Machine Learning', 'Regulation'],
                keywords: ['artificial intelligence', 'ethics', 'regulation', 'innovation', 'responsibility'],
                sentiment: 'neutral',
                educationalValue: 0.85
            },
            {
                id: 'politics-climate-policy-1',
                title: 'Climate Policy: The Economic Impact of Green Energy Transition',
                content: `The transition to renewable energy sources has become a central issue in political discourse, with competing narratives about its economic implications. Recent studies have provided conflicting data about the costs and benefits of rapid decarbonization.

Proponents of aggressive climate action point to the falling costs of renewable energy technologies. Solar and wind power have become increasingly competitive with fossil fuels, even without subsidies in many markets. "The economic case for renewable energy is stronger than ever," asserts Dr. Jennifer Park, an energy economist at MIT.

However, critics argue that the transition will impose significant costs on certain sectors and regions. The fossil fuel industry employs millions of workers worldwide, and rapid transition could lead to economic dislocation. "We need to ensure that the benefits of clean energy are shared equitably," says Senator Robert Thompson, who represents a coal-producing state.

The debate extends to international competitiveness. Some argue that aggressive climate policies will put domestic industries at a disadvantage against countries with weaker environmental regulations. Others counter that leadership in clean energy technologies will create new economic opportunities.

Recent policy proposals include carbon pricing, renewable energy subsidies, and investment in green infrastructure. The effectiveness of these approaches remains contested among economists and policymakers.

The role of government versus market forces in driving the transition is another point of contention. Some advocate for government-led initiatives, while others prefer market-based solutions like carbon trading.

What's clear is that the transition to a low-carbon economy will require significant investment and policy coordination. The challenge lies in designing policies that achieve environmental goals while maintaining economic competitiveness and social equity.`,
                source: 'Policy Review',
                category: 'politics',
                biasLevel: 'moderate',
                complexity: 'intermediate',
                topics: ['Climate Policy', 'Economic Impact', 'Renewable Energy', 'Political Debate'],
                keywords: ['climate change', 'renewable energy', 'economic impact', 'policy', 'transition'],
                sentiment: 'neutral',
                educationalValue: 0.80
            },
            {
                id: 'health-vaccine-research-1',
                title: 'Breakthrough in Vaccine Technology: mRNA Platform Shows Promise',
                content: `The success of mRNA vaccines during the COVID-19 pandemic has opened new possibilities for treating and preventing a wide range of diseases. Researchers are now exploring applications for cancer, HIV, and other challenging conditions.

The mRNA platform works by instructing cells to produce specific proteins that trigger an immune response. This approach offers several advantages over traditional vaccine methods, including faster development times and greater flexibility in targeting different pathogens.

Dr. Lisa Martinez, a leading vaccine researcher, explains: "The mRNA platform represents a paradigm shift in vaccine development. We can now design vaccines for diseases that were previously considered untreatable."

Recent clinical trials have shown promising results for mRNA vaccines targeting various cancers. The technology allows for personalized cancer vaccines that target specific mutations in a patient's tumor cells.

However, challenges remain. The technology requires sophisticated manufacturing processes and ultra-cold storage, which can limit distribution in resource-limited settings. Researchers are working on solutions to make mRNA vaccines more accessible globally.

The cost of mRNA vaccines is another consideration. While prices have decreased since the initial COVID-19 vaccines, they remain higher than many traditional vaccines. This raises questions about equitable access, particularly in developing countries.

Despite these challenges, the potential benefits are enormous. "We're just beginning to scratch the surface of what's possible with mRNA technology," says Dr. David Kim, director of vaccine research at the National Institutes of Health.

The success of mRNA vaccines has also renewed interest in other novel vaccine platforms, including DNA vaccines and viral vector approaches. This diversification could lead to more effective treatments for a broader range of diseases.

As research continues, the focus remains on ensuring that these breakthrough technologies benefit people worldwide, regardless of their economic circumstances.`,
                source: 'Medical Research Today',
                category: 'health',
                biasLevel: 'low',
                complexity: 'intermediate',
                topics: ['Vaccine Technology', 'mRNA', 'Medical Research', 'Public Health'],
                keywords: ['mRNA', 'vaccines', 'medical research', 'cancer', 'technology'],
                sentiment: 'positive',
                educationalValue: 0.90
            },
            {
                id: 'economy-digital-currency-1',
                title: 'Central Bank Digital Currencies: The Future of Money?',
                content: `Central banks around the world are exploring the potential of digital currencies as the financial landscape continues to evolve. The rise of cryptocurrencies and the decline of cash usage have prompted serious consideration of government-backed digital alternatives.

Proponents argue that central bank digital currencies (CBDCs) could provide several benefits, including improved payment efficiency, reduced transaction costs, and better financial inclusion. "CBDCs could revolutionize how we think about money and payments," says Dr. Alan Foster, an economist specializing in monetary policy.

However, concerns about privacy and surveillance have sparked intense debate. CBDCs would give central banks unprecedented visibility into individual financial transactions, raising questions about civil liberties and government overreach.

The technical challenges of implementing CBDCs are significant. Central banks must balance security, privacy, and efficiency while ensuring that digital currencies work seamlessly with existing financial systems.

International coordination presents another challenge. As different countries develop their own CBDCs, questions arise about interoperability and the future of the global financial system.

Some experts worry that CBDCs could destabilize commercial banks by providing a direct alternative to traditional bank deposits. This could fundamentally change the banking sector and monetary policy transmission.

The Federal Reserve has been studying CBDCs for several years, but has not yet committed to implementation. Other countries, including China and Sweden, have moved more aggressively toward digital currency adoption.

The European Central Bank is also exploring a digital euro, with pilot programs expected to begin soon. The European approach emphasizes privacy protection and offline functionality.

As the debate continues, it's clear that the future of money will be shaped by both technological innovation and careful consideration of economic, social, and political implications.`,
                source: 'Financial Innovation Review',
                category: 'economy',
                biasLevel: 'moderate',
                complexity: 'advanced',
                topics: ['Digital Currency', 'Monetary Policy', 'Financial Technology', 'Privacy'],
                keywords: ['digital currency', 'central bank', 'cryptocurrency', 'monetary policy', 'privacy'],
                sentiment: 'neutral',
                educationalValue: 0.85
            },
            {
                id: 'environment-ocean-conservation-1',
                title: 'Ocean Conservation: New Technologies for Marine Protection',
                content: `The world's oceans face unprecedented threats from pollution, overfishing, and climate change. However, innovative technologies are providing new tools for marine conservation and sustainable ocean management.

Satellite technology has revolutionized our ability to monitor ocean health and track illegal fishing activities. "We can now monitor vast areas of ocean that were previously invisible to us," explains Dr. Maria Santos, a marine biologist at the Ocean Conservation Institute.

Artificial intelligence is also playing a crucial role in ocean protection. AI systems can analyze vast amounts of data to identify patterns in marine ecosystems and predict environmental changes. This information helps conservationists make more informed decisions about marine protected areas and fishing regulations.

The development of biodegradable materials offers hope for reducing ocean plastic pollution. Researchers have created alternatives to traditional plastics that break down safely in marine environments without harming wildlife.

Sustainable aquaculture practices are providing alternatives to overfished wild populations. New farming techniques minimize environmental impact while producing healthy seafood for growing populations.

However, challenges remain significant. Enforcement of marine protection laws is difficult in international waters, and economic pressures continue to drive unsustainable practices.

Climate change poses perhaps the greatest threat to ocean health. Rising temperatures and acidification are affecting marine ecosystems worldwide, with consequences that scientists are still working to understand.

The role of international cooperation in ocean conservation cannot be overstated. Many marine species migrate across national boundaries, requiring coordinated protection efforts.

Public awareness and education are also crucial. "People need to understand how their choices affect ocean health," says Dr. James Wilson, director of marine education programs. "Every decision, from what we eat to how we dispose of waste, has an impact."

The path forward requires continued innovation, international cooperation, and public engagement. Only through such comprehensive efforts can we hope to preserve the world's oceans for future generations.`,
                source: 'Marine Science Quarterly',
                category: 'environment',
                biasLevel: 'low',
                complexity: 'intermediate',
                topics: ['Ocean Conservation', 'Marine Technology', 'Environmental Protection', 'Sustainability'],
                keywords: ['ocean conservation', 'marine protection', 'sustainability', 'technology', 'climate change'],
                sentiment: 'positive',
                educationalValue: 0.88
            }
        ];
        return templates;
    };
    const applyFilters = (templates) => {
        let filtered = templates;
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(article => article.category === selectedCategory);
        }
        if (selectedBiasLevel !== 'all') {
            filtered = filtered.filter(article => article.biasLevel === selectedBiasLevel);
        }
        if (selectedComplexity !== 'all') {
            filtered = filtered.filter(article => article.complexity === selectedComplexity);
        }
        return filtered;
    };
    const handleArticleSelect = (article) => {
        if (onArticleSelected) {
            onArticleSelected(article);
        }
    };
    const getBiasColor = (biasLevel) => {
        switch (biasLevel) {
            case 'low': return '#28a745';
            case 'moderate': return '#ffc107';
            case 'high': return '#dc3545';
            default: return '#6c757d';
        }
    };
    const getComplexityIcon = (complexity) => {
        switch (complexity) {
            case 'basic': return _jsx(FiEye, {});
            case 'intermediate': return _jsx(FiTarget, {});
            case 'advanced': return _jsx(FiZap, {});
            default: return _jsx(FiBookOpen, {});
        }
    };
    return (_jsxs("div", { className: "dynamic-article-generator", children: [_jsxs("div", { className: "generator-header", children: [_jsxs("div", { className: "header-content", children: [_jsx(FiRefreshCw, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h2", { children: "Dynamic Article Generator" }), _jsx("p", { children: "Generate realistic, educational content for analysis and training" })] })] }), _jsx("div", { className: "header-controls", children: _jsx("button", { onClick: generateArticles, disabled: isGenerating, className: "generate-button", children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx(FiRefreshCw, { className: "spinner" }), "Generating..."] })) : (_jsxs(_Fragment, { children: [_jsx(FiRefreshCw, {}), "Generate Articles"] })) }) })] }), isGenerating && (_jsxs("div", { className: "generation-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${generationProgress}%` } }) }), _jsxs("p", { children: ["Generating educational articles... ", generationProgress, "%"] })] })), _jsxs("div", { className: "filters-section", children: [_jsxs("h3", { children: [_jsx(FiFilter, {}), " Filters"] }), _jsxs("div", { className: "filter-controls", children: [_jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Categories" }), _jsx("option", { value: "politics", children: "Politics" }), _jsx("option", { value: "technology", children: "Technology" }), _jsx("option", { value: "health", children: "Health" }), _jsx("option", { value: "environment", children: "Environment" }), _jsx("option", { value: "economy", children: "Economy" }), _jsx("option", { value: "education", children: "Education" })] }), _jsxs("select", { value: selectedBiasLevel, onChange: (e) => setSelectedBiasLevel(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Bias Levels" }), _jsx("option", { value: "low", children: "Low Bias" }), _jsx("option", { value: "moderate", children: "Moderate Bias" }), _jsx("option", { value: "high", children: "High Bias" })] }), _jsxs("select", { value: selectedComplexity, onChange: (e) => setSelectedComplexity(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Complexity Levels" }), _jsx("option", { value: "basic", children: "Basic" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] })] }), _jsxs("div", { className: "articles-section", children: [_jsxs("h3", { children: [_jsx(FiBookOpen, {}), " Generated Articles (", generatedArticles.length, ")"] }), _jsx("div", { className: "articles-grid", children: generatedArticles.map((article) => (_jsxs("div", { className: "article-card", onClick: () => handleArticleSelect(article), children: [_jsxs("div", { className: "article-header", children: [_jsx("h4", { children: article.title }), _jsxs("div", { className: "article-meta", children: [_jsx("span", { className: "source", children: article.source }), _jsx("span", { className: "category", children: article.category })] })] }), _jsx("div", { className: "article-content", children: _jsxs("p", { children: [article.content.substring(0, 200), "..."] }) }), _jsxs("div", { className: "article-indicators", children: [_jsxs("div", { className: "indicator bias", children: [_jsx("span", { className: "bias-dot", style: { backgroundColor: getBiasColor(article.biasLevel) } }), _jsxs("span", { className: "indicator-label", children: [article.biasLevel, " bias"] })] }), _jsxs("div", { className: "indicator complexity", children: [getComplexityIcon(article.complexity), _jsx("span", { className: "indicator-label", children: article.complexity })] }), _jsx("div", { className: "indicator sentiment", children: _jsx("span", { className: `sentiment-${article.sentiment}`, children: article.sentiment }) })] }), _jsx("div", { className: "article-topics", children: article.topics.slice(0, 3).map((topic, index) => (_jsx("span", { className: "topic-tag", children: topic }, index))) }), _jsxs("div", { className: "article-actions", children: [_jsxs("button", { className: "action-btn", children: [_jsx(FiEye, {}), " Preview"] }), _jsxs("button", { className: "action-btn", children: [_jsx(FiBarChart2, {}), " Analyze"] }), _jsxs("button", { className: "action-btn", children: [_jsx(FiDownload, {}), " Export"] })] })] }, article.id))) })] }), _jsxs("div", { className: "statistics-section", children: [_jsxs("h3", { children: [_jsx(FiTrendingUp, {}), " Generation Statistics"] }), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Total Articles" }), _jsx("span", { className: "stat-value", children: generatedArticles.length })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Average Educational Value" }), _jsxs("span", { className: "stat-value", children: [generatedArticles.length > 0
                                                ? Math.round(generatedArticles.reduce((sum, article) => sum + article.educationalValue, 0) / generatedArticles.length * 100)
                                                : 0, "%"] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Categories Covered" }), _jsx("span", { className: "stat-value", children: new Set(generatedArticles.map(article => article.category)).size })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Bias Distribution" }), _jsxs("span", { className: "stat-value", children: [generatedArticles.filter(article => article.biasLevel === 'low').length, " Low /", generatedArticles.filter(article => article.biasLevel === 'moderate').length, " Mod /", generatedArticles.filter(article => article.biasLevel === 'high').length, " High"] })] })] })] })] }));
};
export default DynamicArticleGenerator;
