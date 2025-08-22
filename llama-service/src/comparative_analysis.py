"""
Comparative Analysis Service

This module provides advanced analysis capabilities to compare multiple articles
on the same topic, identify similarities, differences, and potential misinformation.
"""

import re
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import hashlib
from collections import defaultdict

@dataclass
class Article:
    """Article data structure"""
    title: str
    content: str
    source: str
    url: str
    published_date: str
    article_id: str

@dataclass
class Claim:
    """Individual claim extracted from an article"""
    text: str
    confidence: float
    source_article: str
    claim_type: str  # 'fact', 'opinion', 'quote', 'statistic'
    supporting_evidence: List[str]

@dataclass
class FactCheck:
    """Fact-checking result for a claim"""
    claim: str
    verification_status: str  # 'verified', 'disputed', 'unverified', 'false'
    confidence: float
    contradicting_sources: List[str]
    supporting_sources: List[str]
    explanation: str

@dataclass
class ComparativeAnalysis:
    """Complete comparative analysis result"""
    topic: str
    articles_analyzed: int
    key_claims: List[Claim]
    fact_checks: List[FactCheck]
    similarities: List[str]
    differences: List[str]
    potential_misinformation: List[str]
    amalgamated_summary: str
    confidence_score: float
    analysis_timestamp: str

class TopicMatcher:
    """Matches articles by topic using keyword and semantic similarity"""
    
    def __init__(self):
        # Common topic keywords
        self.topic_keywords = {
            'politics': ['election', 'president', 'congress', 'senate', 'vote', 'campaign', 'policy'],
            'economy': ['economy', 'market', 'stock', 'inflation', 'recession', 'gdp', 'employment'],
            'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'startup', 'innovation'],
            'health': ['health', 'medical', 'covid', 'vaccine', 'hospital', 'doctor', 'treatment'],
            'environment': ['climate', 'environment', 'pollution', 'renewable', 'carbon', 'sustainability'],
            'international': ['foreign', 'international', 'diplomacy', 'trade', 'war', 'peace']
        }
    
    def extract_topic(self, title: str, content: str) -> str:
        """Extract the main topic from article title and content"""
        text = f"{title} {content}".lower()
        
        # Count keyword matches for each topic
        topic_scores = {}
        for topic, keywords in self.topic_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            topic_scores[topic] = score
        
        # Return the topic with highest score
        if topic_scores:
            return max(topic_scores, key=topic_scores.get)
        return 'general'
    
    def calculate_similarity(self, article1: Article, article2: Article) -> float:
        """Calculate similarity between two articles"""
        # Simple keyword-based similarity for now
        # In production, this would use embeddings or more sophisticated NLP
        
        text1 = f"{article1.title} {article1.content}".lower()
        text2 = f"{article2.title} {article2.content}".lower()
        
        # Extract key terms (words longer than 4 characters)
        words1 = set(re.findall(r'\b\w{5,}\b', text1))
        words2 = set(re.findall(r'\b\w{5,}\b', text2))
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0

class ClaimExtractor:
    """Extracts factual claims from articles"""
    
    def __init__(self):
        # Patterns for different types of claims
        self.claim_patterns = {
            'statistic': [
                r'\d+%',
                r'\d+ percent',
                r'\$\d+',
                r'\d+ million',
                r'\d+ billion',
                r'according to [^,]+',
                r'study shows',
                r'research indicates'
            ],
            'quote': [
                r'"([^"]+)"',
                r"'([^']+)'",
                r'said [^,]+',
                r'according to [^,]+'
            ],
            'fact': [
                r'is [^.]*',
                r'was [^.]*',
                r'has [^.]*',
                r'will [^.]*',
                r'can [^.]*'
            ]
        }
    
    def extract_claims(self, article: Article) -> List[Claim]:
        """Extract claims from an article"""
        claims = []
        content = article.content
        
        for claim_type, patterns in self.claim_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    claim_text = match.group(0)
                    # Filter out very short or very long claims
                    if 10 < len(claim_text) < 200:
                        claims.append(Claim(
                            text=claim_text,
                            confidence=0.7,  # Base confidence
                            source_article=article.article_id,
                            claim_type=claim_type,
                            supporting_evidence=[]
                        ))
        
        return claims

class FactChecker:
    """Checks facts across multiple sources"""
    
    def __init__(self):
        # Keywords that indicate factual statements
        self.fact_indicators = [
            'study', 'research', 'data', 'statistics', 'report', 'survey',
            'official', 'government', 'university', 'scientists', 'experts'
        ]
        
        # Keywords that indicate opinion or speculation
        self.opinion_indicators = [
            'believe', 'think', 'feel', 'opinion', 'might', 'could', 'may',
            'possibly', 'perhaps', 'allegedly', 'reportedly'
        ]
    
    def check_facts(self, claims: List[Claim], articles: List[Article]) -> List[FactCheck]:
        """Check facts across multiple sources"""
        fact_checks = []
        
        for claim in claims:
            # Find similar claims in other articles
            similar_claims = self._find_similar_claims(claim, claims)
            
            # Analyze consistency
            consistency_score = self._analyze_consistency(similar_claims)
            
            # Determine verification status
            status = self._determine_status(claim, similar_claims, consistency_score)
            
            # Find contradicting and supporting sources
            contradicting, supporting = self._categorize_sources(claim, similar_claims)
            
            fact_checks.append(FactCheck(
                claim=claim.text,
                verification_status=status,
                confidence=consistency_score,
                contradicting_sources=contradicting,
                supporting_sources=supporting,
                explanation=self._generate_explanation(claim, similar_claims, status)
            ))
        
        return fact_checks
    
    def _find_similar_claims(self, target_claim: Claim, all_claims: List[Claim]) -> List[Claim]:
        """Find claims similar to the target claim"""
        similar = []
        target_words = set(target_claim.text.lower().split())
        
        for claim in all_claims:
            if claim.source_article != target_claim.source_article:
                claim_words = set(claim.text.lower().split())
                similarity = len(target_words.intersection(claim_words)) / len(target_words.union(claim_words))
                if similarity > 0.3:  # 30% word overlap
                    similar.append(claim)
        
        return similar
    
    def _analyze_consistency(self, claims: List[Claim]) -> float:
        """Analyze consistency between claims"""
        if not claims:
            return 0.5  # Neutral if no comparison available
        
        # Simple consistency check based on claim type and content
        claim_types = [c.claim_type for c in claims]
        if len(set(claim_types)) == 1:
            return 0.8  # High consistency if all same type
        
        return 0.6  # Moderate consistency
    
    def _determine_status(self, claim: Claim, similar_claims: List[Claim], consistency: float) -> str:
        """Determine verification status of a claim"""
        if consistency > 0.8:
            return 'verified'
        elif consistency > 0.6:
            return 'unverified'
        elif consistency > 0.4:
            return 'disputed'
        else:
            return 'false'
    
    def _categorize_sources(self, claim: Claim, similar_claims: List[Claim]) -> Tuple[List[str], List[str]]:
        """Categorize sources as supporting or contradicting"""
        supporting = []
        contradicting = []
        
        for similar in similar_claims:
            if similar.claim_type == claim.claim_type:
                supporting.append(similar.source_article)
            else:
                contradicting.append(similar.source_article)
        
        return contradicting, supporting
    
    def _generate_explanation(self, claim: Claim, similar_claims: List[Claim], status: str) -> str:
        """Generate explanation for fact check result"""
        if status == 'verified':
            return f"Claim is supported by {len(similar_claims)} other sources"
        elif status == 'disputed':
            return f"Claim is disputed by {len(similar_claims)} other sources"
        elif status == 'unverified':
            return "Claim cannot be verified with available sources"
        else:
            return "Claim appears to be false based on contradicting evidence"

class ComparativeAnalyzer:
    """Main comparative analysis orchestrator"""
    
    def __init__(self):
        self.topic_matcher = TopicMatcher()
        self.claim_extractor = ClaimExtractor()
        self.fact_checker = FactChecker()
    
    def analyze_articles(self, articles: List[Article]) -> ComparativeAnalysis:
        """Perform comprehensive comparative analysis"""
        if len(articles) < 2:
            raise ValueError("Need at least 2 articles for comparative analysis")
        
        # Group articles by topic
        topic_groups = self._group_by_topic(articles)
        
        # Extract claims from all articles
        all_claims = []
        for article in articles:
            claims = self.claim_extractor.extract_claims(article)
            all_claims.extend(claims)
        
        # Check facts across sources
        fact_checks = self.fact_checker.check_facts(all_claims, articles)
        
        # Identify similarities and differences
        similarities = self._identify_similarities(articles)
        differences = self._identify_differences(articles)
        
        # Identify potential misinformation
        misinformation = self._identify_misinformation(fact_checks)
        
        # Generate amalgamated summary
        amalgamated_summary = self._generate_amalgamated_summary(articles, fact_checks)
        
        # Calculate overall confidence
        confidence = self._calculate_confidence(fact_checks, len(articles))
        
        return ComparativeAnalysis(
            topic=self._determine_main_topic(articles),
            articles_analyzed=len(articles),
            key_claims=all_claims[:10],  # Top 10 claims
            fact_checks=fact_checks,
            similarities=similarities,
            differences=differences,
            potential_misinformation=misinformation,
            amalgamated_summary=amalgamated_summary,
            confidence_score=confidence,
            analysis_timestamp=datetime.now().isoformat()
        )
    
    def _group_by_topic(self, articles: List[Article]) -> Dict[str, List[Article]]:
        """Group articles by topic"""
        groups = defaultdict(list)
        
        for article in articles:
            topic = self.topic_matcher.extract_topic(article.title, article.content)
            groups[topic].append(article)
        
        return dict(groups)
    
    def _identify_similarities(self, articles: List[Article]) -> List[str]:
        """Identify similarities between articles"""
        similarities = []
        
        # Compare article pairs
        for i in range(len(articles)):
            for j in range(i + 1, len(articles)):
                similarity = self.topic_matcher.calculate_similarity(articles[i], articles[j])
                if similarity > 0.5:
                    similarities.append(f"Articles from {articles[i].source} and {articles[j].source} share {similarity:.1%} similarity")
        
        return similarities[:5]  # Top 5 similarities
    
    def _identify_differences(self, articles: List[Article]) -> List[str]:
        """Identify key differences between articles"""
        differences = []
        
        # Compare perspectives and framing
        sources = [article.source for article in articles]
        if len(set(sources)) > 1:
            differences.append(f"Articles come from {len(set(sources))} different sources with varying perspectives")
        
        # Compare claim types
        claim_types = defaultdict(int)
        for article in articles:
            claims = self.claim_extractor.extract_claims(article)
            for claim in claims:
                claim_types[claim.claim_type] += 1
        
        if len(claim_types) > 1:
            differences.append(f"Articles use different types of claims: {', '.join(claim_types.keys())}")
        
        return differences
    
    def _identify_misinformation(self, fact_checks: List[FactCheck]) -> List[str]:
        """Identify potential misinformation"""
        misinformation = []
        
        for check in fact_checks:
            if check.verification_status in ['false', 'disputed']:
                misinformation.append(f"Claim: '{check.claim[:50]}...' - Status: {check.verification_status}")
        
        return misinformation[:5]  # Top 5 misinformation items
    
    def _generate_amalgamated_summary(self, articles: List[Article], fact_checks: List[FactCheck]) -> str:
        """Generate amalgamated summary combining verified facts"""
        verified_claims = [check for check in fact_checks if check.verification_status == 'verified']
        
        if verified_claims:
            summary_parts = []
            for claim in verified_claims[:3]:  # Top 3 verified claims
                summary_parts.append(claim.claim)
            
            return " ".join(summary_parts)
        else:
            return "No verified claims found across sources. Further fact-checking recommended."
    
    def _calculate_confidence(self, fact_checks: List[FactCheck], num_articles: int) -> float:
        """Calculate overall confidence in the analysis"""
        if not fact_checks:
            return 0.5
        
        avg_confidence = sum(check.confidence for check in fact_checks) / len(fact_checks)
        source_diversity = min(1.0, num_articles / 5)  # More sources = higher confidence
        
        return (avg_confidence + source_diversity) / 2
    
    def _determine_main_topic(self, articles: List[Article]) -> str:
        """Determine the main topic from all articles"""
        topics = []
        for article in articles:
            topic = self.topic_matcher.extract_topic(article.title, article.content)
            topics.append(topic)
        
        # Return most common topic
        from collections import Counter
        topic_counts = Counter(topics)
        return topic_counts.most_common(1)[0][0]

# Global instance for easy access
comparative_analyzer = ComparativeAnalyzer()

def analyze_articles_comparatively(articles_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Main function to analyze articles comparatively"""
    # Convert data to Article objects
    articles = []
    for data in articles_data:
        article = Article(
            title=data.get('title', ''),
            content=data.get('content', ''),
            source=data.get('source', ''),
            url=data.get('url', ''),
            published_date=data.get('published_date', ''),
            article_id=data.get('article_id', str(hash(data.get('title', ''))))
        )
        articles.append(article)
    
    # Perform analysis
    analysis = comparative_analyzer.analyze_articles(articles)
    
    # Convert to dictionary for JSON serialization
    return {
        "topic": analysis.topic,
        "articles_analyzed": analysis.articles_analyzed,
        "key_claims": [
            {
                "text": claim.text,
                "confidence": claim.confidence,
                "source_article": claim.source_article,
                "claim_type": claim.claim_type
            }
            for claim in analysis.key_claims
        ],
        "fact_checks": [
            {
                "claim": check.claim,
                "verification_status": check.verification_status,
                "confidence": check.confidence,
                "contradicting_sources": check.contradicting_sources,
                "supporting_sources": check.supporting_sources,
                "explanation": check.explanation
            }
            for check in analysis.fact_checks
        ],
        "similarities": analysis.similarities,
        "differences": analysis.differences,
        "potential_misinformation": analysis.potential_misinformation,
        "amalgamated_summary": analysis.amalgamated_summary,
        "confidence_score": analysis.confidence_score,
        "analysis_timestamp": analysis.analysis_timestamp
    }
