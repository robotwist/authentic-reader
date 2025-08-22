"""
Comprehensive Article Analysis Module
Uses Llama/Mistral to analyze articles for bias, logical fallacies, and rhetorical devices
"""

import re
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Impact(Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

@dataclass
class LogicalFallacy:
    type: str
    description: str
    examples: List[str]
    severity: Severity
    confidence: float

@dataclass
class RhetoricalDevice:
    type: str
    description: str
    impact: Impact
    examples: List[str]
    confidence: float

@dataclass
class CredibilityAssessment:
    score: float
    factors: List[str]
    warnings: List[str]
    confidence: float

@dataclass
class ComprehensiveAnalysis:
    bias: Dict[str, float]
    logical_fallacies: List[LogicalFallacy]
    rhetorical_devices: List[RhetoricalDevice]
    credibility: CredibilityAssessment
    summary: Dict[str, Any]
    confidence: float

class ComprehensiveAnalyzer:
    def __init__(self):
        self.fallacy_patterns = {
            'ad_hominem': [
                r'\b(attacks?|insults?|name.?calling|personal attacks?)\b',
                r'\b(character assassination|smear campaign)\b'
            ],
            'appeal_to_emotion': [
                r'\b(fear.?mongering|scare tactics|emotional manipulation)\b',
                r'\b(heart.?wrenching|tear.?jerking|outrageous)\b'
            ],
            'straw_man': [
                r'\b(misrepresents?|distorts?|exaggerates?)\b',
                r'\b(claims? that|suggests? that).*\b(but|however)\b'
            ],
            'false_dichotomy': [
                r'\b(either|or|choose between|only two options?)\b',
                r'\b(us vs them|with us or against us)\b'
            ],
            'appeal_to_authority': [
                r'\b(studies show|research indicates|experts say)\b',
                r'\b(according to|as stated by)\b'
            ],
            'slippery_slope': [
                r'\b(if.*then.*will lead to|domino effect|snowball effect)\b',
                r'\b(this will inevitably|this will cause)\b'
            ],
            'hasty_generalization': [
                r'\b(all|every|always|never|none)\b',
                r'\b(everyone knows|obviously|clearly)\b'
            ],
            'confirmation_bias': [
                r'\b(proves?|confirms?|validates?)\b',
                r'\b(selective evidence|cherry.?picked)\b'
            ]
        }
        
        self.rhetorical_patterns = {
            'loaded_language': [
                r'\b(radical|extreme|dangerous|threatening)\b',
                r'\b(heroic|brave|courageous|patriotic)\b'
            ],
            'rhetorical_questions': [
                r'\?.*\b(doesn\'t|isn\'t|aren\'t|won\'t)\b',
                r'\?.*\b(how|why|what|when)\b'
            ],
            'repetition': [
                r'\b(\w+)\b.*\b\1\b.*\b\1\b',
                r'\b(same|identical|repeated)\b'
            ],
            'hyperbole': [
                r'\b(worst|best|most|least|never|always)\b',
                r'\b(disaster|catastrophe|miracle|revolutionary)\b'
            ],
            'appeal_to_fear': [
                r'\b(dangerous|threatening|risky|harmful)\b',
                r'\b(warning|alert|caution|beware)\b'
            ],
            'appeal_to_pity': [
                r'\b(poor|unfortunate|suffering|victim)\b',
                r'\b(helpless|desperate|needy|struggling)\b'
            ]
        }

    def analyze_comprehensive(self, text: str, bias_result: Dict[str, Any]) -> ComprehensiveAnalysis:
        """
        Perform comprehensive analysis of article text
        """
        # Extract bias scores
        bias_scores = {
            'political': bias_result.get('political_bias', 5.0),
            'emotional': bias_result.get('emotional_bias', 5.0),
            'cognitive': bias_result.get('cognitive_bias', 5.0),
            'overall': (bias_result.get('political_bias', 5.0) + 
                       bias_result.get('emotional_bias', 5.0) + 
                       bias_result.get('cognitive_bias', 5.0)) / 3
        }
        
        # Detect logical fallacies
        logical_fallacies = self._detect_logical_fallacies(text, bias_scores)
        
        # Detect rhetorical devices
        rhetorical_devices = self._detect_rhetorical_devices(text, bias_scores)
        
        # Assess credibility
        credibility = self._assess_credibility(text, bias_scores, logical_fallacies)
        
        # Generate summary
        summary = self._generate_summary(bias_scores, logical_fallacies, rhetorical_devices, credibility)
        
        # Calculate overall confidence
        confidence = self._calculate_confidence(bias_result, logical_fallacies, rhetorical_devices)
        
        return ComprehensiveAnalysis(
            bias=bias_scores,
            logical_fallacies=logical_fallacies,
            rhetorical_devices=rhetorical_devices,
            credibility=credibility,
            summary=summary,
            confidence=confidence
        )

    def _detect_logical_fallacies(self, text: str, bias_scores: Dict[str, float]) -> List[LogicalFallacy]:
        """Detect logical fallacies in the text"""
        fallacies = []
        text_lower = text.lower()
        
        # Check each fallacy pattern
        for fallacy_type, patterns in self.fallacy_patterns.items():
            matches = []
            for pattern in patterns:
                matches.extend(re.findall(pattern, text_lower, re.IGNORECASE))
            
            if matches:
                # Determine severity based on bias scores and match frequency
                severity = self._determine_fallacy_severity(fallacy_type, bias_scores, len(matches))
                confidence = min(0.9, len(matches) * 0.2 + 0.3)
                
                fallacy = LogicalFallacy(
                    type=self._get_fallacy_name(fallacy_type),
                    description=self._get_fallacy_description(fallacy_type),
                    examples=matches[:3],  # Limit to 3 examples
                    severity=severity,
                    confidence=confidence
                )
                fallacies.append(fallacy)
        
        return fallacies

    def _detect_rhetorical_devices(self, text: str, bias_scores: Dict[str, float]) -> List[RhetoricalDevice]:
        """Detect rhetorical devices in the text"""
        devices = []
        text_lower = text.lower()
        
        # Check each rhetorical pattern
        for device_type, patterns in self.rhetorical_patterns.items():
            matches = []
            for pattern in patterns:
                matches.extend(re.findall(pattern, text_lower, re.IGNORECASE))
            
            if matches:
                # Determine impact based on device type and bias scores
                impact = self._determine_rhetorical_impact(device_type, bias_scores)
                confidence = min(0.9, len(matches) * 0.15 + 0.4)
                
                device = RhetoricalDevice(
                    type=self._get_device_name(device_type),
                    description=self._get_device_description(device_type),
                    impact=impact,
                    examples=matches[:3],  # Limit to 3 examples
                    confidence=confidence
                )
                devices.append(device)
        
        return devices

    def _assess_credibility(self, text: str, bias_scores: Dict[str, float], 
                          fallacies: List[LogicalFallacy]) -> CredibilityAssessment:
        """Assess the credibility of the content"""
        score = 70.0  # Base score
        factors = []
        warnings = []
        
        # Adjust score based on bias
        if bias_scores['overall'] > 7:
            score -= 20
            warnings.append("High bias detected")
        elif bias_scores['overall'] > 5:
            score -= 10
            warnings.append("Moderate bias detected")
        
        # Adjust score based on logical fallacies
        high_severity_fallacies = [f for f in fallacies if f.severity == Severity.HIGH]
        medium_severity_fallacies = [f for f in fallacies if f.severity == Severity.MEDIUM]
        
        score -= len(high_severity_fallacies) * 15
        score -= len(medium_severity_fallacies) * 8
        
        if high_severity_fallacies:
            warnings.append(f"{len(high_severity_fallacies)} high-severity logical fallacies detected")
        
        # Positive factors
        if len(text) > 500:
            factors.append("Detailed content")
            score += 5
        
        if bias_scores['overall'] < 4:
            factors.append("Low bias content")
            score += 10
        
        if not fallacies:
            factors.append("No logical fallacies detected")
            score += 5
        
        # Ensure score stays within bounds
        score = max(0, min(100, score))
        confidence = 0.8
        
        return CredibilityAssessment(
            score=score,
            factors=factors,
            warnings=warnings,
            confidence=confidence
        )

    def _generate_summary(self, bias_scores: Dict[str, float], 
                         fallacies: List[LogicalFallacy],
                         devices: List[RhetoricalDevice],
                         credibility: CredibilityAssessment) -> Dict[str, Any]:
        """Generate a comprehensive summary"""
        key_points = []
        recommendations = []
        
        # Key points based on analysis
        if bias_scores['political'] > 6:
            key_points.append("Strong political bias detected")
            recommendations.append("Seek alternative viewpoints")
        
        if bias_scores['emotional'] > 6:
            key_points.append("High emotional manipulation")
            recommendations.append("Read with emotional distance")
        
        if fallacies:
            key_points.append(f"{len(fallacies)} logical fallacies identified")
            recommendations.append("Fact-check claims independently")
        
        if credibility.score < 60:
            key_points.append("Low credibility score")
            recommendations.append("Verify information with reliable sources")
        
        # Bias summary
        if bias_scores['overall'] > 7:
            bias_summary = "This content shows significant bias and should be read critically."
        elif bias_scores['overall'] > 5:
            bias_summary = "This content shows moderate bias and requires careful evaluation."
        else:
            bias_summary = "This content appears relatively balanced but still requires critical reading."
        
        return {
            "key_points": key_points,
            "bias_summary": bias_summary,
            "recommendations": recommendations,
            "overall_assessment": self._get_overall_assessment(bias_scores, credibility.score)
        }

    def _determine_fallacy_severity(self, fallacy_type: str, bias_scores: Dict[str, float], 
                                  match_count: int) -> Severity:
        """Determine the severity of a logical fallacy"""
        if fallacy_type in ['ad_hominem', 'appeal_to_emotion'] and bias_scores['emotional'] > 6:
            return Severity.HIGH
        elif fallacy_type in ['straw_man', 'false_dichotomy'] and bias_scores['political'] > 6:
            return Severity.HIGH
        elif match_count > 3:
            return Severity.HIGH
        elif match_count > 1:
            return Severity.MEDIUM
        else:
            return Severity.LOW

    def _determine_rhetorical_impact(self, device_type: str, bias_scores: Dict[str, float]) -> Impact:
        """Determine the impact of a rhetorical device"""
        if device_type in ['loaded_language', 'appeal_to_fear', 'hyperbole']:
            return Impact.NEGATIVE
        elif device_type in ['appeal_to_authority']:
            return Impact.POSITIVE
        else:
            return Impact.NEUTRAL

    def _calculate_confidence(self, bias_result: Dict[str, Any], 
                            fallacies: List[LogicalFallacy],
                            devices: List[RhetoricalDevice]) -> float:
        """Calculate overall confidence in the analysis"""
        base_confidence = 0.7
        
        # Adjust based on bias result confidence
        if 'confidence' in bias_result:
            base_confidence = bias_result['confidence'] * 0.8
        
        # Adjust based on number of detected patterns
        pattern_confidence = min(0.2, (len(fallacies) + len(devices)) * 0.05)
        
        return min(0.95, base_confidence + pattern_confidence)

    def _get_fallacy_name(self, fallacy_type: str) -> str:
        """Get human-readable fallacy name"""
        names = {
            'ad_hominem': 'Ad Hominem',
            'appeal_to_emotion': 'Appeal to Emotion',
            'straw_man': 'Straw Man',
            'false_dichotomy': 'False Dichotomy',
            'appeal_to_authority': 'Appeal to Authority',
            'slippery_slope': 'Slippery Slope',
            'hasty_generalization': 'Hasty Generalization',
            'confirmation_bias': 'Confirmation Bias'
        }
        return names.get(fallacy_type, fallacy_type.replace('_', ' ').title())

    def _get_fallacy_description(self, fallacy_type: str) -> str:
        """Get fallacy description"""
        descriptions = {
            'ad_hominem': 'Attacks the person rather than the argument',
            'appeal_to_emotion': 'Uses emotional language to manipulate rather than reason',
            'straw_man': 'Misrepresents an opponent\'s argument to make it easier to attack',
            'false_dichotomy': 'Presents only two options when more exist',
            'appeal_to_authority': 'Uses authority figures to support claims without evidence',
            'slippery_slope': 'Assumes one action will inevitably lead to extreme consequences',
            'hasty_generalization': 'Makes broad conclusions from limited evidence',
            'confirmation_bias': 'Selectively presents information that confirms preexisting beliefs'
        }
        return descriptions.get(fallacy_type, 'Logical fallacy detected')

    def _get_device_name(self, device_type: str) -> str:
        """Get human-readable device name"""
        names = {
            'loaded_language': 'Loaded Language',
            'rhetorical_questions': 'Rhetorical Questions',
            'repetition': 'Repetition',
            'hyperbole': 'Hyperbole',
            'appeal_to_fear': 'Appeal to Fear',
            'appeal_to_pity': 'Appeal to Pity'
        }
        return names.get(device_type, device_type.replace('_', ' ').title())

    def _get_device_description(self, device_type: str) -> str:
        """Get device description"""
        descriptions = {
            'loaded_language': 'Uses emotionally charged words to influence perception',
            'rhetorical_questions': 'Questions asked for effect rather than to get answers',
            'repetition': 'Repeats words or phrases for emphasis',
            'hyperbole': 'Uses extreme exaggeration for effect',
            'appeal_to_fear': 'Uses fear to influence behavior or opinion',
            'appeal_to_pity': 'Uses pity or sympathy to gain support'
        }
        return descriptions.get(device_type, 'Rhetorical device detected')

    def _get_overall_assessment(self, bias_scores: Dict[str, float], credibility_score: float) -> str:
        """Get overall assessment of the content"""
        if credibility_score < 40:
            return "Very Low Credibility"
        elif credibility_score < 60:
            return "Low Credibility"
        elif credibility_score < 80:
            return "Moderate Credibility"
        else:
            return "High Credibility"

def analyze_article_comprehensive(text: str, bias_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to perform comprehensive article analysis
    """
    analyzer = ComprehensiveAnalyzer()
    analysis = analyzer.analyze_comprehensive(text, bias_result)
    
    # Convert to dictionary for JSON serialization
    return {
        "bias": analysis.bias,
        "logical_fallacies": [
            {
                "type": f.type,
                "description": f.description,
                "examples": f.examples,
                "severity": f.severity.value,
                "confidence": f.confidence
            }
            for f in analysis.logical_fallacies
        ],
        "rhetorical_devices": [
            {
                "type": d.type,
                "description": d.description,
                "impact": d.impact.value,
                "examples": d.examples,
                "confidence": d.confidence
            }
            for d in analysis.rhetorical_devices
        ],
        "credibility": {
            "score": analysis.credibility.score,
            "factors": analysis.credibility.factors,
            "warnings": analysis.credibility.warnings,
            "confidence": analysis.credibility.confidence
        },
        "summary": analysis.summary,
        "confidence": analysis.confidence
    }
