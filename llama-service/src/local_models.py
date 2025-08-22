"""
Local Models for Fallback Analysis

This module provides local analysis capabilities as fallbacks when
the main Llama service is unavailable or when we need offline analysis.
"""

import re
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

@dataclass
class BiasAnalysisResult:
    """Result of bias analysis"""
    political_score: float
    ideological_score: float
    partisan_score: float
    emotional_score: float
    detected_phrases: List[str]
    overall_assessment: str
    confidence: float

@dataclass
class SentimentAnalysisResult:
    """Result of sentiment analysis"""
    overall_sentiment: str
    sentiment_score: float
    emotional_intensity: float
    primary_emotions: List[Dict[str, Any]]
    confidence: float

class LocalBiasAnalyzer:
    """Local bias analysis using keyword-based and rule-based approaches"""
    
    def __init__(self):
        # Political bias indicators
        self.left_indicators = {
            'social_justice': ['social justice', 'equity', 'systemic racism', 'privilege', 'marginalized'],
            'progressive': ['progressive', 'climate crisis', 'gun control', 'reproductive rights', 'universal healthcare'],
            'economic': ['income inequality', 'wealth tax', 'corporate greed', 'worker rights', 'living wage'],
            'social': ['diversity', 'inclusion', 'gender equality', 'LGBTQ+ rights', 'cancel culture']
        }
        
        self.right_indicators = {
            'traditional': ['traditional values', 'family values', 'religious freedom', 'patriotic', 'constitutional'],
            'economic': ['free market', 'small government', 'lower taxes', 'deregulation', 'personal responsibility'],
            'social': ['law and order', 'border security', 'second amendment', 'pro-life', 'states rights'],
            'nationalist': ['America first', 'national security', 'strong military', 'illegal immigration']
        }
        
        # Emotional bias indicators
        self.emotional_indicators = {
            'sensationalist': ['shocking', 'scandalous', 'explosive', 'devastating', 'outrageous'],
            'fear_mongering': ['terrifying', 'horrific', 'dangerous', 'threat', 'crisis'],
            'inflammatory': ['disgusting', 'appalling', 'offensive', 'controversial', 'divisive']
        }
        
        # Loaded language patterns
        self.loaded_language = [
            r'\b(clearly|obviously|undoubtedly|certainly|definitely)\b',
            r'\b(radical|extreme|dangerous|threatening)\b',
            r'\b(amazing|incredible|unbelievable|shocking)\b',
            r'\b(disgusting|appalling|offensive|outrageous)\b'
        ]
    
    def analyze_bias(self, text: str) -> BiasAnalysisResult:
        """Analyze text for various types of bias"""
        text_lower = text.lower()
        
        # Calculate political bias scores
        left_score = self._calculate_political_score(text_lower, self.left_indicators)
        right_score = self._calculate_political_score(text_lower, self.right_indicators)
        
        # Normalize scores
        total_political = left_score + right_score
        if total_political > 0:
            political_score = (right_score - left_score) / total_political * 10  # Scale to 0-10
        else:
            political_score = 5.0  # Neutral
        
        # Calculate ideological bias (based on loaded language and framing)
        ideological_score = self._calculate_ideological_bias(text_lower)
        
        # Calculate partisan bias (party-specific language)
        partisan_score = self._calculate_partisan_bias(text_lower)
        
        # Calculate emotional bias
        emotional_score = self._calculate_emotional_bias(text_lower)
        
        # Detect biased phrases
        detected_phrases = self._detect_biased_phrases(text_lower)
        
        # Generate overall assessment
        overall_assessment = self._generate_assessment(
            political_score, ideological_score, partisan_score, emotional_score
        )
        
        # Calculate confidence based on number of indicators found
        confidence = min(0.9, (len(detected_phrases) * 0.1) + 0.3)
        
        return BiasAnalysisResult(
            political_score=abs(political_score),
            ideological_score=ideological_score,
            partisan_score=partisan_score,
            emotional_score=emotional_score,
            detected_phrases=detected_phrases,
            overall_assessment=overall_assessment,
            confidence=confidence
        )
    
    def _calculate_political_score(self, text: str, indicators: Dict[str, List[str]]) -> float:
        """Calculate political bias score based on indicators"""
        score = 0
        for category, terms in indicators.items():
            for term in terms:
                # Use word boundary matching for more accurate detection
                pattern = r'\b' + re.escape(term) + r'\b'
                matches = len(re.findall(pattern, text))
                score += matches * 0.5  # Weight each match
        return score
    
    def _calculate_ideological_bias(self, text: str) -> float:
        """Calculate ideological bias based on loaded language and framing"""
        score = 0
        
        # Check for loaded language patterns
        for pattern in self.loaded_language:
            matches = len(re.findall(pattern, text))
            score += matches * 0.3
        
        # Check for one-sided arguments (lack of balanced language)
        balanced_terms = ['however', 'although', 'on the other hand', 'conversely', 'meanwhile']
        balanced_count = sum(len(re.findall(r'\b' + re.escape(term) + r'\b', text)) for term in balanced_terms)
        
        # Higher score if fewer balanced terms
        if len(text.split()) > 50:  # Only for longer texts
            score += max(0, (10 - balanced_count) * 0.2)
        
        return min(10.0, score)
    
    def _calculate_partisan_bias(self, text: str) -> float:
        """Calculate partisan bias based on party-specific language"""
        partisan_terms = [
            'democrat', 'republican', 'liberal', 'conservative',
            'left-wing', 'right-wing', 'progressive', 'traditional'
        ]
        
        score = 0
        for term in partisan_terms:
            pattern = r'\b' + re.escape(term) + r'\b'
            matches = len(re.findall(pattern, text))
            score += matches * 0.4
        
        return min(10.0, score)
    
    def _calculate_emotional_bias(self, text: str) -> float:
        """Calculate emotional bias based on sensationalist language"""
        score = 0
        
        for category, terms in self.emotional_indicators.items():
            for term in terms:
                pattern = r'\b' + re.escape(term) + r'\b'
                matches = len(re.findall(pattern, text))
                score += matches * 0.5
        
        return min(10.0, score)
    
    def _detect_biased_phrases(self, text: str) -> List[str]:
        """Detect specific biased phrases in the text"""
        detected = []
        
        # Check all indicator categories
        all_indicators = {**self.left_indicators, **self.right_indicators, **self.emotional_indicators}
        
        for category, terms in all_indicators.items():
            for term in terms:
                pattern = r'\b' + re.escape(term) + r'\b'
                if re.search(pattern, text):
                    detected.append(term)
        
        # Check for loaded language patterns
        for pattern in self.loaded_language:
            matches = re.findall(pattern, text)
            detected.extend(matches)
        
        return list(set(detected))  # Remove duplicates
    
    def _generate_assessment(self, political: float, ideological: float, partisan: float, emotional: float) -> str:
        """Generate overall bias assessment"""
        assessments = []
        
        if political > 7:
            assessments.append("Strong political bias detected")
        elif political > 4:
            assessments.append("Moderate political bias detected")
        
        if ideological > 7:
            assessments.append("High ideological bias with loaded language")
        elif ideological > 4:
            assessments.append("Some ideological bias present")
        
        if partisan > 7:
            assessments.append("Strong partisan language and framing")
        elif partisan > 4:
            assessments.append("Some partisan bias detected")
        
        if emotional > 7:
            assessments.append("High emotional bias with sensationalist language")
        elif emotional > 4:
            assessments.append("Some emotional bias present")
        
        if not assessments:
            return "Content appears relatively balanced with minimal bias detected."
        
        return ". ".join(assessments) + "."

class LocalSentimentAnalyzer:
    """Local sentiment analysis using lexicon-based approach"""
    
    def __init__(self):
        # Positive and negative word lists (simplified)
        self.positive_words = {
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'brilliant',
            'positive', 'successful', 'effective', 'beneficial', 'helpful', 'supportive',
            'happy', 'joyful', 'pleased', 'satisfied', 'content', 'optimistic'
        }
        
        self.negative_words = {
            'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'offensive', 'harmful',
            'negative', 'destructive', 'damaging', 'dangerous', 'threatening', 'hostile',
            'sad', 'angry', 'frustrated', 'disappointed', 'worried', 'pessimistic'
        }
        
        # Emotional intensity modifiers
        self.intensifiers = {
            'very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally',
            'highly', 'deeply', 'strongly', 'intensely', 'severely', 'critically'
        }
    
    def analyze_sentiment(self, text: str) -> SentimentAnalysisResult:
        """Analyze sentiment of the text"""
        text_lower = text.lower()
        words = text_lower.split()
        
        positive_count = 0
        negative_count = 0
        emotional_intensity = 0
        
        for i, word in enumerate(words):
            # Check for positive/negative words
            if word in self.positive_words:
                positive_count += 1
            elif word in self.negative_words:
                negative_count += 1
            
            # Check for intensifiers
            if word in self.intensifiers and i + 1 < len(words):
                next_word = words[i + 1]
                if next_word in self.positive_words or next_word in self.negative_words:
                    emotional_intensity += 0.5
        
        # Calculate sentiment score (-1 to 1)
        total_words = len(words)
        if total_words > 0:
            sentiment_score = (positive_count - negative_count) / total_words
        else:
            sentiment_score = 0
        
        # Determine overall sentiment
        if sentiment_score > 0.1:
            overall_sentiment = "positive"
        elif sentiment_score < -0.1:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"
        
        # Calculate emotional intensity (0 to 1)
        emotional_intensity = min(1.0, emotional_intensity / max(1, total_words / 10))
        
        # Identify primary emotions
        primary_emotions = self._identify_emotions(text_lower)
        
        # Calculate confidence
        confidence = min(0.8, (abs(sentiment_score) * 2) + 0.2)
        
        return SentimentAnalysisResult(
            overall_sentiment=overall_sentiment,
            sentiment_score=sentiment_score,
            emotional_intensity=emotional_intensity,
            primary_emotions=primary_emotions,
            confidence=confidence
        )
    
    def _identify_emotions(self, text: str) -> List[Dict[str, Any]]:
        """Identify primary emotions in the text"""
        emotions = []
        
        # Simple emotion detection based on keywords
        emotion_keywords = {
            'anger': ['angry', 'furious', 'outraged', 'irritated', 'frustrated'],
            'fear': ['afraid', 'scared', 'terrified', 'worried', 'anxious'],
            'joy': ['happy', 'joyful', 'excited', 'pleased', 'delighted'],
            'sadness': ['sad', 'depressed', 'disappointed', 'grief', 'sorrow']
        }
        
        for emotion, keywords in emotion_keywords.items():
            count = sum(len(re.findall(r'\b' + re.escape(keyword) + r'\b', text)) 
                       for keyword in keywords)
            if count > 0:
                emotions.append({
                    'emotion': emotion,
                    'intensity': min(1.0, count * 0.3),
                    'evidence': [kw for kw in keywords if kw in text]
                })
        
        return emotions

# Global instances for easy access
local_bias_analyzer = LocalBiasAnalyzer()
local_sentiment_analyzer = LocalSentimentAnalyzer()

def analyze_bias_local(text: str) -> Dict[str, Any]:
    """Analyze bias using local models"""
    result = local_bias_analyzer.analyze_bias(text)
    return {
        "bias_scores": {
            "political": result.political_score,
            "ideological": result.ideological_score,
            "partisan": result.partisan_score
        },
        "detected_bias_phrases": result.detected_phrases,
        "overall_bias_assessment": result.overall_assessment,
        "confidence": result.confidence
    }

def analyze_sentiment_local(text: str) -> Dict[str, Any]:
    """Analyze sentiment using local models"""
    result = local_sentiment_analyzer.analyze_sentiment(text)
    return {
        "overall_sentiment": result.overall_sentiment,
        "sentiment_score": result.sentiment_score,
        "emotional_intensity": result.emotional_intensity,
        "primary_emotions": result.primary_emotions,
        "confidence": result.confidence
    }
