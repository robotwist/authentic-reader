/**
 * Sorting options for article lists
 */
export var SortOption;
(function (SortOption) {
    SortOption["NEWEST_FIRST"] = "newest";
    SortOption["OLDEST_FIRST"] = "oldest";
    SortOption["HIGHEST_QUALITY"] = "quality";
    SortOption["MOST_FALLACIES"] = "fallacies";
    SortOption["STRONGEST_BIAS"] = "bias";
    SortOption["MOST_CITATIONS"] = "citations";
    SortOption["LONGEST_READ"] = "length";
    SortOption["SHORTEST_READ"] = "short";
})(SortOption || (SortOption = {}));
/**
 * Type guard to check if a source is an API source
 */
export function isAPISource(source) {
    return source && typeof source.id === 'number';
}
/**
 * Type guard to check if an article is an API article
 */
export function isAPIArticle(article) {
    return article && typeof article.id === 'number';
}
/**
 * Convert any source type to RSSSource
 */
export function toRSSSource(source) {
    if (!source)
        return { name: 'Unknown', url: '' };
    return {
        id: source.id,
        name: source.name || 'Unknown',
        url: source.url || '',
        category: source.category,
        description: source.description
    };
}
/**
 * Convert any article type to RSSArticle
 */
export function toRSSArticle(article) {
    if (!article)
        return {
            title: 'Unknown',
            link: '',
            author: 'Unknown',
            source: 'Unknown',
            publishDate: new Date().toISOString(),
            summary: '',
            categories: []
        };
    // Handle case where source might be a string or object
    let source;
    if (typeof article.source === 'object' && article.source !== null) {
        source = {
            name: article.source.name || 'Unknown',
            url: article.source.url || ''
        };
    }
    else {
        source = article.source || 'Unknown';
    }
    return {
        title: article.title || 'Unknown',
        link: article.link || '',
        guid: article.guid,
        author: article.author || article.creator || 'Unknown',
        source,
        sourceUrl: article.sourceUrl || (typeof article.source === 'object' ? article.source.url : ''),
        sourceName: article.sourceName || (typeof article.source === 'object' ? article.source.name : article.source),
        sourceLogoUrl: article.sourceLogoUrl,
        publishDate: article.publishDate || article.pubDate || new Date().toISOString(),
        pubDate: article.pubDate || article.publishDate,
        summary: article.summary || article.description || '',
        content: article.content || '',
        contentSnippet: article.contentSnippet || '',
        imageUrl: article.imageUrl || '',
        categories: Array.isArray(article.categories) ? article.categories : [],
        isRead: article.isRead || false,
        isSaved: article.isSaved || false,
        creator: article.creator || article.author
    };
}
// Add new types for multi-dimensional bias analysis
// Enhanced bias dimensions for more nuanced analysis
export var BiasDimension;
(function (BiasDimension) {
    BiasDimension["POLITICAL"] = "political";
    BiasDimension["ECONOMIC"] = "economic";
    BiasDimension["SOCIAL"] = "social";
    BiasDimension["IDENTITY"] = "identity";
    BiasDimension["GEOPOLITICAL"] = "geopolitical";
    BiasDimension["EPISTEMOLOGICAL"] = "epistemological";
})(BiasDimension || (BiasDimension = {}));
// Existing BiasType (for backward compatibility)
export var BiasType;
(function (BiasType) {
    BiasType["LEFT_STRONG"] = "LEFT_STRONG";
    BiasType["LEFT_MODERATE"] = "LEFT_MODERATE";
    BiasType["CENTER"] = "CENTER";
    BiasType["RIGHT_MODERATE"] = "RIGHT_MODERATE";
    BiasType["RIGHT_STRONG"] = "RIGHT_STRONG";
})(BiasType || (BiasType = {}));
// Dark pattern detection
export var DarkPatternType;
(function (DarkPatternType) {
    DarkPatternType["FORCED_CONTINUITY"] = "forced_continuity";
    DarkPatternType["HIDDEN_COSTS"] = "hidden_costs";
    DarkPatternType["TRICK_QUESTIONS"] = "trick_questions";
    DarkPatternType["MISDIRECTION"] = "misdirection";
    DarkPatternType["CONFIRMSHAMING"] = "confirmshaming";
    DarkPatternType["DISGUISED_ADS"] = "disguised_ads";
    DarkPatternType["SCARCITY"] = "scarcity";
    DarkPatternType["SOCIAL_PROOF"] = "social_proof";
    DarkPatternType["URGENCY"] = "urgency";
    DarkPatternType["ROACH_MOTEL"] = "roach_motel";
})(DarkPatternType || (DarkPatternType = {}));
// Rhetoric and persuasion techniques
export var RhetoricType;
(function (RhetoricType) {
    RhetoricType["ETHOS"] = "ethos";
    RhetoricType["PATHOS"] = "pathos";
    RhetoricType["LOGOS"] = "logos";
    RhetoricType["KAIROS"] = "kairos"; // Appeal to timeliness/opportunity
})(RhetoricType || (RhetoricType = {}));
